import Fastify from 'fastify';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';

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
  const { category, search, featured, limit = 50, offset = 0 } = request.query;

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

// Stats endpoint
fastify.get('/api/stats', async () => {
  return {
    total: platforms.length,
    featured: platforms.filter(p => p.featured).length,
    verified: platforms.filter(p => p.verified).length,
    categories: new Set(platforms.map(p => p.category)).size
  };
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
fastify.post('/api/submit-tool', async (request, reply) => {
  const submission = request.body;

  // Log submission
  console.log('[Submission] New tool submission:', {
    name: submission.name,
    website: submission.website,
    category: submission.category,
    totalPrice: submission.totalPrice,
  });

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
