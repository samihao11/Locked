let endTime = null;
let lockedTabs = new Map(); // Map of tabId to original URL

// Function to inject timer into a tab
async function injectTimerIntoTab(tabId, endTime) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (endTime) => {
        // Create timer div if it doesn't exist
        let timerDiv = document.getElementById('focusTimer');
        if (!timerDiv) {
          timerDiv = document.createElement('div');
          timerDiv.id = 'focusTimer';
          timerDiv.style.position = 'fixed';
          timerDiv.style.top = '20px';
          timerDiv.style.right = '20px';
          timerDiv.style.background = 'rgba(0, 0, 0, 0.8)';
          timerDiv.style.color = '#fff';
          timerDiv.style.padding = '15px 20px';
          timerDiv.style.borderRadius = '10px';
          timerDiv.style.fontFamily = 'Arial, sans-serif';
          timerDiv.style.fontSize = '16px';
          timerDiv.style.fontWeight = 'bold';
          timerDiv.style.zIndex = '2147483647';
          timerDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
          timerDiv.style.display = 'flex';
          timerDiv.style.alignItems = 'center';
          timerDiv.style.gap = '15px';

          // Timer content container
          const timerContent = document.createElement('div');
          
          const titleSpan = document.createElement('span');
          titleSpan.textContent = 'Focus Mode: ';
          titleSpan.style.color = '#4CAF50';
          timerContent.appendChild(titleSpan);

          const timeSpan = document.createElement('span');
          timeSpan.id = 'timeDisplay';
          timerContent.appendChild(timeSpan);

          timerDiv.appendChild(timerContent);

          // Add Finished button
          const finishButton = document.createElement('button');
          finishButton.textContent = 'Finished';
          finishButton.style.backgroundColor = '#4CAF50';
          finishButton.style.color = 'white';
          finishButton.style.border = 'none';
          finishButton.style.padding = '5px 10px';
          finishButton.style.borderRadius = '5px';
          finishButton.style.cursor = 'pointer';
          finishButton.style.fontWeight = 'bold';
          finishButton.style.transition = 'background-color 0.2s';
          
          // Hover effect
          finishButton.addEventListener('mouseover', () => {
            finishButton.style.backgroundColor = '#45a049';
          });
          finishButton.addEventListener('mouseout', () => {
            finishButton.style.backgroundColor = '#4CAF50';
          });

          // Click handler
          finishButton.addEventListener('click', () => {
            // Send message to background script to end lock
            chrome.runtime.sendMessage({ action: 'endLock' });
          });

          timerDiv.appendChild(finishButton);
          document.body.appendChild(timerDiv);
        }

        // Clear any existing interval
        if (window._focusTimerInterval) {
          clearInterval(window._focusTimerInterval);
        }

        function updateTime() {
          const timeDisplay = document.getElementById('timeDisplay');
          if (!timeDisplay) return;

          const remaining = endTime - Date.now();
          if (remaining <= 0) {
            clearInterval(window._focusTimerInterval);
            const timer = document.getElementById('focusTimer');
            if (timer) timer.remove();
          } else {
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        }

        // Initial update
        updateTime();

        // Start interval
        window._focusTimerInterval = setInterval(updateTime, 1000);
      },
      args: [endTime]
    });
  } catch (error) {
    console.error(`Failed to inject timer into tab ${tabId}:`, error);
  }
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === 'startTimer') {
    endTime = msg.endTime;
    
    // Get all tabs in current window
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Store tabs and inject timer
    for (const tab of tabs) {
      lockedTabs.set(tab.id, tab.url);
      await injectTimerIntoTab(tab.id, endTime);
    }

    // Set up navigation blocking
    setupNavigationBlocking();

    // Set timeout to unlock
    setTimeout(unlock, msg.endTime - Date.now());
  } else if (msg.action === 'endLock') {
    // End the lock early
    unlock();
  }
});

// When a tab is updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (lockedTabs.has(tabId)) {
    // If URL changed, revert it
    if (changeInfo.url) {
      const originalUrl = lockedTabs.get(tabId);
      if (changeInfo.url !== originalUrl) {
        await chrome.tabs.update(tabId, { url: originalUrl });
      }
    }
    
    // If page finished loading and we're still in lock mode, show timer
    if (changeInfo.status === 'complete' && endTime) {
      await injectTimerIntoTab(tabId, endTime);
    }
  }
});

function setupNavigationBlocking() {
  // Listen for any navigation attempts
  chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (lockedTabs.has(details.tabId)) {
      const originalUrl = lockedTabs.get(details.tabId);
      if (details.url !== originalUrl) {
        chrome.tabs.update(details.tabId, { url: originalUrl });
      }
    }
  });

  // Block new tabs
  chrome.tabs.onCreated.addListener(closeNewTabs);
}

function closeNewTabs(tab) {
  if (!lockedTabs.has(tab.id)) {
    chrome.tabs.remove(tab.id);
  }
}

function unlock() {
  // Remove timer from all locked tabs
  lockedTabs.forEach(async (url, tabId) => {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          if (window._focusTimerInterval) {
            clearInterval(window._focusTimerInterval);
          }
          const timer = document.getElementById('focusTimer');
          if (timer) timer.remove();
        }
      });
    } catch (error) {
      console.error(`Failed to remove timer from tab ${tabId}:`, error);
    }
  });

  endTime = null;
  lockedTabs.clear();
  
  // Remove all listeners
  chrome.webNavigation.onBeforeNavigate.removeListener();
  chrome.tabs.onCreated.removeListener(closeNewTabs);
}
