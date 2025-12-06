# Telegram Bot - Quick Start Guide

Get your AI Platforms List Telegram bot running in 5 minutes!

## Step 1: Create Your Bot (2 minutes)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `AI Platforms List` (or your preferred name)
4. Choose a username: `aiplatformslistbot` (must end in 'bot')
5. **Copy the bot token** - you'll need this!

Example token: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

## Step 2: Enable Inline Search (30 seconds)

1. Send `/setinline` to @BotFather
2. Select your bot
3. Type: `Search AI platforms...`

## Step 3: Set Commands (30 seconds)

1. Send `/setcommands` to @BotFather
2. Select your bot
3. Paste this:

```
start - Welcome message with quick actions
search - Search for AI platforms
category - Browse platforms by category
random - Get a random platform
trending - View trending platforms
recommend - Get personalized recommendations
help - Show help message
```

## Step 4: Get Your Chat ID (1 minute)

1. Send any message to your bot (e.g., `/start`)
2. Open this URL in your browser (replace `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. Look for `"chat":{"id":123456789}` - **copy this number**

## Step 5: Configure Environment (30 seconds)

Add to your Railway environment variables:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_step_1
TELEGRAM_CHAT_ID=your_chat_id_from_step_4
```

**In Railway:**
1. Go to your project
2. Click "Variables"
3. Add both variables
4. Click "Deploy"

## Step 6: Deploy & Test (1 minute)

**Option A: Deploy to Railway (Recommended)**

The bot will start automatically on Railway after you push the code.

To run bot alongside your server, create `start-all.js`:

```javascript
import { spawn } from 'child_process';

const server = spawn('node', ['server.js'], { stdio: 'inherit' });
const bot = spawn('node', ['telegram-bot.js'], { stdio: 'inherit' });

process.on('SIGINT', () => {
  server.kill();
  bot.kill();
  process.exit();
});
```

Then update your Railway start command to: `node start-all.js`

**Option B: Test Locally**

```bash
npm run bot
```

You should see:
```
✅ Loaded Inter font for OG images
🤖 Telegram Bot started with 733 platforms loaded
📁 Available categories: 50
✅ Telegram bot is ready! Send /start to begin.
```

## Step 7: Try It Out!

Open Telegram and send to your bot:

1. `/start` - See welcome message
2. `/search chatbot` - Search for platforms
3. `/category` - Browse categories
4. `/random` - Get random platform
5. Try inline: `@yourbot chatbot` (in any chat)

## Troubleshooting

### Bot not responding?
- Check token is correct
- Make sure bot is running
- Look for errors in Railway logs

### Can't find chat ID?
```bash
# Alternative method - run this after messaging your bot:
curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

### Admin commands not working?
- Your TELEGRAM_CHAT_ID must match the chat where you send commands
- Use your personal chat ID, not a group

## What's Included?

✅ **10 User Commands** - Full featured bot
✅ **Inline Search** - Search from any chat
✅ **Interactive Buttons** - Easy navigation
✅ **Category Browsing** - 50+ categories
✅ **Admin Panel** - Manage submissions
✅ **733+ Platforms** - Full database access
✅ **Auto-formatted** - Beautiful messages
✅ **Rate Limited** - Production ready

## Production Deployment

### Railway Setup

1. **Push to GitHub:**
```bash
git add .
git commit -m "Add Telegram bot"
git push origin master
```

2. **Update Railway Start Command:**

In Railway dashboard → Settings → Start Command:
```
node start-all.js
```

Or run as separate service:
```
npm run bot
```

3. **Verify Environment Variables:**
- TELEGRAM_BOT_TOKEN ✓
- TELEGRAM_CHAT_ID ✓

4. **Deploy:**
Railway auto-deploys on push. Check logs for:
```
✅ Telegram bot is ready!
```

## Next Steps

1. ✅ Test all commands
2. ✅ Try inline search
3. ✅ Share bot with users
4. 📊 Monitor usage
5. 🎨 Customize messages (edit [telegram-bot.js](telegram-bot.js))

## Full Documentation

See [TELEGRAM-BOT.md](TELEGRAM-BOT.md) for:
- Advanced features
- Customization guide
- API reference
- Security best practices

## Support

Questions? Email: info@aiplatformslist.com

---

**Estimated Total Time: 5 minutes** ⚡

Your bot is now live and ready to serve thousands of users!
