# 📱 Telegram Bot Setup for Form Notifications

Get instant Telegram notifications whenever someone submits an AI tool to your directory!

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send: `/newbot`
3. Follow the prompts:
   - **Bot name**: `AI Platforms Directory Bot` (or any name you like)
   - **Username**: `aiplatforms_notify_bot` (must end with `_bot`)
4. BotFather will give you a **bot token** like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. **Copy this token** - you'll need it!

## Step 2: Get Your Chat ID

### Option A: Use Your Personal Chat
1. Search for your new bot in Telegram
2. Click **Start** to begin a chat
3. Send any message (e.g., "Hello")
4. Visit this URL in your browser (replace `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
5. Look for `"chat":{"id":123456789}` in the response
6. **Copy the chat ID number**

### Option B: Use a Group/Channel
1. Create a Telegram group or channel
2. Add your bot to the group/channel as an admin
3. Send a message in the group mentioning the bot
4. Visit the same URL as above
5. Find the `chat.id` in the response (might be negative for groups)

## Step 3: Add to Railway Environment Variables

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Add these two environment variables:

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

**Important:**
- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `TELEGRAM_CHAT_ID`: Your chat/group ID (can be negative)

5. Click **Add** for each variable
6. Railway will automatically redeploy with the new variables

## Step 4: Test It!

1. Go to your website: `https://aiplatformslist.com/submit`
2. Fill out the form with test data
3. Submit the form
4. Check your Telegram - you should receive a notification! 🎉

## What You'll Receive

Every submission notification includes:
- 📝 Tool Name
- 🌐 Website URL
- 📧 Contact Email
- 📂 Category
- 💰 Pricing Model
- 📄 Full Description
- ⭐ Featured Listing (if selected)
- 💵 Total Price
- 🕒 Submission Timestamp

## Troubleshooting

### Not receiving notifications?

1. **Check Railway logs:**
   ```
   [Telegram] Notification sent successfully ✅
   ```
   or
   ```
   [Telegram] Bot token or chat ID not configured ❌
   ```

2. **Verify bot token:**
   - Go to @BotFather
   - Send `/mybots`
   - Select your bot → API Token

3. **Verify chat ID:**
   - Make sure you started a chat with the bot first
   - Use the `/getUpdates` URL to confirm

4. **Check bot permissions:**
   - If using a group, make sure bot is an admin
   - Bot needs permission to send messages

### Test locally:

```bash
export TELEGRAM_BOT_TOKEN="your-token-here"
export TELEGRAM_CHAT_ID="your-chat-id-here"
npm run dev
```

Then test the form at `http://localhost:3001/submit`

## Security Notes

- ✅ Bot token is secret - never commit to Git
- ✅ Railway environment variables are encrypted
- ✅ Only you can receive notifications (your chat ID)
- ✅ No sensitive data is logged in console

---

**Need help?** Check Railway logs for Telegram-related messages:
```
Railway Dashboard → Your Service → Deployments → View Logs
```
