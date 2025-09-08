import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  stackTrace?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogSize = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeLogging();
  }

  debug(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.Debug)) {
      this.writeLog(LogLevel.Debug, message, data, source);
    }
  }

  info(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.Info)) {
      this.writeLog(LogLevel.Info, message, data, source);
    }
  }

  warn(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.Warn)) {
      this.writeLog(LogLevel.Warn, message, data, source);
    }
  }

  error(message: string, error?: any, source?: string): void {
    if (this.shouldLog(LogLevel.Error)) {
      const stackTrace = error instanceof Error ? error.stack : undefined;
      this.writeLog(LogLevel.Error, message, error, source, stackTrace);
    }
  }

  fatal(message: string, error?: any, source?: string): void {
    const stackTrace = error instanceof Error ? error.stack : undefined;
    this.writeLog(LogLevel.Fatal, message, error, source, stackTrace);
  }

  // Performance logging
  startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.info(`Timer: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // User action logging
  logUserAction(action: string, details?: any): void {
    this.info(`User Action: ${action}`, details, 'UserAction');
  }

  // API logging
  logApiCall(method: string, url: string, duration: number, status: number, error?: any): void {
    const level = status >= 400 ? LogLevel.Error : LogLevel.Info;
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;
    
    if (this.shouldLog(level)) {
      this.writeLog(level, message, { method, url, duration, status, error }, 'API');
    }
  }

  // Get logs with filtering
  getLogs(level?: LogLevel, source?: string, limit?: number): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (source) {
      filteredLogs = filteredLogs.filter(log => log.source === source);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  // Export logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.convertToCSV(this.logs);
    }
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Get log statistics
  getLogStats(): { total: number; byLevel: Record<LogLevel, number>; bySources: Record<string, number> } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.Debug]: 0,
        [LogLevel.Info]: 0,
        [LogLevel.Warn]: 0,
        [LogLevel.Error]: 0,
        [LogLevel.Fatal]: 0
      },
      bySources: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      if (log.source) {
        stats.bySources[log.source] = (stats.bySources[log.source] || 0) + 1;
      }
    });

    return stats;
  }

  private shouldLog(level: LogLevel): boolean {
    const configLevel = this.getConfigLogLevel();
    return level >= configLevel;
  }

  private getConfigLogLevel(): LogLevel {
    switch (environment.logging.level) {
      case 'debug': return LogLevel.Debug;
      case 'info': return LogLevel.Info;
      case 'warn': return LogLevel.Warn;
      case 'error': return LogLevel.Error;
      case 'fatal': return LogLevel.Fatal;
      default: return LogLevel.Info;
    }
  }

  private writeLog(level: LogLevel, message: string, data?: any, source?: string, stackTrace?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace
    };

    // Add to in-memory logs
    this.logs.push(logEntry);

    // Manage log size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Console output
    if (environment.logging.enableConsoleLog) {
      this.writeToConsole(logEntry);
    }

    // Remote logging
    if (environment.logging.enableRemoteLog && level >= LogLevel.Error) {
      this.sendToRemoteService(logEntry);
    }
  }

  private writeToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${LogLevel[logEntry.level]}] [${logEntry.source || 'App'}]`;
    const message = `${prefix} ${logEntry.message}`;

    switch (logEntry.level) {
      case LogLevel.Debug:
        console.debug(message, logEntry.data);
        break;
      case LogLevel.Info:
        console.info(message, logEntry.data);
        break;
      case LogLevel.Warn:
        console.warn(message, logEntry.data);
        break;
      case LogLevel.Error:
      case LogLevel.Fatal:
        console.error(message, logEntry.data);
        if (logEntry.stackTrace) {
          console.error('Stack trace:', logEntry.stackTrace);
        }
        break;
    }
  }

  private sendToRemoteService(logEntry: LogEntry): void {
    // Implement remote logging service integration
    // This could be Sentry, LogRocket, or custom logging endpoint
    try {
      // Example: Send to custom logging endpoint
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      }).catch(error => {
        console.error('Failed to send log to remote service:', error);
      });
    } catch (error) {
      console.error('Error sending log to remote service:', error);
    }
  }

  private convertToCSV(logs: LogEntry[]): string {
    if (logs.length === 0) return '';

    const headers = ['timestamp', 'level', 'message', 'source', 'url'];
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp.toISOString(),
        LogLevel[log.level],
        `"${log.message.replace(/"/g, '""')}"`,
        log.source || '',
        log.url || ''
      ].join(','))
    ];

    return csvRows.join('\\n');
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogging(): void {
    // Log application start
    this.info('Application started', { 
      version: environment.version,
      environment: environment.production ? 'production' : 'development'
    });

    // Set up global error handling
    window.addEventListener('error', (event) => {
      this.error('Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }, 'GlobalErrorHandler');
    });

    // Set up unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      }, 'UnhandledPromise');
    });
  }
}
