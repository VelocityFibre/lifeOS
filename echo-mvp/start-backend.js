#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, 'mastra-backend');

console.log('Starting backend server...');
console.log(`Backend directory: ${BACKEND_DIR}`);

const server = spawn('npm', ['run', 'api'], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
  detached: false
});

server.on('error', (error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  process.exit(code || 0);
});

// Forward signals to child process
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, forwarding to backend...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, forwarding to backend...');
  server.kill('SIGINT');
});
