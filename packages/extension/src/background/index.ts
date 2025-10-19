/**
 * Background service worker for ConsoleCapture extension
 * Handles recording state, storage, and API communication
 */

import {
  ConsoleEvent,
  Session,
  SessionStatus,
  Recording,
  RecordingQuality,
  RecordingPrivacy,
} from '@console-capture/shared';
import { MessageType, Message, ConsoleLogMessage } from '../types/messages';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  sessionId: string | null;
  startTime: number | null;
  events: ConsoleEvent[];
  currentTabId: number | null;
}

// Global recording state
const recordingState: RecordingState = {
  isRecording: false,
  isPaused: false,
  sessionId: null,
  startTime: null,
  events: [],
  currentTabId: null,
};

// API endpoint (from environment or default to localhost)
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api';

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start recording
 */
async function startRecording(tabId: number, quality: RecordingQuality = RecordingQuality.HD) {
  if (recordingState.isRecording) {
    throw new Error('Recording already in progress');
  }

  recordingState.isRecording = true;
  recordingState.isPaused = false;
  recordingState.sessionId = generateSessionId();
  recordingState.startTime = Date.now();
  recordingState.events = [];
  recordingState.currentTabId = tabId;

  // Save state to storage
  await chrome.storage.local.set({
    isRecording: true,
    sessionId: recordingState.sessionId,
    quality,
  });

  // Update badge
  chrome.action.setBadgeText({ text: 'REC' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });

  console.log('[ConsoleCapture] Recording started', recordingState.sessionId);
}

/**
 * Stop recording
 */
async function stopRecording(): Promise<Recording | null> {
  if (!recordingState.isRecording) {
    return null;
  }

  const duration = recordingState.startTime
    ? (Date.now() - recordingState.startTime) / 1000
    : 0;

  const session: Session = {
    id: recordingState.sessionId!,
    userId: 'local', // Will be replaced with actual user ID after auth
    status: SessionStatus.COMPLETED,
    startTime: new Date(recordingState.startTime!),
    endTime: new Date(),
    metadata: {
      totalDuration: duration,
      totalEvents: recordingState.events.length,
      recordingIds: [],
    },
    events: recordingState.events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      data: event,
    })),
  };

  // Reset state
  recordingState.isRecording = false;
  recordingState.isPaused = false;
  recordingState.sessionId = null;
  recordingState.startTime = null;
  recordingState.currentTabId = null;

  await chrome.storage.local.set({
    isRecording: false,
    sessionId: null,
  });

  // Save session to local storage
  const sessions = await getStoredSessions();
  sessions.push(session);
  await chrome.storage.local.set({ sessions });

  // Update badge
  chrome.action.setBadgeText({ text: '' });

  console.log('[ConsoleCapture] Recording stopped', session);

  // Create recording object
  const recording: Recording = {
    id: `recording_${Date.now()}`,
    userId: 'local',
    sessionId: session.id,
    title: `Recording ${new Date().toLocaleString()}`,
    quality: RecordingQuality.HD,
    privacy: RecordingPrivacy.PRIVATE,
    tags: [],
    duration,
    fileSize: JSON.stringify(session).length,
    storageUrl: '', // Will be set after upload
    viewCount: 0,
    metadata: {
      width: 1920,
      height: 1080,
      shell: 'browser',
      terminalType: 'chrome-console',
      consoleEvents: recordingState.events,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Clear events
  recordingState.events = [];

  return recording;
}

/**
 * Get stored sessions
 */
async function getStoredSessions(): Promise<Session[]> {
  const result = await chrome.storage.local.get(['sessions']);
  return result.sessions || [];
}

/**
 * Pause recording
 */
async function pauseRecording() {
  if (!recordingState.isRecording || recordingState.isPaused) {
    return;
  }

  recordingState.isPaused = true;
  chrome.action.setBadgeText({ text: 'PAUSE' });
  chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
}

/**
 * Resume recording
 */
async function resumeRecording() {
  if (!recordingState.isRecording || !recordingState.isPaused) {
    return;
  }

  recordingState.isPaused = false;
  chrome.action.setBadgeText({ text: 'REC' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
}

/**
 * Handle console log events
 */
function handleConsoleLog(event: ConsoleEvent) {
  if (!recordingState.isRecording || recordingState.isPaused) {
    return;
  }

  recordingState.events.push(event);

  // Limit stored events to prevent memory issues (keep last 10000)
  if (recordingState.events.length > 10000) {
    recordingState.events = recordingState.events.slice(-10000);
  }
}

/**
 * Message listener
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case MessageType.CONSOLE_LOG: {
          const consoleMsg = message as ConsoleLogMessage;
          handleConsoleLog(consoleMsg.payload);
          sendResponse({ success: true });
          break;
        }

        case MessageType.START_RECORDING: {
          const tabId = sender.tab?.id || recordingState.currentTabId;
          if (!tabId) {
            throw new Error('No active tab');
          }
          await startRecording(tabId);
          sendResponse({ success: true, sessionId: recordingState.sessionId });
          break;
        }

        case MessageType.STOP_RECORDING: {
          const recording = await stopRecording();
          sendResponse({ success: true, recording });
          break;
        }

        case MessageType.PAUSE_RECORDING: {
          await pauseRecording();
          sendResponse({ success: true });
          break;
        }

        case MessageType.RESUME_RECORDING: {
          await resumeRecording();
          sendResponse({ success: true });
          break;
        }

        case MessageType.GET_SESSION: {
          sendResponse({
            success: true,
            session: {
              isRecording: recordingState.isRecording,
              isPaused: recordingState.isPaused,
              sessionId: recordingState.sessionId,
              eventCount: recordingState.events.length,
              duration: recordingState.startTime
                ? (Date.now() - recordingState.startTime) / 1000
                : 0,
            },
          });
          break;
        }

        case MessageType.GET_RECORDINGS: {
          const sessions = await getStoredSessions();
          sendResponse({ success: true, sessions });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[ConsoleCapture] Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();

  return true; // Keep channel open for async response
});

/**
 * Extension installed/updated
 */
chrome.runtime.onInstalled.addListener(details => {
  console.log('[ConsoleCapture] Extension installed/updated', details);

  // Initialize storage
  chrome.storage.local.set({
    isRecording: false,
    sessions: [],
    settings: {
      autoStart: false,
      quality: RecordingQuality.HD,
      uploadAutomatically: false,
    },
  });
});

console.log('[ConsoleCapture] Background service worker initialized');
