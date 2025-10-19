/**
 * Injected script that runs in page context to capture console logs
 * This script intercepts console methods before they are called
 */

import { ConsoleEvent } from '@console-capture/shared';
import { MessageType } from '../types/messages';

interface ExtendedWindow extends Window {
  __consoleCaptureOriginal?: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
    debug: typeof console.debug;
  };
}

(function () {
  const win = window as ExtendedWindow;

  // Store original console methods
  if (!win.__consoleCaptureOriginal) {
    win.__consoleCaptureOriginal = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };
  }

  const originalConsole = win.__consoleCaptureOriginal;

  /**
   * Serialize console arguments for transmission
   */
  function serializeArgs(args: unknown[]): unknown[] {
    return args.map(arg => {
      try {
        if (arg === null) return null;
        if (arg === undefined) return undefined;
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number') return arg;
        if (typeof arg === 'boolean') return arg;
        if (arg instanceof Error) {
          return {
            __error: true,
            name: arg.name,
            message: arg.message,
            stack: arg.stack,
          };
        }
        // For objects and arrays, try to serialize
        return JSON.parse(JSON.stringify(arg));
      } catch (e) {
        // If serialization fails, return string representation
        return String(arg);
      }
    });
  }

  /**
   * Get stack trace for console call
   */
  function getStackTrace(): string | undefined {
    try {
      const error = new Error();
      const stack = error.stack?.split('\n').slice(3).join('\n'); // Remove first 3 lines
      return stack;
    } catch {
      return undefined;
    }
  }

  /**
   * Intercept console method
   */
  function interceptConsole(
    type: 'log' | 'warn' | 'error' | 'info' | 'debug',
    originalMethod: (...args: unknown[]) => void
  ): (...args: unknown[]) => void {
    return function (...args: unknown[]) {
      // Call original method first
      originalMethod(...args);

      // Create console event
      const event: ConsoleEvent = {
        timestamp: Date.now(),
        type,
        message: args.map(arg => String(arg)).join(' '),
        args: serializeArgs(args),
        stackTrace: getStackTrace(),
      };

      // Send to content script
      window.postMessage(
        {
          type: MessageType.CONSOLE_LOG,
          source: 'console-capture-injected',
          payload: event,
        },
        '*'
      );
    };
  }

  // Override console methods
  console.log = interceptConsole('log', originalConsole.log);
  console.warn = interceptConsole('warn', originalConsole.warn);
  console.error = interceptConsole('error', originalConsole.error);
  console.info = interceptConsole('info', originalConsole.info);
  console.debug = interceptConsole('debug', originalConsole.debug);

  // Mark as initialized
  window.postMessage(
    {
      type: 'CONSOLE_CAPTURE_INITIALIZED',
      source: 'console-capture-injected',
    },
    '*'
  );
})();
