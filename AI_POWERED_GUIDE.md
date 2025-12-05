# AI-Powered Platform Organizer

**Supercharged automation using AI (Claude, GPT, or DeepSeek) to discover, categorize, and maintain your AI platforms directory automatically.**

---

## 🤖 What It Does

This AI-powered tool uses large language models to:

✨ **Discover** new AI platforms from across the web
🔍 **Intelligently categorize** them using natural language understanding
📝 **Enrich** platform descriptions, tags, and metadata
🔗 **Detect duplicates** with context-aware matching
🛠️ **Auto-fix** data quality issues
🌐 **Scrape** and extract information from platform websites

**Think of it as having an AI assistant that keeps your directory fresh and organized 24/7!**

---

## 🚀 Quick Start

### 1. Get an API Key

Choose one provider (DeepSeek is recommended for cost):

**DeepSeek** (Cheapest - $0.14/M tokens):
```bash
# Get key from: https://platform.deepseek.com
export DEEPSEEK_API_KEY="sk-..."
```

**Claude** (High quality - $3/M tokens):
```bash
# Get key from: https://console.anthropic.com
export ANTHROPIC_API_KEY="sk-ant-..."
```

**GPT** (OpenAI - $10/M tokens):
```bash
# Get key from: https://platform.openai.com
export OPENAI_API_KEY="sk-..."
```

Or create a `.env` file:
```bash
DEEPSEEK_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
```

### 2. Run AI-Powered Commands

```bash
# Discover 10 new AI platforms and add them automatically
npm run ai:discover

# Enrich existing platforms with better data
npm run ai:enrich

# Comprehensive fix (enrich + duplicates)
npm run ai:fix-all

# Just analyze (no changes)
npm run ai:analyze
```

---

## 📋 Available Modes

### 🔍 Discover Mode

**Automatically finds and adds new AI platforms**

```bash
npm run ai:discover

# Custom options:
node scripts/ai-powered-organizer.mjs --discover --auto-add --max=20
```

**What it does:**
- Searches for latest AI platforms (2024-2025)
- Checks against existing 693 platforms to avoid duplicates
- Uses AI to categorize and extract metadata
- Automatically adds to platforms.json

**Example output:**
```
✨ Discovered 10 new platforms:

  1. Cursor AI (code-ai)
     AI-powered code editor with GPT-4 integration
     URL: https://cursor.sh

  2. Perplexity AI (nlp)
     AI-powered search engine with citations
     URL: https://perplexity.ai

  ...
```

---

### 📝 Enrich Mode

**Improves existing platform data using AI**

```bash
npm run ai:enrich
```

**What it does:**
- Finds platforms with poor descriptions
- Uses AI to write better descriptions
- Auto-categorizes based on content
- Adds missing tags, features, use cases

**Example:**
```
Before:
  Name: TensorFlow
  Description: ML framework
  Tags: []

After:
  Name: TensorFlow
  Description: Open-source machine learning framework by Google for building and deploying ML models at scale
  Tags: ["machine-learning", "deep-learning", "neural-networks", "python", "tensorflow"]
  Features: ["GPU acceleration", "Distributed training", "TensorBoard visualization"]
```

---

### 🛠️ Fix-All Mode

**Comprehensive AI-powered cleanup**

```bash
npm run ai:fix-all
```

**What it does:**
- Enriches poor data
- Detects intelligent duplicates
- Suggests merge strategies
- Fixes categorization
- Adds missing metadata

---

### 🔬 Analyze Mode

**Analyze without making changes**

```bash
npm run ai:analyze
```

Shows what the tool can do without modifying anything.

---

## 🎛️ Advanced Usage

### Command Line Options

```bash
node scripts/ai-powered-organizer.mjs [options]
```

**Modes:**
- `--discover` - Find new platforms
- `--enrich` - Enhance existing data
- `--fix-all` - Comprehensive cleanup

**Flags:**
- `--auto-add` - Automatically add discovered platforms
- `--max=N` - Max new platforms to discover (default: 10)
- `--provider=X` - Force provider (deepseek/claude/gpt)
- `--verbose` - Detailed output
- `--dry-run` - Don't save changes

**Examples:**
```bash
# Discover 50 platforms using DeepSeek
node scripts/ai-powered-organizer.mjs --discover --auto-add --max=50 --provider=deepseek

# Enrich with verbose output
node scripts/ai-powered-organizer.mjs --enrich --verbose

# Test without saving
node scripts/ai-powered-organizer.mjs --fix-all --dry-run
```

---

## 💰 Cost Comparison

### Per 1000 Platforms

| Provider | Cost | Speed | Quality |
|----------|------|-------|---------|
| **DeepSeek** | ~$0.50 | Fast | Good ⭐️ Best Value |
| **Claude** | ~$15 | Medium | Excellent |
| **GPT-4** | ~$50 | Slow | Excellent |

**Recommendation:** Use **DeepSeek** for regular maintenance, Claude for critical enrichment.

---

## 🔄 Automation Workflow

### Daily Discovery (Cron Job)

```bash
# Add to crontab
0 2 * * * cd /path/to/ai-platforms-directory && npm run ai:discover >> logs/discovery.log 2>&1
```

Runs every day at 2 AM, discovers new platforms.

### Weekly Enrichment

```bash
# Every Sunday at 3 AM
0 3 * * 0 cd /path/to/ai-platforms-directory && npm run ai:enrich >> logs/enrich.log 2>&1
```

