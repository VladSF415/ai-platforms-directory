import { spawn } from 'child_process';

console.log('🚀 Starting AI Platforms Directory services...\n');

// Start the web server
console.log('📡 Starting web server...');
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

// Start the Telegram bot
console.log('🤖 Starting Telegram bot...');
const bot = spawn('node', ['telegram-bot.js'], {
  stdio: 'inherit',
  env: process.env
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
});

// Handle bot errors
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

bot.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Bot exited with code ${code}`);
  }
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down services...');

  server.kill('SIGTERM');
  bot.kill('SIGTERM');

  setTimeout(() => {
    console.log('✅ Services stopped');
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('\n✅ All services started successfully!');
console.log('Press Ctrl+C to stop all services\n');
