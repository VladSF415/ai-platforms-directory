import TelegramBot from 'node-telegram-bot-api';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chatService from './ai-chat-service.js';
import { getAnalytics } from './chat-analytics.js';

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

// ============================================================================
// MENU BUILDERS
// ============================================================================

function getMainMenu() {
  return {
    inline_keyboard: [
      [
        { text: '🤖 Ask AI', callback_data: 'menu_ai' },
        { text: '🔍 Search', callback_data: 'menu_search' }
      ],
      [
        { text: '📂 Categories', callback_data: 'menu_categories' },
        { text: '🔥 Trending', callback_data: 'menu_trending' }
      ],
      [
        { text: '💡 Recommendations', callback_data: 'menu_recommend' },
        { text: '🎲 Random', callback_data: 'random_platform' }
      ],
      [
        { text: '🚀 Submit Platform', url: `${BASE_URL}/submit` },
        { text: '🌐 Website', url: BASE_URL }
      ],
      [
        { text: '❓ Help', callback_data: 'menu_help' },
        { text: '⚙️ Settings', callback_data: 'menu_settings' }
      ]
    ]
  };
}

function getCategoriesMenu(page = 0) {
  const itemsPerPage = 8;
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const pageCategories = categories.slice(start, end);

  const buttons = pageCategories.map(cat => [{
    text: `${cat} (${platforms.filter(p => p.category === cat).length})`,
    callback_data: `cat_${cat}`
  }]);

  // Add navigation buttons
  const navButtons = [];
  if (page > 0) {
    navButtons.push({ text: '◀️ Previous', callback_data: `catpage_${page - 1}` });
  }
  if (end < categories.length) {
    navButtons.push({ text: 'Next ▶️', callback_data: `catpage_${page + 1}` });
  }
  if (navButtons.length > 0) {
    buttons.push(navButtons);
  }

  // Add back button
  buttons.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);

  return { inline_keyboard: buttons };
}

