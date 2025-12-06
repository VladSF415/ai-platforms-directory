import TelegramBot from 'node-telegram-bot-api';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BASE_URL = process.env.BASE_URL || 'https://aiplatformslist.com';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required!');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Load platform data
const platformsPath = join(__dirname, 'platforms.json');
const platforms = JSON.parse(readFileSync(platformsPath, 'utf-8'));

// Load categories
const categories = [...new Set(platforms.map(p => p.category))].filter(Boolean).sort();

// In-memory storage for pending submissions (in production, use a database)
const pendingSubmissions = [];

console.log(`🤖 Telegram Bot started with ${platforms.length} platforms loaded`);
console.log(`📁 Available categories: ${categories.length}`);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function formatPlatform(platform, includeDescription = true) {
  const name = escapeMarkdown(platform.name);
  const category = escapeMarkdown(platform.category || 'Uncategorized');
  const pricing = escapeMarkdown(platform.pricing || 'Not specified');
  const url = `${BASE_URL}/platform/${platform.slug}`;

  let message = `🤖 *${name}*\n\n`;
  message += `📂 Category: ${category}\n`;
  message += `💰 Pricing: ${pricing}\n`;

  if (includeDescription && platform.description) {
    const desc = escapeMarkdown(platform.description.substring(0, 200));
    message += `\n${desc}${platform.description.length > 200 ? '...' : ''}\n`;
  }

  if (platform.website) {
    message += `\n🔗 [Visit Website](${platform.website})`;
  }

  message += `\n📄 [Full Details](${url})`;

  return message;
}

function getCategoryKeyboard() {
  const buttons = categories.slice(0, 20).map(cat => [{
    text: `${cat} (${platforms.filter(p => p.category === cat).length})`,
    callback_data: `cat_${cat}`
  }]);

  return { inline_keyboard: buttons };
}

function getPlatformKeyboard(platform) {
  const buttons = [];

  if (platform.website) {
    buttons.push([{ text: '🌐 Visit Website', url: platform.website }]);
  }

  buttons.push([{ text: '📄 Full Details', url: `${BASE_URL}/platform/${platform.slug}` }]);

  // Add "More from this category" button
  buttons.push([{ text: '📂 More in this category', callback_data: `cat_${platform.category}` }]);

  return { inline_keyboard: buttons };
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';

  const welcomeMessage = `👋 Welcome to *AI Platforms List Bot*, ${escapeMarkdown(firstName)}\\!\n\n` +
    `Discover ${platforms.length}\\+ AI tools and platforms\\.\n\n` +
    `*What can I do?*\n` +
    `🔍 Search platforms \\- /search \\[query\\]\n` +
    `📂 Browse categories \\- /category\n` +
    `🎲 Random platform \\- /random\n` +
    `🔥 Trending tools \\- /trending\n` +
    `💡 Get recommendations \\- /recommend\n` +
    `❓ Help \\- /help\n\n` +
    `You can also use inline search\\! Type @${escapeMarkdown(bot.options.username || 'aiplatformsbot')} in any chat to search\\.`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '🔍 Search Platforms', switch_inline_query_current_chat: '' }],
      [{ text: '📂 Browse Categories', callback_data: 'browse_categories' }],
      [{ text: '🎲 Random Platform', callback_data: 'random_platform' }],
      [{ text: '🌐 Visit Website', url: BASE_URL }]
    ]
  };

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard
  });
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `*📚 AI Platforms List Bot \\- Help*\n\n` +
    `*Commands:*\n` +
    `/start \\- Show welcome message\n` +
    `/search \\[query\\] \\- Search for AI platforms\n` +
    `/category \\- Browse platforms by category\n` +
    `/random \\- Get a random AI platform\n` +
    `/trending \\- See trending AI tools\n` +
    `/recommend \\- Get personalized recommendations\n` +
    `/help \\- Show this help message\n\n` +
    `*Inline Search:*\n` +
    `Type @${escapeMarkdown(bot.options.username || 'aiplatformsbot')} \\[query\\] in any chat to search platforms\\.\n\n` +
    `*Need more help?*\n` +
    `Visit our website: ${escapeMarkdown(BASE_URL)}`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'MarkdownV2' });
});

