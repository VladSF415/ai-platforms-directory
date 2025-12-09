# AI Chatbot Setup Guide

This guide explains how to set up and use the AI-powered chatbot for both the website and Telegram bot.

## Overview

The AI chatbot system provides intelligent, conversational assistance to help users:
- Find the perfect AI platform for their specific needs
- Get personalized platform recommendations
- Direct advertisers to the submit platform
- Answer questions about AI tools and features

## Features

### Website Chat Widget
- Floating chat button on all pages
- Real-time AI-powered responses
- Platform recommendations with clickable links
- Persistent conversation history
- Mobile-responsive design
- Quick action buttons for common queries

### Telegram Bot Integration
- New `/ask` command for AI-powered conversations
- Intelligent platform search and recommendations
- Maintains conversation context per user
- All existing commands still work (`/search`, `/category`, `/recommend`, etc.)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Chat Service                         │
│  (ai-chat-service.js)                                       │
│  - Multi-provider support (Anthropic, OpenAI, DeepSeek)    │
│  - Platform search & filtering                              │
│  - Intent analysis                                          │
│  - Conversation history management                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Used by
                          │
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌─────────────────┐
│  Website Widget  │              │  Telegram Bot   │
│  (ChatWidget.tsx)│              │  (telegram-bot) │
│  - Web UI        │              │  - /ask command │
│  - REST API      │              │  - Inline chat  │
└──────────────────┘              └─────────────────┘
```

## Setup Instructions

### 1. Install Dependencies

The necessary packages are already included in `package.json`:
- `@anthropic-ai/sdk` - For Claude AI
- `openai` - For OpenAI and DeepSeek APIs
- All existing dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Add one of the following AI API keys to your `.env` file or Railway environment variables:

#### Option A: Anthropic Claude (Recommended for Quality)
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Get your key:** https://console.anthropic.com/

**Pricing:** Pay-as-you-go, ~$3-15 per 1M tokens (very affordable)

#### Option B: OpenAI GPT
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Get your key:** https://platform.openai.com/api-keys

**Pricing:** Pay-as-you-go, varies by model

#### Option C: DeepSeek (Most Affordable)
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**Get your key:** https://platform.deepseek.com/

**Pricing:** Extremely affordable, great for high volume

### 3. Existing Telegram Configuration

Your Telegram bot is already configured. These variables should already be set:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_admin_chat_id
BASE_URL=https://aiplatformslist.com
```

### 4. Deploy to Railway

#### Update Environment Variables in Railway

1. Go to your Railway dashboard
2. Select your project: `ai-platforms-directory-production`
3. Go to **Variables** tab
4. Add your AI API key (choose one):
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY`

#### The deployment will automatically:
- ✅ Include the AI chat service
- ✅ Add chat API endpoints
- ✅ Deploy the chat widget to the website
- ✅ Enable AI commands in Telegram bot

No changes needed to `railway.json` or build commands!

## Usage

### Website Chat Widget

The chat widget appears on all pages as a floating button in the bottom-right corner.

**User Flow:**
1. User clicks the chat button
2. Sees welcome message with quick actions
3. Types their question or clicks a quick action
4. Receives AI-powered response with platform recommendations
5. Can click on recommended platforms to view details

**Example Conversations:**

```
User: "I need an AI tool for writing blog posts"
Bot: "I can help you find the perfect AI writing tool! Here are my
      top recommendations for blog writing:

      **Jasper AI** - Advanced AI writing assistant
      - Generate long-form blog content
      - SEO optimization features
      - Pricing: Starting at $49/month
      - [Learn More](/platform/jasper)

      **Copy.ai** - AI copywriting platform
      - Quick blog post generation
      - 90+ templates
      - Pricing: Free plan available, Pro at $49/month
      - [Learn More](/platform/copy-ai)

      Would you like more options or have specific requirements?"
```

```
User: "I want to advertise my platform"
Bot: "Great! You can submit your AI platform to our directory.

      **Pricing:**
      - Base listing: $49 (one-time)
      - Featured listings available

      **Benefits:**
      - Reach thousands of potential users
      - Quality backlink for SEO
      - Increased visibility

      [Submit Your Platform](/submit)"
