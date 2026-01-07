# Platform Auto-Organizer Tool

Automated tool to scan, clean, enrich, and organize your AI platforms directory.

## Features

✅ **Duplicate Detection** - Finds platforms with similar names/URLs
✅ **Category Validation** - Suggests better categorization based on content
✅ **Data Quality Checks** - Identifies missing descriptions, URLs, tags, etc.
✅ **Web Scraping** - Enriches platforms with better descriptions from their websites
✅ **Auto-Fix** - Automatically fixes common issues (slugs, URLs, etc.)
✅ **Detailed Reports** - Generates JSON reports for review

---

## Quick Start

### 1. Scan Only (No Changes)

```bash
npm run organize
```

This will:
- Scan for duplicates
- Check categorization
- Find data quality issues
- Generate a report (`organization-report.json`)
- **Does NOT modify platforms.json**

### 2. Scan + Auto-Fix

```bash
npm run organize:fix
```

This will:
- Everything from scan mode
- **Auto-fix common issues:**
  - Generate missing slugs
  - Normalize URL fields
  - Add empty arrays for missing tags/features
- **Saves changes to platforms.json**

### 3. Scan + Web Scraping + Auto-Fix

```bash
npm run organize:scrape
```

This will:
- Everything from auto-fix mode
- **Scrape websites** for better descriptions
- Limited to 50 platforms to avoid rate limits
- 1-second delay between requests
- **Saves enriched data to platforms.json**

### 4. Verbose Output

```bash
npm run organize:verbose
```

Shows detailed information about:
- Each duplicate group
- Individual data issues
- Enrichment details
- Failed scraping attempts

---

## What It Detects

### 1. Duplicates

Finds platforms with:
- **80%+ name similarity** (e.g., "Claude" vs "Claude AI")
- **Matching URLs** (e.g., both point to anthropic.com)

**Example output:**
```
🔴 Found 3 duplicate groups:

  Group 1:
    - Anthropic API (anthropic-api)
    - Anthropic Claude 3 (anthropic-claude-3)
    - Claude (claude)
```

### 2. Miscategorization

Suggests better categories based on:
- Platform name
- Description content
- Tags

**Example output:**
```
🟡 Found 15 potentially miscategorized platforms:

  GPT-4 Vision:
    Current: generative-ai
    Suggested: computer-vision (confidence: 4)
```

### 3. Data Quality Issues

Checks for:
- Missing/short descriptions (< 20 chars)
- Missing URLs
- Missing tags
- Missing pricing info
- Missing slugs
- Invalid categories

**Example output:**
```
📊 Data Quality Issues:

  missing_description: 23
  missing_url: 5
  missing_tags: 147
  missing_pricing: 89
  no_slug: 0
  invalid_category: 2
```

### 4. Web Enrichment

Scrapes platform websites for:
- Meta descriptions
- Open Graph descriptions
- Better platform information

**Example output:**
```
🌐 Enriched 12 platforms with better descriptions

  Midjourney:
    Old: AI art generator
    New: Midjourney is an independent research lab exploring new mediums of thought and expanding the imaginative powers of the human species.
```

---

## Auto-Fix Capabilities

When you run with `--fix` flag, it automatically:

### ✅ Generates Missing Slugs
```json
{
  "name": "GPT-4 Vision",
  "slug": "gpt-4-vision"  // Auto-generated
}
```

### ✅ Normalizes URL Fields
```json
{
  "url": "https://example.com",
  "website": "https://example.com"  // Synced
}
```

### ✅ Adds Empty Arrays
```json
{
  "tags": [],      // Added if missing
  "features": []   // Added if missing
}
```

---

## Report Files

### organization-report.json

Detailed JSON report containing:
```json
{
  "timestamp": "2025-12-05T03:00:00.000Z",
  "total_platforms": 693,
  "duplicates": [...],
  "miscategorized": [...],
  "data_issues": {...},
  "enriched": [...]
}
```

