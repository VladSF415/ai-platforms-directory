// Get token from environment variable or command line argument
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.argv[2];

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found');
  console.error('Usage: node setup-telegram-bot.mjs [BOT_TOKEN]');
  console.error('   or: set TELEGRAM_BOT_TOKEN environment variable');
  process.exit(1);
}

const API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Bot configuration
const BOT_CONFIG = {
  // Short description (120 characters max) - shown in chat list
  shortDescription: 'Discover 739+ AI tools. Search, filter, get recommendations. Find the perfect platform.',

  // Full description (512 characters max) - shown when user opens bot
  description: `🤖 AI PLATFORMS LIST

739+ AI tools directory. Search, filter, get personalized recommendations.

🔍 Search tools
💡 Get recommendations
📂 Browse categories
⭐ View ratings & pricing
🚀 Submit your platform

Commands: /start /menu /search /categories /random

Visit: aiplatformslist.com`,

  // Bot commands
  commands: [
    { command: 'start', description: '🏠 Open main menu' },
    { command: 'menu', description: '📱 Interactive menu with all options' },
    { command: 'search', description: '🔍 Search for AI platforms' },
    { command: 'categories', description: '📂 Browse by category' },
    { command: 'random', description: '🎲 Discover a random platform' },
    { command: 'trending', description: '🔥 View trending platforms' },
    { command: 'ask', description: '🤖 Ask AI for recommendations' },
    { command: 'help', description: '❓ Get help and usage guide' },
    { command: 'submit', description: '🚀 Submit your platform' }
  ]
};

async function setBotCommands() {
  console.log('📝 Setting bot commands...');

  const response = await fetch(`${API_URL}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: BOT_CONFIG.commands
    })
  });

  const data = await response.json();

  if (data.ok) {
    console.log('✅ Bot commands set successfully');
    console.log(`   Added ${BOT_CONFIG.commands.length} commands`);
  } else {
    console.error('❌ Failed to set commands:', data.description);
  }

  return data.ok;
}

async function setBotDescription() {
  console.log('\n📝 Setting bot description...');

  const response = await fetch(`${API_URL}/setMyDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: BOT_CONFIG.description
    })
  });

  const data = await response.json();

  if (data.ok) {
    console.log('✅ Bot description set successfully');
    console.log(`   Length: ${BOT_CONFIG.description.length} characters`);
  } else {
    console.error('❌ Failed to set description:', data.description);
  }

  return data.ok;
}

async function setBotShortDescription() {
  console.log('\n📝 Setting bot short description (About)...');

  const response = await fetch(`${API_URL}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: BOT_CONFIG.shortDescription
    })
  });

  const data = await response.json();

  if (data.ok) {
    console.log('✅ Bot short description set successfully');
    console.log(`   Length: ${BOT_CONFIG.shortDescription.length} characters`);
  } else {
    console.error('❌ Failed to set short description:', data.description);
  }

  return data.ok;
}

async function getBotInfo() {
  console.log('\n📊 Getting bot info...');

  const response = await fetch(`${API_URL}/getMe`);
  const data = await response.json();

  if (data.ok) {
    const bot = data.result;
    console.log('✅ Bot info:');
    console.log(`   Name: ${bot.first_name}`);
    console.log(`   Username: @${bot.username}`);
    console.log(`   ID: ${bot.id}`);
  }

  return data.ok;
}

// Main execution
async function main() {
  console.log('🤖 AI PLATFORMS LIST - Telegram Bot Setup\n');
  console.log('=' .repeat(50));

  try {
    // Get bot info first
    await getBotInfo();

    console.log('\n' + '=' .repeat(50));
    console.log('🔧 Configuring bot settings...\n');

    // Set all configurations
    const results = await Promise.all([
      setBotCommands(),
      setBotDescription(),
      setBotShortDescription()
    ]);

    console.log('\n' + '=' .repeat(50));

    if (results.every(r => r)) {
      console.log('\n✅ All bot settings configured successfully!');
      console.log('\n📱 Your bot is ready to use!');
      console.log('   Try it: https://t.me/' + (await fetch(`${API_URL}/getMe`).then(r => r.json())).result.username);
    } else {
      console.log('\n⚠️  Some settings failed. Check errors above.');
    }

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    process.exit(1);
  }
}

main();
