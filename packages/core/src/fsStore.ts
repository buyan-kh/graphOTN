/**
 * GoTN Filesystem Storage Layer
 *
 * Manages .gotn state with atomic writes, locking, and durable persistence.
 * All operations are designed to be safe for concurrent access.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createWriteStream } from "fs";
import { promisify } from "util";

// Types
export interface GoTNMeta {
  version: string;
  created: string;
  updated: string;
  workspace_path: string;
}

export interface GoTNGraph {
  nodes: GoTNNode[];
  edges: GoTNEdge[];
  version: number;
  updated: string;
}

export interface GoTNNode {
  id: string;
  kind: string;
  summary: string;
  prompt_text: string;
  parent?: string;
  children: string[];
  requires: string[];
  produces: string[];
  exec_target?: string;
  embedding_ref?: {
    collection: string;
    id: string;
  };
  tags: string[];
  success_criteria: string[];
  guards: string[];
  artifacts: {
    files: string[];
  };
  status: "ready" | "running" | "completed" | "failed" | "skipped";
  provenance: {
    created_by: string;
    source: string;
  };
  version: number;
}

export interface GoTNEdge {
  from: string;
  to: string;
  type: "hard_requires" | "soft_semantic" | "soft_order" | "derived_from";
  weight?: number;
  evidence?: string;
}

export interface JournalEntry {
  timestamp: string;
  event: string;
  data: any;
  id: string;
}

// Lock management
const writeLocks = new Map<string, Promise<void>>();

/**
 * Ensures atomic write operations using temp file + rename + fsync pattern
 */
async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    // Write to temp file
    await fs.writeFile(tempPath, data, { encoding: "utf8" });

    // Atomic rename
    await fs.rename(tempPath, filePath);

    // Ensure data is flushed to disk
    const fd = await fs.open(filePath, "r+");
    await fd.sync();
    await fd.close();
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Serializes write operations to prevent concurrent modifications
 */
export async function withWriteLock<T>(
  lockKey: string,
  operation: () => Promise<T>
): Promise<T> {
  // Wait for any existing lock
  const existingLock = writeLocks.get(lockKey);
  if (existingLock) {
    await existingLock;
  }

  // Create new lock
  const lockPromise = (async () => {
    try {
      return await operation();
    } finally {
      writeLocks.delete(lockKey);
    }
  })();

  writeLocks.set(
    lockKey,
    lockPromise.then(() => undefined)
  );

  return lockPromise;
}

/**
 * Initialize .gotn storage structure
 */
export async function initStore(workspacePath: string): Promise<void> {
  const gotnPath = path.join(workspacePath, ".gotn");

  await withWriteLock(`init:${gotnPath}`, async () => {
    // Create directory structure
    await fs.mkdir(gotnPath, { recursive: true });
    await fs.mkdir(path.join(gotnPath, "locks"), { recursive: true });
    await fs.mkdir(path.join(gotnPath, "runs"), { recursive: true });
    await fs.mkdir(path.join(gotnPath, "cache"), { recursive: true });

    const now = new Date().toISOString();

    // Initialize meta.json
    const metaPath = path.join(gotnPath, "meta.json");
    try {
      await fs.access(metaPath);
      // File exists, just update timestamp
      const existingMeta = await readMeta(workspacePath);
      existingMeta.updated = now;
      await atomicWrite(metaPath, JSON.stringify(existingMeta, null, 2));
    } catch {
      // File doesn't exist, create it
      const meta: GoTNMeta = {
        version: "0.1.0",
        created: now,
        updated: now,
        workspace_path: workspacePath,
      };
      await atomicWrite(metaPath, JSON.stringify(meta, null, 2));
    }

    // Initialize graph.json
    const graphPath = path.join(gotnPath, "graph.json");
    try {
      await fs.access(graphPath);
      // File exists, don't overwrite
    } catch {
      // File doesn't exist, create empty graph
      const graph: GoTNGraph = {
        nodes: [],
        edges: [],
        version: 1,
        updated: now,
      };
      await atomicWrite(graphPath, JSON.stringify(graph, null, 2));
    }

    // Initialize journal.ndjson if it doesn't exist
    const journalPath = path.join(gotnPath, "journal.ndjson");
    try {
      await fs.access(journalPath);
      // File exists, don't overwrite
    } catch {
      // Create empty journal file
      await atomicWrite(journalPath, "");
    }
  });
}

/**
 * Read meta.json
 */
export async function readMeta(workspacePath: string): Promise<GoTNMeta> {
  const metaPath = path.join(workspacePath, ".gotn", "meta.json");
  const content = await fs.readFile(metaPath, "utf8");
  return JSON.parse(content);
}

/**
 * Read graph.json
 */
export async function readGraph(workspacePath: string): Promise<GoTNGraph> {
  const graphPath = path.join(workspacePath, ".gotn", "graph.json");
  const content = await fs.readFile(graphPath, "utf8");
  return JSON.parse(content);
}

/**
 * Write graph.json atomically
 */
export async function writeGraph(
  workspacePath: string,
  graph: GoTNGraph
): Promise<void> {
  const graphPath = path.join(workspacePath, ".gotn", "graph.json");

  await withWriteLock(`graph:${workspacePath}`, async () => {
    // Update version and timestamp
    graph.version += 1;
    graph.updated = new Date().toISOString();

    // Write atomically
    await atomicWrite(graphPath, JSON.stringify(graph, null, 2));
  });
}

/**
 * Append entry to journal.ndjson
 */
export async function appendJournal(
  workspacePath: string,
  entry: Omit<JournalEntry, "timestamp" | "id">
): Promise<void> {
  const journalPath = path.join(workspacePath, ".gotn", "journal.ndjson");

  await withWriteLock(`journal:${workspacePath}`, async () => {
    const fullEntry: JournalEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const line = JSON.stringify(fullEntry) + "\n";
    await fs.appendFile(journalPath, line, "utf8");
  });
}

/**
 * Read all journal entries
 */
export async function readJournal(
  workspacePath: string
): Promise<JournalEntry[]> {
  const journalPath = path.join(workspacePath, ".gotn", "journal.ndjson");

  try {
    const content = await fs.readFile(journalPath, "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Check if .gotn exists and is properly initialized
 */
export async function isInitialized(workspacePath: string): Promise<boolean> {
  try {
    const gotnPath = path.join(workspacePath, ".gotn");
    await fs.access(gotnPath);

    // Check required files
    await fs.access(path.join(gotnPath, "meta.json"));
    await fs.access(path.join(gotnPath, "graph.json"));
    await fs.access(path.join(gotnPath, "journal.ndjson"));

    return true;
  } catch {
    return false;
  }
}
