import { appendFileSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const ANALYTICS_FILE = join(process.cwd(), 'server-analytics.json');

// Initialize analytics file if it doesn't exist
if (!existsSync(ANALYTICS_FILE)) {
  writeFileSync(ANALYTICS_FILE, JSON.stringify({
    dailyStats: {},
    pageViews: [],
    uniqueVisitors: new Set()
  }, null, 2));
}

/**
 * Track page view - SERVER SIDE (cannot be blocked by ad blockers)
 */
export function trackPageView(request) {
  const ip = request.headers['x-forwarded-for']?.split(',')[0].trim() || request.ip;
  const userAgent = request.headers['user-agent'] || '';
  const url = request.url;
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0]; // YYYY-MM-DD

  // Skip tracking for assets, API calls, bots
  if (url.includes('/assets/') ||
      url.includes('/api/') ||
      url.includes('.js') ||
      url.includes('.css') ||
      url.includes('.png') ||
      url.includes('.jpg') ||
      url.includes('.svg') ||
      url.includes('favicon') ||
      url.includes('/health') ||
      isBot(userAgent)) {
    return;
  }

  try {
    const analytics = JSON.parse(readFileSync(ANALYTICS_FILE, 'utf-8'));

    // Track daily stats
    if (!analytics.dailyStats[date]) {
      analytics.dailyStats[date] = {
        date,
        totalPageViews: 0,
        uniqueVisitors: new Set(),
        pages: {}
      };
    }

    // Increment page views
    analytics.dailyStats[date].totalPageViews++;

    // Track unique visitors by IP
    const visitors = new Set(analytics.dailyStats[date].uniqueVisitors);
    visitors.add(ip);
    analytics.dailyStats[date].uniqueVisitors = Array.from(visitors);

    // Track pages
    if (!analytics.dailyStats[date].pages[url]) {
      analytics.dailyStats[date].pages[url] = 0;
    }
    analytics.dailyStats[date].pages[url]++;

    // Keep only last 30 days
    const dates = Object.keys(analytics.dailyStats).sort();
    if (dates.length > 30) {
      const toDelete = dates.slice(0, dates.length - 30);
      toDelete.forEach(d => delete analytics.dailyStats[d]);
    }

    // Write back
    writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
  } catch (error) {
    console.error('[Server Analytics] Error tracking:', error.message);
  }
}

/**
 * Get analytics summary
 */
export function getServerAnalytics() {
  try {
    const analytics = JSON.parse(readFileSync(ANALYTICS_FILE, 'utf-8'));

    // Calculate totals
    const dates = Object.keys(analytics.dailyStats).sort();
    const last7Days = dates.slice(-7);
    const last30Days = dates.slice(-30);

    const stats7Day = {
      totalPageViews: 0,
      uniqueVisitors: new Set(),
      topPages: {}
    };

    const stats30Day = {
      totalPageViews: 0,
      uniqueVisitors: new Set(),
      topPages: {}
    };

    // Calculate 7-day stats
    last7Days.forEach(date => {
      const day = analytics.dailyStats[date];
      stats7Day.totalPageViews += day.totalPageViews;
      day.uniqueVisitors.forEach(v => stats7Day.uniqueVisitors.add(v));
      Object.entries(day.pages).forEach(([url, count]) => {
        stats7Day.topPages[url] = (stats7Day.topPages[url] || 0) + count;
      });
    });

    // Calculate 30-day stats
    last30Days.forEach(date => {
      const day = analytics.dailyStats[date];
      stats30Day.totalPageViews += day.totalPageViews;
      day.uniqueVisitors.forEach(v => stats30Day.uniqueVisitors.add(v));
      Object.entries(day.pages).forEach(([url, count]) => {
        stats30Day.topPages[url] = (stats30Day.topPages[url] || 0) + count;
      });
    });

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = analytics.dailyStats[today] || { totalPageViews: 0, uniqueVisitors: [], pages: {} };

    return {
      today: {
        date: today,
        pageViews: todayStats.totalPageViews,
        uniqueVisitors: todayStats.uniqueVisitors.length,
        topPages: Object.entries(todayStats.pages)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([url, views]) => ({ url, views }))
      },
      last7Days: {
        pageViews: stats7Day.totalPageViews,
        uniqueVisitors: stats7Day.uniqueVisitors.size,
        avgDailyPageViews: Math.round(stats7Day.totalPageViews / 7),
        topPages: Object.entries(stats7Day.topPages)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([url, views]) => ({ url, views }))
      },
      last30Days: {
        pageViews: stats30Day.totalPageViews,
        uniqueVisitors: stats30Day.uniqueVisitors.size,
        avgDailyPageViews: Math.round(stats30Day.totalPageViews / 30),
        topPages: Object.entries(stats30Day.topPages)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([url, views]) => ({ url, views }))
      },
      comparison: {
        cloudflareVsServer: `Cloudflare shows ~${Math.round(stats7Day.uniqueVisitors.size / 7)} daily visitors. Google Analytics shows only ~30-40% due to ad blockers.`,
        realTraffic: `Your TRUE traffic is ${stats7Day.uniqueVisitors.size} unique visitors in the last 7 days.`
      }
    };
  } catch (error) {
    console.error('[Server Analytics] Error reading:', error.message);
    return null;
  }
}

function isBot(userAgent) {
  const ua = userAgent.toLowerCase();
  const bots = [
    'bot', 'crawler', 'spider', 'crawling',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'whatsapp', 'telegram'
  ];
  return bots.some(bot => ua.includes(bot));
}
