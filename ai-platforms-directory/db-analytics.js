/**
 * PostgreSQL-based Chat Analytics
 * Persistent analytics that survive deployments
 */

import pg from 'pg';
const { Pool } = pg;

// PostgreSQL connection pool
let pool = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

// Initialize database tables
export async function initAnalyticsDB() {
  const db = getPool();
  if (!db) {
    console.log('[Analytics] No DATABASE_URL configured, skipping DB init');
    return false;
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_analytics (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        intent VARCHAR(50),
        platforms_recommended INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_new_session BOOLEAN DEFAULT FALSE,
        date DATE DEFAULT CURRENT_DATE
      );
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_analytics_date ON chat_analytics(date);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_analytics_session ON chat_analytics(session_id);
    `);

    console.log('[Analytics] ✅ Database tables initialized');
    return true;
  } catch (error) {
    console.error('[Analytics] Failed to initialize DB:', error);
    return false;
  }
}

// Track a chat interaction
export async function trackChatInteraction(sessionId, message, intent, platformsRecommended = 0) {
  const db = getPool();
  if (!db) {
    console.log('[Analytics] No database configured, skipping tracking');
    return;
  }

  try {
    // Check if this is a new session
    const sessionCheck = await db.query(
      'SELECT COUNT(*) as count FROM chat_analytics WHERE session_id = $1',
      [sessionId]
    );
    const isNewSession = sessionCheck.rows[0].count === '0';

    // Insert interaction
    await db.query(
      `INSERT INTO chat_analytics
       (session_id, message, intent, platforms_recommended, is_new_session, date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)`,
      [
        sessionId.substring(0, 100),
        message.substring(0, 500),
        intent,
        platformsRecommended,
        isNewSession
      ]
    );

    console.log(`[Analytics] Tracked: ${intent} | New: ${isNewSession}`);
  } catch (error) {
    console.error('[Analytics] Failed to track interaction:', error);
  }
}

// Get analytics statistics
export async function getAnalytics() {
  const db = getPool();
  if (!db) {
    return {
      summary: {
        totalMessages: 0,
        totalSessions: 0,
        uniqueSessions: 0,
        averageMessagesPerSession: 0,
        lastUpdated: new Date().toISOString()
      },
      today: { messages: 0, sessions: 0, newSessions: 0, platformsRecommended: 0 },
      last7Days: [],
      topQueries: [],
      intentDistribution: [],
      recentInteractions: []
    };
  }

  try {
    // Total stats
    const totalStats = await db.query(`
      SELECT
        COUNT(*) as total_messages,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(CASE WHEN is_new_session = true THEN 1 END) as total_sessions
      FROM chat_analytics
    `);

    const stats = totalStats.rows[0];
    const totalMessages = parseInt(stats.total_messages);
    const uniqueSessions = parseInt(stats.unique_sessions);
    const totalSessions = parseInt(stats.total_sessions);

    // Today's stats
    const todayStats = await db.query(`
      SELECT
        COUNT(*) as messages,
        COUNT(CASE WHEN is_new_session = true THEN 1 END) as new_sessions,
        SUM(platforms_recommended) as platforms_recommended
      FROM chat_analytics
      WHERE date = CURRENT_DATE
    `);

    const today = todayStats.rows[0];

    // Last 7 days
    const last7DaysData = await db.query(`
      SELECT
        date::text,
        COUNT(*) as messages,
        COUNT(CASE WHEN is_new_session = true THEN 1 END) as new_sessions,
        SUM(platforms_recommended) as platforms_recommended
      FROM chat_analytics
      WHERE date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    // Fill in missing dates
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = last7DaysData.rows.find(d => d.date === dateStr);
      last7Days.push({
        date: dateStr,
        messages: dayData ? parseInt(dayData.messages) : 0,
        sessions: dayData ? parseInt(dayData.new_sessions) : 0,
        newSessions: dayData ? parseInt(dayData.new_sessions) : 0,
        platformsRecommended: dayData ? parseInt(dayData.platforms_recommended || 0) : 0
      });
    }

    // Top queries (extract keywords from messages)
    const recentMessages = await db.query(`
      SELECT message FROM chat_analytics
      WHERE intent = 'search'
      ORDER BY timestamp DESC
      LIMIT 100
    `);

    const keywords = {};
    recentMessages.rows.forEach(row => {
      const words = extractKeywords(row.message);
      words.forEach(word => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    });

    const topQueries = Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    // Intent distribution
    const intentData = await db.query(`
      SELECT intent, COUNT(*) as count
      FROM chat_analytics
      WHERE intent IS NOT NULL
      GROUP BY intent
      ORDER BY count DESC
    `);

    const intentDistribution = intentData.rows.map(row => ({
      intent: row.intent,
      count: parseInt(row.count)
    }));

    // Recent interactions
    const recentData = await db.query(`
      SELECT
        timestamp,
        session_id,
        message,
        intent,
        platforms_recommended,
        is_new_session
      FROM chat_analytics
      ORDER BY timestamp DESC
      LIMIT 20
    `);

    const recentInteractions = recentData.rows.map(row => ({
      timestamp: row.timestamp.toISOString(),
      sessionId: row.session_id.substring(0, 20),
      message: row.message.substring(0, 100),
      intent: row.intent,
      platformsRecommended: row.platforms_recommended,
      isNewSession: row.is_new_session
    }));

    return {
      summary: {
        totalMessages,
        totalSessions,
        uniqueSessions,
        averageMessagesPerSession: totalSessions > 0
          ? (totalMessages / totalSessions).toFixed(2)
          : '0.00',
        lastUpdated: new Date().toISOString()
      },
      today: {
        messages: parseInt(today.messages),
        sessions: parseInt(today.new_sessions),
        newSessions: parseInt(today.new_sessions),
        platformsRecommended: parseInt(today.platforms_recommended || 0)
      },
      last7Days,
      topQueries,
      intentDistribution,
      recentInteractions
    };
  } catch (error) {
    console.error('[Analytics] Failed to get analytics:', error);
    return null;
  }
}

// Extract keywords from message (same logic as before)
function extractKeywords(message) {
  const stopWords = new Set(['i', 'need', 'want', 'looking', 'for', 'a', 'an', 'the', 'to', 'find', 'help', 'me', 'can', 'you', 'please', 'thanks', 'thank']);

  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  return words.slice(0, 5);
}

// Close database connection on shutdown
export async function closeDB() {
  if (pool) {
    await pool.end();
    console.log('[Analytics] Database connection closed');
  }
}
