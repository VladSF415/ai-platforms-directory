# AI Platforms Directory - Custom Agents

This directory contains specialized AI agents designed to help maintain, optimize, and grow the AI Platforms Directory.

## Available Agents

### Content Creation & Optimization

#### 1. **Blog Post Generator** (`content/blog-post-generator.md`)
**Purpose**: Create comprehensive, SEO-optimized blog posts about AI platforms

**Use Cases:**
- Generate comparison articles (e.g., "Best AI Coding Tools 2025")
- Create platform reviews and guides
- Write category overview posts
- Produce hands-on testing articles

**Example Usage:**
```
Create a comprehensive blog post comparing the top 5 AI video generation tools:
- Runway Gen-4.5
- Synthesia
- Pika
- InVideo
- VEED

Target: 15-18 min read
Angle: Hands-on comparison by video producer
Include: Real performance metrics, ROI analysis, use case recommendations
```

**Output**: Complete JSON file for `blog-posts/` directory with E-E-A-T compliance

---

#### 2. **SEO Optimizer** (`content/seo-optimizer.md`)
**Purpose**: Optimize existing content for search engine rankings while maintaining quality

**Use Cases:**
- Audit blog posts for SEO opportunities
- Optimize platform pages for target keywords
- Improve meta tags and descriptions
- Enhance internal linking strategy
- Monitor Google Core Updates compliance

**Example Usage:**
```
Analyze and optimize our top 10 blog posts:
1. Review current rankings and traffic
2. Identify quick-win optimization opportunities
3. Ensure December 2025 Core Update compliance
4. Provide specific title/meta/content improvements
5. Recommend internal linking enhancements
```

**Output**: SEO audit report with specific optimizations and expected impact

---

### Research & Discovery

#### 3. **Trend Researcher** (`research/trend-researcher.md`)
**Purpose**: Discover new AI platforms and track industry trends

**Use Cases:**
- Daily monitoring of Product Hunt, Hacker News, Hugging Face
- Weekly deep dives into funding rounds and launches
- Monthly trend analysis and predictions
- Competitive intelligence gathering
- Content opportunity identification

**Example Usage:**
```
Conduct weekly AI platform discovery scan:
1. Check Product Hunt AI tools (last 7 days)
2. Review Hacker News "Show HN" posts
3. Scan recent Hugging Face model releases
4. Monitor AI funding announcements
5. Generate prioritized platform list for evaluation
```

**Output**: Discovery report with high/medium/low priority platforms

---

#### 4. **Tool Evaluator** (`research/tool-evaluator.md`)
**Purpose**: Systematically evaluate AI platforms before adding to directory

**Use Cases:**
- Assess new platform submissions
- Verify platform information accuracy
- Test core functionality (when possible)
- Generate complete platform entries
- Quality control for directory

**Example Usage:**
```
Evaluate this new platform for inclusion:
Platform: "CodeCompanion AI"
URL: https://codecompanion.ai
Category: Code assistance
Submitted by: User submission

Provide:
1. Complete evaluation report
2. Platform JSON entry (if approved)
3. Recommendation (Add/Reject/Needs Review)
4. Rationale
```

**Output**: Evaluation report + complete platform JSON entry

---

### Analytics & Reporting

#### 5. **Analytics Reporter** (`analytics/analytics-reporter.md`)
**Purpose**: Monitor website performance and provide actionable insights

**Use Cases:**
- Daily health checks (traffic, engagement, alerts)
- Weekly performance summaries
- Monthly strategic reports
- SEO performance tracking (Google Search Console)
- Content effectiveness analysis
- User behavior insights

**Example Usage:**
```
Generate monthly analytics report for December 2025:
1. Traffic analysis (sources, trends, year-over-year)
2. Content performance (top posts, platforms, categories)
3. Search Console insights (queries, positions, CTR)
4. User behavior and conversion funnels
5. Recommendations for January
```

**Output**: Comprehensive monthly report with insights and action items

---

