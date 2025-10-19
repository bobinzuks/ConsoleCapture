/**
 * Content script that acts as a bridge between injected script and background
 */

import { MessageType, Message, ConsoleLogMessage } from '../types/messages';

// Track if injected script is loaded
let isInjected = false;

/**
 * Inject the script into page context
 */
function injectScript(): void {
  if (isInjected) return;

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = () => {
    script.remove();
  };

  (document.head || document.documentElement).appendChild(script);
  isInjected = true;
}

/**
 * Handle messages from injected script
 */
window.addEventListener('message', event => {
  // Only accept messages from same frame
  if (event.source !== window) return;

  const message = event.data;
  if (!message || message.source !== 'console-capture-injected') return;

  // Forward console logs to background
  if (message.type === MessageType.CONSOLE_LOG) {
    chrome.runtime.sendMessage<ConsoleLogMessage>({
      type: MessageType.CONSOLE_LOG,
      payload: message.payload,
    });
  }

  // Confirm initialization
  if (message.type === 'CONSOLE_CAPTURE_INITIALIZED') {
    console.log('[ConsoleCapture] Initialized');
  }
});

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  switch (message.type) {
    case MessageType.START_RECORDING:
      // Ensure injected script is loaded
      injectScript();
      sendResponse({ success: true });
      break;

    case MessageType.STOP_RECORDING:
      sendResponse({ success: true });
      break;

    default:
      break;
  }
});

// Auto-inject on page load if recording is active
chrome.storage.local.get(['isRecording'], result => {
  if (result.isRecording) {
    injectScript();
  }
});
