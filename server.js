// Force Railway redeploy - 2026-01-08T12:35:00Z - Load vibe coding and all pillar guides
import Fastify from 'fastify';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';
import satori from 'satori';
import sharp from 'sharp';
import chatService from './ai-chat-service.js';
import geoip from 'geoip-lite';
import rateLimit from '@fastify/rate-limit';

// Use database-based analytics if DATABASE_URL is set, otherwise fallback to file-based
import { trackChatInteraction as trackDB, getAnalytics as getDB, initAnalyticsDB } from './db-analytics.js';
import { trackChatInteraction as trackFile, getAnalytics as getFile } from './chat-analytics.js';

const useDatabase = !!process.env.DATABASE_URL;
console.log(`[Analytics] Using ${useDatabase ? 'PostgreSQL' : 'File-based'} storage`);

export const trackChatInteraction = useDatabase ? trackDB : trackFile;
export const getAnalytics = useDatabase ? getDB : getFile;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===========================================
// SSR HELPER FUNCTIONS
// ===========================================

/**
 * Escape HTML special characters to prevent XSS and broken attributes
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Detect if request is from a search engine bot
 */
function isSearchBot(userAgent) {
  if (!userAgent) return false;

  const ua = userAgent.toLowerCase();
  const searchBots = [
    'googlebot',
    'bingbot',
    'slurp',              // Yahoo
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'applebot'
  ];

  return searchBots.some(bot => ua.includes(bot));
}

/**
 * Generate SEO-optimized HTML for platform pages
 */
