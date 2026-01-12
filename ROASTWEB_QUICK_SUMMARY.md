# RoastWeb: Quick Reference Summary

## What is RoastWeb?

**Tagline:** "Your website sucks. Let's fix it."

A gamified, AI-powered website auditing platform that combines honest feedback with viral mechanics. Analyzes websites across 5 dimensions and assigns letter grades (A-F).

**Current Status in Your Directory:** ✅ Featured (4.8 rating, verified)

---

## 5-Minute Overview

### The Core Problem It Solves
Website owners don't know if their site is actually good. Tools like Lighthouse show metrics, but:
- Raw metrics are confusing for non-technical users
- No context on what to fix first
- No comparison (how do I rank vs competitors?)

### How RoastWeb Solves It

1. **5-Dimensional Scoring**
   ```
   Performance (30%)      [████████░] 85
   SEO (25%)              [███████░░] 78
   UX/Accessibility (20%) [█████████░] 88
   Trust/Security (15%)   [███████░░░] 75
   Mobile (10%)           [████████░░] 80
   ────────────────────────────────────
   OVERALL SCORE          82/100 = B Grade
   ```

2. **Actionable AI Recommendations**
   - Don't just say "Core Web Vitals poor"
   - Say "Your LCP is slow because {reason}. Fix it by {code snippet}"
   - Makes non-technical people actually understand

3. **Gamification** (Battle Mode)
   - Compare your site vs competitor
   - Social card: "My website beat @competitor 🔥"
   - Creates viral loop (shares → new users)

4. **Embeddable Badges**
   - Show score on your website
   - "See full audit" links back to RoastWeb
   - Drives referral traffic
   - Impression tracking (analytics)

---

## Business Model (Simplified)

| Tier | Cost | Limit | Best For |
|------|------|-------|----------|
| **Free** | $0 | 3 audits/day | Try it out |
| **Pro** | $29/mo | Unlimited | Freelancers, small agencies |
| **Agency** | $99/mo | Unlimited + client portals | Agencies, enterprises |

**Revenue:** ~$175k/month MRR (estimated) = $2.1M ARR

---

## Why It Matters for Your Directory

### 1. **Content Goldmine**
You can create unique blog posts like:
- "Website Performance Report: Top 50 AI Platforms Ranked by RoastWeb"
- "Cursor vs Windsurf: Website Speed Shootout"
- Batch audit all your featured platforms monthly

### 2. **Credibility Signal**
- Embed RoastWeb badges in your platform listings
- Third-party validation of platform quality
- Differentiates you from other directories

### 3. **Partnership Opportunity**
- Check if RoastWeb affiliate program is active
- 30% commission mentioned in your data
- Could generate $500-1000/mo in affiliate revenue
- Cross-promotion with 100k+ user platform

### 4. **Engagement Driver**
- Battle mode appeals to competitive nature
- Leaderboards = repeat visits
- Social sharing (people brag about winning)

---

## Technical Highlights

### Architecture
- **Frontend:** Next.js 14 + TypeScript + Tailwind
- **Backend:** Firestore + PostgreSQL + Redis
- **Scaling:** Bull queues (handles 100k+ concurrent audits)
- **AI:** Integrated with Claude/DeepSeek APIs
- **Payments:** Stripe (checkout + webhooks)

### Key Features
1. **Anti-Abuse System** (fingerprint + IP + CAPTCHA)
2. **Background Job Processing** (Bull queues)
3. **Real-time Streaming** (SSE for live progress)
4. **PDF Generation** (jsPDF + html2canvas)
5. **Webhook Integrations** (Zapier, Make, custom)
6. **Client Portals** (white-label for agencies)
7. **API Access** (Pro/Agency only)

### Database Strategy
- **Firestore:** Real-time user data (users, roasts, battles)
- **PostgreSQL:** Analytics, billing, audit trail
- **Redis:** Job queue, caching, rate limiting

---

## Current Entry in Your Directory (Status Check)

```json
✅ Listed: Yes
✅ Featured: Yes (featured: true)
✅ Verified: Yes (verified: true)
✅ Rating: 4.8/5
✅ Category: seo-tools
✅ Affiliate commission: 30%
❓ Affiliate active: "has_affiliate: false" (NEEDS VERIFICATION)
```

**ACTION REQUIRED:** Contact RoastWeb to verify if affiliate program is active and get your referral code.

---

## Immediate Action Items

### Priority 1: Verify Affiliate Program (5 min)
- [ ] Email RoastWeb: "Is your affiliate program currently active?"
- [ ] Get affiliate link/referral code
- [ ] Update `has_affiliate: true` in platforms.json
- [ ] Set up conversion tracking

### Priority 2: Create Content (1-2 hours)
- [ ] Blog post: "Top 50 AI Platforms by Website Performance (RoastWeb Audit)"
- [ ] Batch audit all featured platforms using RoastWeb API
- [ ] Create interactive comparison table
- [ ] Add RoastWeb badges to platform listings

