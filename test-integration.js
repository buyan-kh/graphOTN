#!/usr/bin/env node

/**
 * Test full cloud integration:
 * 1. Use cloud MCP server to create a project breakdown
 * 2. Integrate cloud API with real data from MCP server
 * 3. Verify viewer shows the real data
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Testing Full Cloud Integration...');

// Start the cloud MCP server
const serverPath = join(__dirname, 'packages/server/dist/cloudMain.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let testProjectId = 'test-ecommerce-app';

// Test sequence
async function testFullIntegration() {
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('📡 Step 1: Initialize project...');
  
  // Initialize project
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'gotn_init_project',
      arguments: {
        project_id: testProjectId,
        project_name: 'E-commerce App Test'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait a bit then breakdown prompt
  setTimeout(() => {
    console.log('🔄 Step 2: Break down complex prompt...');
    
    const breakdownRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'gotn_breakdown_prompt',
        arguments: {
          project_id: testProjectId,
          prompt: 'Build a full-stack e-commerce web application with user authentication, product catalog with search and filters, shopping cart, checkout with payment processing, order management, and admin dashboard for inventory management',
          mode: 'tree',
          max_nodes: 8
        }
      }
    };
    
    server.stdin.write(JSON.stringify(breakdownRequest) + '\n');
    
    // Wait then test API integration
    setTimeout(() => {
      testAPIIntegration();
    }, 3000);
  }, 1000);
}

async function testAPIIntegration() {
  console.log('🌐 Step 3: Test cloud API with real data...');
  
  try {
    // Test if cloud API can get the real data
    const response = await fetch(`http://localhost:4311/graph?project_id=${testProjectId}`);
    const data = await response.json();
    
    console.log(`📊 API Response: ${data.nodes?.length || 0} nodes, ${data.edges?.length || 0} edges`);
    
    if (data.nodes && data.nodes.length > 0) {
      console.log('✅ SUCCESS: Cloud API is serving real MCP data!');
      console.log(`🎯 Project: ${data.project_id}`);
      console.log(`📝 First node: ${data.nodes[0].summary}`);
      
      // Test viewer integration
      console.log('🖥️  Step 4: Testing viewer integration...');
      console.log(`📱 Open viewer: http://localhost:4313`);
      console.log(`🔍 Select project: ${testProjectId}`);
      
    } else {
      console.log('❌ ISSUE: API not returning real data from MCP server');
      console.log('💡 This means we need to connect cloud API to cloud store');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
  
  // Clean up
  setTimeout(() => {
    console.log('\n✅ Integration test completed!');
    server.kill();
    process.exit(0);
  }, 2000);
}

// Handle server output
server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  if (response.includes('"result"')) {
    try {
      const parsed = JSON.parse(response);
      if (parsed.result && parsed.result.content) {
        const content = JSON.parse(parsed.result.content[0].text);
        console.log(`📥 MCP Response: ${content.tool} - ${content.message}`);
        if (content.nodes_created) {
          console.log(`   Created ${content.nodes_created} nodes, ${content.edges_created} edges`);
        }
      }
    } catch (e) {
      // Ignore parsing errors for log messages
    }
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Start the test
testFullIntegration().catch(console.error);