function getRecommendMenu() {
  return {
    inline_keyboard: [
      [
        { text: '✍️ Writing & Content', callback_data: 'rec_writing' },
        { text: '💻 Code & Dev', callback_data: 'rec_code' }
      ],
      [
        { text: '🎨 Image Generation', callback_data: 'rec_image' },
        { text: '🎥 Video Creation', callback_data: 'rec_video' }
      ],
      [
        { text: '💬 Chat & Assistants', callback_data: 'rec_chat' },
        { text: '📊 Data & Analytics', callback_data: 'rec_data' }
      ],
      [
        { text: '🎵 Audio & Music', callback_data: 'rec_audio' },
        { text: '🔬 Research & Science', callback_data: 'rec_research' }
      ],
      [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

function getSettingsMenu(chatId) {
  const isAdmin = chatId.toString() === ADMIN_CHAT_ID;

  const buttons = [
    [
      { text: '🔔 Notifications', callback_data: 'settings_notifications' },
      { text: '🌐 Language', callback_data: 'settings_language' }
    ],
    [
      { text: '📊 My Stats', callback_data: 'settings_stats' },
      { text: '⭐ Favorites', callback_data: 'settings_favorites' }
    ]
  ];

  if (isAdmin) {
    buttons.push([
      { text: '👑 Admin Panel', callback_data: 'admin_panel' }
    ]);
  }

  buttons.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);

  return { inline_keyboard: buttons };
}

function getAdminMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📋 Pending Submissions', callback_data: 'admin_pending' },
        { text: '📊 Statistics', callback_data: 'admin_stats' }
      ],
      [
        { text: '👥 User Analytics', callback_data: 'admin_users' },
        { text: '🔥 Top Platforms', callback_data: 'admin_top' }
      ],
      [
        { text: '📢 Broadcast Message', callback_data: 'admin_broadcast' },
        { text: '⚡ Clear Cache', callback_data: 'admin_cache' }
      ],
      [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

function getHelpMenu() {
  return {
    inline_keyboard: [
      [
        { text: '🚀 Getting Started', callback_data: 'help_start' },
        { text: '🔍 How to Search', callback_data: 'help_search' }
      ],
      [
        { text: '🤖 AI Assistant', callback_data: 'help_ai' },
        { text: '📂 Categories Guide', callback_data: 'help_categories' }
      ],
      [
        { text: '💡 Tips & Tricks', callback_data: 'help_tips' },
        { text: '❓ FAQ', callback_data: 'help_faq' }
      ],
      [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

function formatPlatform(platform, includeDescription = true) {
  const name = escapeMarkdown(platform.name);
  const category = escapeMarkdown(platform.category || 'Uncategorized');
  const pricing = escapeMarkdown(platform.pricing || 'Not specified');
  const url = `${BASE_URL}/platform/${platform.slug || platform.id}`;

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

  buttons.push([{ text: '📄 Full Details', url: `${BASE_URL}/platform/${platform.slug || platform.id}` }]);

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

  const welcomeMessage = `👋 *Welcome to AI Platforms List*, ${escapeMarkdown(firstName)}\\!\n\n` +
    `🔍 Discover ${platforms.length}\\+ AI tools and platforms\n` +
    `🤖 Get AI\\-powered recommendations\n` +
    `📂 Browse by category\n` +
    `🔥 Find trending tools\n\n` +
    `*Choose an action below or type /menu anytime\\!*`;

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'MarkdownV2',
    reply_markup: getMainMenu()
  });
});

// /menu command - Show main menu anytime
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, '📱 *Main Menu*\n\nChoose an option:', {
    parse_mode: 'MarkdownV2',
    reply_markup: getMainMenu()
  });
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `*📚 AI Platforms List Bot \\- Help*\n\n` +
    `*Commands:*\n` +
    `/start \\- Show welcome message\n` +
    `/ask \\[question\\] \\- Chat with AI assistant\n` +
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

// /ask command - AI-powered conversational assistant
bot.onText(/\/ask(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const question = match[1];

  if (!question) {
    bot.sendMessage(chatId, `🤖 *AI Assistant*\n\nAsk me anything about AI platforms\\!\n\nUsage: /ask \\[your question\\]\n\nExamples:\n\\- /ask I need an AI tool for writing blog posts\n\\- /ask What\\'s the best free image generator?\n\\- /ask I want to submit my platform`, {
      parse_mode: 'MarkdownV2'
    });
    return;
  }

  // Send typing indicator
  bot.sendChatAction(chatId, 'typing');

  try {
    // Generate session ID for this user
    const sessionId = `telegram_${chatId}`;

    // Get AI response
    const response = await chatService.chat(sessionId, question);

    // Send the AI response
    let message = response.message;

    // Check if this is about submitting a platform
    if (response.intent === 'submit' || message.toLowerCase().includes('submit')) {
      message += `\n\n💡 *Submit Your Platform:*\nVisit: ${BASE_URL}/submit`;
    }

    // If there are platform recommendations, add them
    if (response.platforms && response.platforms.length > 0) {
      bot.sendMessage(chatId, message);

      // Send each platform as a separate message with buttons
      response.platforms.forEach((platform, index) => {
        setTimeout(() => {
          const fullPlatform = platforms.find(p => p.slug === platform.slug);
          if (fullPlatform) {
            bot.sendMessage(chatId, formatPlatform(fullPlatform, false), {
              parse_mode: 'MarkdownV2',
              reply_markup: getPlatformKeyboard(fullPlatform),
              disable_web_page_preview: true
            });
          }
        }, index * 100);
      });
    } else {
      // No platforms, just send the message
      bot.sendMessage(chatId, message);
    }

  } catch (error) {
    console.error('AI chat error:', error);
    bot.sendMessage(chatId, `❌ Sorry, I\\'m having trouble processing your request\\. Please try again or use /search to find platforms manually\\.`, {
      parse_mode: 'MarkdownV2'
    });
  }
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

// /analytics command (admin only) - Website chatbot analytics
bot.onText(/\/analytics/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== ADMIN_CHAT_ID) {
    bot.sendMessage(chatId, '❌ This command is only available to administrators.');
    return;
  }

  try {
    const analytics = getAnalytics();

    if (!analytics || !analytics.summary) {
      bot.sendMessage(chatId, '❌ No analytics data available yet.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayStats = analytics.today || { messages: 0, sessions: 0, platformsRecommended: 0 };

    // Build summary message
    let message = `📊 *Website Chatbot Analytics*\n\n`;
    message += `*Total Stats:*\n`;
    message += `💬 Messages: ${analytics.summary.totalMessages}\n`;
    message += `👥 Total Sessions: ${analytics.summary.totalSessions}\n`;
    message += `✨ Unique Users: ${analytics.summary.uniqueSessions}\n`;
    message += `📈 Avg Messages/Session: ${analytics.summary.averageMessagesPerSession}\n\n`;

    message += `*Today (${today}):*\n`;
    message += `💬 Messages: ${todayStats.messages || 0}\n`;
    message += `👥 Sessions: ${todayStats.sessions || 0}\n`;
    message += `🤖 Platforms Recommended: ${todayStats.platformsRecommended || 0}\n\n`;

    // Top queries
    if (analytics.topQueries && analytics.topQueries.length > 0) {
      message += `*Top Queries:*\n`;
      analytics.topQueries.slice(0, 5).forEach((query, idx) => {
        message += `${idx + 1}\\. ${escapeMarkdown(query.keyword)} \\(${query.count}\\)\n`;
      });
      message += `\n`;
    }

    // Intent distribution
    if (analytics.intentDistribution && analytics.intentDistribution.length > 0) {
      message += `*User Intent:*\n`;
      analytics.intentDistribution.forEach(intent => {
        message += `${escapeMarkdown(intent.intent)}: ${intent.count}\n`;
      });
      message += `\n`;
    }

    // Last 7 days
    if (analytics.last7Days && analytics.last7Days.length > 0) {
      message += `*Last 7 Days:*\n`;
      const totalLast7Days = analytics.last7Days.reduce((sum, day) => sum + (day.messages || 0), 0);
      message += `📊 Total Messages: ${totalLast7Days}\n`;
    }

    message += `\n💡 Use /analytics\\_detail for more info`;

    bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    bot.sendMessage(chatId, '❌ Failed to retrieve analytics data.');
  }
});

// /analytics_detail command (admin only) - Detailed analytics
bot.onText(/\/analytics_detail/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== ADMIN_CHAT_ID) {
    bot.sendMessage(chatId, '❌ This command is only available to administrators.');
    return;
  }

  try {
    const analytics = getAnalytics();

    if (!analytics) {
      bot.sendMessage(chatId, '❌ No analytics data available yet.');
      return;
    }

    // Last 7 days breakdown
    if (analytics.last7Days && analytics.last7Days.length > 0) {
      let message = `📅 *Last 7 Days Breakdown:*\n\n`;

      analytics.last7Days.reverse().forEach(day => {
        message += `*${escapeMarkdown(day.date)}*\n`;
        message += `💬 Messages: ${day.messages || 0}\n`;
        message += `👥 Sessions: ${day.sessions || 0}\n`;
        message += `✨ New Sessions: ${day.newSessions || 0}\n`;
        message += `🤖 Platforms: ${day.platformsRecommended || 0}\n\n`;
      });

      bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    }

    // Recent interactions
    if (analytics.recentInteractions && analytics.recentInteractions.length > 0) {
      let message = `💬 *Recent Interactions \\(Last ${analytics.recentInteractions.length}\\):*\n\n`;

      analytics.recentInteractions.slice(0, 10).forEach((interaction, idx) => {
        const time = new Date(interaction.timestamp).toLocaleTimeString();
        message += `${idx + 1}\\. ${escapeMarkdown(time)}\n`;
        message += `   "${escapeMarkdown(interaction.message.substring(0, 50))}..."\n`;
        message += `   Intent: ${escapeMarkdown(interaction.intent || 'unknown')}\n\n`;
      });

      bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    }

    // Top 20 queries
    if (analytics.topQueries && analytics.topQueries.length > 5) {
      let message = `🔍 *Top 20 Search Queries:*\n\n`;

      analytics.topQueries.slice(0, 20).forEach((query, idx) => {
        message += `${idx + 1}\\. ${escapeMarkdown(query.keyword)} \\(${query.count}\\)\n`;
      });

      bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    }

  } catch (error) {
    console.error('[Analytics Detail] Error:', error);
    bot.sendMessage(chatId, '❌ Failed to retrieve detailed analytics.');
  }
});

// ============================================================================
// CALLBACK QUERY HANDLERS
// ============================================================================

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;

  // ==================== MAIN MENU ====================
  if (data === 'main_menu') {
    bot.editMessageText('📱 *Main Menu*\n\nChoose an option:', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: getMainMenu()
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  // ==================== MENU ACTIONS ====================
  if (data === 'menu_ai') {
    bot.editMessageText('🤖 *AI Assistant*\n\nAsk me anything about AI platforms\\!\n\nUsage: /ask \\[your question\\]\n\nExamples:\n• /ask I need a tool for video editing\n• /ask Best free chatbot platforms\n• /ask I want to submit my platform', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'menu_search') {
    bot.editMessageText('🔍 *Search Platforms*\n\nUse /search \\[query\\] to find platforms\n\nOr tap below to use inline search\\!', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Start Inline Search', switch_inline_query_current_chat: '' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'menu_categories') {
    bot.editMessageText('📂 *Browse by Category*\n\nSelect a category:', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: getCategoriesMenu(0)
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'menu_trending') {
    const trending = platforms.sort(() => Math.random() - 0.5).slice(0, 5);

    bot.editMessageText('🔥 *Trending AI Platforms*\n\nTop platforms right now:', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]] }
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

    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'menu_recommend') {
    bot.editMessageText('💡 *Get Recommendations*\n\nWhat type of AI tool are you looking for?', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: getRecommendMenu()
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'menu_help') {
    bot.editMessageText('❓ *Help & Support*\n\nSelect a topic:', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: getHelpMenu()
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'menu_settings') {
    bot.editMessageText('⚙️ *Settings*\n\nManage your preferences:', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: getSettingsMenu(chatId)
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  // ==================== CATEGORIES PAGINATION ====================
  if (data.startsWith('catpage_')) {
    const page = parseInt(data.split('_')[1]);
    bot.editMessageText('📂 *Browse by Category*\n\nSelect a category:', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: getCategoriesMenu(page)
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  // ==================== HELP MENU ====================
  if (data === 'help_start') {
    const helpText = '🚀 *Getting Started*\n\n' +
      '1️⃣ Use /menu to open the main menu\n' +
      '2️⃣ Browse categories or search for platforms\n' +
      '3️⃣ Ask the AI assistant with /ask\n' +
      '4️⃣ Get random platform with /random\n' +
      '5️⃣ Submit your platform via the website\n\n' +
      '*Quick tips:*\n' +
      '• Use inline search in any chat\\!\n' +
      '• Type @' + escapeMarkdown(bot.options.username || 'aiplatformsbot') + ' \\[query\\]\n';

    bot.editMessageText(helpText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Help', callback_data: 'menu_help' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'help_search') {
    const helpText = '🔍 *How to Search*\n\n' +
      '*Command Search:*\n' +
      '/search \\[query\\] \\- Search platforms\n\n' +
      '*Inline Search:*\n' +
      'Type @' + escapeMarkdown(bot.options.username || 'aiplatformsbot') + ' in any chat\n\n' +
      '*Examples:*\n' +
      '• /search chatbot\n' +
      '• /search image generation\n' +
      '• /search free tools\n';

    bot.editMessageText(helpText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Help', callback_data: 'menu_help' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'help_ai') {
    const helpText = '🤖 *AI Assistant Guide*\n\n' +
      '*How to use:*\n' +
      '/ask \\[your question\\]\n\n' +
      '*What can it do?*\n' +
      '• Find perfect platforms for your needs\n' +
      '• Provide personalized recommendations\n' +
      '• Compare different tools\n' +
      '• Guide you to submit platforms\n\n' +
      '*Example questions:*\n' +
      '• "I need an AI for coding"\n' +
      '• "Best free video editors?"\n' +
      '• "Compare GPT\\-4 vs Claude"\n';

    bot.editMessageText(helpText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Help', callback_data: 'menu_help' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'help_categories') {
    const categoryList = categories.slice(0, 10).map(c => `• ${escapeMarkdown(c)}`).join('\n');
    const helpText = `📂 *Categories Guide*\n\n` +
      `We have ${categories.length} categories:\n\n` +
      `${categoryList}\n` +
      `\\.\\.\\.and more\\!\n\n` +
      `Use /category to browse all\\.`;

    bot.editMessageText(helpText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Help', callback_data: 'menu_help' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'help_tips') {
    const helpText = '💡 *Tips & Tricks*\n\n' +
      '🔥 *Pro Tips:*\n' +
      '1️⃣ Save time with inline search\n' +
      '2️⃣ Use AI assistant for complex queries\n' +
      '3️⃣ Browse by category for discovery\n' +
      '4️⃣ Check trending for popular tools\n' +
      '5️⃣ Get random platforms for inspiration\n\n' +
      '⭐ *Did you know?*\n' +
      `• We have ${platforms.length}\\+ platforms\n` +
      '• New tools added daily\n' +
      '• All platforms are curated\n';

    bot.editMessageText(helpText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Help', callback_data: 'menu_help' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'help_faq') {
    const helpText = '❓ *Frequently Asked Questions*\n\n' +
      '*Q: How do I submit my platform?*\n' +
      'A: Visit our website or use the Submit button\\!\n\n' +
      '*Q: Are all tools free?*\n' +
      'A: No, we list both free and paid tools\\.\n\n' +
      '*Q: How often is the list updated?*\n' +
      'A: Daily\\! New platforms added regularly\\.\n\n' +
      '*Q: Can I suggest a platform?*\n' +
      'A: Yes\\! Use the submit form\\.\n\n' +
      `*Need more help?*\nContact: ${escapeMarkdown(BASE_URL)}/contact`;

    bot.editMessageText(helpText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Help', callback_data: 'menu_help' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  // ==================== ADMIN PANEL ====================
  if (data === 'admin_panel') {
    if (chatId.toString() !== ADMIN_CHAT_ID) {
      bot.answerCallbackQuery(query.id, { text: '❌ Admin only', show_alert: true });
      return;
    }

    bot.editMessageText('👑 *Admin Panel*\n\nSelect an action:', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: getAdminMenu()
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'admin_stats') {
    if (chatId.toString() !== ADMIN_CHAT_ID) {
      bot.answerCallbackQuery(query.id, { text: '❌ Admin only', show_alert: true });
      return;
    }

    const stats = `📊 *Bot Statistics*\n\n` +
      `🤖 Total Platforms: ${platforms.length}\n` +
      `📂 Categories: ${categories.length}\n` +
      `📋 Pending Submissions: ${pendingSubmissions.length}\n` +
      `🌐 Website: ${escapeMarkdown(BASE_URL)}\n\n` +
      `Updated: ${new Date().toLocaleString()}`;

    bot.editMessageText(stats, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Admin', callback_data: 'admin_panel' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'admin_pending') {
    if (chatId.toString() !== ADMIN_CHAT_ID) {
      bot.answerCallbackQuery(query.id, { text: '❌ Admin only', show_alert: true });
      return;
    }

    if (pendingSubmissions.length === 0) {
      bot.answerCallbackQuery(query.id, { text: '✅ No pending submissions', show_alert: true });
      return;
    }

    bot.answerCallbackQuery(query.id, { text: `${pendingSubmissions.length} pending` });
    // Show pending submissions
    return;
  }

  // ==================== SETTINGS ====================
  if (data === 'settings_stats') {
    const userStats = '📊 *Your Statistics*\n\n' +
      '🔍 Searches: \\-\\-\n' +
      '💬 AI Chats: \\-\\-\n' +
      '⭐ Favorites: 0\n' +
      '📅 Member since: Today\n\n' +
      '\\(Stats tracking coming soon\\!\\)';

    bot.editMessageText(userStats, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [[{ text: '« Back to Settings', callback_data: 'menu_settings' }]] }
    });
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === 'settings_notifications') {
    bot.answerCallbackQuery(query.id, { text: '🔔 Notifications: ON (Coming soon!)' });
    return;
  }

  if (data === 'settings_language') {
    bot.answerCallbackQuery(query.id, { text: '🌐 Language: English (More coming soon!)' });
    return;
  }

  if (data === 'settings_favorites') {
    bot.answerCallbackQuery(query.id, { text: '⭐ Favorites feature coming soon!' });
    return;
  }

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
