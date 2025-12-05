# 🤖 Autonomous AI Platform Discovery - Setup Guide

Your AI platform directory now runs **completely autonomously** using GitHub Actions + DeepSeek AI.

## 🎯 What It Does Automatically

Every day, the system will:
1. **Discover 40+ new platforms** (3 rounds of 15-20 each)
2. **Check for duplicates** (skips if already exists)
3. **Auto-categorize** (uses existing or creates new categories)
4. **Enrich 20 existing platforms** with detailed data:
   - Rich descriptions
   - Features lists
   - Use cases
   - Pricing details (tiers, models, starting prices)
   - Target audience
   - API availability
5. **Save affiliate opportunities** to separate file
6. **Auto-commit** to GitHub
7. **Auto-deploy** to Railway

## 🚀 Setup Steps

### Step 1: Add DeepSeek API Key to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `DEEPSEEK_API_KEY`
5. Value: `sk-3f65ad125d194f8d9dca1fef9b47e1d4`
6. Click **Add secret**

### Step 2: Enable GitHub Actions

1. Go to **Actions** tab in your repo
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. You should see **"AI Platform Auto-Discovery"** workflow

### Step 3: Run First Test (Manual)

1. Go to **Actions** tab
2. Click **AI Platform Auto-Discovery** workflow
3. Click **Run workflow** dropdown
4. Click the green **Run workflow** button
5. Watch it run! It will take 30-60 minutes

### Step 4: Review Results

After the workflow completes:
1. Check **Code** tab for new commits
2. Open `affiliate-opportunities.md` to see affiliate programs
3. Check Railway - it should auto-deploy

## ⏰ Schedule

**Runs automatically every day at 6:00 AM UTC**

To change the schedule, edit `.github/workflows/auto-discovery.yml`:
```yaml
schedule:
  - cron: '0 6 * * *'  # Change this (hour minute * * *)
```

Examples:
- `'0 0 * * *'` = Midnight UTC
- `'0 12 * * *'` = Noon UTC
- `'0 */6 * * *'` = Every 6 hours
- `'0 9 * * 1'` = Every Monday at 9 AM

## 📊 What Gets Saved

### `platforms.json`
Complete platform data with:
- Rich descriptions (2-3 sentences)
- Features (5-8 items)
- Use cases (4-6 items)
- Pricing details (tiers, models, starting price)
- Target audience
- API availability
- Affiliate flag (true/false)
- Categories (auto-created if needed)

### `affiliate-opportunities.md`
Separate file with:
- Affiliate program details
- Commission info
- Sign-up action checklist
- Program requirements

## 🎛️ Configuration

### Discovery Settings

Edit the workflow file to change:
```yaml
- name: Run AI Discovery (Round 1)
  run: |
    node scripts/ai-powered-organizer.mjs --discover --max=20 --auto-add --verbose
    #                                              Change ^^
```

### Enrichment Settings

In `scripts/ai-powered-organizer.mjs` line 479:
```javascript
.slice(0, 20); // Process 20 platforms per run
#          ^^ Change this number
```

## 💰 Cost Estimate

- **DeepSeek API**: $0.14 per 1M tokens
- **Per run**: ~20,000 tokens = $0.003 (less than 1 cent)
- **Daily**: $0.003/day
- **Your $5 credit**: Lasts ~4.5 years!

## 🔍 Monitoring

### View Workflow Runs
- GitHub → **Actions** tab → See all runs
- Click any run to see detailed logs

### Check for Errors
- Failed runs will show ❌ in Actions tab
- Click to see error logs
- Common issues:
  - API key invalid
  - Rate limiting (add more delays)
  - Network issues (auto-retries)

## 🛑 Pause/Disable

### Temporary Pause
Just disable the workflow:
1. Actions → AI Platform Auto-Discovery
2. Click "..." → Disable workflow

### Permanent Stop
Delete the workflow file:
```bash
rm .github/workflows/auto-discovery.yml
```

## 🎯 Manual Runs

You can run anytime locally:

```bash
# Discover new platforms
set DEEPSEEK_API_KEY=sk-3f65ad125d194f8d9dca1fef9b47e1d4
node scripts/ai-powered-organizer.mjs --discover --max=10 --auto-add

# Enrich existing platforms
node scripts/ai-powered-organizer.mjs --enrich --verbose

# Full analysis
node scripts/ai-powered-organizer.mjs --fix-all
```

## 📈 Expected Results

**Per day you should see:**
- 30-50 new platforms discovered
- 20 platforms enriched with full data
- 10-20 new affiliate opportunities
- 3-5 new categories created

**After 1 week:**
- ~300 new platforms
- Entire directory enriched with full data
- 100+ affiliate opportunities to monetize

**After 1 month:**
- ~1,200 new platforms
- Most comprehensive AI platform directory online!

## ✅ Success Indicators

You'll know it's working when:
- ✅ New commits appear daily in GitHub
- ✅ `affiliate-opportunities.md` keeps growing
- ✅ Platform count increases daily
- ✅ Railway auto-deploys after each commit
- ✅ No failed workflow runs in Actions tab

## 🆘 Troubleshooting

### "No new platforms discovered"
- Normal! Sometimes there aren't 20 new platforms
- System will enrich existing ones instead

### "Duplicate detected"
- Good! The system is working correctly
- It won't add the same platform twice

### "Low confidence, skipped"
- AI wasn't sure about the data
- Platform will be retried in next run

### Workflow failed
- Check Actions tab for error
- Usually API key or network issue
- Workflow will retry next day automatically

---

## 🎉 You're All Set!

Your AI platform directory is now **fully autonomous**. It will:
- Discover new platforms daily
- Keep all data fresh and accurate
- Find affiliate opportunities
- Deploy automatically

**Just check `affiliate-opportunities.md` weekly to sign up for new affiliate programs!**
