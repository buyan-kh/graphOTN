/**
 * Structured logging for GoTN
 */

import { writeFile, appendFile } from "fs/promises";
import { mkdirSync, existsSync } from "fs";
import path from "path";

export interface LogEntry {
  t: string; // timestamp
  level: "info" | "warn" | "error" | "debug";
  msg: string;
  data?: any;
}

export class Logger {
  private logPath: string;

  constructor(workspacePath: string = ".") {
    this.logPath = path.join(workspacePath, ".gotn", "logs.ndjson");

    // Ensure logs directory exists
    const logsDir = path.dirname(this.logPath);
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
  }

  async log(level: LogEntry["level"], msg: string, data?: any): Promise<void> {
    const entry: LogEntry = {
      t: new Date().toISOString(),
      level,
      msg,
      data,
    };

    try {
      await appendFile(this.logPath, JSON.stringify(entry) + "\n");
    } catch (error) {
      // Fallback to console if file write fails
      console.error(`[GoTN] Failed to write log: ${error}`);
      console.error(`[GoTN] ${level.toUpperCase()}: ${msg}`, data);
    }
  }

  async info(msg: string, data?: any): Promise<void> {
    await this.log("info", msg, data);
  }

  async warn(msg: string, data?: any): Promise<void> {
    await this.log("warn", msg, data);
  }

  async error(msg: string, data?: any): Promise<void> {
    await this.log("error", msg, data);
  }

  async debug(msg: string, data?: any): Promise<void> {
    await this.log("debug", msg, data);
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function getLogger(workspacePath?: string): Logger {
  if (!globalLogger || workspacePath) {
    globalLogger = new Logger(workspacePath || ".");
  }
  return globalLogger;
}
