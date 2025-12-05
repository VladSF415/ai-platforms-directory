# AI Platforms Directory

🚀 **Live Site:** https://ai-platforms-directory-production.up.railway.app
📊 **693+ Curated AI Tools & Platforms**
💰 **Revenue Potential:** $10k+/month

## Overview

A monetized directory of AI tools and platforms with:
- **693 curated platforms** across 9 categories
- **Affiliate link tracking** for commission earnings
- **Paid tool submissions** ($49/submission)
- **Featured listing upgrades** ($99-$299/month)
- **Click analytics** for performance tracking

## Documentation

**📚 For Future Claude Sessions:**
- **[PROJECT_HISTORY.md](PROJECT_HISTORY.md)** - Complete project history and all work done
- **[DEPLOYMENT_WORKFLOW.md](DEPLOYMENT_WORKFLOW.md)** - How Claude handles deployments
- **[ANALYTICS_GUIDE.md](ANALYTICS_GUIDE.md)** - Google Analytics setup (G-87QJXFEQQD)
- **[PLATFORM_PAGES_GUIDE.md](PLATFORM_PAGES_GUIDE.md)** - Platform detail pages architecture
- **[MONETIZATION_GUIDE.md](MONETIZATION_GUIDE.md)** - Revenue features setup

**Start here:** Read [PROJECT_HISTORY.md](PROJECT_HISTORY.md) to understand everything that was built.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev         # Frontend (Vite)
node server.js      # API (Fastify)

# Build for production
npm run build
```

### Deployment (Railway)

Already deployed!
- **URL:** https://ai-platforms-directory-production.up.railway.app
- **Project:** AI Platforms Directory
- **Service ID:** a9bff8eb-2554-426b-9778-2a6eedd48425

## Monetization Features

See [MONETIZATION_GUIDE.md](MONETIZATION_GUIDE.md) for complete details.

### 1. Affiliate Links ✅
- Track every platform click
- Add affiliate URLs to platforms
- Earn commissions on conversions

### 2. Tool Submissions ($49) ✅
- `/submit` page with payment form
- Stripe integration ready (just add API keys)
- Review and approve new listings

### 3. Featured Listings ($99-299/month) ✅
- 3 pricing tiers (Basic, Premium, Enterprise)
- Recurring monthly subscriptions
- Premium placement and badges

## DNS Setup

To point `aiplatformslist.com` to Railway, add these DNS records:

**Root domain:**
```
Type: CNAME or ALIAS
Name: @
Value: ietj093u.up.railway.app
```

**WWW subdomain:**
```
Type: CNAME
Name: www
Value: 6bazfm7y.up.railway.app
```

## Revenue Potential

| Stream | Monthly |
|--------|---------|
| Affiliate Links | $6,930 |
| Submissions (20 × $49) | $980 |
| Featured Listings | $2,583 |
| **Total** | **$10,493/month** |

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Fastify (Node.js)
- **Hosting:** Railway
- **Payments:** Stripe (integration ready)
- **Data:** 693 platforms in JSON (migrate to PostgreSQL later)

## Pages

- `/` - Home directory with search & filters
- `/platform/:slug` - Individual platform detail pages (693 pages for SEO!)
- `/submit` - Tool submission form with payment

## API Endpoints

```
GET  /api/platforms       # List platforms
GET  /api/categories      # List categories
GET  /api/stats          # Statistics
POST /api/track-click    # Analytics
POST /api/submit-tool    # Submissions
```

## Next Steps

1. **Enable Payments:** Add Stripe API keys to Railway
2. **Configure Domain:** Update DNS to point aiplatformslist.com
3. **Add Affiliate Links:** Update platforms.json with affiliate URLs
4. **Launch Marketing:** Product Hunt, Reddit, Twitter
5. **Get Featured Customers:** Reach out to AI platforms

See [MONETIZATION_GUIDE.md](MONETIZATION_GUIDE.md) for detailed setup instructions!
