/**
 * Popup UI for ConsoleCapture extension
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MessageType } from '../types/messages';
import './popup.css';

interface SessionState {
  isRecording: boolean;
  isPaused: boolean;
  sessionId: string | null;
  eventCount: number;
  duration: number;
}

const Popup: React.FC = () => {
  const [session, setSession] = useState<SessionState>({
    isRecording: false,
    isPaused: false,
    sessionId: null,
    eventCount: 0,
    duration: 0,
  });
  const [recordings, setRecordings] = useState<any[]>([]);

  useEffect(() => {
    loadSession();
    loadRecordings();

    // Update duration every second when recording
    const interval = setInterval(() => {
      if (session.isRecording && !session.isPaused) {
        loadSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isRecording, session.isPaused]);

  const loadSession = async () => {
    const response = await chrome.runtime.sendMessage({ type: MessageType.GET_SESSION });
    if (response.success) {
      setSession(response.session);
    }
  };

  const loadRecordings = async () => {
    const response = await chrome.runtime.sendMessage({ type: MessageType.GET_RECORDINGS });
    if (response.success) {
      setRecordings(response.sessions || []);
    }
  };

  const handleStartRecording = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    await chrome.tabs.sendMessage(tab.id, { type: MessageType.START_RECORDING });
    await chrome.runtime.sendMessage({ type: MessageType.START_RECORDING });
    loadSession();
  };

  const handleStopRecording = async () => {
    await chrome.runtime.sendMessage({ type: MessageType.STOP_RECORDING });
    loadSession();
    loadRecordings();
  };

  const handlePauseRecording = async () => {
    await chrome.runtime.sendMessage({ type: MessageType.PAUSE_RECORDING });
    loadSession();
  };

  const handleResumeRecording = async () => {
    await chrome.runtime.sendMessage({ type: MessageType.RESUME_RECORDING });
    loadSession();
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="popup">
      <header className="popup-header">
        <h1>ConsoleCapture</h1>
        <span className="version">v1.0.0</span>
      </header>

      <div className="popup-content">
        {session.isRecording ? (
          <div className="recording-controls">
            <div className="status-indicator recording">
              <span className="pulse"></span>
              {session.isPaused ? 'Paused' : 'Recording'}
            </div>

            <div className="recording-stats">
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{formatDuration(session.duration)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Events</span>
                <span className="stat-value">{session.eventCount}</span>
              </div>
            </div>

            <div className="button-group">
              {session.isPaused ? (
                <button className="btn btn-primary" onClick={handleResumeRecording}>
                  Resume
                </button>
              ) : (
                <button className="btn btn-warning" onClick={handlePauseRecording}>
                  Pause
                </button>
              )}
              <button className="btn btn-danger" onClick={handleStopRecording}>
                Stop Recording
              </button>
            </div>
          </div>
        ) : (
          <div className="start-controls">
            <button className="btn btn-success btn-large" onClick={handleStartRecording}>
              Start Recording
            </button>
          </div>
        )}

        <div className="recordings-list">
          <h3>Recent Recordings</h3>
          {recordings.length === 0 ? (
            <p className="empty-state">No recordings yet</p>
          ) : (
            <ul>
              {recordings.slice(0, 5).map(rec => (
                <li key={rec.id} className="recording-item">
                  <div className="recording-info">
                    <span className="recording-time">
                      {new Date(rec.startTime).toLocaleString()}
                    </span>
                    <span className="recording-events">{rec.metadata.totalEvents} events</span>
                  </div>
                  <span className="recording-duration">
                    {formatDuration(rec.metadata.totalDuration)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <footer className="popup-footer">
        <a href="#" className="link">View All</a>
        <a href="#" className="link">Settings</a>
        <a href="#" className="link">Help</a>
      </footer>
    </div>
  );
};

// Render
const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);
