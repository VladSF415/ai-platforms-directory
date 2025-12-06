# Telegram Bot - AI Platforms List

A fully-featured Telegram bot that brings the power of the AI Platforms Directory to Telegram users.

## Features

### User Commands

- **/start** - Welcome message with quick action buttons
- **/search [query]** - Search for AI platforms by name, description, or category
- **/category** - Browse platforms by category with interactive buttons
- **/random** - Get a random AI platform recommendation
- **/trending** - View trending AI platforms
- **/recommend** - Get personalized recommendations by use case
- **/help** - Display help message with all available commands

### Inline Search

Users can search platforms from any chat by typing:
```
@your_bot_username [search query]
```

For example:
```
@aiplatformsbot chatbot
```

### Interactive Features

- **Interactive Keyboards** - Button-based navigation for easy browsing
- **Category Browsing** - View platforms organized by categories
- **Direct Links** - Quick access to platform websites and full details
- **Rich Formatting** - Beautiful message formatting with emojis and markdown

### Admin Commands

- **/pending** - View pending platform submissions
- **/stats** - View bot statistics (total platforms, categories, etc.)
- **Approve/Reject** - Inline buttons to approve or reject submissions

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Choose a name for your bot (e.g., "AI Platforms List Bot")
4. Choose a username (must end in 'bot', e.g., "aiplatformsbot")
5. Save the **bot token** provided by BotFather

### 2. Enable Inline Mode

1. Send `/setinline` to @BotFather
2. Select your bot
3. Set inline placeholder text (e.g., "Search AI platforms...")

### 3. Set Bot Commands

Send `/setcommands` to @BotFather and paste:

```
start - Welcome message with quick actions
search - Search for AI platforms
category - Browse platforms by category
random - Get a random platform
trending - View trending platforms
recommend - Get personalized recommendations
help - Show help message
```

### 4. Configure Environment Variables

Add these to your `.env` file or Railway environment variables:

```bash
# Required for bot to run
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Required for admin commands
TELEGRAM_CHAT_ID=your_admin_chat_id_here
```

**How to get your Chat ID:**
1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}` - that's your chat ID

### 5. Run the Bot

**Local Development:**
```bash
npm run bot
```

**Production (Railway):**

The bot should run alongside your main server. You can:

**Option 1: Run as a separate process**
1. Add a new service in Railway
2. Point it to the same repository
3. Set the start command to `npm run bot`

**Option 2: Run in the same process**
Create a file called `start-all.js`:

```javascript
import { spawn } from 'child_process';

// Start the web server
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

// Start the Telegram bot
const bot = spawn('node', ['telegram-bot.js'], { stdio: 'inherit' });

// Handle shutdown
process.on('SIGINT', () => {
  server.kill();
  bot.kill();
  process.exit();
});
```

Then update your Railway start command to: `node start-all.js`

## Usage Examples

### Search for Platforms

**Command:**
```
/search chatbot
```

**Response:**
The bot will return up to 10 matching platforms with:
- Platform name
- Category
- Pricing model
- Brief description
- Links to website and full details

### Browse Categories

**Command:**
```
/category
```

**Response:**
Interactive keyboard with all categories showing platform counts. Click any category to see platforms in that category.

### Get Random Platform

**Command:**
```
/random
```

**Response:**
A random platform from the directory with full details and action buttons.

### Inline Search

**In any chat, type:**
```
@aiplatformsbot writing tools
```

**Response:**
A list of matching platforms that you can share directly in the chat.

### Get Recommendations

**Command:**
```
/recommend
```

**Response:**
Interactive keyboard with different use cases (writing, coding, image generation, etc.). Select one to get top recommendations.

## Bot Architecture

```
telegram-bot.js
├── Command Handlers
│   ├── /start - Welcome & navigation
│   ├── /search - Platform search
│   ├── /category - Category browser
│   ├── /random - Random platform
│   ├── /trending - Trending platforms
│   ├── /recommend - Recommendations
│   └── /help - Help message
│
├── Inline Query Handler
│   └── Search from any chat
│
├── Callback Query Handlers
│   ├── Category selection
│   ├── Recommendation filters
│   └── Admin actions
│
└── Admin Commands
    ├── /pending - View submissions
    ├── /stats - Bot statistics
    └── Approve/Reject buttons
