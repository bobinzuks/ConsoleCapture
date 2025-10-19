/**
 * Structured logger for MCP Cloud Server
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private logLevel: LogLevel = 'info';

  constructor() {
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (envLogLevel && ['debug', 'info', 'warn', 'error'].includes(envLogLevel)) {
      this.logLevel = envLogLevel;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...metadata,
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: unknown, metadata?: LogMetadata): void {
    const errorMetadata: LogMetadata = { ...metadata };

    if (error instanceof Error) {
      errorMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorMetadata.error = error;
    }

    this.log('error', message, errorMetadata);
  }
}

export const logger = new Logger();