// /search command
bot.onText(/\/search(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  if (!query) {
    bot.sendMessage(chatId, '🔍 *Search AI Platforms*\n\nUsage: /search \\[your query\\]\n\nExample: `/search chatbot`', {
      parse_mode: 'MarkdownV2'
    });
    return;
  }

  const searchQuery = query.toLowerCase();
  const results = platforms.filter(p =>
    p.name.toLowerCase().includes(searchQuery) ||
    (p.description && p.description.toLowerCase().includes(searchQuery)) ||
    (p.category && p.category.toLowerCase().includes(searchQuery))
  ).slice(0, 10);

  if (results.length === 0) {
    bot.sendMessage(chatId, `❌ No platforms found for "${escapeMarkdown(query)}"\\.\n\nTry a different search term or browse by /category\\.`, {
      parse_mode: 'MarkdownV2'
    });
    return;
  }

  bot.sendMessage(chatId, `🔍 Found ${results.length} platform${results.length > 1 ? 's' : ''} for "${escapeMarkdown(query)}":`, {
    parse_mode: 'MarkdownV2'
  });

  results.forEach((platform, index) => {
    setTimeout(() => {
      bot.sendMessage(chatId, formatPlatform(platform, false), {
        parse_mode: 'MarkdownV2',
        reply_markup: getPlatformKeyboard(platform),
        disable_web_page_preview: true
      });
    }, index * 100); // Stagger messages to avoid rate limits
  });
});

// /category command
bot.onText(/\/category/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, `📂 *Browse by Category*\n\nSelect a category to explore:`, {
    parse_mode: 'MarkdownV2',
    reply_markup: getCategoryKeyboard()
  });
});

// /random command
bot.onText(/\/random/, (msg) => {
  const chatId = msg.chat.id;
  const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

  bot.sendMessage(chatId, `🎲 *Random AI Platform*\n\n${formatPlatform(randomPlatform)}`, {
    parse_mode: 'MarkdownV2',
    reply_markup: getPlatformKeyboard(randomPlatform),
    disable_web_page_preview: true
  });
});

// /trending command
bot.onText(/\/trending/, (msg) => {
  const chatId = msg.chat.id;

  // Get random trending platforms (in production, use actual trending data)
  const trending = platforms
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  bot.sendMessage(chatId, `🔥 *Trending AI Platforms*\n\nTop platforms right now:`, {
    parse_mode: 'MarkdownV2'
  });

  trending.forEach((platform, index) => {
    setTimeout(() => {
      bot.sendMessage(chatId, `${index + 1}\\. ${formatPlatform(platform, false)}`, {
        parse_mode: 'MarkdownV2',
        reply_markup: getPlatformKeyboard(platform),
        disable_web_page_preview: true
      });
    }, index * 100);
  });
});

// /recommend command
bot.onText(/\/recommend/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [
      [{ text: '✍️ Writing & Content', callback_data: 'rec_writing' }],
      [{ text: '💻 Code & Development', callback_data: 'rec_code' }],
      [{ text: '🎨 Image Generation', callback_data: 'rec_image' }],
      [{ text: '🎥 Video Creation', callback_data: 'rec_video' }],
      [{ text: '💬 Chat & Assistants', callback_data: 'rec_chat' }],
      [{ text: '📊 Data & Analytics', callback_data: 'rec_data' }]
    ]
  };

  bot.sendMessage(chatId, `💡 *Get Recommendations*\n\nWhat type of AI tool are you looking for?`, {
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard
  });
});

// ============================================================================
// ADMIN COMMANDS
// ============================================================================

