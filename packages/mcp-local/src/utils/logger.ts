/**
 * Simple logger utility for MCP server
 * Writes to stderr to avoid interfering with stdio transport
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logLevel: LogLevel = 'info';

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // Write to stderr to avoid interfering with stdio transport
    console.error(prefix, message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}

export const logger = new Logger();

// Set log level from environment variable
const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
if (envLogLevel && ['debug', 'info', 'warn', 'error'].includes(envLogLevel)) {
  logger.setLogLevel(envLogLevel);
}
