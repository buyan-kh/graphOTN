/**
 * Structured logging for GoTN
 */
export interface LogEntry {
    t: string;
    level: "info" | "warn" | "error" | "debug";
    msg: string;
    data?: any;
}
export declare class Logger {
    private logPath;
    constructor(workspacePath?: string);
    log(level: LogEntry["level"], msg: string, data?: any): Promise<void>;
    info(msg: string, data?: any): Promise<void>;
    warn(msg: string, data?: any): Promise<void>;
    error(msg: string, data?: any): Promise<void>;
    debug(msg: string, data?: any): Promise<void>;
}
export declare function getLogger(workspacePath?: string): Logger;