Use this for:
- Manual review of duplicates
- Categorization decisions
- Tracking data quality over time
- Auditing enrichment

---

## Advanced Usage

### Manual Command Line

```bash
# Scan only
node scripts/auto-organize.mjs

# With flags
node scripts/auto-organize.mjs --fix --verbose

# Web scraping + auto-fix
node scripts/auto-organize.mjs --scrape --fix

# All flags
node scripts/auto-organize.mjs --fix --scrape --verbose
```

### Flags

- `--fix` - Auto-fix common issues
- `--scrape` - Enrich from web (limited to 50 platforms)
- `--verbose` - Show detailed output

---

## Best Practices

### 1. Regular Scans

Run weekly to maintain data quality:
```bash
npm run organize
```

Review the report and manually fix critical issues.

### 2. Before Major Updates

Before adding many new platforms:
```bash
npm run organize:verbose
```

Check for existing duplicates to avoid adding more.

### 3. Enrichment Runs

Monthly web scraping to improve descriptions:
```bash
npm run organize:scrape
```

**Note:** Limited to 50 platforms per run to avoid rate limiting.

### 4. After Manual Edits

After manually editing platforms.json:
```bash
npm run organize:fix
```

Auto-fix any formatting issues you may have introduced.

---

## Configuration

Edit `scripts/auto-organize.mjs` to customize:

```javascript
const CONFIG = {
  similarity_threshold: 0.8,  // Duplicate detection sensitivity (0.8 = 80%)
  max_scrape: 50,             // Max platforms to scrape per run
  auto_fix: false,            // Auto-enable via --fix flag
  scrape_web: false,          // Auto-enable via --scrape flag
  verbose: false              // Auto-enable via --verbose flag
};
```

---

## Categories

Valid categories with keyword matching:

- `ml-frameworks` - TensorFlow, PyTorch, Keras, scikit-learn
- `generative-ai` - GPT, text generation, Stable Diffusion
- `computer-vision` - Image recognition, object detection, OCR
- `nlp` - Natural language processing, text analysis
- `llms` - Large language models (GPT, Claude, LLaMA)
- `image-generation` - AI art, DALL-E, Midjourney
- `analytics-bi` - Business intelligence, data visualization
- `code-ai` - Coding assistants, Copilot, code generation

Add more categories by editing the `CATEGORIES` constant in the script.

---

## Troubleshooting

### "No duplicates found" but I see duplicates

Lower the similarity threshold:
```javascript
similarity_threshold: 0.7,  // Lower = more sensitive
```

### Web scraping fails

- Check internet connection
- Some sites block automated requests
- Rate limiting (wait and try again)
- Use `--verbose` to see which sites failed

### Too many false positives

Increase similarity threshold:
```javascript
similarity_threshold: 0.9,  // Higher = stricter
```

---

## Integration with Workflow

### After Running Auto-Organizer

1. **Review the report:** Check `organization-report.json`
2. **Handle duplicates:** Manually merge or remove
3. **Fix miscategorization:** Update categories in platforms.json
4. **Commit changes:**
   ```bash
   git add platforms.json organization-report.json
   git commit -m "DATA: Auto-organize platforms"
   git push origin master
   ```
5. **Railway auto-deploys** your cleaned data

---

## Future Enhancements

Planned features:
- [ ] AI-powered categorization using GPT/Claude
- [ ] Automatic duplicate merging
- [ ] Screenshot generation for platforms
- [ ] Logo extraction from websites
- [ ] Pricing information extraction
- [ ] User review aggregation
- [ ] Affiliate link validation
- [ ] Dead link detection
- [ ] Competitor analysis

---

## Need Help?

- Check the console output for detailed error messages
- Use `--verbose` flag for debugging
- Review `organization-report.json` for insights
- Edit the script directly for custom behavior

**Happy organizing!** 🚀