function generatePlatformHTML(platform, baseUrl) {
  const title = escapeHtml(`${platform.name} - AI Platform Review | AI Platforms List`);
  const description = escapeHtml(platform.description?.substring(0, 160) || `Discover ${platform.name}, an AI platform in the ${platform.category} category.`);
  const url = escapeHtml(`${baseUrl}/platform/${platform.slug}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${baseUrl}/og-image.png">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #1a1a1a; font-size: 2.5rem; margin-bottom: 0.5rem; }
    .meta { color: #666; margin-bottom: 2rem; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #f0f0f0; border-radius: 4px; margin-right: 0.5rem; }
    .section { margin-bottom: 2rem; }
    .section h2 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 0.5rem; }
    ul { padding-left: 1.5rem; }
    li { margin: 0.5rem 0; }
    .cta { display: inline-block; background: #4F46E5; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; margin: 2rem 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(platform.name)}</h1>
  <div class="meta">
    <span class="badge">${escapeHtml(platform.category || 'AI Platform')}</span>
    ${platform.pricing ? `<span class="badge">💰 ${escapeHtml(platform.pricing)}</span>` : ''}
    ${platform.rating ? `<span class="badge">⭐ ${platform.rating}/5</span>` : ''}
  </div>
  <div class="section">
    <p>${escapeHtml(platform.description || 'An innovative AI platform.')}</p>
  </div>
  ${platform.features && platform.features.length > 0 ? `
  <div class="section">
    <h2>Key Features</h2>
    <ul>${platform.features.slice(0, 10).map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
  </div>` : ''}
  ${platform.use_cases && platform.use_cases.length > 0 ? `
  <div class="section">
    <h2>Use Cases</h2>
    <ul>${platform.use_cases.slice(0, 10).map(u => `<li>${escapeHtml(u)}</li>`).join('')}</ul>
  </div>` : ''}
  ${platform.website || platform.url ? `
  <a href="${escapeHtml(platform.website || platform.url)}" class="cta" target="_blank" rel="noopener">Visit ${escapeHtml(platform.name)} →</a>` : ''}
  <p style="margin-top: 3rem; color: #666; font-size: 0.875rem;">© 2026 AI Platforms List. All rights reserved.</p>
</body>
</html>`;
}

/**
 * Generate simple HTML for comparison/alternatives pages
 */
function generateContentHTML(content, baseUrl, type = 'comparison') {
  const title = escapeHtml(content.title || `AI Platform ${type}`);
  const description = escapeHtml(content.metaDescription || content.description?.substring(0, 160) || `Discover AI platform ${type}.`);
  const url = escapeHtml(`${baseUrl}/${type === 'comparison' ? 'compare' : type === 'alternatives' ? 'alternatives' : 'best'}/${content.slug}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | AI Platforms List</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #1a1a1a; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p style="margin-top: 2rem; color: #666;">© 2026 AI Platforms List</p>
</body>
</html>`;
}

const fastify = Fastify({
  logger: true,
  // Add error handling to prevent 5xx crashes
  onError: (request, reply, error) => {
    console.error('[Server Error]', error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  console.error('[Error Handler]', {
    url: request.url,
    method: request.method,
    error: error.message
  });

  // Don't expose internal errors to clients
  if (error.statusCode && error.statusCode < 500) {
    reply.code(error.statusCode).send({ error: error.message });
  } else {
    reply.code(500).send({ error: 'Internal Server Error' });
  }
});

// ===========================================
// SECURITY HEADERS
// ===========================================
fastify.addHook('onSend', async (request, reply, payload) => {
  // Content Security Policy - Prevent XSS attacks
  reply.header(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://www.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.deepseek.com https://api.openai.com https://api.anthropic.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; " +
    "frame-src 'self' https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests;"
  );

  // HTTP Strict Transport Security - Force HTTPS
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent clickjacking attacks
  reply.header('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  reply.header('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection (legacy browsers)
  reply.header('X-XSS-Protection', '1; mode=block');

  // Referrer policy - don't leak URLs to third parties
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - disable unnecessary features
  reply.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(self)'
  );

  return payload;
});

// Initialize Stripe (only if API key is provided)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Load platforms data
let platforms = [];
try {
  const data = readFileSync(join(__dirname, 'platforms.json'), 'utf-8');
  platforms = JSON.parse(data);
  console.log(`✅ Loaded ${platforms.length} platforms`);
} catch (error) {
  console.error('Failed to load platforms:', error);
}

// Load pillar content
let pillarContent = [];
try {
  const pillarDir = join(__dirname, 'pillar-content');
  if (existsSync(pillarDir)) {
    const files = readdirSync(pillarDir).filter(f => f.endsWith('.json'));
    pillarContent = files.map(file => {
      const data = readFileSync(join(pillarDir, file), 'utf-8');
      return JSON.parse(data);
    });
    console.log(`✅ Loaded ${pillarContent.length} pillar pages`);
  } else {
    console.log('⚠️  No pillar-content directory found');
  }
} catch (error) {
  console.error('Failed to load pillar content:', error);
}

// Load landing page content
let landingContent = [];
try {
  const landingDir = join(__dirname, 'landing-content');
  if (existsSync(landingDir)) {
    const files = readdirSync(landingDir).filter(f => f.endsWith('.json'));
    landingContent = files.map(file => {
      const data = readFileSync(join(landingDir, file), 'utf-8');
      return JSON.parse(data);
    });
    console.log(`✅ Loaded ${landingContent.length} landing pages`);
  } else {
    console.log('⚠️  No landing-content directory found');
  }
} catch (error) {
  console.error('Failed to load landing content:', error);
}

// Load comparison content
let comparisonContent = [];
try {
  const comparisonDir = join(__dirname, 'comparison-content');
  if (existsSync(comparisonDir)) {
    const files = readdirSync(comparisonDir).filter(f => f.endsWith('.json'));
    comparisonContent = files.map(file => {
      const data = readFileSync(join(comparisonDir, file), 'utf-8');
      return JSON.parse(data);
    });
    console.log(`✅ Loaded ${comparisonContent.length} comparison pages`);
  }
} catch (error) {
  console.error('Failed to load comparison content:', error);
}

// Load alternatives content
let alternativesContent = [];
try {
  const alternativesDir = join(__dirname, 'alternatives-content');
  if (existsSync(alternativesDir)) {
    const files = readdirSync(alternativesDir).filter(f => f.endsWith('.json'));
    alternativesContent = files.map(file => {
      const data = readFileSync(join(alternativesDir, file), 'utf-8');
      return JSON.parse(data);
    });
    console.log(`✅ Loaded ${alternativesContent.length} alternatives pages`);
  }
} catch (error) {
  console.error('Failed to load alternatives content:', error);
}

// Load best-of content
let bestOfContent = [];
try {
  const bestOfDir = join(__dirname, 'bestof-content');
  if (existsSync(bestOfDir)) {
    const files = readdirSync(bestOfDir).filter(f => f.endsWith('.json'));
    bestOfContent = files.map(file => {
      const data = readFileSync(join(bestOfDir, file), 'utf-8');
      return JSON.parse(data);
    });
    console.log(`✅ Loaded ${bestOfContent.length} best-of pages`);
  }
} catch (error) {
  console.error('Failed to load best-of content:', error);
}

// Load blog posts
let blogPosts = [];
try {
  const blogDir = join(__dirname, 'blog-posts');
  if (existsSync(blogDir)) {
    const files = readdirSync(blogDir).filter(f => f.endsWith('.json'));
    blogPosts = files.map(file => {
      const data = readFileSync(join(blogDir, file), 'utf-8');
      return JSON.parse(data);
    });
    console.log(`✅ Loaded ${blogPosts.length} blog posts`);
  }
} catch (error) {
  console.error('Failed to load blog posts:', error);
}

// CORS for development
fastify.register(import('@fastify/cors'), {
  origin: true
});

// ===========================================
// RATE LIMITING: Prevent aggressive scraping
// ===========================================
fastify.register(rateLimit, {
  max: 100, // Max 100 requests
  timeWindow: '1 minute', // Per minute per IP
  cache: 10000, // Cache 10k IP addresses
  allowList: ['127.0.0.1', '::1'], // Whitelist localhost
  skipOnError: false,
  ban: 5, // Ban after 5 rate limit violations
  continueExceeding: true,
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true
  },
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true
  },
  onExceeding: function(request, key) {
    console.log(`[RATE-LIMIT] IP ${key} is exceeding rate limits`);
  },
  onExceeded: function(request, key) {
    console.log(`[RATE-LIMIT] Blocked IP ${key} for excessive requests`);
  }
});

// ===========================================
// CANONICAL URLs: Prevent duplicate content
// ===========================================
fastify.addHook('onRequest', async (request, reply) => {
  const baseUrl = process.env.BASE_URL || 'https://aiplatformslist.com';

  // Remove query parameters for canonical URL
  const canonicalPath = request.url.split('?')[0];
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  // Add Link header for canonical URL (Google respects this)
  reply.header('Link', `<${canonicalUrl}>; rel="canonical"`);
});

// ===========================================
// BOT DETECTION: Block known scrapers
// ===========================================
const BLOCKED_USER_AGENTS = [
  'scrapy', 'crawl', 'bot', 'spider', 'scraper',
  'python-requests', 'curl', 'wget', 'httrack',
  'webzip', 'teleport', 'webcopier', 'download',
  'offline', 'webripper', 'harvester', 'extract',
  'sitesucker', 'grab', 'fetch', 'collect'
];

fastify.addHook('onRequest', async (request, reply) => {
  const userAgent = (request.headers['user-agent'] || '').toLowerCase();

  // Check for suspicious/scraper user agents
  const isSuspiciousBot = BLOCKED_USER_AGENTS.some(bot => userAgent.includes(bot));

  // Allow legitimate bots (Google, Bing, etc.)
  const isLegitimateBot = userAgent.includes('googlebot') ||
                          userAgent.includes('bingbot') ||
                          userAgent.includes('slackbot') ||
                          userAgent.includes('facebookexternalhit') ||
                          userAgent.includes('twitterbot') ||
                          userAgent.includes('linkedinbot');

  if (isSuspiciousBot && !isLegitimateBot) {
    console.log(`[BOT-BLOCK] Blocked scraper bot - User-Agent: ${userAgent}`);
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Automated access is not permitted.'
    });
    return;
  }

  // Block requests with no user agent (common for scrapers)
  if (!userAgent || userAgent.length < 5) {
    console.log(`[BOT-BLOCK] Blocked request with missing/invalid User-Agent`);
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Valid browser required.'
    });
    return;
  }
});

