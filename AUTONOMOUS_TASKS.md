# Autonomous Task Suite - AI Platforms Directory

Complete automation suite powered by DeepSeek AI for autonomous directory management.

## 🚀 Quick Start

```bash
# 1. Set DeepSeek API key
export DEEPSEEK_API_KEY="sk-..."

# 2. Run master orchestrator (runs all tasks intelligently)
node scripts/autonomous-orchestrator.mjs

# Or run individual tasks
node scripts/affiliate-hunter.mjs
node scripts/data-enrichment.mjs --max=20
node scripts/blog-generator.mjs --num=3 --type=category
node scripts/platform-health-check.mjs
node scripts/seo-meta-generator.mjs --max=100
```

## 📋 Available Autonomous Tasks

### 1. **Platform Discovery** (Daily)
**Script:** `ai-powered-organizer.mjs --discover --auto-add --max=10`

**What it does:**
- Discovers 10 new AI platforms per run
- Checks for duplicates (name + URL-based)
- Auto-categorizes and adds to directory
- Prioritizes platforms with affiliate programs

**Frequency:** Daily
**Cost:** ~$0.05 per run (DeepSeek)

**Run manually:**
```bash
node scripts/ai-powered-organizer.mjs --discover --auto-add --max=10 --provider=deepseek
```

---

### 2. **Data Enrichment Pipeline** (Daily)
**Script:** `data-enrichment.mjs --max=20`

**What it does:**
- Finds platforms with incomplete data
- Enriches: pricing, features, use cases, target audience
- Prioritizes featured platforms
- Calculates completeness scores

**Frequency:** Daily (20 platforms/day)
**Cost:** ~$0.10 per run

**Run manually:**
```bash
node scripts/data-enrichment.mjs --max=20
```

**Output:**
- Updates `platforms.json` with enriched data
- Improves platform completeness by ~30-50%

---

### 3. **Affiliate Program Hunter** (Weekly)
**Script:** `affiliate-hunter.mjs`

**What it does:**
- Scans all platforms for affiliate/referral programs
- Extracts commission rates, networks, cookie duration
- Identifies high-value monetization opportunities
- Generates detailed opportunity report

**Frequency:** Weekly
**Cost:** ~$2.00 per full scan (729 platforms)

**Run manually:**
```bash
node scripts/affiliate-hunter.mjs
```

**Output:**
- `affiliate-opportunities.json` - Full data
- `AFFILIATE_OPPORTUNITIES.md` - Human-readable report
- Updates `platforms.json` with `has_affiliate` field

**Expected Results:**
- Find 100-200 platforms with affiliate programs
- Identify 20-30 high-value opportunities ($50+ commission)

---

### 4. **Blog Post Generator** (Weekly)
**Script:** `blog-generator.mjs`

**What it does:**
- Auto-generates SEO-optimized blog posts
- Category guides: "Best X Tools in 2025"
- Comparison posts: "Platform A vs B"
- 2000-2500 word comprehensive articles

**Frequency:** Weekly (2-3 posts)
**Cost:** ~$0.15 per blog post

**Run manually:**
```bash
# Generate category guides
node scripts/blog-generator.mjs --num=3 --type=category

# Generate comparison posts
node scripts/blog-generator.mjs --num=2 --type=comparison
```

**Output:**
- Markdown files in `blog-posts/` directory
- Ready to publish content
- SEO-optimized with keywords, headers, meta tags

---

### 5. **Platform Health Monitor** (Daily)
**Script:** `platform-health-check.mjs`

**What it does:**
- Checks URL availability (404s, dead links)
- Detects redirects and shutdowns
- Monitors server errors
- Flags problematic platforms

**Frequency:** Daily
**Cost:** Free (HTTP requests only)

**Run manually:**
```bash
# Check top 100 platforms
node scripts/platform-health-check.mjs

# Check ALL platforms
node scripts/platform-health-check.mjs --all
```

**Output:**
- `platform-health-report.json` - Full health data
- Updates `platforms.json` with `health_status` field
- Lists dead platforms for removal

---

### 6. **SEO Meta Generator** (Weekly)
**Script:** `seo-meta-generator.mjs`

**What it does:**
- Generates optimized meta titles & descriptions
- Creates Open Graph tags for social sharing
- Generates Twitter Card data
- Schema.org structured data

**Frequency:** Weekly (100 platforms)
**Cost:** ~$0.20 per run

**Run manually:**
```bash
node scripts/seo-meta-generator.mjs --max=100
```

**Output:**
- Updates `platforms.json` with `seo_metadata`
- `seo-metadata.json` - Full SEO data export
- 155-char meta descriptions
- Social media optimized titles

---

### 7. **Smart Recategorization** (Weekly)
**Script:** `ai-powered-organizer.mjs --recategorize`

**What it does:**
- Analyzes platform features vs current category
- Suggests better categorization
- Identifies emerging categories
- Fixes miscategorized platforms

**Frequency:** Weekly (30 platforms)
**Cost:** ~$0.10 per run

**Run manually:**
```bash
node scripts/ai-powered-organizer.mjs --recategorize --recat-max=30 --provider=deepseek
```

---

## 🤖 Master Orchestrator

The **Autonomous Orchestrator** runs all tasks on the optimal schedule and auto-deploys changes.

**Script:** `autonomous-orchestrator.mjs`

**What it does:**
- Runs tasks based on frequency (daily/weekly)
- Tracks last run time (no duplicate runs)
- Logs all activities
- Auto-commits and pushes to GitHub
- Triggers Railway auto-deployment

