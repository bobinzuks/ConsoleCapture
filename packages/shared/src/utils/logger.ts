/**
 * Structured logging utility following SPARC principles
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  service?: string;
  userId?: string;
  requestId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private context: LogContext = {};
  private minLevel: LogLevel = LogLevel.INFO;

  constructor(defaultContext: LogContext = {}) {
    this.context = defaultContext;
    this.setLevel(process.env.LOG_LEVEL as LogLevel || LogLevel.INFO);
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
  }

  private write(logEntry: LogEntry): void {
    const output = JSON.stringify(logEntry);

    if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.FATAL) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.write(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.write(this.formatLog(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.write(this.formatLog(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.write(this.formatLog(LogLevel.ERROR, message, context, error));
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.write(this.formatLog(LogLevel.FATAL, message, context, error));
    }
  }

  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger({ ...this.context, ...additionalContext });
    childLogger.setLevel(this.minLevel);
    return childLogger;
  }
}

// Export singleton logger
export const logger = new Logger({
  service: 'console-capture',
});

// Export Logger class for creating custom loggers
export { Logger };