// ===========================================
// GEO-BLOCKING: Block traffic from China and Singapore
// ===========================================
const BLOCKED_COUNTRIES = ['CN', 'SG']; // China, Singapore

fastify.addHook('onRequest', async (request, reply) => {
  // Get client IP address
  const clientIp = request.headers['x-forwarded-for']?.split(',')[0].trim() ||
                   request.headers['x-real-ip'] ||
                   request.ip ||
                   request.socket.remoteAddress;

  // Skip blocking for localhost/development
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    return;
  }

  // Look up IP location
  const geo = geoip.lookup(clientIp);

  if (geo && BLOCKED_COUNTRIES.includes(geo.country)) {
    const countryName = geo.country === 'CN' ? 'China' : geo.country === 'SG' ? 'Singapore' : geo.country;
    console.log(`[GEO-BLOCK] Blocked request from ${countryName} - IP: ${clientIp}`);
    reply.code(403).send({
      error: 'Access Denied',
      message: 'Access from your region is not available at this time.'
    });
    return;
  }
});

// ===========================================
// SSR MIDDLEWARE: Serve pre-rendered HTML to search bots
// ===========================================
fastify.addHook('onRequest', async (request, reply) => {
  const userAgent = request.headers['user-agent'] || '';

  // Only process for search engine bots
  if (!isSearchBot(userAgent)) {
    return; // Regular users continue to normal routing
  }

  const baseUrl = process.env.BASE_URL || 'https://aiplatformslist.com';
  const url = request.url.split('?')[0]; // Remove query params

  try {
    // Match /platform/:slug
    const platformMatch = url.match(/^\/platform\/([a-z0-9-]+)$/);
    if (platformMatch) {
      const slug = platformMatch[1];
      const platform = platforms.find(p => p.slug === slug || p.id === slug);

      if (platform) {
        console.log(`[SSR] Serving platform HTML for bot: ${userAgent.substring(0, 50)} - ${slug}`);
        const html = generatePlatformHTML(platform, baseUrl);
        reply.type('text/html').send(html);
        return; // Stop processing
      }
    }

    // Match /compare/:slug
    const compareMatch = url.match(/^\/compare\/([a-z0-9-]+)$/);
    if (compareMatch) {
      const slug = compareMatch[1];
      const comparison = comparisonContent.find(c => c.slug === slug);

      if (comparison) {
        console.log(`[SSR] Serving comparison HTML for bot: ${userAgent.substring(0, 50)} - ${slug}`);
        const html = generateContentHTML(comparison, baseUrl, 'comparison');
        reply.type('text/html').send(html);
        return;
      }
    }

    // Match /alternatives/:slug
    const altMatch = url.match(/^\/alternatives\/([a-z0-9-]+)$/);
    if (altMatch) {
      const slug = altMatch[1];
      const alternatives = alternativesContent.find(a => a.slug === slug);

      if (alternatives) {
        console.log(`[SSR] Serving alternatives HTML for bot: ${userAgent.substring(0, 50)} - ${slug}`);
        const html = generateContentHTML(alternatives, baseUrl, 'alternatives');
        reply.type('text/html').send(html);
        return;
      }
    }

    // Match /best/:slug
    const bestMatch = url.match(/^\/best\/([a-z0-9-]+)$/);
    if (bestMatch) {
      const slug = bestMatch[1];
      const bestOf = bestOfContent.find(b => b.slug === slug);

      if (bestOf) {
        console.log(`[SSR] Serving best-of HTML for bot: ${userAgent.substring(0, 50)} - ${slug}`);
        const html = generateContentHTML(bestOf, baseUrl, 'best-of');
        reply.type('text/html').send(html);
        return;
      }
    }

    // If no match found, continue to normal routing (will hit 404 handler which serves SPA)
  } catch (error) {
    console.error('[SSR] Error generating HTML:', error);
    // On error, continue to normal routing
  }
});

// ===========================================
// SEO: 301 Redirects for old URL patterns
// ===========================================

// Helper to find platform by old naming conventions
function findPlatformByOldSlug(oldSlug) {
  // Try to extract platform name from old format like "platform-emailmgmt-mailytica"
  const parts = oldSlug.replace('platform-', '').split('-');
  // Remove category prefix (first part) and join the rest
  const nameGuess = parts.slice(1).join(' ');

  return platforms.find(p => {
    const pName = p.name.toLowerCase();
    const pSlug = (p.slug || p.id || '').toLowerCase();
    return pName.includes(nameGuess) ||
           pSlug.includes(parts.slice(1).join('-')) ||
           nameGuess.includes(pName.split(' ')[0]);
  });
}

// Handle old /platforms/[firebaseId] URLs - 301 redirect to homepage
fastify.get('/platforms/:firebaseId', async (request, reply) => {
  // These are old Firebase-style URLs - redirect to homepage
  // Using 301 permanent redirect to preserve SEO value
  reply.redirect(301, '/');
});

// Redirect old /platform/platform-[category]-[name] format
fastify.get('/platform/platform-:rest', async (request, reply) => {
  const oldSlug = `platform-${request.params.rest}`;
  const platform = findPlatformByOldSlug(oldSlug);

  if (platform) {
    const newSlug = platform.slug || platform.id || platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    reply.redirect(301, `/platform/${newSlug}`);
  } else {
    // No match found - redirect to homepage to preserve SEO
    reply.redirect(301, '/');
  }
});

// Handle old blog URLs - 301 redirect to blog index
fastify.get('/blog/:category/:slug', async (request, reply) => {
  // Old blog URL format - redirect to /blog to preserve SEO
  reply.redirect(301, '/blog');
});

// Additional redirect patterns for common old URLs
fastify.get('/guide/:slug', async (request, reply) => {
  // Old /guide/* format - redirect to /guides (pillar content)
  reply.redirect(301, `/guides`);
});

// Removed broken /compare/:slug redirect that caused infinite loop
// The SPA handles these routes naturally through the 404 fallback

fastify.get('/alternatives/:platform/:slug', async (request, reply) => {
  // Old alternatives URL format - redirect to new format
  reply.redirect(301, `/alternatives/${request.params.slug}`);
});