```

## Customization

### Add More Commands

Add new commands in [telegram-bot.js](telegram-bot.js):

```javascript
bot.onText(/\/yourcommand/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Your response here');
});
```

### Customize Messages

Edit the message templates in the command handlers. All messages use MarkdownV2 formatting.

### Add More Categories to Recommendations

Update the `categoryMap` in the recommendation callback handler:

```javascript
const categoryMap = {
  writing: 'writing',
  code: 'code',
  // Add your categories here
  yourCategory: 'your-category-slug'
};
```

## Advanced Features

### User Analytics

Track user interactions by adding to command handlers:

```javascript
const userStats = {};

bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;
  userStats[userId] = userStats[userId] || { searches: 0, interactions: 0 };
  userStats[userId].interactions++;
  // ... rest of command
});
```

### Database Integration

For production, replace the in-memory `pendingSubmissions` array with database queries:

```javascript
// Instead of:
const pendingSubmissions = [];

// Use:
import { getSubmissions, approveSubmission } from './database.js';

bot.onText(/\/pending/, async (msg) => {
  const submissions = await getSubmissions({ status: 'pending' });
  // ... display submissions
});
```

### Rate Limiting

Add rate limiting to prevent abuse:

```javascript
import rateLimit from 'telegram-bot-api-rate-limit';

const limitedBot = rateLimit(bot, {
  interval: 1000, // 1 second
  limit: 30 // 30 requests per interval
});
```

## Troubleshooting

### Bot not responding

1. Check if bot is running: Look for "✅ Telegram bot is ready!" in logs
2. Verify bot token is correct in environment variables
3. Make sure bot is not blocked by the user
4. Check Railway logs for errors

### Inline search not working

1. Make sure inline mode is enabled (send `/setinline` to @BotFather)
2. Check if bot username is correct in inline query
3. Verify bot is running and polling

### Admin commands not working

1. Verify `TELEGRAM_CHAT_ID` matches your actual chat ID
2. Get your chat ID from: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Make sure you're sending commands from the authorized chat

### Messages not formatting correctly

1. The bot uses MarkdownV2 which requires escaping special characters
2. The `escapeMarkdown()` function handles this automatically
3. If you add custom messages, use the escape function

## Performance Tips

1. **Stagger Messages** - The bot already staggers multiple results to avoid rate limits
2. **Cache Results** - Consider caching frequently requested data
3. **Use Webhooks** - In production, use webhooks instead of polling for better performance
4. **Optimize Images** - If adding images, optimize them first

## Security Best Practices

1. **Never commit tokens** - Always use environment variables
2. **Validate admin access** - Always check chat ID before executing admin commands
3. **Sanitize input** - The bot escapes markdown, but validate any user input used in queries
4. **Rate limit** - Implement rate limiting to prevent abuse
5. **Log suspicious activity** - Monitor for unusual patterns

## Monitoring

### Key Metrics to Track

- Total messages processed
- Search queries per hour
- Most searched categories
- Error rate
- Response time

### Logging

The bot logs:
- ✅ Successful actions
- ❌ Errors
- 📊 Statistics on startup

Check logs in Railway or your terminal.

## Next Steps

1. **Add Analytics** - Track popular searches and platforms
2. **User Preferences** - Save user favorites and preferences
3. **Notifications** - Send weekly digest of new platforms
4. **Multi-language** - Add support for multiple languages
5. **Voice Commands** - Handle voice messages
6. **Group Features** - Special commands for groups
7. **Payment Integration** - Premium features via Stripe

## Support

For issues or questions:
- Check the bot logs first
- Review [Telegram Bot API docs](https://core.telegram.org/bots/api)
- Test commands with @BotFather's `/test` features
- Email: info@aiplatformslist.com

## License

Same as main project - see LICENSE file.

---

Built with ❤️ for the AI Platforms List community
