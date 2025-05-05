// Store the current URL when the script loads
const initialURL = window.location.href;
console.log('Overlay script loaded on:', initialURL);

// Function to prevent navigation and return to initial URL
function preventNavigation(e) {
  e.preventDefault();
  e.stopPropagation();
  if (window.location.href !== initialURL) {
    window.location.replace(initialURL);
  }
  return false;
}

// Capture all forms, especially Google's search form
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.getElementsByTagName('form');
  for (let form of forms) {
    form.addEventListener('submit', preventNavigation, true);
  }
  
  // Specifically target Google search box
  const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
  searchInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        preventNavigation(e);
      }
    });
  });
});

// Block form submissions
document.addEventListener('submit', preventNavigation, true);

// Block URL changes
window.addEventListener('beforeunload', preventNavigation, true);

// Monitor URL changes
let lastUrl = initialURL;
new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    if (lastUrl !== initialURL) {
      window.location.replace(initialURL);
    }
  }
}).observe(document, {subtree: true, childList: true});

// Block navigation APIs
window.addEventListener('popstate', preventNavigation, true);
window.addEventListener('hashchange', preventNavigation, true);

// Override history methods
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;
history.pushState = function() {
  return preventNavigation(new Event('pushState'));
};
history.replaceState = function() {
  return preventNavigation(new Event('replaceState'));
};

// Block clicks on links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.href !== initialURL) {
    preventNavigation(e);
  }
}, true);

// Timer functionality
let timerInterval = null;

function createTimer() {
  const timerDiv = document.createElement('div');
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
  timerDiv.id = 'focusTimer';

  const titleSpan = document.createElement('span');
  titleSpan.textContent = 'Focus Mode: ';
  titleSpan.style.color = '#4CAF50';
  timerDiv.appendChild(titleSpan);

  const timeSpan = document.createElement('span');
  timeSpan.id = 'timeDisplay';
  timerDiv.appendChild(timeSpan);

  return timerDiv;
}

function removeTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  const existingTimer = document.getElementById('focusTimer');
  if (existingTimer) {
    existingTimer.remove();
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Received message in overlay:', msg);
  
  if (msg.action === 'showTimer') {
    console.log('Showing timer with end time:', msg.endTime);
    
    // Remove any existing timer
    removeTimer();

    // Create and add new timer
    const timerDiv = createTimer();
    document.body.appendChild(timerDiv);
    const timeDisplay = document.getElementById('timeDisplay');

    function updateTime() {
      const remaining = msg.endTime - Date.now();
      if (remaining <= 0) {
        console.log('Timer finished');
        removeTimer();
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
    timerInterval = setInterval(updateTime, 1000);

    // Return true to indicate we'll send a response asynchronously
    return true;
  } else if (msg.action === 'removeTimer') {
    console.log('Removing timer');
    removeTimer();
  }
});
  