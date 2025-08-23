/**
 * Recovery utilities for GoTN
 */
export interface RecoveryResult {
    nodes_recovered: number;
    edges_recovered: number;
    skipped_entries: number;
    corrupt_entries: string[];
    success: boolean;
    message: string;
}
export declare class RecoveryEngine {
    private workspacePath;
    private logger;
    constructor(workspacePath?: string);
    recover(): Promise<RecoveryResult>;
    private processJournalEntry;
    verifyIntegrity(): Promise<{
        nodes: number;
        edges: number;
        valid: boolean;
    }>;
}
export declare function getRecoveryEngine(workspacePath?: string): RecoveryEngine;
