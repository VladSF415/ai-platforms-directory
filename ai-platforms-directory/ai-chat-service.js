/**
 * AI Chat Service for Platform Recommendations
 * Supports multiple AI providers: Anthropic Claude, OpenAI, DeepSeek
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIChatService {
  constructor() {
    this.platforms = this.loadPlatforms();
    this.categories = this.extractCategories();
    this.conversationHistory = new Map(); // Store conversation history by session

    // Initialize AI clients based on available API keys
    this.initializeAIClients();
  }

  initializeAIClients() {
    this.aiProvider = null;

    // Priority: DeepSeek > Anthropic > OpenAI (based on cost-effectiveness)
    if (process.env.DEEPSEEK_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com'
      });
      this.aiProvider = 'deepseek';
      console.log('✓ AI Chat Service: Using DeepSeek (most affordable)');
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      this.aiProvider = 'anthropic';
      console.log('✓ AI Chat Service: Using Anthropic Claude');
    } else if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.aiProvider = 'openai';
      console.log('✓ AI Chat Service: Using OpenAI');
    } else {
      console.warn('⚠ AI Chat Service: No AI API key found. Chatbot will use fallback logic.');
    }
  }

  loadPlatforms() {
    try {
      const platformsPath = path.join(__dirname, 'platforms.json');
      const data = fs.readFileSync(platformsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading platforms:', error);
      return [];
    }
  }

  extractCategories() {
    const categoriesSet = new Set();
    this.platforms.forEach(platform => {
      if (platform.category) {
        categoriesSet.add(platform.category);
      }
    });
    return Array.from(categoriesSet);
  }

  // Get or create conversation history for a session
  getConversation(sessionId) {
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }
    return this.conversationHistory.get(sessionId);
  }

  // Add message to conversation history
  addToHistory(sessionId, role, content) {
    const conversation = this.getConversation(sessionId);
    conversation.push({ role, content });

    // Keep only last 10 messages to avoid token limits
    if (conversation.length > 10) {
      conversation.shift();
      conversation.shift();
    }
  }

  // Analyze user intent
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Check if user wants to submit/advertise
    const submitKeywords = ['submit', 'advertise', 'add my tool', 'list my platform', 'promote', 'feature my'];
    if (submitKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'submit', confidence: 0.9 };
    }

    // Check if user is looking for platforms (expanded keywords)
    const searchKeywords = [
      'find', 'looking for', 'need', 'recommend', 'suggest', 'best',
      'tool for', 'platform for', 'wanna', 'want to', 'help me',
      'i want', 'make', 'create', 'build', 'generate', 'use for'
    ];
    if (searchKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'search', confidence: 0.8 };
    }

    // Check for general questions
    const questionKeywords = ['what', 'how', 'why', 'when', 'where', 'can you', 'do you'];
    if (questionKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'question', confidence: 0.7 };
    }

    // Default to search (assume users want platform recommendations)
    return { type: 'search', confidence: 0.5 };
  }

  // Search platforms based on criteria
  searchPlatforms(query, options = {}) {
    const { category, pricing, limit = 5 } = options;
    const lowerQuery = query.toLowerCase();

    // Enhanced keyword mapping for better search results
    const keywordMap = {
      'music': ['audio', 'music', 'sound', 'audio-ai', 'composition', 'generate music'],
      'voice': ['audio', 'voice', 'speech', 'tts', 'text-to-speech', 'voice clone'],
      'video': ['video', 'video-ai', 'editing', 'production'],
      'image': ['image', 'visual', 'photo', 'picture', 'generative-ai', 'image-generation'],
      'code': ['coding', 'programming', 'development', 'developer-tools'],
      'chat': ['chatbot', 'conversation', 'chat', 'llm', 'llms']
    };

    // Expand search query with related terms
    let expandedQuery = lowerQuery;
    for (const [key, synonyms] of Object.entries(keywordMap)) {
      if (lowerQuery.includes(key)) {
        expandedQuery += ' ' + synonyms.join(' ');
      }
    }

    let results = this.platforms.filter(platform => {
      // Category filter
      if (category && platform.category !== category) {
        return false;
      }

      // Pricing filter
      if (pricing && platform.pricing !== pricing) {
        return false;
      }

      // Search in name, description, tags, category
      const searchableText = [
        platform.name,
        platform.description,
        platform.category,
        ...(platform.tags || []),
        platform.category
      ].join(' ').toLowerCase();

      // Check if any word from the expanded query matches
      const queryWords = expandedQuery.split(' ').filter(w => w.length > 2);
      return queryWords.some(word => searchableText.includes(word));
    });

    // Sort by relevance (featured first, then by rating)
    results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    return results.slice(0, limit);
  }

  // Generate system prompt for AI (optimized to reduce token usage)
  getSystemPrompt() {
    return `You are an AI assistant for AI Platforms List (${this.platforms.length}+ tools).

Role: Help users find AI platforms from our directory. Direct advertisers to submit page.

CRITICAL: ONLY recommend platforms from "Relevant platforms found" list. Never hallucinate or suggest unlisted platforms.

Guidelines:
- Recommend max 3 platforms per response (from provided list only)
- Keep responses concise (2-3 paragraphs)
- For advertisers: direct to submit page ($49 base fee)
- If no matches: "We don't have platforms for that use case yet. Explore related categories or submit yours?"

Format:
**[Name]** - Brief description
- Pricing: [from context]
- Website: [URL from context]`;
  }

  // Generate AI response using Anthropic Claude
  async generateClaudeResponse(sessionId, userMessage, platformContext) {
    const conversation = this.getConversation(sessionId);

    const messages = [
      ...conversation,
      {
        role: 'user',
        content: platformContext
          ? `${userMessage}\n\nRelevant platforms found:\n${platformContext}`
          : userMessage
      }
    ];

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: this.getSystemPrompt(),
      messages: messages
    });

    return response.content[0].text;
  }

  // Generate AI response using OpenAI or DeepSeek
  async generateOpenAIResponse(sessionId, userMessage, platformContext) {
    const conversation = this.getConversation(sessionId);

    const messages = [
      { role: 'system', content: this.getSystemPrompt() },
      ...conversation,
      {
        role: 'user',
        content: platformContext
          ? `${userMessage}\n\nRelevant platforms found:\n${platformContext}`
          : userMessage
      }
    ];

    const model = this.aiProvider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';

    const response = await this.openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }

  // Fallback response without AI
  generateFallbackResponse(intent, userMessage) {
    if (intent.type === 'submit') {
      return {
        message: "🚀 **Advertise Your Platform**\n\nGreat! You can submit your AI platform to our directory.\n\n**Pricing:**\n- Base listing: $49 (one-time)\n- Featured listings available (Basic: $99/mo, Premium: $199/mo, Enterprise: $299/mo)\n\n**Benefits:**\n- Reach thousands of potential users\n- Quality backlink for SEO\n- Increased visibility in AI community\n\n[Submit Your Platform](/submit)",
        action: 'submit',
        url: '/submit'
      };
    }

    // Extract potential search terms
    const searchTerms = userMessage.toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(' ')
      .filter(word => word.length > 3);

    if (searchTerms.length > 0) {
      const platforms = this.searchPlatforms(searchTerms.join(' '), { limit: 3 });

      if (platforms.length > 0) {
        let message = "I found some platforms that might interest you:\n\n";
        platforms.forEach(platform => {
          message += `**${platform.name}** - ${platform.description.substring(0, 100)}...\n`;
          message += `- Category: ${platform.category}\n`;
          message += `- Pricing: ${platform.pricing || 'See website'}\n`;
          message += `- [Learn More](/platform/${platform.slug})\n\n`;
        });
        message += "\nWould you like me to help you find something more specific?";

        return {
          message,
          platforms: platforms.map(p => ({ name: p.name, slug: p.slug }))
        };
      }
    }

    return {
      message: "👋 Hello! I'm here to help you find the perfect AI platform for your needs.\n\nTell me about your project:\n- What are you trying to build?\n- What's your budget?\n- Any specific features you need?\n\nOr if you'd like to **advertise your platform**, I can help with that too!"
    };
  }

  // Main chat method
  async chat(sessionId, userMessage) {
    try {
      // Add user message to history
      this.addToHistory(sessionId, 'user', userMessage);

      // Analyze intent
      const intent = this.analyzeIntent(userMessage);

      // Search for relevant platforms
      let platformContext = '';
      let relevantPlatforms = [];

      if (intent.type === 'search') {
        relevantPlatforms = this.searchPlatforms(userMessage, { limit: 5 }); // Reduced from 10 to 5
        if (relevantPlatforms.length > 0) {
          platformContext = relevantPlatforms.map(p =>
            // Shortened description to save tokens
            `- ${p.name}: ${p.description.substring(0, 100)}... (${p.category}, ${p.pricing || 'See website'})`
          ).join('\n');
        }
      }

      // Generate response
      let aiResponse;

      if (!this.aiProvider) {
        // No AI available, use fallback
        return this.generateFallbackResponse(intent, userMessage);
      }

      // Generate AI response
      if (this.aiProvider === 'anthropic') {
        aiResponse = await this.generateClaudeResponse(sessionId, userMessage, platformContext);
      } else {
        aiResponse = await this.generateOpenAIResponse(sessionId, userMessage, platformContext);
      }

      // Add AI response to history
      this.addToHistory(sessionId, 'assistant', aiResponse);

      return {
        message: aiResponse,
        platforms: relevantPlatforms.slice(0, 5).map(p => ({
          name: p.name,
          slug: p.slug,
          category: p.category
        })),
        intent: intent.type
      };

    } catch (error) {
      console.error('Error in chat service:', error);

      // Return fallback on error
      return {
        message: "I'm having trouble processing your request right now. Please try again or browse our [platform directory](/) directly.",
        error: true
      };
    }
  }

  // Clear conversation history for a session
  clearHistory(sessionId) {
    this.conversationHistory.delete(sessionId);
  }

  // Get chat statistics
  getStats() {
    return {
      totalPlatforms: this.platforms.length,
      categories: this.categories.length,
      activeSessions: this.conversationHistory.size,
      aiProvider: this.aiProvider || 'fallback'
    };
  }
}

// Create singleton instance
const chatService = new AIChatService();

export default chatService;