// Redirect old category URLs with different naming
const oldCategoryMappings = {
  'speech-recognition-ai': 'audio-ai',
  'text-generation-ai': 'llms',
  'conversational-ai': 'agent-platforms',
  'autonomous-agents': 'agent-platforms',
  'ai-simulation-platforms': 'ml-frameworks',
  'ai-cybersecurity': 'analytics-bi',
  'generative-design-ai': 'generative-ai',
  'ai-dev-frameworks': 'ml-frameworks',
  'emotion-recognition-ai': 'nlp',
  'audio-generation-ai': 'audio-ai',
  'image-generation-ai': 'image-generation',
  'ai-model-training': 'ml-frameworks',
  'ai-deployment-platforms': 'ml-frameworks',
  'data-analysis-ai': 'analytics-bi',
  'computer-vision-ai': 'computer-vision',
  'ethical-ai-monitoring': 'analytics-bi',
  'knowledge-graph-ai': 'nlp',
  'gen-ai-assistants': 'llms',
  'recommendation-systems': 'analytics-bi',
  'predictive-ai': 'analytics-bi',
  'ai-for-synthetic-data': 'generative-ai',
  'ai-driven-email-management': 'workflow-automation',
  'ai-anomaly-detection': 'analytics-bi',
  'ai-personalization-engines': 'analytics-bi',
  'specialized-industry-ai': 'enterprise-ai-platforms',
  'ai-workflow-automation': 'workflow-automation',
  'gaming-ai': 'generative-ai',
  'video-generation-ai': 'video-generation',
  // Handle spaces and different cases
  'Knowledge Graph AI': 'nlp',
  'AI Workflow Automation': 'workflow-automation',
  'AI for Cybersecurity': 'analytics-bi',
  'Speech Recognition AI': 'audio-ai',
  'AI for Anomaly Detection': 'analytics-bi',
  'Conversational AI': 'agent-platforms',
  'AI Deployment Platforms': 'ml-frameworks'
};