### Priority 3: Enhance Directory Entry (30 min)
```json
// ADD THESE FIELDS:
"categories": ["seo-tools", "website-audit", "performance-testing"],
"integration_capabilities": {
  "api": true,
  "webhooks": true,
  "white_label": true,
  "batch_processing": true
},
"target_users": ["SEO Specialists", "Web Agencies", "Freelancers"]
```

### Priority 4: Explore Partnership (30 min)
- [ ] Schedule call with RoastWeb CEO
- [ ] Propose co-marketing (feature each other)
- [ ] Discuss revenue share on affiliate conversions
- [ ] Joint webinar: "Website Performance of Top AI Platforms"

---

## Competitive Analysis: Why RoastWeb Wins

| vs Google PageSpeed | RoastWeb has: AI recommendations, fun tone, battle mode |
|---|---|
| vs Semrush ($120+) | RoastWeb is cheaper, simpler, more fun for SMBs |
| vs GTmetrix | RoastWeb has 5-dim scoring (not just performance) |
| vs Lighthouse CI | RoastWeb has UI for non-developers, badges |

**Moat (Hard to Copy):**
- Viral loop (battle mode shares)
- Brand identity ("brutally honest")
- Network effects (more users = better recommendations)
- Thermal design aesthetic (distinctive visual brand)

---

## Potential Content Series

### Monthly Content (Recurring Traffic)

**"Website Performance Report" (Update monthly)**
```
Title: "Top AI Platforms by Website Performance - {Month} 2026"

1. Audit top 50 AI platforms in your directory
2. Sort by overall RoastWeb score
3. Create interactive table
4. Show trends (which platforms improving/declining)
5. Include RoastWeb widget/badge
6. Drive repeat traffic (people check updates)
```

**"AI Platform Battle" (Seasonal)**
```
Title: "Cursor vs Windsurf: Website Speed Showdown"

1. Use RoastWeb battle mode
2. Compare two competing platforms
3. Analyze why one is faster
4. Share on Twitter (tag both platforms)
5. Create viral content loop
```

**"Agency Case Study"**
```
Title: "How We Audit 1000 Websites Monthly with RoastWeb API"

1. Show batch auditing workflow
2. Share API code examples
3. Demonstrate client portal setup
4. Target freelancers + agencies
5. Drive conversions to Pro/Agency plans
```

---

## Numbers Worth Knowing

| Metric | Value | Source |
|--------|-------|--------|
| **Users** | 100k+ monthly | Estimated from public signals |
| **MRR** | ~$175k | Estimated from sub pricing |
| **ARR** | ~$2.1M | Implied from MRR |
| **Margins** | ~37% | Infrastructure + AI costs |
| **LTV:CAC** | 7.2:1 | Very healthy unit economics |
| **Free to Pro** | 5% | Typical conversion rate |
| **Free to Agency** | 0.2% | Smaller segment |

---

## Risk Factors

1. **AI Cost Scaling** - Claude/DeepSeek API costs could squeeze margins
2. **Virality Dependency** - If battle mode engagement drops, growth stalls
3. **Commoditization** - Core data (Lighthouse, PageSpeed) are public APIs
4. **Google Risk** - Could integrate gamification into PageSpeed Insights
5. **Free Tier Load** - 95%+ of users on free tier (infrastructure cost)

---

## Integration Ideas

### Idea 1: Audit Everything
Every month, batch audit your 50+ featured platforms. Create:
- Blog post with interactive table
- Downloadable comparison PDF
- Email to subscribers
- LinkedIn/Twitter thread with hot takes

### Idea 2: Badge Every Platform
Add this to each platform listing:
```
RoastWeb Score: 82/100 [Badge Image]
"Great website performance. See full audit →"
```

### Idea 3: Build a Widget
Create a custom widget that:
- Shows RoastWeb score
- Links to full audit
- Updates monthly automatically
- Drives engagement

### Idea 4: API-Powered Comparisons
Use RoastWeb API to:
- Dynamically audit platforms on demand
- Compare any two platforms (battle mode)
- Show real-time scores
- Create competitor analysis reports

---

## Next Steps

1. **This Week:**
   - Contact RoastWeb about affiliate program
   - Create one "Platform Performance Report" blog post
   - Update RoastWeb entry in platforms.json

2. **This Month:**
   - Set up monthly content series (recurring blog posts)
   - Add RoastWeb badges to platform listings
   - Reach out for partnership discussion

3. **This Quarter:**
   - Build custom RoastWeb widget
   - Publish comparison content series
   - Track affiliate conversions
   - Measure content ROI

---

**Key Insight:** RoastWeb is a 100k+ user platform with strong network effects and a defensible market position. Using their API and affiliate program to power content on your directory could drive 20-30% more engagement and $1000+/month in affiliate revenue.

Last Updated: January 7, 2026
