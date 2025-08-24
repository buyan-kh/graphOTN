# GoTN Viewer

A clean, monochrome React Flow viewer for GoTN graphs with no canvas usage.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (runs on port 4312)
npm run dev

# Build for production
npm run build
```

## API Proxy

The viewer automatically proxies API requests:

- Viewer runs on http://localhost:4312
- API requests to `/api/*` are proxied to http://localhost:4311
- Make sure your GoTN API server is running on port 4311

## Keyboard Shortcuts

- `/` - Focus search input
- `f` - Fit view to show all nodes
- `r` - Reload graph data (Ctrl/Cmd+R)
- `Esc` - Close node drawer or blur focused input

## Features

### Graph Visualization

- **Topological layout** - Nodes arranged by dependency layers
- **Edge types** - Solid lines for hard dependencies, dashed for soft/semantic
- **Cycle detection** - Shows warning banner when cycles detected
- **Responsive layout** - Top-down or left-right orientation

### Interactions

- **Click node** - Open detailed drawer with raw JSON
- **Double-click node** - Center and zoom to node
- **Search** - Live filter by node ID or summary (case-insensitive)
- **Hover edge** - Show edge type and score tooltip

### Controls

- **Search box** - Filter nodes and connected edges
- **Reload button** - Refresh data from API
- **Layout selector** - Switch between Top-Down and Left-Right
- **Legend toggle** - Show/hide edge type legend
- **Export button** - Download current graph as JSON

### Accessibility

- **Keyboard navigation** - All controls accessible via keyboard
- **Focus management** - Proper focus trapping in modal drawer
- **ARIA labels** - Screen reader friendly
- **High contrast** - Monochrome design with clear visual hierarchy

## Data Format

The viewer expects data from `GET /graph`:

```typescript
type RawNode = {
  id: string;
  summary?: string;
  [k: string]: any;
};

type RawEdge = {
  src: string;
  dst: string;
  type?: string;
  score?: number;
  [k: string]: any;
};

type GraphPayload = {
  nodes: RawNode[];
  edges: RawEdge[];
};
```

### Edge Types

- `hard_requires` / `derived_from` - Solid black lines (dependencies)
- `soft_semantic` / `soft_order` - Dashed gray lines (similarity)
- No type specified - Defaults to hard edge

## Design System

Monochrome palette with CSS variables:

- `--bg: #ffffff` (background)
- `--fg: #111111` (foreground text)
- `--muted: #666666` (secondary text)
- `--line: #cccccc` (borders)
- `--panel: #f7f7f7` (panels/toolbars)

No colors are used - only black, white, and grays.

## Performance

- **Smooth rendering** - Tested with 300+ nodes and 500+ edges
- **Debounced search** - 200ms delay to prevent excessive filtering
- **Memory efficient** - No memory leaks on repeated reloads
- **SVG/HTML only** - No canvas or WebGL usage

## Empty States

- **No data** - Shows centered message with reload button
- **Fetch errors** - Error banner with retry action
- **No search results** - All nodes hidden, counts show 0/total

## URL State

The viewer syncs state with URL parameters:

- `?q=search` - Search query
- `?node=nodeId` - Selected node (opens drawer)
- `?layout=LR` - Layout mode (TD is default)

## Browser Support

Modern browsers with ES2020 support:

- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+