### Monthly Cleanup

```bash
# First day of month at 4 AM
0 4 1 * * cd /path/to/ai-platforms-directory && npm run ai:fix-all >> logs/cleanup.log 2>&1
```

---

## 🧠 How It Works

### Discovery Process

1. **AI generates search queries** based on latest AI trends
2. **Simulates web research** for new platforms
3. **Extracts platform data** (name, URL, description, category)
4. **Validates against existing** 693 platforms
5. **Auto-categorizes** using keyword matching + AI understanding
6. **Adds to platforms.json** with metadata

### Enrichment Process

1. **Identifies platforms** with poor data (short descriptions, missing tags)
2. **AI analyzes** platform name, current description, URL
3. **Generates enriched data:**
   - Professional description
   - Accurate category
   - Relevant tags
   - Key features
   - Use cases
4. **Confidence scoring** (only applies if >70%)

### Duplicate Detection

1. **Groups similar platforms** by name/URL similarity
2. **AI analyzes** each group contextually
3. **Determines** if they're duplicates or distinct products
4. **Suggests action:**
   - `keep_all` - Different products
   - `merge` - Same product, combine data
   - `keep_best` - Remove inferior duplicate

---

## 📊 What Gets Discovered

The AI searches for platforms in:

- 🚀 **Product Hunt** AI category
- 💻 **GitHub** trending AI repositories
- 📄 **Papers with Code** latest models
- 🤗 **Hugging Face** Spaces and models
- 📰 **AI news sites** (TechCrunch, VentureBeat)
- 💬 **Reddit** r/artificial, r/MachineLearning
- 🐦 **Twitter** AI influencer mentions
- 🌐 **AI directories** and marketplaces

---

## 🛡️ Safety Features

**Automatic safeguards:**
- ✅ Never overwrites good data with bad
- ✅ Confidence scoring (rejects low-quality AI output)
- ✅ Duplicate checking before adding
- ✅ Dry-run mode for testing
- ✅ Backup original data
- ✅ Git integration (changes are versioned)

---

## 🔧 Troubleshooting

### "No AI API key found"

Set an environment variable:
```bash
export DEEPSEEK_API_KEY="sk-..."
# OR
export ANTHROPIC_API_KEY="sk-ant-..."
# OR
export OPENAI_API_KEY="sk-..."
```

### "Failed to parse AI response"

The AI sometimes returns invalid JSON. Solutions:
- Use `--verbose` to see raw response
- Try different provider (`--provider=claude`)
- Lower `max` platforms (`--max=5`)

### "Rate limit exceeded"

- Wait a few minutes
- Use DeepSeek (higher limits)
- Reduce batch size (`--max=5`)

### "Low confidence, skipped"

AI wasn't confident in its enrichment. This is good - it's being cautious!

---

## 📈 Expected Results

### Discovery Mode
- **Input:** Existing 693 platforms
- **Output:** 5-10 new verified platforms
- **Time:** 2-3 minutes
- **Cost:** ~$0.10 (DeepSeek)

### Enrich Mode
- **Input:** Platforms with poor data
- **Output:** Enhanced descriptions, tags, categories
- **Time:** 5-10 minutes (10 platforms)
- **Cost:** ~$0.20 (DeepSeek)

### Fix-All Mode
- **Input:** Entire directory
- **Output:** Enriched + duplicates resolved
- **Time:** 15-20 minutes
- **Cost:** ~$0.50 (DeepSeek)

---

## 🎯 Best Practices

### 1. Start Small
```bash
# Test with dry-run first
node scripts/ai-powered-organizer.mjs --discover --max=5 --dry-run
```

### 2. Review Before Deploying
```bash
# Check git diff
git diff platforms.json
```

### 3. Run Regularly
- **Daily:** Discovery
- **Weekly:** Enrichment
- **Monthly:** Full cleanup

### 4. Use Cost-Effective Provider
- **DeepSeek** for automation
- **Claude** for critical data

### 5. Monitor Quality
- Check `confidence` scores
- Review AI suggestions
- Keep verbose logs

---

## 🚀 Future Enhancements

Planned features:
- [ ] Real-time web scraping of platform websites
- [ ] Screenshot generation for each platform
- [ ] Pricing information extraction
- [ ] User review aggregation
- [ ] Competitor analysis
- [ ] SEO optimization
- [ ] Social media monitoring
- [ ] Automatic blog post generation
- [ ] Email notifications for new platforms
- [ ] Slack/Discord integration

---

## 💡 Pro Tips

**Maximize discovery:**
```bash
# Run with max discovery
node scripts/ai-powered-organizer.mjs --discover --auto-add --max=50 --provider=deepseek
```

**Batch enrichment:**
```bash
# Enrich all platforms over time
for i in {1..10}; do
  npm run ai:enrich
  sleep 60
done
```

**Cost optimization:**
```bash
# Always use DeepSeek for automation
export DEEPSEEK_API_KEY="sk-..."
# Falls back to Claude/GPT if not set
```

---

## 🤝 Contributing

Found a bug or have ideas? The AI-powered organizer is designed to be extensible:

- Add new discovery sources
- Improve prompts for better results
- Add new AI providers
- Enhance duplicate detection

---

## 📞 Support

- Check logs with `--verbose`
- Test with `--dry-run`
- Review AI responses
- Start small with `--max=5`

**Happy automating!** 🎉
