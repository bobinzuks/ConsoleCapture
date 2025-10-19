/**
 * Message types for extension communication
 */

import { ConsoleEvent } from '@console-capture/shared';

export enum MessageType {
  // Console capture
  CONSOLE_LOG = 'CONSOLE_LOG',
  START_RECORDING = 'START_RECORDING',
  STOP_RECORDING = 'STOP_RECORDING',
  PAUSE_RECORDING = 'PAUSE_RECORDING',
  RESUME_RECORDING = 'RESUME_RECORDING',

  // Session management
  GET_SESSION = 'GET_SESSION',
  CREATE_SESSION = 'CREATE_SESSION',
  UPDATE_SESSION = 'UPDATE_SESSION',

  // Storage
  SAVE_RECORDING = 'SAVE_RECORDING',
  GET_RECORDINGS = 'GET_RECORDINGS',
  DELETE_RECORDING = 'DELETE_RECORDING',

  // Settings
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',

  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  GET_USER = 'GET_USER',

  // Responses
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface Message {
  type: MessageType;
  payload?: unknown;
  requestId?: string;
}

export interface ConsoleLogMessage extends Message {
  type: MessageType.CONSOLE_LOG;
  payload: ConsoleEvent;
}

export interface StartRecordingMessage extends Message {
  type: MessageType.START_RECORDING;
  payload?: {
    quality?: '720p' | '1080p' | '4k';
    title?: string;
  };
}

export interface StopRecordingMessage extends Message {
  type: MessageType.STOP_RECORDING;
}

export interface SuccessMessage extends Message {
  type: MessageType.SUCCESS;
  payload: {
    data: unknown;
    requestId: string;
  };
}

export interface ErrorMessage extends Message {
  type: MessageType.ERROR;
  payload: {
    error: string;
    requestId: string;
  };
}
