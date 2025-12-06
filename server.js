import Fastify from 'fastify';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';
import satori from 'satori';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({ logger: true });

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

// CORS for development
fastify.register(import('@fastify/cors'), {
  origin: true
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  fastify.register(import('@fastify/static'), {
    root: join(__dirname, 'dist'),
    prefix: '/'
  });
}

// API Routes
fastify.get('/api/platforms', async (request, reply) => {
  const { category, search, featured, limit = 1000, offset = 0 } = request.query;

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
  const { slug } = request.params;
  const platform = platforms.find(p => p.slug === slug || p.id === slug);

  if (!platform) {
    reply.code(404).send({ error: 'Platform not found' });
    return;
  }

  return platform;
});

// Get categories
fastify.get('/api/categories', async () => {
  const categoryMap = new Map();

  platforms.forEach(platform => {
    const cat = platform.category || 'uncategorized';
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

  return Array.from(categoryMap.values())
    .sort((a, b) => b.count - a.count);
});

// Get pillar content list
fastify.get('/api/pillar', async () => {
  return pillarContent.map(p => ({
    slug: p.slug,
    category: p.category,
    title: p.title,
    metaDescription: p.metaDescription
  }));
});

// Get single pillar page
fastify.get('/api/pillar/:slug', async (request, reply) => {
  const { slug } = request.params;
  const pillar = pillarContent.find(p => p.slug === slug);

  if (!pillar) {
    reply.code(404).send({ error: 'Pillar page not found' });
    return;
  }

  return pillar;
});

// Get comparison content list
fastify.get('/api/comparisons', async () => {
  return comparisonContent.map(c => ({
    slug: c.slug,
    title: c.title,
    metaDescription: c.metaDescription,
    platform1Slug: c.platform1Slug,
    platform2Slug: c.platform2Slug
  }));
});

// Get single comparison page
fastify.get('/api/comparisons/:slug', async (request, reply) => {
  const { slug } = request.params;
  const comparison = comparisonContent.find(c => c.slug === slug);

  if (!comparison) {
    reply.code(404).send({ error: 'Comparison not found' });
    return;
  }

  return comparison;
});

// Get alternatives content list
fastify.get('/api/alternatives', async () => {
  return alternativesContent.map(a => ({
    slug: a.slug,
    title: a.title,
    metaDescription: a.metaDescription,
    platformSlug: a.platformSlug
  }));
});

// Get single alternatives page
fastify.get('/api/alternatives/:slug', async (request, reply) => {
  const { slug } = request.params;
  const alternatives = alternativesContent.find(a => a.slug === slug);

  if (!alternatives) {
    reply.code(404).send({ error: 'Alternatives page not found' });
    return;
  }

  return alternatives;
});

// Get best-of content list
fastify.get('/api/best-of', async () => {
  return bestOfContent.map(b => ({
    slug: b.slug,
    title: b.title,
    metaDescription: b.metaDescription,
    category: b.category,
    totalPlatforms: b.totalPlatforms
  }));
});

// Get single best-of page
fastify.get('/api/best-of/:slug', async (request, reply) => {
  const { slug } = request.params;
  const bestOf = bestOfContent.find(b => b.slug === slug);

  if (!bestOf) {
    reply.code(404).send({ error: 'Best-of page not found' });
    return;
  }

  return bestOf;
});

// Stats endpoint
fastify.get('/api/stats', async () => {
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
                          type: 'div',
                          props: {
                            style: {
                              width: '60px',
                              height: '60px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                            },
                            children: '🤖',
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
    const slug = platform.id || platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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

  const robots = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow admin/private paths (if any)
Disallow: /api/
Disallow: /*.json$`;

  reply.type('text/plain').send(robots);
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', platforms: platforms.length };
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

// Serve React app for all other routes (SPA)
if (process.env.NODE_ENV === 'production') {
  fastify.setNotFoundHandler((request, reply) => {
    reply.sendFile('index.html');
  });
}

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 AI Platforms Directory running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
