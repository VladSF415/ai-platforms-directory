# AI Platforms Directory

Discover 693+ curated AI tools and platforms.

## Features
- 693 AI platforms across 52 categories
- Full-text search
- Category filtering
- Featured platforms
- Ratings and reviews
- Direct links to platforms

## Quick Start

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/platforms` - List all platforms (with filtering)
- `GET /api/platforms/:slug` - Get single platform
- `GET /api/categories` - List all categories
- `GET /api/stats` - Get statistics

## Deploy to Railway

This app is ready to deploy to Railway:

1. Push to GitHub
2. Create new service in Railway
3. Connect to GitHub repo
4. Deploy!

Environment variables:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (production/development)
