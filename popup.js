document.getElementById('start').addEventListener('click', () => {
  const minutes = parseInt(document.getElementById('minutes').value);
  if (!minutes || minutes <= 0) {
    alert('Please enter a valid number of minutes');
    return;
  }

  const ms = minutes * 60 * 1000;
  const endTime = Date.now() + ms;

  // Send message to background script to start the timer
  chrome.runtime.sendMessage({ 
    action: 'startTimer', 
    endTime: endTime
  });

  // Close popup
  window.close();
});

// Function that will be injected into each tab
function injectTimer(endTime) {
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

    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'Focus Mode: ';
    titleSpan.style.color = '#4CAF50';
    timerDiv.appendChild(titleSpan);

    const timeSpan = document.createElement('span');
    timeSpan.id = 'timeDisplay';
    timerDiv.appendChild(timeSpan);

    // Make sure we can add to the document
    if (document.body) {
      document.body.appendChild(timerDiv);
    } else {
      // If document.body isn't available yet, wait for it
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(timerDiv);
      });
    }
  }

  // Clear any existing interval
  if (window._focusTimerInterval) {
    clearInterval(window._focusTimerInterval);
  }

  // Update timer function
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

  // Return true to indicate successful injection
  return true;
}
  