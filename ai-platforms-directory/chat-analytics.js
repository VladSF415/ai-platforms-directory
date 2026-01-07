/**
 * Chat Analytics Tracker
 * Tracks chatbot interactions and provides usage statistics
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ANALYTICS_FILE = join(__dirname, 'chat-analytics.json');

// Initialize analytics file if it doesn't exist
function initAnalytics() {
  if (!existsSync(ANALYTICS_FILE)) {
    const initialData = {
      totalMessages: 0,
      totalSessions: 0,
      uniqueSessions: new Set(),
      interactions: [],
      dailyStats: {},
      popularQueries: {},
      intentCounts: {},
      lastUpdated: new Date().toISOString()
    };
    saveAnalytics(initialData);
  }
}

// Load analytics data
function loadAnalytics() {
  try {
    const data = JSON.parse(readFileSync(ANALYTICS_FILE, 'utf-8'));
    // Convert uniqueSessions array back to Set
    data.uniqueSessions = new Set(data.uniqueSessions || []);
    return data;
  } catch (error) {
    console.error('[Analytics] Failed to load:', error);
    return {
      totalMessages: 0,
      totalSessions: 0,
      uniqueSessions: new Set(),
      interactions: [],
      dailyStats: {},
      popularQueries: {},
      intentCounts: {},
      lastUpdated: new Date().toISOString()
    };
  }
}

// Save analytics data
function saveAnalytics(data) {
  try {
    // Convert Set to Array for JSON serialization
    const saveData = {
      ...data,
      uniqueSessions: Array.from(data.uniqueSessions)
    };
    writeFileSync(ANALYTICS_FILE, JSON.stringify(saveData, null, 2));
  } catch (error) {
    console.error('[Analytics] Failed to save:', error);
  }
}

// Track a chat interaction
export function trackChatInteraction(sessionId, message, intent, platformsRecommended = 0) {
  try {
    const analytics = loadAnalytics();

    // Get today's date key (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Track new session
    const isNewSession = !analytics.uniqueSessions.has(sessionId);
    if (isNewSession) {
      analytics.uniqueSessions.add(sessionId);
      analytics.totalSessions++;
    }

    // Increment total messages
    analytics.totalMessages++;

    // Track intent
    if (intent) {
      analytics.intentCounts[intent] = (analytics.intentCounts[intent] || 0) + 1;
    }

    // Track daily stats
    if (!analytics.dailyStats[today]) {
      analytics.dailyStats[today] = {
        messages: 0,
        sessions: 0,
        newSessions: 0,
        platformsRecommended: 0
      };
    }
    analytics.dailyStats[today].messages++;
    if (isNewSession) {
      analytics.dailyStats[today].newSessions++;
    }
    if (platformsRecommended > 0) {
      analytics.dailyStats[today].platformsRecommended += platformsRecommended;
    }

    // Track popular queries (extract keywords)
    const keywords = extractKeywords(message);
    keywords.forEach(keyword => {
      analytics.popularQueries[keyword] = (analytics.popularQueries[keyword] || 0) + 1;
    });

    // Add interaction (keep last 1000 interactions to prevent file bloat)
    analytics.interactions.push({
      timestamp: new Date().toISOString(),
      sessionId: sessionId.substring(0, 20), // Truncate for privacy
      message: message.substring(0, 100), // First 100 chars
      intent,
      platformsRecommended,
      isNewSession
    });

    // Keep only last 1000 interactions
    if (analytics.interactions.length > 1000) {
      analytics.interactions = analytics.interactions.slice(-1000);
    }

    analytics.lastUpdated = new Date().toISOString();

    saveAnalytics(analytics);
  } catch (error) {
    console.error('[Analytics] Failed to track interaction:', error);
  }
}

// Extract keywords from message
function extractKeywords(message) {
  const stopWords = new Set(['i', 'need', 'want', 'looking', 'for', 'a', 'an', 'the', 'to', 'find', 'help', 'me', 'can', 'you', 'please', 'thanks', 'thank']);

  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  return words.slice(0, 5); // Top 5 keywords
}

// Get analytics statistics
export function getAnalytics() {
  try {
    const analytics = loadAnalytics();

    // Calculate stats
    const last7Days = getLast7Days();
    const last7DaysStats = last7Days.map(date => ({
      date,
      ...analytics.dailyStats[date] || { messages: 0, sessions: 0, newSessions: 0, platformsRecommended: 0 }
    }));

    // Get top queries
    const topQueries = Object.entries(analytics.popularQueries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    // Get intent distribution
    const intentDistribution = Object.entries(analytics.intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = analytics.dailyStats[today] || { messages: 0, sessions: 0, newSessions: 0, platformsRecommended: 0 };

    return {
      summary: {
        totalMessages: analytics.totalMessages,
        totalSessions: analytics.totalSessions,
        uniqueSessions: analytics.uniqueSessions.size,
        averageMessagesPerSession: analytics.totalSessions > 0
          ? (analytics.totalMessages / analytics.totalSessions).toFixed(2)
          : 0,
        lastUpdated: analytics.lastUpdated
      },
      today: todayStats,
      last7Days: last7DaysStats,
      topQueries,
      intentDistribution,
      recentInteractions: analytics.interactions.slice(-20).reverse()
    };
  } catch (error) {
    console.error('[Analytics] Failed to get analytics:', error);
    return null;
  }
}

// Helper: Get last 7 days date strings
function getLast7Days() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// Initialize on module load
initAnalytics();
