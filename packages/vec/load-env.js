#!/usr/bin/env node

/**
 * Simple utility to load .env from project root
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");

try {
  const envPath = join(projectRoot, ".env");
  const envContent = readFileSync(envPath, "utf8");

  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env file not found or not readable - this is okay
}