**Schedule:**
```
Daily:
  - Platform Discovery (10 new platforms)
  - Data Enrichment (20 platforms)
  - Health Check (all platforms)

Weekly:
  - Affiliate Hunter (full scan)
  - Blog Generator (2-3 posts)
  - SEO Meta Generator (100 platforms)
  - Smart Recategorization (30 platforms)
```

**Run manually:**
```bash
node scripts/autonomous-orchestrator.mjs
```

**Logs:**
- `.autonomous-state.json` - Execution state
- `autonomous-runs.log` - Full activity log

---

## ⏰ Scheduling (Production Setup)

### Windows (Task Scheduler)

```powershell
# Create daily task
schtasks /create /tn "AI Directory - Autonomous Tasks" /tr "node C:\path\to\scripts\autonomous-orchestrator.mjs" /sc daily /st 03:00

# Or use this PowerShell script
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\Users\geras\OneDrive\Desktop\AI PLATFORMS LIST 2025\ai-platforms-directory\scripts\autonomous-orchestrator.mjs"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "AI Directory Autonomous"
```

### Linux/Mac (Cron)

```bash
# Edit crontab
crontab -e

# Add daily run at 3 AM
0 3 * * * cd /path/to/ai-platforms-directory && node scripts/autonomous-orchestrator.mjs >> logs/autonomous.log 2>&1
```

### GitHub Actions (Cloud)

Create `.github/workflows/autonomous.yml`:

```yaml
name: Autonomous Tasks
on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  run-autonomous:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - name: Run Orchestrator
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
        run: node scripts/autonomous-orchestrator.mjs
      - name: Commit changes
        run: |
          git config user.name "Autonomous Bot"
          git config user.email "bot@aiplatformslist.com"
          git add .
          git commit -m "Autonomous update [skip ci]" || echo "No changes"
          git push
```

---

## 💰 Cost Breakdown

**DeepSeek Pricing:** $0.14 per 1M input tokens, $0.28 per 1M output tokens

**Daily Costs:**
- Platform Discovery (10 platforms): $0.05
- Data Enrichment (20 platforms): $0.10
- Health Check: Free
- **Daily Total:** ~$0.15/day ($4.50/month)

**Weekly Costs:**
- Affiliate Hunter (full scan): $2.00
- Blog Generator (3 posts): $0.45
- SEO Meta Generator (100 platforms): $0.20
- Recategorization (30 platforms): $0.10
- **Weekly Total:** ~$2.75/week ($11/month)

**Monthly Total:** ~$15-20/month

**Compare to manual work:**
- Discovering 300 platforms/month: 20 hours ($400 at $20/hr)
- Enriching 600 platforms: 40 hours ($800)
- Writing 12 blog posts: 24 hours ($480)
- **Total manual cost:** $1,680/month
- **Savings:** $1,660/month (99% cost reduction)

---

## 📊 Expected Results (30 Days)

**Growth:**
- +300 new platforms discovered
- +600 platforms enriched
- +12 SEO blog posts published
- +100-200 affiliate programs identified

**Quality:**
- 80%+ platform completeness
- 100% URL health verified
- Full SEO metadata for all platforms

**Revenue:**
- 100+ affiliate partnerships
- 20-30 high-value opportunities
- $5,000-$15,000/month potential (at scale)

---

## 🔧 Configuration

Edit `autonomous-orchestrator.mjs` to customize:

```javascript
tasks: {
  discover: {
    frequency: 'daily',  // Change to 'hourly', 'daily', 'weekly'
    enabled: true,       // Set to false to disable
    args: '--max=10'     // Adjust parameters
  },
  // ... other tasks
}
```

---

## 🛠️ Troubleshooting

**API Rate Limits:**
```bash
# Reduce frequency or batch size
node scripts/data-enrichment.mjs --max=10  # Instead of 20
```

**Failed Tasks:**
Check logs:
```bash
cat autonomous-runs.log
cat .autonomous-state.json
```

**Manual Intervention:**
Disable orchestrator, run tasks individually:
```bash
node scripts/affiliate-hunter.mjs --verbose
```

---

## 🎯 Best Practices

1. **Start Small:** Run orchestrator manually for first week
2. **Monitor Logs:** Check `autonomous-runs.log` daily
3. **Review Changes:** Inspect git commits before merging
4. **Adjust Frequencies:** Based on your needs and budget
5. **Test Dry Runs:** Use `--dry-run` flag before production

---

## 🔐 Security

**API Keys:**
- Never commit API keys to git
- Use environment variables
- Rotate keys monthly

**Git Automation:**
- Review auto-commits weekly
- Use branch protection
- Enable PR reviews for production

---

## 📈 Monitoring & Analytics

**Track Performance:**
```bash
# View orchestrator stats
cat .autonomous-state.json

# Check platform growth
node -e "console.log(require('./platforms.json').length)"

# View recent logs
tail -100 autonomous-runs.log
```

---

## 🎉 Success Metrics

**Week 1:**
- 70 new platforms added
- 140 platforms enriched
- 3 blog posts published

**Month 1:**
- 300 new platforms
- 600 platforms enriched
- 12 blog posts published
- 150 affiliate programs found

**Month 3:**
- 1000+ platforms total
- 90%+ data completeness
- 50 blog posts
- Active monetization from affiliates

---

## Support

For issues or questions:
- Check logs: `autonomous-runs.log`
- Review state: `.autonomous-state.json`
- Manual run with `--verbose` flag
- Contact: support@aiplatformslist.com
