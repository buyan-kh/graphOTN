# GoTN - Graph of Tiny Nodes

GoTN turns large requests into atomic micro-prompts, stores them as a dependency graph, and links them by dependencies and semantic similarity.

## Architecture

- **Server**: MCP server entry point
- **Core**: Schemas, filesystem layer, and graph logic
- **Vec**: Embeddings and vector store with Zilliz integration

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Development

Run the server in watch mode:

```bash
pnpm dev
```

### Build

Build all packages:

```bash
pnpm build
```

### Type Check

Check types across all packages:

```bash
pnpm type-check
```

## Package Structure

```
packages/
├── server/     # MCP server entry point
├── core/       # Core schemas and graph logic
└── vec/        # Vector store and embeddings
```

## Development Workflow

1. `pnpm install` - Install dependencies
2. `pnpm dev` - Start development server
3. `pnpm build` - Build for production
4. `pnpm type-check` - Verify TypeScript types

The dev command runs the server package in watch mode, automatically rebuilding on changes.
