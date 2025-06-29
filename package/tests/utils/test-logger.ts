import { Page, ConsoleMessage } from '@playwright/test';
import { writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
  url?: string;
  location?: string;
  stack?: string;
}

export class TestLogger {
  private logEntries: LogEntry[] = [];
  private logDir: string;
  private testName: string;
  private logFile: string;

  constructor(testName: string) {
    this.testName = testName.replace(/[^a-zA-Z0-9-_]/g, '-');
    this.logDir = join('test-results', 'logs');
    this.logFile = join(this.logDir, `${this.testName}-${Date.now()}.log`);
    
    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
    
    // Initialize log file
    this.writeToFile(`=== TEST LOG: ${testName} ===\n`);
    this.writeToFile(`Started at: ${new Date().toISOString()}\n\n`);
  }

  /**
   * Setup console logging for a page
   */
  setupPageLogging(page: Page): void {
    // Capture all console messages
    page.on('console', (msg: ConsoleMessage) => {
      this.logConsoleMessage(msg);
    });

    // Capture page errors
    page.on('pageerror', (error: Error) => {
      this.logError('PAGE_ERROR', error.message, error.stack);
    });

    // Capture network failures
    page.on('response', (response) => {
      if (!response.ok() && response.status() >= 400) {
        this.logEntry('NETWORK_ERROR', `${response.status()} ${response.statusText()} - ${response.url()}`);
      }
    });

    // Capture request failures
    page.on('requestfailed', (request) => {
      this.logEntry('REQUEST_FAILED', `${request.method()} ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
    });

    // Capture worker errors
    page.on('worker', (worker) => {
      worker.on('error', (error) => {
        this.logError('WORKER_ERROR', error.message, error.stack);
      });
    });
  }

  /**
   * Log a console message
   */
  private logConsoleMessage(msg: ConsoleMessage): void {
    const type = msg.type().toUpperCase();
    const text = msg.text();
    const location = msg.location();
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: `CONSOLE_${type}`,
      message: text,
      url: location.url,
      location: `${location.url}:${location.lineNumber}:${location.columnNumber}`
    };

    this.logEntries.push(entry);
    this.writeLogEntry(entry);
  }

  /**
   * Log an error with stack trace
   */
  private logError(type: string, message: string, stack?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      stack
    };

    this.logEntries.push(entry);
    this.writeLogEntry(entry);
  }

  /**
   * Log a custom entry
   */
  logEntry(type: string, message: string, extra?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message: extra ? `${message} | ${JSON.stringify(extra)}` : message
    };

    this.logEntries.push(entry);
    this.writeLogEntry(entry);
  }

  /**
   * Log test step
   */
  logStep(stepName: string, details?: string): void {
    this.logEntry('TEST_STEP', `${stepName}${details ? ` - ${details}` : ''}`);
  }

  /**
   * Write log entry to file
   */
  private writeLogEntry(entry: LogEntry): void {
    let output = `[${entry.timestamp}] ${entry.type}: ${entry.message}\n`;
    
    if (entry.location) {
      output += `  Location: ${entry.location}\n`;
    }
    
    if (entry.stack) {
      output += `  Stack:\n${entry.stack.split('\n').map(line => `    ${line}`).join('\n')}\n`;
    }
    
    output += '\n';
    this.writeToFile(output);
  }

  /**
   * Write to log file
   */
  private writeToFile(content: string): void {
    try {
      appendFileSync(this.logFile, content, 'utf8');
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }

  /**
   * Get all log entries
   */
  getLogEntries(): LogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * Finalize logging
   */
  finalize(): void {
    this.writeToFile(`\n=== TEST COMPLETED ===\n`);
    this.writeToFile(`Finished at: ${new Date().toISOString()}\n`);
    this.writeToFile(`Total log entries: ${this.logEntries.length}\n`);
    
    // Write summary of log types
    const typeCounts = this.logEntries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    this.writeToFile('\nLog type summary:\n');
    Object.entries(typeCounts).forEach(([type, count]) => {
      this.writeToFile(`  ${type}: ${count}\n`);
    });
  }
}