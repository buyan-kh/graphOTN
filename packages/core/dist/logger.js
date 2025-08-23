/**
 * Structured logging for GoTN
 */
import { appendFile } from "fs/promises";
import { mkdirSync, existsSync } from "fs";
import path from "path";
export class Logger {
    logPath;
    constructor(workspacePath = ".") {
        this.logPath = path.join(workspacePath, ".gotn", "logs.ndjson");
        // Ensure logs directory exists
        const logsDir = path.dirname(this.logPath);
        if (!existsSync(logsDir)) {
            mkdirSync(logsDir, { recursive: true });
        }
    }
    async log(level, msg, data) {
        const entry = {
            t: new Date().toISOString(),
            level,
            msg,
            data,
        };
        try {
            await appendFile(this.logPath, JSON.stringify(entry) + "\n");
        }
        catch (error) {
            // Fallback to console if file write fails
            console.error(`[GoTN] Failed to write log: ${error}`);
            console.error(`[GoTN] ${level.toUpperCase()}: ${msg}`, data);
        }
    }
    async info(msg, data) {
        await this.log("info", msg, data);
    }
    async warn(msg, data) {
        await this.log("warn", msg, data);
    }
    async error(msg, data) {
        await this.log("error", msg, data);
    }
    async debug(msg, data) {
        await this.log("debug", msg, data);
    }
}
// Global logger instance
let globalLogger = null;
export function getLogger(workspacePath) {
    if (!globalLogger || workspacePath) {
        globalLogger = new Logger(workspacePath || ".");
    }
    return globalLogger;
}
