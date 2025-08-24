#!/bin/bash

# GoTN Cloud System Startup Script

echo "🌥️  Starting GoTN Cloud System..."

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "cloudApi.js" 2>/dev/null || true
pkill -f "vite.*4313" 2>/dev/null || true
sleep 2

# Start Cloud API Server
echo "📡 Starting Cloud API Server (port 4311)..."
node cloudApi.js &
API_PID=$!

# Wait for API to start
sleep 3

# Start Viewer
echo "🖥️  Starting Viewer (port 4313)..."
cd viewer
npm run dev &
VIEWER_PID=$!

echo "✅ GoTN Cloud System Started!"
echo ""
echo "📊 Cloud API:  http://localhost:4311"
echo "🖥️  Viewer:     http://localhost:4313" 
echo "💡 MCP Server: Runs automatically with Cursor"
echo ""
echo "🎯 Usage:"
echo "1. Open Cursor in any project"
echo "2. Ask: 'Break down this task: Build a React dashboard'"
echo "3. GoTN will create a project breakdown automatically"
echo "4. View the graph at http://localhost:4313"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping GoTN..."; kill $API_PID $VIEWER_PID 2>/dev/null; exit' INT
wait