```

### Telegram Bot Commands

#### New AI Command: `/ask`

The `/ask` command enables conversational AI assistance in Telegram.

**Usage:**
```
/ask I need an AI tool for image generation
/ask What's the best free chatbot platform?
/ask I want to submit my platform
/ask Compare GPT-4 to Claude
```

**Examples:**

```
User: /ask I need an affordable video editing AI

Bot: Based on your needs for affordable video editing AI, I recommend:

🤖 Runway ML
📂 Category: Video Generation
💰 Pricing: Free plan, paid from $15/month
[Description and details...]
🔗 Visit Website | 📄 Full Details

🤖 Descript
📂 Category: Video Editing
💰 Pricing: Free plan, paid from $12/month
[Description and details...]
🔗 Visit Website | 📄 Full Details

Would you like more options or have specific features in mind?
```

#### Existing Commands (Still Work!)

All existing Telegram commands continue to function:
- `/start` - Welcome message
- `/search [query]` - Search platforms
- `/category` - Browse by category
- `/random` - Random platform
- `/trending` - Trending platforms
- `/recommend` - Category-based recommendations
- `/help` - Help message

## API Endpoints

### POST /api/chat

Chat with the AI assistant.

**Request:**
```json
{
  "message": "I need an AI tool for writing",
  "sessionId": "optional_session_id"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "web_1234567890_abc123",
  "response": "I can help you find the perfect AI writing tool...",
  "platforms": [
    {
      "name": "Jasper AI",
      "slug": "jasper",
      "category": "Writing"
    }
  ],
  "intent": "search",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### POST /api/chat/clear

Clear conversation history for a session.

**Request:**
```json
{
  "sessionId": "web_1234567890_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat history cleared"
}
```

### GET /api/chat/stats

Get chatbot statistics.

**Response:**
```json
{
  "totalPlatforms": 693,
  "categories": 15,
  "activeSessions": 42,
  "aiProvider": "anthropic"
}
```

## AI Provider Comparison

| Provider | Quality | Speed | Cost | Best For |
|----------|---------|-------|------|----------|
| **Anthropic Claude** | ⭐⭐⭐⭐⭐ | Fast | Medium | Best quality responses |
| **OpenAI GPT** | ⭐⭐⭐⭐⭐ | Fast | Medium | Great all-around |
| **DeepSeek** | ⭐⭐⭐⭐ | Very Fast | Very Low | High volume, budget-conscious |

**Recommendation:** Start with **Anthropic Claude** for the best user experience. The cost is reasonable and the quality is excellent.

## Fallback Mode

If no AI API key is configured, the chatbot automatically operates in **fallback mode**:
- Uses rule-based logic for common queries
- Performs keyword-based platform search
- Directs advertisers to submit page
- Still provides value without AI API costs

This allows you to:
1. Deploy and test without an API key
2. Gradually transition to AI-powered responses
3. Have a backup if API limits are reached

## Conversation History

### Website
- Stored in browser localStorage
- Persists across page refreshes
- Can be cleared by user
- Separate history per browser/device

### Telegram
- Stored in memory on server
- Maintained per user (chat ID)
- Last 10 messages kept
- Clears on bot restart

## Customization

### Modify AI Behavior

Edit [ai-chat-service.js](ai-platforms-directory/ai-chat-service.js):

```javascript
getSystemPrompt() {
  return `You are a helpful AI assistant for AI Platforms List...

  // Customize the personality, tone, and instructions here
  `;
}
```

### Adjust Platform Search

Modify search logic in `searchPlatforms()`:
```javascript
searchPlatforms(query, options = {}) {
  const { category, pricing, limit = 5 } = options;
  // Customize search logic here
}
```

### Change Widget Styling

Edit [src/styles/ChatWidget.css](ai-platforms-directory/src/styles/ChatWidget.css):
- Colors, gradients
- Button position
- Animation effects
- Mobile responsive breakpoints

## Testing

### Test Website Chat Locally

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:5173
3. Click the chat button in bottom-right
4. Test conversations

### Test Telegram Bot Locally

1. Start the bot:
```bash
npm run bot
```

2. Open Telegram and find your bot
3. Test the `/ask` command:
```
/ask I need an AI for coding
```

### Test Both Services Together

```bash
node start-all.js
```

This runs both the web server and Telegram bot simultaneously.

## Monitoring

### Check Logs

**Railway Dashboard:**
- Go to your project
- Click on **Logs** tab
- Look for:
  - `✓ AI Chat Service: Using [Provider]`
  - `[Chat] Message received`
  - `[Chat] Response generated`

**Telegram Bot Logs:**
- Look for: `🤖 Telegram Bot started`
- AI chat logs: `[AI Chat]` prefix

### Chat Statistics

Check active sessions and AI provider:
```bash
curl https://your-domain.com/api/chat/stats
```

## Troubleshooting

### Chat Widget Not Appearing

1. Check browser console for errors
2. Verify build completed: `npm run build`
3. Clear browser cache
4. Check [App.tsx](ai-platforms-directory/src/App.tsx) includes `<ChatWidget />`

### Telegram /ask Command Not Working

1. Verify AI API key is set in Railway
2. Check bot logs for errors
3. Restart the bot service
4. Test with: `/help` to see if `/ask` is listed

### AI Responses Are Slow

1. Consider switching to DeepSeek (faster)
2. Check API rate limits
3. Reduce conversation history size in code
4. Use fallback mode for non-critical queries

### API Key Errors

**Error: Invalid API key**
- Verify the key is correct
- Check it's set in Railway variables (not just .env locally)
- Ensure no extra spaces or quotes

**Error: Rate limit exceeded**
- Wait for rate limit to reset
- Upgrade API plan
- Implement request queuing
- Use fallback mode temporarily

## Cost Estimation

### Anthropic Claude (Recommended)

**Model:** Claude Sonnet 3.5
**Pricing:** ~$3 per 1M input tokens, ~$15 per 1M output tokens

**Typical Chat:**
- Average input: 500 tokens (user message + context)
- Average output: 300 tokens (AI response)
- Cost per chat: ~$0.006 (less than 1 cent!)

**Monthly Estimates:**
- 1,000 chats/month: ~$6
- 10,000 chats/month: ~$60
- 50,000 chats/month: ~$300

### OpenAI GPT-4o Mini

**Pricing:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

**Monthly Estimates:**
- 1,000 chats/month: ~$0.48
- 10,000 chats/month: ~$4.80
- 50,000 chats/month: ~$24

### DeepSeek

**Pricing:** Extremely low, ~$0.10 per 1M tokens total

**Monthly Estimates:**
- 1,000 chats/month: ~$0.08
- 10,000 chats/month: ~$0.80
- 50,000 chats/month: ~$4

## Security Considerations

1. **API Keys:** Never commit API keys to git. Use environment variables.
2. **Rate Limiting:** Implement rate limiting on `/api/chat` endpoint to prevent abuse
3. **Input Validation:** All user input is validated before processing
4. **Session Management:** Session IDs are auto-generated and isolated per user
5. **Error Handling:** Errors don't expose sensitive information

## Future Enhancements

Potential improvements for the chatbot:

- [ ] Add rate limiting per user/IP
- [ ] Implement conversation analytics
- [ ] Add multi-language support
- [ ] Voice message support in Telegram
- [ ] Integration with user accounts
- [ ] Save favorite platforms
- [ ] Email conversation summaries
- [ ] Advanced filters (pricing, features, ratings)
- [ ] Platform comparison tool
- [ ] User feedback collection

## Support

If you encounter issues:

1. Check this documentation first
2. Review logs in Railway dashboard
3. Test with fallback mode (no API key)
4. Check the [main README](README.md) for general setup
5. Review [BOT-QUICKSTART.md](BOT-QUICKSTART.md) for Telegram bot basics

## Summary

You now have a complete AI chatbot system that:

✅ **Website:** Floating chat widget with AI responses
✅ **Telegram:** `/ask` command for conversational AI
✅ **Multi-provider:** Works with Claude, GPT, or DeepSeek
✅ **Smart:** Understands intent and recommends platforms
✅ **Integrated:** Connects to existing platform data
✅ **Scalable:** Handles multiple concurrent conversations
✅ **Affordable:** Costs pennies per conversation
✅ **Fallback:** Works without AI API if needed

**Next Steps:**
1. Add an AI API key to Railway
2. Deploy the updated code
3. Test the chat widget on your website
4. Try `/ask` in Telegram
5. Monitor usage and costs
6. Customize based on user feedback

Happy chatting! 🤖
