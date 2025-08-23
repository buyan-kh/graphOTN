#!/usr/bin/env node

/**
 * CLI tool for manual embedding checks
 */

// Load environment variables from project root
import "../load-env.js";

import { getEmbedder } from "../src/index.js";

const text = process.argv[2] || "hello";
const dim = Number(process.env.GOTN_EMBED_DIM) || 1536;

getEmbedder()
  .embed(text)
  .then((v) => {
    console.log("dim", v.length);
    console.log("first5", v.slice(0, 5));
    console.log("env_dim", dim);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