fastify.get('/category/:oldCategory', async (request, reply) => {
  const oldCat = request.params.oldCategory;
  const newCat = oldCategoryMappings[oldCat];

  if (newCat) {
    reply.redirect(301, `/category/${newCat}`);
  } else {
    // Check if it's a valid current category
    const validCategories = [...new Set(platforms.map(p => p.category).filter(Boolean))];
    if (validCategories.includes(oldCat)) {
      // It's valid, let it pass through to the SPA
      return;
    }
    // Invalid category - redirect to homepage to preserve SEO
    reply.redirect(301, '/');
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  fastify.register(import('@fastify/static'), {
    root: join(__dirname, 'dist'),
    prefix: '/'
  });
}

// ===========================================
// COPYRIGHT PROTECTION: Add watermarks
// ===========================================
fastify.addHook('onSend', async (request, reply, payload) => {
  // Only add copyright to API responses
  if (request.url.startsWith('/api/')) {
    const contentType = reply.getHeader('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(payload);
        // Add copyright notice to API responses
        data._copyright = '© 2026 AI Platforms List. All rights reserved. Unauthorized copying or redistribution prohibited.';
        data._source = 'https://aiplatformslist.com';
        return JSON.stringify(data);
      } catch (e) {
        // If parsing fails, return original payload
        return payload;
      }
    }
  }
  return payload;
});

// API Routes
fastify.get('/api/platforms', async (request, reply) => {
  const { category, search, featured, limit = 1000, offset = 0, sort, order = 'desc' } = request.query;

  let filtered = platforms;

  // Filter by category
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  // Filter by featured
  if (featured === 'true') {
    filtered = filtered.filter(p => p.featured === true);
  }

  // Search
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.tags?.some(t => t.toLowerCase().includes(searchLower))
    );
  }

  // Sorting
  if (sort) {
    filtered = filtered.sort((a, b) => {
      let aVal = a[sort];
      let bVal = b[sort];

      // Handle created_at / added_date fields
      if (sort === 'created_at' || sort === 'added_date') {
        aVal = new Date(a.added_date || a.created_at || 0).getTime();
        bVal = new Date(b.added_date || b.created_at || 0).getTime();
      }

      // Handle rating/numeric fields
      if (sort === 'rating' || sort === 'clicks') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      // Handle string fields
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }

  // Pagination
  const total = filtered.length;
  const results = filtered
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  return {
    platforms: results,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  };
});

// Get single platform
fastify.get('/api/platforms/:slug', async (request, reply) => {
  try {
    const { slug } = request.params;
    const platform = platforms.find(p => p.slug === slug || p.id === slug);

    if (!platform) {
      reply.code(404).send({ error: 'Platform not found' });
      return;
    }

    return platform;
  } catch (error) {
    console.error('[API Error] /api/platforms/:slug:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get categories
fastify.get('/api/categories', async (request, reply) => {
  try {
    const categoryMap = new Map();

    platforms.forEach(platform => {
      // Use categories array (plural) for modern platforms, fallback to category (singular) for legacy
      const cats = platform.categories || (platform.category ? [platform.category] : ['uncategorized']);

      cats.forEach(cat => {
        if (!categoryMap.has(cat)) {
          // Convert slug to name
          const name = cat
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          categoryMap.set(cat, { slug: cat, name, count: 0 });
        }
        categoryMap.get(cat).count++;
      });
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('[API Error] /api/categories:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get pillar content list
fastify.get('/api/pillar', async (request, reply) => {
  try {
    return pillarContent.map(p => ({
      slug: p.slug,
      category: p.category,
      title: p.title,
      metaDescription: p.metaDescription
    }));
  } catch (error) {
    console.error('[API Error] /api/pillar:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get single pillar page
fastify.get('/api/pillar/:slug', async (request, reply) => {
  try {
    const { slug } = request.params;
    const pillar = pillarContent.find(p => p.slug === slug);

    if (!pillar) {
      reply.code(404).send({ error: 'Pillar page not found' });
      return;
    }

    return pillar;
  } catch (error) {
    console.error('[API Error] /api/pillar/:slug:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get landing page content
fastify.get('/api/landing/:slug', async (request, reply) => {
  try {
    const { slug } = request.params;
    const landing = landingContent.find(l => l.slug === slug);

    if (!landing) {
      reply.code(404).send({ error: 'Landing page not found' });
      return;
    }

    return landing;
  } catch (error) {
    console.error('[API Error] /api/landing/:slug:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Platform recommendation based on quiz answers
fastify.post('/api/quiz/recommendations', async (request, reply) => {
  try {
    const { answers } = request.body;

    if (!answers || !Array.isArray(answers)) {
      reply.code(400).send({ error: 'Invalid request: answers array required' });
      return;
    }

    // Scoring algorithm: match answers to platform attributes
    const scored = platforms.map(platform => {
      let score = 0;

      answers.forEach(answer => {
        const { questionId, selectedOptions } = answer;

        selectedOptions.forEach(optionValue => {
          // Match by category
          if (platform.category === optionValue) score += 10;

          // Match by tags
          if (platform.tags && platform.tags.includes(optionValue)) score += 5;

          // Match by pricing
          if (platform.pricing === optionValue) score += 8;

          // Match by use cases
          if (platform.use_cases && platform.use_cases.some(uc =>
            typeof uc === 'string' ? uc.toLowerCase().includes(optionValue.toLowerCase()) : false
          )) {
            score += 7;
          }

          // Match by target audience
          if (platform.target_audience && platform.target_audience.includes(optionValue)) {
            score += 6;
          }
        });
      });

      return { platform, score };
    });

    // Sort by score and return top 5
    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.platform);

    const reasoning = `Based on your answers, we matched platforms that align with your needs, focusing on ${
      answers[0]?.selectedOptions[0] || 'your requirements'
    }.`;

    return {
      platforms: recommendations,
      reasoning,
      totalMatches: scored.filter(s => s.score > 0).length
    };
  } catch (error) {
    console.error('[API Error] /api/quiz/recommendations:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// ROI Calculator
fastify.post('/api/calculator/roi', async (request, reply) => {
  try {
    const { currentMonthlyCost, automationPercentage, platformMonthlyFee, implementationCost, teamSize } = request.body;

    if (typeof currentMonthlyCost !== 'number' || typeof automationPercentage !== 'number' ||
        typeof platformMonthlyFee !== 'number') {
      reply.code(400).send({ error: 'Invalid request: numeric values required' });
      return;
    }

    // Calculate savings
    const monthlySavings = (currentMonthlyCost * (automationPercentage / 100)) - platformMonthlyFee;
    const paybackMonths = implementationCost && monthlySavings > 0
      ? Math.ceil(implementationCost / monthlySavings)
      : 0;
    const roi12Month = monthlySavings > 0
      ? ((monthlySavings * 12 - (implementationCost || 0)) / (implementationCost || 1)) * 100
      : 0;
    const tco36Month = (platformMonthlyFee * 36) + (implementationCost || 0);

    return {
      monthlySavings: Math.round(monthlySavings),
      paybackMonths,
      roi12Month: Math.round(roi12Month),
      tco36Month: Math.round(tco36Month),
      totalSavings36Month: Math.round((monthlySavings * 36) - tco36Month)
    };
  } catch (error) {
    console.error('[API Error] /api/calculator/roi:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Platform recommendations by filters
fastify.post('/api/platforms/recommend', async (request, reply) => {
  try {
    const { useCase, budget, technicalLevel, features } = request.body;

    let matches = [...platforms];

    // Filter by use case
    if (useCase) {
      matches = matches.filter(p =>
        p.use_cases && p.use_cases.some(uc =>
          typeof uc === 'string' ? uc.toLowerCase().includes(useCase.toLowerCase()) : false
        )
      );
    }

    // Filter by budget
    if (budget) {
      matches = matches.filter(p => p.pricing === budget);
    }

    // Filter by features
    if (features && Array.isArray(features)) {
      matches = matches.filter(p =>
        p.features && features.some(f =>
          p.features.some(pf => pf.toLowerCase().includes(f.toLowerCase()))
        )
      );
    }

    // Sort by rating
    matches.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return {
      platforms: matches.slice(0, 20),
      totalMatches: matches.length
    };
  } catch (error) {
    console.error('[API Error] /api/platforms/recommend:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get comparison content list
fastify.get('/api/comparisons', async (request, reply) => {
  try {
    return comparisonContent.map(c => ({
      slug: c.slug,
      title: c.title,
      metaDescription: c.metaDescription,
      platform1Slug: c.platform1Slug,
      platform2Slug: c.platform2Slug
    }));
  } catch (error) {
    console.error('[API Error] /api/comparisons:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get single comparison page
fastify.get('/api/comparisons/:slug', async (request, reply) => {
  try {
    const { slug } = request.params;
    const comparison = comparisonContent.find(c => c.slug === slug);

    if (!comparison) {
      reply.code(404).send({ error: 'Comparison not found' });
      return;
    }

    return comparison;
  } catch (error) {
    console.error('[API Error] /api/comparisons/:slug:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get alternatives content list
fastify.get('/api/alternatives', async (request, reply) => {
  try {
    return alternativesContent.map(a => ({
      slug: a.slug,
      title: a.title,
      metaDescription: a.metaDescription,
      platformSlug: a.platformSlug
    }));
  } catch (error) {
    console.error('[API Error] /api/alternatives:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get single alternatives page
fastify.get('/api/alternatives/:slug', async (request, reply) => {
  try {
    const { slug } = request.params;
    const alternatives = alternativesContent.find(a => a.slug === slug);

    if (!alternatives) {
      reply.code(404).send({ error: 'Alternatives page not found' });
      return;
    }

    return alternatives;
  } catch (error) {
    console.error('[API Error] /api/alternatives/:slug:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get best-of content list
fastify.get('/api/best-of', async (request, reply) => {
  try {
    return bestOfContent.map(b => ({
      slug: b.slug,
      title: b.title,
      metaDescription: b.metaDescription,
      category: b.category,
      totalPlatforms: b.totalPlatforms
    }));
  } catch (error) {
    console.error('[API Error] /api/best-of:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get single best-of page
fastify.get('/api/best-of/:slug', async (request, reply) => {
  try {
    const { slug } = request.params;
    const bestOf = bestOfContent.find(b => b.slug === slug);

    if (!bestOf) {
      reply.code(404).send({ error: 'Best-of page not found' });
      return;
    }

    return bestOf;
  } catch (error) {
    console.error('[API Error] /api/best-of/:slug:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get blog posts list
fastify.get('/api/blog', async (request, reply) => {
  try {
    return blogPosts
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
      .map(p => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        category: p.category,
        readTime: p.readTime,
        publishedDate: p.publishedDate,
        featured: p.featured,
        keywords: p.keywords
      }));
  } catch (error) {
    console.error('[API Error] /api/blog:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Get single blog post
fastify.get('/api/blog/:slug', async (request, reply) => {
  try {
    const { slug } = request.params;
    const post = blogPosts.find(p => p.slug === slug);

    if (!post) {
      reply.code(404).send({ error: 'Blog post not found' });
      return;
    }

    return post;
  } catch (error) {
    console.error('[API Error] /api/blog/:slug:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Stats endpoint
fastify.get('/api/stats', async (request, reply) => {
  try {
    return {
      total: platforms.length,
      featured: platforms.filter(p => p.featured).length,
      verified: platforms.filter(p => p.verified).length,
      categories: new Set(platforms.map(p => p.category)).size,
      content: {
        pillarPages: pillarContent.length,
        comparisons: comparisonContent.length,
        alternatives: alternativesContent.length,
        bestOf: bestOfContent.length,
        totalPages: pillarContent.length + comparisonContent.length + alternativesContent.length + bestOfContent.length
      }
    };
  } catch (error) {
    console.error('[API Error] /api/stats:', error);
    reply.code(500).send({ error: 'Internal server error', message: error.message });
  }
});

// Load font for OG image generation
let interFont;
try {
  const fontPath = join(__dirname, 'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff');
  interFont = readFileSync(fontPath);
  console.log('✅ Loaded Inter font for OG images');
} catch (error) {
  console.error('⚠️ Failed to load font for OG images:', error.message);
}

// Load logo for OG image generation
let logoBase64;
try {
  const logoPath = join(__dirname, 'public/logo.png');
  const logoBuffer = readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  console.log('✅ Loaded logo for OG images');
} catch (error) {
  console.error('⚠️ Failed to load logo for OG images:', error.message);
}

// Dynamic OG Image Generator
fastify.get('/og-image.png', async (request, reply) => {
  const {
    title = 'AI Platforms List',
    subtitle = `Discover ${platforms.length}+ AI Tools & Software`,
    type = 'home'
  } = request.query;

  try {
    // Create SVG using satori
    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
            padding: '80px',
            fontFamily: 'Inter',
            position: 'relative',
          },
          children: [
            // Decorative elements
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '40px',
                  right: '80px',
                  width: '200px',
                  height: '200px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  opacity: 0.2,
                  filter: 'blur(40px)',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '40px',
                  left: '80px',
                  width: '300px',
                  height: '300px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  opacity: 0.15,
                  filter: 'blur(60px)',
                },
              },
            },
            // Main content
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  position: 'relative',
                  zIndex: 10,
                },
                children: [
                  // Logo/Brand
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '20px',
                      },
                      children: [
                        {
                          type: 'img',
                          props: {
                            src: logoBase64,
                            width: 60,
                            height: 60,
                            style: {
                              borderRadius: '12px',
                            },
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '28px',
                              fontWeight: '600',
                              color: '#ffffff',
                              letterSpacing: '-0.5px',
                            },
                            children: 'AI Platforms List',
                          },
                        },
                      ],
                    },
                  },
                  // Main Title
                  {
                    type: 'h1',
                    props: {
                      style: {
                        fontSize: title.length > 50 ? '56px' : '72px',
                        fontWeight: '900',
                        color: '#ffffff',
                        lineHeight: 1.1,
                        margin: 0,
                        maxWidth: '900px',
                        letterSpacing: '-2px',
                      },
                      children: title,
                    },
                  },
                  // Subtitle
                  {
                    type: 'p',
                    props: {
                      style: {
                        fontSize: '32px',
                        fontWeight: '400',
                        color: '#a0a0b8',
                        lineHeight: 1.4,
                        margin: 0,
                        maxWidth: '800px',
                      },
                      children: subtitle,
                    },
                  },
                  // Badge/Stats
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        gap: '16px',
                        marginTop: '20px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              background: 'rgba(102, 126, 234, 0.15)',
                              border: '2px solid rgba(102, 126, 234, 0.3)',
                              borderRadius: '999px',
                              padding: '12px 28px',
                              fontSize: '20px',
                              fontWeight: '600',
                              color: '#667eea',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            },
                            children: `✓ ${platforms.length}+ Platforms`,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              background: 'rgba(102, 126, 234, 0.15)',
                              border: '2px solid rgba(102, 126, 234, 0.3)',
                              borderRadius: '999px',
                              padding: '12px 28px',
                              fontSize: '20px',
                              fontWeight: '600',
                              color: '#667eea',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            },
                            children: '⭐ Verified',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: interFont,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );

    // Convert SVG to PNG using sharp
    const png = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    reply
      .type('image/png')
      .header('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
      .send(png);
  } catch (error) {
    console.error('[OG Image Error]', error);
    reply.code(500).send({ error: 'Failed to generate OG image' });
  }
});

// Dynamic Sitemap.xml
fastify.get('/sitemap.xml', async (request, reply) => {
  const baseUrl = process.env.BASE_URL || 'https://aiplatformslist.com';
  const today = new Date().toISOString().split('T')[0];

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += '    <changefreq>daily</changefreq>\n';
  sitemap += '    <priority>1.0</priority>\n';
  sitemap += '  </url>\n';

  // Submit page
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/submit</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += '    <changefreq>monthly</changefreq>\n';
  sitemap += '    <priority>0.8</priority>\n';
  sitemap += '  </url>\n';

  // Blog page
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/blog</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += '    <changefreq>daily</changefreq>\n';
  sitemap += '    <priority>0.9</priority>\n';
  sitemap += '  </url>\n';

  // About page
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/about</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += '    <changefreq>monthly</changefreq>\n';
  sitemap += '    <priority>0.7</priority>\n';
  sitemap += '  </url>\n';

  // Contact page
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/contact</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += '    <changefreq>monthly</changefreq>\n';
  sitemap += '    <priority>0.6</priority>\n';
  sitemap += '  </url>\n';

  // Guides page
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/guides</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += '    <changefreq>weekly</changefreq>\n';
  sitemap += '    <priority>0.8</priority>\n';
  sitemap += '  </url>\n';

  // Methodology page
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/methodology</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += '    <changefreq>monthly</changefreq>\n';
  sitemap += '    <priority>0.7</priority>\n';
  sitemap += '  </url>\n';

  // Category pages
  const categoryMap = new Map();
  platforms.forEach(platform => {
    const cat = platform.category || 'uncategorized';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, true);
    }
  });

  Array.from(categoryMap.keys()).forEach(category => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/category/${category}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += '    <changefreq>weekly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });

  // Pillar pages (guides)
  pillarContent.forEach(pillar => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/guide/${pillar.slug}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += '    <changefreq>monthly</changefreq>\n';
    sitemap += '    <priority>0.9</priority>\n';
    sitemap += '  </url>\n';
  });

  // Comparison pages
  comparisonContent.forEach(comparison => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/compare/${comparison.slug}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += '    <changefreq>monthly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });

  // Alternatives pages
  alternativesContent.forEach(alternatives => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/alternatives/${alternatives.slug}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += '    <changefreq>monthly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });

  // Best-of pages
  bestOfContent.forEach(bestOf => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/best/${bestOf.slug}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += '    <changefreq>monthly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });

  // Blog posts
  blogPosts.forEach(post => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
    sitemap += `    <lastmod>${post.publishedDate?.split('T')[0] || today}</lastmod>\n`;
    sitemap += '    <changefreq>monthly</changefreq>\n';
    sitemap += '    <priority>0.9</priority>\n';
    sitemap += '  </url>\n';
  });

  // Legal pages
  const legalPages = ['privacy', 'terms', 'cookie-policy', 'dmca', 'disclaimer'];
  legalPages.forEach(page => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/${page}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += '    <changefreq>yearly</changefreq>\n';
    sitemap += '    <priority>0.3</priority>\n';
    sitemap += '  </url>\n';
  });

  // All platforms
  platforms.forEach(platform => {
    const slug = platform.slug || platform.id || platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const lastmod = platform.added_date || today;

    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}/platform/${slug}</loc>\n`;
    sitemap += `    <lastmod>${lastmod.split('T')[0]}</lastmod>\n`;
    sitemap += '    <changefreq>weekly</changefreq>\n';
    sitemap += '    <priority>0.7</priority>\n';
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>';

  reply.type('application/xml').send(sitemap);
});

// Robots.txt
fastify.get('/robots.txt', async (request, reply) => {
  const baseUrl = process.env.BASE_URL || 'https://aiplatformslist.com';

  const robots = `# AI Platforms List - Robots.txt
# © 2026 AI Platforms List. All content protected.

# Google and legitimate search engines
User-agent: *
Allow: /
Disallow: /api/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay to prevent aggressive scraping
Crawl-delay: 2

# Block aggressive scraper bots
User-agent: HTTrack
User-agent: WebReaper
User-agent: WebCopier
User-agent: WebZIP
User-agent: Offline Explorer
User-agent: Teleport
User-agent: WebStripper
User-agent: SiteSnagger
User-agent: ProWebWalker
User-agent: BackStreet
User-agent: WebAuto
User-agent: RMA
User-agent: WebRipper
User-agent: Download Demon
User-agent: SuperBot
User-agent: WebmasterWorldForumBot
Disallow: /

# Block Chinese search engines (content protection)
User-agent: Baiduspider
User-agent: Sogou
User-agent: Yandex
Disallow: /`;

  reply.type('text/plain').send(robots);
});

// Health check
fastify.get('/health', async () => {
  return {
    status: 'ok',
    platforms: platforms.length,
    geoBlocking: {
      enabled: true,
      blockedCountries: BLOCKED_COUNTRIES,
      version: '2025-12-13T21:30:00Z'
    }
  };
});

// Track click endpoint for analytics
fastify.post('/api/track-click', async (request, reply) => {
  const { platformId, type } = request.body;

  // Log analytics (in production, save to database)
  console.log(`[Analytics] ${type} for platform: ${platformId}`);

  // Update click count in memory
  const platform = platforms.find(p => p.id === platformId);
  if (platform) {
    platform.clicks = (platform.clicks || 0) + 1;
  }

  return { success: true };
});

// Submit tool endpoint
// Telegram notification function
async function sendTelegramNotification(submission) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('[Telegram] Bot token or chat ID not configured');
    return;
  }

  try {
    const message = `
🤖 <b>New AI Tool Submission!</b>

📝 <b>Tool Name:</b> ${submission.name}
🌐 <b>Website:</b> ${submission.website}
📧 <b>Contact:</b> ${submission.contactEmail}

📂 <b>Category:</b> ${submission.category}
💰 <b>Pricing Model:</b> ${submission.pricing}

📄 <b>Description:</b>
${submission.description}

${submission.wantsFeatured ? `⭐ <b>Featured Listing:</b> ${submission.featuredTier?.toUpperCase() || 'Yes'}` : ''}

💵 <b>Total Price:</b> $${submission.totalPrice}

🕒 <b>Submitted:</b> ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
`.trim();

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (response.ok) {
      console.log('[Telegram] Notification sent successfully');
    } else {
      const error = await response.json();
      console.error('[Telegram] Failed to send notification:', error);
    }
  } catch (error) {
    console.error('[Telegram] Error sending notification:', error.message);
  }
}

fastify.post('/api/submit-tool', async (request, reply) => {
  const submission = request.body;

  // Log submission
  console.log('[Submission] New tool submission:', {
    name: submission.name,
    website: submission.website,
    category: submission.category,
    totalPrice: submission.totalPrice,
  });

  // Send Telegram notification
  await sendTelegramNotification(submission);

  // If Stripe is configured, create checkout session
  if (stripe && submission.totalPrice > 0) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AI Tool Submission: ${submission.name}`,
              description: submission.wantsFeatured
                ? `Submission + Featured Listing (${submission.featuredTier})`
                : 'Tool Submission',
            },
            unit_amount: submission.totalPrice * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.DOMAIN || 'http://localhost:3001'}/submit/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN || 'http://localhost:3001'}/submit`,
        metadata: {
          toolName: submission.name,
          website: submission.website,
          category: submission.category,
          contactEmail: submission.contactEmail,
          wantsFeatured: submission.wantsFeatured.toString(),
          featuredTier: submission.featuredTier || '',
        },
      });

      return { checkoutUrl: session.url };
    } catch (error) {
      console.error('[Stripe Error]', error);
      reply.code(500).send({ error: 'Failed to create checkout session' });
      return;
    }
  }

  // If Stripe not configured, return mock success
  console.log('[Demo Mode] Stripe not configured, returning mock success');
  return { success: true };
});

// Contact form endpoint - sends message to Telegram
fastify.post('/api/contact', async (request, reply) => {
  const { name, email, subject, message } = request.body;

  // Validate required fields
  if (!name || !email || !message) {
    reply.code(400).send({ error: 'Name, email, and message are required' });
    return;
  }

  console.log('[Contact] New message received:', { name, email, subject });

  // Send to Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    try {
      const subjectLabels = {
        'general': 'General Question',
        'platform': 'Question About a Platform',
        'submit': 'Submit New Platform',
        'report': 'Report an Issue',
        'partnership': 'Partnership / Business',
        'feedback': 'Feedback / Suggestion'
      };

      const telegramMessage = `
📬 <b>New Contact Form Message!</b>

👤 <b>From:</b> ${name}
📧 <b>Email:</b> ${email}
📋 <b>Subject:</b> ${subjectLabels[subject] || subject}

💬 <b>Message:</b>
${message}

🕒 <b>Received:</b> ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
`.trim();

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        console.log('[Telegram] Contact message sent successfully');
      } else {
        const error = await response.json();
        console.error('[Telegram] Failed to send contact message:', error);
      }
    } catch (error) {
      console.error('[Telegram] Error sending contact message:', error.message);
    }
  } else {
    console.log('[Contact] Telegram not configured, message logged only');
  }

  return { success: true, message: 'Message received! We will get back to you soon.' };
});

// AI Chat endpoint
fastify.post('/api/chat', async (request, reply) => {
  const { message, sessionId } = request.body;

  // Validate required fields
  if (!message) {
    reply.code(400).send({ error: 'Message is required' });
    return;
  }

  // Generate session ID if not provided
  const session = sessionId || `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('[Chat] Message received:', { session, message: message.substring(0, 50) });

  try {
    // Get AI response
    const response = await chatService.chat(session, message);

    console.log('[Chat] Response generated:', { session, intent: response.intent });

    // Track analytics
    trackChatInteraction(
      session,
      message,
      response.intent,
      response.platforms ? response.platforms.length : 0
    );

    return {
      success: true,
      sessionId: session,
      response: response.message,
      platforms: response.platforms || [],
      intent: response.intent,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Chat] Error:', error);
    reply.code(500).send({
      error: 'Failed to process chat message',
      message: "I'm having trouble processing your request. Please try again."
    });
  }
});

// Clear chat history endpoint
fastify.post('/api/chat/clear', async (request, reply) => {
  const { sessionId } = request.body;

  if (!sessionId) {
    reply.code(400).send({ error: 'Session ID is required' });
    return;
  }

  chatService.clearHistory(sessionId);
  return { success: true, message: 'Chat history cleared' };
});

// Chat analytics endpoint (internal use only - accessible via Telegram bot)
fastify.get('/api/chat/analytics', async (request, reply) => {
  try {
    const analytics = getAnalytics();
    if (!analytics) {
      reply.code(500).send({ error: 'Failed to load analytics' });
      return;
    }
    return analytics;
  } catch (error) {
    console.error('[Analytics] Error:', error);
    reply.code(500).send({ error: 'Failed to retrieve analytics' });
  }
});

// Chat statistics endpoint
fastify.get('/api/chat/stats', async () => {
  return chatService.getStats();
});

// Catch-all 404 handler with proper error handling and logging
fastify.setNotFoundHandler((request, reply) => {
  // Log 404s for debugging (helps identify broken URLs)
  console.log(`[404] ${request.method} ${request.url} - Referrer: ${request.headers.referer || 'none'}`);

  // Only serve SPA for browser requests (not API calls)
  if (request.headers.accept && request.headers.accept.includes('text/html')) {
    if (process.env.NODE_ENV === 'production') {
      try {
        reply.sendFile('index.html');
      } catch (error) {
        console.error('[NotFound] Failed to send index.html:', error);
        reply.code(404).send({ error: 'Not Found' });
      }
    } else {
      reply.code(404).send({ error: 'Not Found - Dev Mode' });
    }
  } else {
    // API requests - return JSON 404
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} does not exist`
    });
  }
});

// Start server
const start = async () => {
  try {
    // Initialize database analytics if DATABASE_URL is set
    if (useDatabase) {
      await initAnalyticsDB();
    }

    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 AI Platforms Directory running on port ${port}`);

    // Start Telegram bot ONLY if explicitly enabled (prevents conflicts)
    // This should ONLY be enabled in the worker service, NOT main service
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.ENABLE_TELEGRAM_BOT === 'true') {
      try {
        await import('./telegram-bot.js');
        console.log('🤖 Telegram bot started');
      } catch (botError) {
        console.error('Failed to start Telegram bot:', botError.message);
      }
    } else if (process.env.TELEGRAM_BOT_TOKEN) {
      console.log('ℹ️  TELEGRAM_BOT_TOKEN present but ENABLE_TELEGRAM_BOT not set to true - bot not started');
    } else {
      console.log('ℹ️  TELEGRAM_BOT_TOKEN not set, bot not started');
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