// /pending command (admin only)
bot.onText(/\/pending/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== ADMIN_CHAT_ID) {
    bot.sendMessage(chatId, '❌ This command is only available to administrators.');
    return;
  }

  if (pendingSubmissions.length === 0) {
    bot.sendMessage(chatId, '✅ No pending submissions.');
    return;
  }

  bot.sendMessage(chatId, `📋 *Pending Submissions: ${pendingSubmissions.length}*`, {
    parse_mode: 'MarkdownV2'
  });

  pendingSubmissions.forEach((submission, index) => {
    const message = `*${index + 1}\\. ${escapeMarkdown(submission.name)}*\n\n` +
      `🌐 Website: ${escapeMarkdown(submission.website)}\n` +
      `📂 Category: ${escapeMarkdown(submission.category)}\n` +
      `💰 Pricing: ${escapeMarkdown(submission.pricing)}\n` +
      `📧 Contact: ${escapeMarkdown(submission.contactEmail)}\n\n` +
      `Description: ${escapeMarkdown(submission.description)}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: `approve_${index}` },
          { text: '❌ Reject', callback_data: `reject_${index}` }
        ],
        [{ text: '🌐 Visit Website', url: submission.website }]
      ]
    };

    bot.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });
  });
});

// /stats command (admin only)
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== ADMIN_CHAT_ID) {
    bot.sendMessage(chatId, '❌ This command is only available to administrators.');
    return;
  }

  const stats = `📊 *Bot Statistics*\n\n` +
    `🤖 Total Platforms: ${platforms.length}\n` +
    `📂 Categories: ${categories.length}\n` +
    `📋 Pending Submissions: ${pendingSubmissions.length}\n` +
    `🌐 Website: ${escapeMarkdown(BASE_URL)}`;

  bot.sendMessage(chatId, stats, { parse_mode: 'MarkdownV2' });
});

// ============================================================================
// CALLBACK QUERY HANDLERS
// ============================================================================

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Handle category selection
  if (data.startsWith('cat_')) {
    const category = data.substring(4);
    const categoryPlatforms = platforms.filter(p => p.category === category).slice(0, 10);

    bot.sendMessage(chatId, `📂 *${escapeMarkdown(category)}*\n\nShowing ${categoryPlatforms.length} platforms:`, {
      parse_mode: 'MarkdownV2'
    });

    categoryPlatforms.forEach((platform, index) => {
      setTimeout(() => {
        bot.sendMessage(chatId, formatPlatform(platform, false), {
          parse_mode: 'MarkdownV2',
          reply_markup: getPlatformKeyboard(platform),
          disable_web_page_preview: true
        });
      }, index * 100);
    });

    bot.answerCallbackQuery(query.id);
    return;
  }

  // Handle browse categories
  if (data === 'browse_categories') {
    bot.sendMessage(chatId, `📂 *Browse by Category*\n\nSelect a category:`, {
      parse_mode: 'MarkdownV2',
      reply_markup: getCategoryKeyboard()
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  // Handle random platform
  if (data === 'random_platform') {
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    bot.sendMessage(chatId, `🎲 *Random Platform*\n\n${formatPlatform(randomPlatform)}`, {
      parse_mode: 'MarkdownV2',
      reply_markup: getPlatformKeyboard(randomPlatform),
      disable_web_page_preview: true
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  // Handle recommendations
  if (data.startsWith('rec_')) {
    const type = data.substring(4);
    const categoryMap = {
      writing: 'writing',
      code: 'code',
      image: 'image-generation',
      video: 'video',
      chat: 'chatbots',
      data: 'analytics'
    };

    const category = categoryMap[type];
    const recommended = platforms.filter(p =>
      p.category && p.category.toLowerCase().includes(category)
    ).slice(0, 5);

    if (recommended.length === 0) {
      bot.sendMessage(chatId, '❌ No recommendations found in this category.');
      bot.answerCallbackQuery(query.id);
      return;
    }

    bot.sendMessage(chatId, `💡 *Recommended for ${type}:*`, {
      parse_mode: 'MarkdownV2'
    });

    recommended.forEach((platform, index) => {
      setTimeout(() => {
        bot.sendMessage(chatId, formatPlatform(platform, false), {
          parse_mode: 'MarkdownV2',
          reply_markup: getPlatformKeyboard(platform),
          disable_web_page_preview: true
        });
      }, index * 100);
    });

    bot.answerCallbackQuery(query.id);
    return;
  }

  // Handle admin actions
  if (data.startsWith('approve_') || data.startsWith('reject_')) {
    if (chatId.toString() !== ADMIN_CHAT_ID) {
      bot.answerCallbackQuery(query.id, { text: '❌ Admin only' });
      return;
    }

    const index = parseInt(data.split('_')[1]);
    const submission = pendingSubmissions[index];

    if (!submission) {
      bot.answerCallbackQuery(query.id, { text: '❌ Submission not found' });
      return;
    }

    if (data.startsWith('approve_')) {
      bot.sendMessage(chatId, `✅ Approved: ${submission.name}\n\n(In production, this would add to database)`);
      pendingSubmissions.splice(index, 1);
    } else {
      bot.sendMessage(chatId, `❌ Rejected: ${submission.name}`);
      pendingSubmissions.splice(index, 1);
    }

    bot.answerCallbackQuery(query.id);
    return;
  }

  bot.answerCallbackQuery(query.id);
});

// ============================================================================
// INLINE QUERY HANDLER
// ============================================================================

bot.on('inline_query', (query) => {
  const searchQuery = query.query.toLowerCase();

  if (!searchQuery) {
    // Show random platforms if no query
    const randomPlatforms = platforms.sort(() => Math.random() - 0.5).slice(0, 10);

    const results = randomPlatforms.map((platform, index) => ({
      type: 'article',
      id: `${index}`,
      title: platform.name,
      description: `${platform.category || 'AI Platform'} - ${platform.pricing || 'Pricing varies'}`,
      input_message_content: {
        message_text: formatPlatform(platform),
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      },
      reply_markup: getPlatformKeyboard(platform)
    }));

    bot.answerInlineQuery(query.id, results, { cache_time: 300 });
    return;
  }

  // Search platforms
  const results = platforms.filter(p =>
    p.name.toLowerCase().includes(searchQuery) ||
    (p.description && p.description.toLowerCase().includes(searchQuery)) ||
    (p.category && p.category.toLowerCase().includes(searchQuery))
  ).slice(0, 20).map((platform, index) => ({
    type: 'article',
    id: `${index}`,
    title: platform.name,
    description: `${platform.category || 'AI Platform'} - ${platform.pricing || 'Pricing varies'}`,
    input_message_content: {
      message_text: formatPlatform(platform),
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    },
    reply_markup: getPlatformKeyboard(platform)
  }));

  bot.answerInlineQuery(query.id, results, { cache_time: 300 });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Telegram bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Telegram bot is ready! Send /start to begin.');
