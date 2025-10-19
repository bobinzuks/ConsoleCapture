/**
 * DevTools integration
 */

chrome.devtools.panels.create(
  'ConsoleCapture',
  '/icons/icon48.png',
  '/panel.html',
  panel => {
    console.log('[ConsoleCapture] DevTools panel created');
  }
);
