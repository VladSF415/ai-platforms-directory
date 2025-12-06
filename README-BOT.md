# 🤖 Telegram Bot - AI Platforms List

A production-ready Telegram bot for your AI Platforms Directory with 733+ platforms!

## Quick Links

- **Quick Start:** [BOT-QUICKSTART.md](BOT-QUICKSTART.md) - Get running in 5 minutes
- **Full Documentation:** [TELEGRAM-BOT.md](TELEGRAM-BOT.md) - Complete feature guide
- **Bot Code:** [telegram-bot.js](telegram-bot.js)

## What's Included

### User Features
- 🔍 **Search** - Find platforms by name, description, or category
- 📂 **Browse** - Interactive category navigation
- 🎲 **Random** - Discover new platforms
- 🔥 **Trending** - Popular platforms
- 💡 **Recommendations** - Personalized suggestions
- ⚡ **Inline Search** - Search from any chat with `@yourbot query`

### Admin Features
- 📋 **Pending Submissions** - Review new platform submissions
- ✅ **Approve/Reject** - One-click moderation
- 📊 **Statistics** - Bot and platform metrics

### Technical Features
- ✅ Interactive keyboards and buttons
- ✅ Rich markdown formatting
- ✅ Rate limiting protection
- ✅ Error handling
- ✅ Graceful shutdown
- ✅ Production ready

## Installation

```bash
# Dependencies already installed
npm install

# Run the bot
npm run bot

# Run bot + server together
node start-all.js
```

## Configuration

Add to your `.env` or Railway environment variables:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_admin_chat_id_here
```

## Bot Commands

```
/start - Welcome message with quick actions
/search [query] - Search for AI platforms
/category - Browse platforms by category
/random - Get a random platform
/trending - View trending platforms
/recommend - Get personalized recommendations
/help - Show help message

Admin only:
/pending - View pending submissions
/stats - Bot statistics
```

## Deployment

### Railway (Recommended)

Update your start command to run both services:

```bash
node start-all.js
```

Or deploy as separate service with:

```bash
npm run bot
```

### Local Development

```bash
# Terminal 1: Run web server
npm start

# Terminal 2: Run bot
npm run bot
```

## Architecture

```
telegram-bot.js          # Main bot logic
├── Command Handlers     # /start, /search, etc.
├── Inline Queries      # @bot search
├── Callback Handlers   # Button clicks
└── Admin Commands      # /pending, /stats

start-all.js            # Run server + bot together
package.json            # "bot": "node telegram-bot.js"
```

## Example Usage

**Search:**
```
User: /search chatbot
Bot: 🔍 Found 15 platforms for "chatbot"
     [Shows list with buttons]
```

**Browse:**
```
User: /category
Bot: 📂 Browse by Category
     [Shows interactive keyboard with all categories]
```

**Inline:**
```
User: @yourbot image generation
Bot: [Shows platforms that can be shared in chat]
```

## Performance

- ⚡ Fast response times
- 🔄 Handles concurrent requests
- 📦 Minimal memory footprint
- 🛡️ Built-in rate limiting
- 📊 Scalable to thousands of users

## Customization

All messages, buttons, and features can be customized in [telegram-bot.js](telegram-bot.js).

Common customizations:
- Add more commands
- Change message templates
- Add analytics
- Integrate with database
- Add payment features

## Files Created

- ✅ `telegram-bot.js` - Main bot code (500+ lines)
- ✅ `start-all.js` - Run server + bot together
- ✅ `TELEGRAM-BOT.md` - Complete documentation
- ✅ `BOT-QUICKSTART.md` - 5-minute setup guide
- ✅ `README-BOT.md` - This file
- ✅ Updated `package.json` with bot script

## Security

- ✅ Environment variables for tokens
- ✅ Admin-only commands protected
- ✅ Input sanitization
- ✅ MarkdownV2 escape function
- ✅ No sensitive data logged

## Support

- 📧 Email: info@aiplatformslist.com
- 📚 [Full Documentation](TELEGRAM-BOT.md)
- 🚀 [Quick Start Guide](BOT-QUICKSTART.md)

## License

Same as main project

---

**Built with ❤️ using:**
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [Telegram Bot API](https://core.telegram.org/bots/api)

**Total build time:** 5 minutes to deploy ⚡