## How to Use These Agents

### Method 1: Direct Prompting
Copy the agent's instructions and paste them into your conversation with Claude, then provide specific tasks.

### Method 2: Reference in Conversation
```
I need help creating a blog post. Please act according to the Blog Post Generator agent specifications in .claude/agents/content/blog-post-generator.md
```

### Method 3: Custom Workflows
Combine multiple agents for complex workflows:

**Example Workflow: New Platform Addition**
1. **Trend Researcher**: Discovers new platform
2. **Tool Evaluator**: Evaluates and creates JSON entry
3. **Blog Post Generator**: Creates announcement/review post
4. **SEO Optimizer**: Optimizes post for target keywords
5. **Analytics Reporter**: Tracks performance post-launch

---

## Agent Integration with Infrastructure

### File Structure
```
.claude/agents/
├── README.md (this file)
├── content/
│   ├── blog-post-generator.md
│   └── seo-optimizer.md
├── research/
│   ├── trend-researcher.md
│   └── tool-evaluator.md
└── analytics/
    └── analytics-reporter.md
```

### Data Flow
```
Trend Researcher
      ↓
  Discovery Report
      ↓
Tool Evaluator
      ↓
platforms.json Entry
      ↓
Blog Post Generator → blog-posts/*.json
      ↓
SEO Optimizer
      ↓
Analytics Reporter (track performance)
```

---

## Best Practices

### Content Quality
- Always prioritize E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Include methodology sections showing how testing was conducted
- Use realistic metrics and timeframes
- Add author credentials to establish expertise
- Cite official sources and documentation

### SEO Compliance
- Follow Google's December 2025 Core Update guidelines
- Write for humans first, search engines second
- Avoid keyword stuffing and over-optimization
- Keep content fresh with regular updates
- Build natural internal linking

### Platform Accuracy
- Verify all information against official sources
- Keep pricing current (review every 3 months)
- Test platforms when possible
- Update features as platforms evolve
- Flag outdated or discontinued platforms

### Data Privacy
- Never expose API keys or sensitive credentials
- Handle user data according to privacy policy
- Respect platform terms of service during evaluation
- Don't share proprietary or confidential information

---

## Customization

Each agent can be customized for specific needs:

### Modify Agent Behavior
Edit the `.md` file to adjust:
- Output format
- Evaluation criteria
- Quality standards
- Reporting frequency
- Success metrics

### Extend Functionality
Add new sections:
- Additional data sources
- Custom evaluation frameworks
- Industry-specific criteria
- Regional considerations

---

## Success Metrics

### Content Agents
- Blog posts ranking in top 3 for target keywords
- 10,000+ monthly organic visitors from content
- 4+ minute average time on page
- <40% bounce rate on blog posts

### Research Agents
- 90%+ of major AI launches discovered within 7 days
- <5% duplicate or low-quality platform additions
- 80%+ accuracy on platform information

### Analytics Agent
- Reports delivered on schedule (100% on-time)
- 95%+ data accuracy
- 80%+ of recommendations implemented
- Actionable insights driving measurable improvements

---

## Future Enhancements

Potential additional agents:
- **Database Optimizer**: Clean and optimize platforms.json
- **Backlink Builder**: Identify and pursue link opportunities
- **Social Media Manager**: Content distribution strategy
- **User Support**: Handle platform submissions and questions
- **A/B Test Manager**: Optimize conversion rates
- **Newsletter Generator**: Create weekly AI tool roundups

---

## Support & Feedback

For questions or suggestions about these agents:
1. Review the agent's documentation
2. Test with small tasks first
3. Iterate based on output quality
4. Provide feedback for improvements

---

## Version History

- **v1.0** (2025-12-26): Initial agent suite
  - Blog Post Generator
  - SEO Optimizer
  - Trend Researcher
  - Tool Evaluator
  - Analytics Reporter

---

*These agents are designed to work with the AI Platforms Directory infrastructure. Adjust and customize based on your specific needs and workflows.*
