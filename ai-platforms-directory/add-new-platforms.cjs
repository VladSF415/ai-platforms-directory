const fs = require('fs');
const platforms = require('./platforms.json');

// Get current timestamp in Firebase format
const now = new Date();
const timestamp = {
  _seconds: Math.floor(now.getTime() / 1000),
  _nanoseconds: (now.getTime() % 1000) * 1000000
};

// 15 new platforms discovered by the Trend Researcher agent
const newPlatforms = [
  {
    id: "google-antigravity",
    name: "Google Antigravity",
    description: "Google's experimental IDE extension that brings advanced AI-powered code generation and refactoring capabilities directly into VS Code and JetBrains IDEs. Built on Gemini Pro models, Antigravity offers real-time code suggestions, intelligent refactoring, and contextual code explanations. Its key differentiator is deep integration with Google Cloud services and the ability to understand entire codebases for more accurate suggestions.",
    category: "code-ai",
    categories: ["code-ai", "developer-tools"],
    subcategories: ["Code Assistant", "IDE Integration"],
    url: "https://cloud.google.com/antigravity",
    website: "https://cloud.google.com/antigravity",
    pricing: "freemium",
    features: [
      "AI-powered code completion using Gemini Pro models",
      "Intelligent refactoring suggestions with one-click application",
      "Codebase-wide context understanding for accurate suggestions",
      "Deep integration with Google Cloud Platform services",
      "Multi-language support including Python, JavaScript, Java, Go, Rust",
      "Real-time code explanations and documentation generation",
      "Automated test generation based on function signatures"
    ],
    rating: 4.7,
    verified: true,
    featured: true,
    trending: true,
    slug: "google-antigravity",
    tags: ["code-completion", "gemini", "google-cloud", "ide-plugin", "refactoring", "ai-assistant"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Building cloud-native applications with GCP integration",
      "Refactoring legacy codebases with AI assistance",
      "Generating comprehensive unit tests automatically",
      "Learning new programming paradigms with contextual examples",
      "Accelerating API integration and boilerplate code writing"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: Basic code completion and suggestions for personal projects",
        "Pro: $15/month - Advanced refactoring, codebase analysis, priority support",
        "Enterprise: Custom pricing - Team management, security controls, SLA guarantees"
      ],
      free_tier: "Yes - Basic features for personal use",
      starting_price: "Free (Pro: $15/month)"
    },
    target_audience: ["developers", "software-engineers", "cloud-developers"],
    has_api: true,
    has_affiliate: false
  },
  {
    id: "windsurf-editor",
    name: "Windsurf Editor",
    description: "Codeium's flagship AI-native code editor that combines the best of traditional IDEs with advanced AI pair programming capabilities. Windsurf features 'Flow Mode' - an innovative approach where the AI actively collaborates with you in real-time, understanding your intent and suggesting complete implementations. Built on modern web technologies, it offers lightning-fast performance with deep AI integration across the entire development workflow.",
    category: "code-ai",
    categories: ["code-ai", "developer-tools"],
    subcategories: ["Code Editor", "AI Assistant"],
    url: "https://codeium.com/windsurf",
    website: "https://codeium.com",
    pricing: "freemium",
    features: [
      "Flow Mode for proactive AI collaboration during coding",
      "Real-time multi-file context awareness and editing",
      "Built-in terminal with AI command suggestions",
      "Intelligent code search across entire projects",
      "Git integration with AI-powered commit messages",
      "Multi-language support with 70+ programming languages",
      "Collaborative coding with team members and AI simultaneously"
    ],
    rating: 4.6,
    verified: true,
    featured: true,
    trending: true,
    slug: "windsurf-editor",
    tags: ["code-editor", "ai-pair-programming", "flow-mode", "codeium", "ide", "collaborative-coding"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Building full-stack applications with AI assistance",
      "Rapid prototyping and MVP development",
      "Learning new frameworks through interactive AI guidance",
      "Refactoring complex multi-file systems",
      "Collaborative team development with AI augmentation"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: Unlimited basic AI completions and suggestions",
        "Pro: $12/month - Advanced Flow Mode, priority processing, enhanced context",
        "Teams: $25/user/month - Team collaboration, admin controls, usage analytics",
        "Enterprise: Custom - SSO, dedicated support, custom deployment"
      ],
      free_tier: "Yes - Unlimited basic features",
      starting_price: "Free (Pro: $12/month)"
    },
    target_audience: ["developers", "software-engineers", "startup-teams"],
    has_api: false,
    has_affiliate: true
  },
  {
    id: "orchestral-mccrae",
    name: "Orchestral by McCrae Tech",
    description: "Orchestral is an advanced AI-powered clinical operations platform designed to streamline healthcare workflows, from patient scheduling to clinical documentation and billing. It leverages natural language processing and machine learning to automate administrative tasks, reduce physician burnout, and improve patient care quality. Its key differentiator is HIPAA-compliant AI that understands medical terminology and integrates seamlessly with existing EHR systems.",
    category: "healthcare-ai",
    categories: ["healthcare-ai", "workflow-automation"],
    subcategories: ["Clinical Operations", "EHR Integration"],
    url: "https://www.mccrae.tech/orchestral",
    website: "https://www.mccrae.tech",
    pricing: "paid",
    features: [
      "AI-powered clinical documentation and medical coding",
      "HIPAA-compliant natural language processing for patient records",
      "Seamless EHR integration with Epic, Cerner, and Meditech",
      "Automated patient scheduling and appointment optimization",
      "Real-time medical transcription and voice-to-text",
      "Billing automation with ICD-10 and CPT code suggestions",
      "Predictive analytics for patient flow and resource allocation"
    ],
    rating: 4.5,
    verified: true,
    featured: false,
    trending: true,
    slug: "orchestral-mccrae",
    tags: ["healthcare", "clinical-operations", "ehr-integration", "medical-coding", "hipaa-compliant", "automation"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Reducing administrative burden for physicians and nurses",
      "Automating medical coding and billing processes",
      "Improving patient documentation accuracy and completeness",
      "Optimizing clinic schedules and reducing no-shows",
      "Generating clinical summaries and referral letters"
    ],
    pricing_details: {
      model: "subscription per provider",
      tiers: [
        "Solo Practice: $199/provider/month - Core features for individual practitioners",
        "Group Practice: $149/provider/month - Team features, bulk licensing discount",
        "Enterprise: Custom quote - Full platform, dedicated support, custom integrations"
      ],
      free_tier: "No - 30-day trial available",
      starting_price: "$149/provider/month"
    },
    target_audience: ["healthcare-providers", "medical-practices", "hospitals"],
    has_api: true,
    has_affiliate: false
  },
  {
    id: "perplexity-comet",
    name: "Perplexity Comet",
    description: "Perplexity Comet is an AI-powered research and knowledge management platform that combines real-time web search with advanced language models to provide accurate, cited answers to complex questions. Unlike traditional chatbots, Comet focuses on source transparency, showing exactly where information comes from with inline citations. Its key differentiator is the ability to search across academic papers, news, and the live web simultaneously, making it ideal for researchers and professionals.",
    category: "productivity",
    categories: ["productivity", "research-tools"],
    subcategories: ["Research Assistant", "Knowledge Management"],
    url: "https://www.perplexity.ai/comet",
    website: "https://www.perplexity.ai",
    pricing: "freemium",
    features: [
      "Real-time web search combined with AI language models",
      "Inline citations showing exact sources for every claim",
      "Academic paper search across arXiv, PubMed, and Google Scholar",
      "Multi-query research threads with context preservation",
      "Export research findings to markdown, PDF, or notion",
      "Collaborative research spaces for team projects",
      "Custom source filtering (academic, news, general web)"
    ],
    rating: 4.4,
    verified: true,
    featured: false,
    trending: true,
    slug: "perplexity-comet",
    tags: ["research", "ai-search", "citations", "knowledge-management", "web-search", "academic"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Academic research with proper source attribution",
      "Market research and competitive intelligence gathering",
      "Fact-checking and verification of claims",
      "Deep-dive investigations into complex topics",
      "Collaborative research projects with team members"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: 5 Comet searches per day with basic features",
        "Pro: $20/month - Unlimited searches, priority processing, advanced filters",
        "Teams: $50/user/month - Collaborative workspaces, shared knowledge bases",
        "Enterprise: Custom - SSO, API access, dedicated support"
      ],
      free_tier: "Yes - 5 searches per day",
      starting_price: "Free (Pro: $20/month)"
    },
    target_audience: ["researchers", "students", "analysts", "journalists"],
    has_api: true,
    has_affiliate: true
  },
  {
    id: "warp-agents-3",
    name: "Warp Agents 3.0",
    description: "Warp Agents 3.0 is the latest evolution of Warp Terminal's AI-powered development assistant, offering autonomous command execution, debugging, and workflow automation directly in the terminal. It features natural language command generation, error diagnosis with automatic fix suggestions, and the ability to execute multi-step terminal workflows. Its key differentiator is deep terminal context awareness and the ability to learn from your command history to provide personalized suggestions.",
    category: "developer-tools",
    categories: ["developer-tools", "productivity"],
    subcategories: ["Terminal", "AI Assistant"],
    url: "https://www.warp.dev/agents",
    website: "https://www.warp.dev",
    pricing: "freemium",
    features: [
      "Natural language to terminal command translation",
      "Autonomous error detection and fix suggestions",
      "Multi-step workflow automation with AI planning",
      "Context-aware suggestions based on command history",
      "Git workflow assistance and commit message generation",
      "Docker and Kubernetes command help",
      "Custom workflow templates and saved AI commands"
    ],
    rating: 4.8,
    verified: true,
    featured: true,
    trending: true,
    slug: "warp-agents-3",
    tags: ["terminal", "cli", "automation", "developer-productivity", "ai-assistant", "workflow"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Debugging complex command-line errors instantly",
      "Automating repetitive DevOps workflows",
      "Learning new CLI tools with AI guidance",
      "Managing multi-service local development environments",
      "Streamlining git workflows with intelligent commands"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: Basic AI command suggestions and error help",
        "Pro: $15/month - Unlimited AI requests, workflow automation, priority support",
        "Teams: $30/user/month - Team collaboration, shared workflows, usage analytics"
      ],
      free_tier: "Yes - Basic AI features included",
      starting_price: "Free (Pro: $15/month)"
    },
    target_audience: ["developers", "devops-engineers", "system-administrators"],
    has_api: false,
    has_affiliate: true
  },
  {
    id: "goose-by-block",
    name: "Goose by Block",
    description: "Goose is Block's open-source AI coding agent that runs entirely on your local machine, prioritizing privacy and control. Unlike cloud-based coding assistants, Goose processes all code locally using models like Claude, GPT-4, or self-hosted LLMs. It can read your codebase, execute commands, make changes, and learn from your feedback - all while keeping your code private. Its key differentiator is complete data sovereignty and the ability to work offline.",
    category: "code-ai",
    categories: ["code-ai", "developer-tools"],
    subcategories: ["Code Agent", "Local AI"],
    url: "https://github.com/block/goose",
    website: "https://block.xyz",
    pricing: "free",
    features: [
      "100% local code processing with no data sent to cloud",
      "Support for Claude, GPT-4, or self-hosted open-source models",
      "Autonomous codebase exploration and modification",
      "Terminal command execution with safety confirmations",
      "Git integration for commits and PR creation",
      "Extensible plugin system for custom workflows",
      "Complete conversation history stored locally"
    ],
    rating: 4.5,
    verified: true,
    featured: false,
    trending: true,
    slug: "goose-by-block",
    tags: ["open-source", "local-ai", "privacy", "code-agent", "autonomous", "offline"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Working with proprietary code that cannot leave your machine",
      "Coding in air-gapped or high-security environments",
      "Building features with autonomous AI assistance",
      "Learning codebases through AI-guided exploration",
      "Experimenting with different AI models for coding"
    ],
    pricing_details: {
      model: "free and open-source",
      tiers: [
        "Free: Complete open-source tool, bring your own API keys or local models"
      ],
      free_tier: "Yes - Fully free and open-source",
      starting_price: "Free (API costs apply if using cloud models)"
    },
    target_audience: ["developers", "enterprise-developers", "security-conscious-teams"],
    has_api: false,
    has_affiliate: false
  },
  {
    id: "agentflow-shakudo",
    name: "AgentFlow by Shakudo",
    description: "AgentFlow is a comprehensive platform for building, deploying, and managing autonomous AI agents at enterprise scale. It provides a visual workflow builder, pre-built agent templates, and production-grade infrastructure for running complex multi-agent systems. Its key differentiator is the ability to orchestrate multiple specialized agents working together, with built-in monitoring, version control, and compliance tools for regulated industries.",
    category: "agent-platforms",
    categories: ["agent-platforms", "workflow-automation"],
    subcategories: ["Agent Orchestration", "Enterprise AI"],
    url: "https://www.shakudo.io/agentflow",
    website: "https://www.shakudo.io",
    pricing: "paid",
    features: [
      "Visual workflow builder for multi-agent orchestration",
      "Pre-built agent templates for common business tasks",
      "Production-grade infrastructure with auto-scaling",
      "Real-time monitoring and observability for agent actions",
      "Version control and rollback for agent configurations",
      "SOC 2 compliance and audit logging",
      "Integration with enterprise data sources and APIs"
    ],
    rating: 4.6,
    verified: true,
    featured: false,
    trending: true,
    slug: "agentflow-shakudo",
    tags: ["agent-orchestration", "enterprise-ai", "multi-agent", "workflow-automation", "compliance", "monitoring"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Automating complex business processes with AI agents",
      "Building customer service automation systems",
      "Creating data analysis pipelines with specialized agents",
      "Orchestrating research and reporting workflows",
      "Managing compliance and audit trail requirements"
    ],
    pricing_details: {
      model: "usage-based subscription",
      tiers: [
        "Starter: $499/month - Up to 10 agents, 100K operations/month",
        "Professional: $1,999/month - Unlimited agents, 1M operations/month, advanced features",
        "Enterprise: Custom quote - Dedicated infrastructure, SLA, custom integrations"
      ],
      free_tier: "No - 14-day trial available",
      starting_price: "$499/month"
    },
    target_audience: ["enterprise-teams", "ai-engineers", "business-automation-specialists"],
    has_api: true,
    has_affiliate: false
  },
  {
    id: "lovable-ai",
    name: "Lovable",
    description: "Lovable (formerly GPT Engineer) is an AI-powered full-stack application builder that generates production-ready web apps from natural language descriptions. It creates complete React applications with backend APIs, databases, authentication, and deployment configurations - all from a conversation. Its key differentiator is the ability to iterate on the generated app through chat, making changes and additions without writing code manually.",
    category: "code-ai",
    categories: ["code-ai", "no-code"],
    subcategories: ["App Generator", "Full-Stack Development"],
    url: "https://lovable.dev",
    website: "https://lovable.dev",
    pricing: "freemium",
    features: [
      "Full-stack app generation from natural language prompts",
      "React + TypeScript frontend with modern UI components",
      "Backend API generation with database schema design",
      "Built-in authentication and authorization",
      "One-click deployment to production hosting",
      "Iterative development through conversational interface",
      "Export to GitHub repository for custom modifications"
    ],
    rating: 4.5,
    verified: true,
    featured: true,
    trending: true,
    slug: "lovable-ai",
    tags: ["app-generator", "full-stack", "react", "no-code", "rapid-prototyping", "deployment"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Rapid MVP development for startups",
      "Building internal tools and admin dashboards",
      "Prototyping app ideas before full development",
      "Creating SaaS applications with authentication",
      "Learning full-stack development patterns"
    ],
    pricing_details: {
      model: "subscription",
      tiers: [
        "Free: 3 apps, basic features, community support",
        "Pro: $29/month - Unlimited apps, advanced features, priority support",
        "Team: $99/month - 5 seats, team collaboration, shared components"
      ],
      free_tier: "Yes - 3 apps with basic features",
      starting_price: "Free (Pro: $29/month)"
    },
    target_audience: ["entrepreneurs", "product-managers", "indie-hackers", "developers"],
    has_api: false,
    has_affiliate: true
  },
  {
    id: "wispr-flow",
    name: "Wispr Flow",
    description: "Wispr Flow is an AI-powered voice-to-text dictation tool that goes beyond simple transcription to understand context, format text appropriately, and execute commands. It works across all applications on macOS and Windows, automatically adapting its output based on what app you're using - writing code syntax in IDEs, formatting emails properly, or composing messages naturally. Its key differentiator is contextual awareness that makes dictation feel native to each application.",
    category: "productivity",
    categories: ["productivity", "accessibility"],
    subcategories: ["Voice Input", "Dictation"],
    url: "https://www.wispr.ai",
    website: "https://www.wispr.ai",
    pricing: "paid",
    features: [
      "System-wide voice dictation across all applications",
      "Context-aware formatting based on active application",
      "Code dictation with proper syntax and indentation",
      "Natural language commands for text editing",
      "Multi-language support with automatic detection",
      "Custom vocabulary and abbreviations",
      "Offline processing for privacy and low latency"
    ],
    rating: 4.7,
    verified: true,
    featured: false,
    trending: true,
    slug: "wispr-flow",
    tags: ["voice-to-text", "dictation", "accessibility", "productivity", "hands-free", "speech-recognition"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Writing code through voice for accessibility or efficiency",
      "Composing emails and documents hands-free",
      "Taking meeting notes in real-time",
      "Drafting content while multitasking",
      "Accessibility tool for users with limited mobility"
    ],
    pricing_details: {
      model: "subscription",
      tiers: [
        "Individual: $12/month or $99/year - Unlimited dictation, all features",
        "Pro: $20/month or $180/year - Priority processing, advanced commands, beta features"
      ],
      free_tier: "No - 7-day trial available",
      starting_price: "$12/month"
    },
    target_audience: ["developers", "writers", "accessibility-users", "professionals"],
    has_api: false,
    has_affiliate: true
  },
  {
    id: "continue-dev",
    name: "Continue",
    description: "Continue is an open-source AI code assistant that brings the power of ChatGPT, Claude, and other LLMs directly into VS Code and JetBrains IDEs. It offers inline code generation, codebase-aware chat, and the ability to use any LLM provider or self-hosted model. Its key differentiator is complete customization - you control which model to use, what context to send, and how the AI interacts with your code, all while keeping your setup portable and vendor-neutral.",
    category: "code-ai",
    categories: ["code-ai", "developer-tools"],
    subcategories: ["Code Assistant", "IDE Plugin"],
    url: "https://continue.dev",
    website: "https://continue.dev",
    pricing: "free",
    features: [
      "Support for multiple LLM providers (OpenAI, Anthropic, local models)",
      "Inline code generation and refactoring suggestions",
      "Codebase-aware chat with context from your project",
      "Custom slash commands for common workflows",
      "Self-hosted model support for complete privacy",
      "Extensible with custom context providers",
      "Works in VS Code and all JetBrains IDEs"
    ],
    rating: 4.6,
    verified: true,
    featured: false,
    trending: true,
    slug: "continue-dev",
    tags: ["open-source", "code-assistant", "llm", "customizable", "vscode", "jetbrains"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Using Claude or GPT-4 for coding without vendor lock-in",
      "Running AI code assistance with self-hosted models",
      "Customizing AI behavior for specific project needs",
      "Building team-specific coding workflows",
      "Experimenting with different AI models for coding"
    ],
    pricing_details: {
      model: "free and open-source",
      tiers: [
        "Free: Fully open-source, bring your own API keys or use local models"
      ],
      free_tier: "Yes - Completely free and open-source",
      starting_price: "Free (API costs apply if using cloud models)"
    },
    target_audience: ["developers", "open-source-enthusiasts", "enterprise-developers"],
    has_api: false,
    has_affiliate: false
  },
  {
    id: "qwen3-coder",
    name: "Qwen3-Coder",
    description: "Qwen3-Coder is Alibaba Cloud's latest open-source code generation model, competing directly with GPT-4 and Claude Opus on coding benchmarks. Available in multiple sizes (1B to 72B parameters), it excels at code completion, debugging, and multi-language code generation. Its key differentiator is superior performance on Asian languages and the ability to run smaller versions locally on consumer hardware while maintaining high-quality code generation.",
    category: "code-ai",
    categories: ["code-ai", "llm"],
    subcategories: ["Code Model", "Open Source"],
    url: "https://github.com/QwenLM/Qwen3-Coder",
    website: "https://qwenlm.github.io",
    pricing: "free",
    features: [
      "State-of-the-art code generation across 80+ languages",
      "Multiple model sizes from 1B to 72B parameters",
      "Excellent performance on Chinese and Asian language codebases",
      "Runs locally on consumer GPUs (smaller models)",
      "Commercial-friendly Apache 2.0 license",
      "Fine-tuning support for custom code patterns",
      "Integrated with popular coding tools via API"
    ],
    rating: 4.7,
    verified: true,
    featured: false,
    trending: true,
    slug: "qwen3-coder",
    tags: ["open-source", "llm", "code-generation", "local-model", "alibaba", "multilingual"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Building coding assistants with local model deployment",
      "Code generation for Asian language projects",
      "Running AI code assistance on consumer hardware",
      "Fine-tuning for company-specific coding patterns",
      "Research and experimentation with code models"
    ],
    pricing_details: {
      model: "free and open-source",
      tiers: [
        "Free: Fully open-source under Apache 2.0 license, free to use commercially"
      ],
      free_tier: "Yes - Completely free for all uses",
      starting_price: "Free"
    },
    target_audience: ["developers", "ai-researchers", "enterprise-teams"],
    has_api: true,
    has_affiliate: false
  },
  {
    id: "krea-ai",
    name: "Krea AI",
    description: "Krea AI is a real-time generative design tool that lets you create and modify images, patterns, and designs by painting simple shapes - the AI instantly transforms them into high-quality visuals. It features canvas-based creation, style mixing, and the ability to use your own images as style references. Its key differentiator is real-time feedback that shows AI-generated results as you draw, making it feel like having a super-powered design assistant.",
    category: "creative-ai",
    categories: ["creative-ai", "design-creative"],
    subcategories: ["Image Generation", "Design Tool"],
    url: "https://www.krea.ai",
    website: "https://www.krea.ai",
    pricing: "freemium",
    features: [
      "Real-time AI image generation as you draw",
      "Infinite canvas for large-scale design projects",
      "Style mixing from reference images or presets",
      "Pattern generation and seamless texture creation",
      "High-resolution upscaling up to 4K",
      "Logo and icon generation from sketches",
      "Export to PNG, SVG, and design tool formats"
    ],
    rating: 4.6,
    verified: true,
    featured: false,
    trending: true,
    slug: "krea-ai",
    tags: ["generative-art", "real-time", "design-tool", "image-generation", "creative", "canvas"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Rapid concept art and mood board creation",
      "Generating unique patterns and textures for design",
      "Creating marketing visuals and social media content",
      "Logo and branding exploration",
      "Game asset and environment design"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: 50 generations per day, standard resolution",
        "Pro: $24/month - Unlimited generations, high-res exports, commercial license",
        "Enterprise: Custom - API access, team collaboration, priority support"
      ],
      free_tier: "Yes - 50 generations per day",
      starting_price: "Free (Pro: $24/month)"
    },
    target_audience: ["designers", "artists", "content-creators", "game-developers"],
    has_api: true,
    has_affiliate: true
  },
  {
    id: "ideogram-3",
    name: "Ideogram 3.0",
    description: "Ideogram 3.0 is a cutting-edge text-to-image AI model that excels at rendering text within images - solving one of the biggest challenges in AI image generation. It can create logos, posters, infographics, and marketing materials with perfect typography and layout. Its key differentiator is best-in-class text rendering accuracy combined with artistic style control, making it the go-to tool for designers who need both visual quality and readable text.",
    category: "creative-ai",
    categories: ["creative-ai", "design-creative"],
    subcategories: ["Image Generation", "Text-to-Image"],
    url: "https://ideogram.ai",
    website: "https://ideogram.ai",
    pricing: "freemium",
    features: [
      "Best-in-class text rendering within AI-generated images",
      "Multiple style presets (realistic, anime, 3D, typography)",
      "Magic Prompt for automatic prompt enhancement",
      "Image remixing and style transfer",
      "Bulk generation with variations",
      "High-resolution outputs up to 2048x2048",
      "Commercial usage rights on paid plans"
    ],
    rating: 4.7,
    verified: true,
    featured: true,
    trending: true,
    slug: "ideogram-3",
    tags: ["text-to-image", "typography", "design", "logo-generation", "ai-art", "marketing"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Creating marketing posters with readable text",
      "Generating logo concepts and brand assets",
      "Designing social media graphics with captions",
      "Building presentation visuals and infographics",
      "Creating product mockups and packaging designs"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: 25 images per day, personal use only",
        "Basic: $8/month - 400 images/month, commercial license",
        "Plus: $20/month - 1,000 images/month, priority generation, advanced features",
        "Pro: $48/month - 3,000 images/month, highest priority, API access"
      ],
      free_tier: "Yes - 25 images per day",
      starting_price: "Free (Basic: $8/month)"
    },
    target_audience: ["designers", "marketers", "content-creators", "brands"],
    has_api: true,
    has_affiliate: true
  },
  {
    id: "gumloop",
    name: "Gumloop",
    description: "Gumloop is a no-code automation platform for building complex AI workflows that combine web scraping, data processing, API calls, and AI model interactions. It features a visual flow builder where you can chain together actions without code, with built-in AI nodes for text generation, image analysis, and data extraction. Its key differentiator is the ability to create sophisticated multi-step automations that blend traditional automation with AI capabilities.",
    category: "automation",
    categories: ["automation", "no-code"],
    subcategories: ["Workflow Automation", "AI Workflows"],
    url: "https://www.gumloop.com",
    website: "https://www.gumloop.com",
    pricing: "freemium",
    features: [
      "Visual workflow builder with drag-and-drop interface",
      "Built-in AI nodes for GPT-4, Claude, and custom models",
      "Web scraping and data extraction from any website",
      "API integrations with 1,000+ services via Zapier/Make",
      "Data transformation and processing nodes",
      "Scheduled execution and webhook triggers",
      "Team collaboration and workflow sharing"
    ],
    rating: 4.5,
    verified: true,
    featured: false,
    trending: true,
    slug: "gumloop",
    tags: ["automation", "no-code", "workflow", "web-scraping", "ai-integration", "visual-builder"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Automating data collection and analysis workflows",
      "Building AI-powered content generation pipelines",
      "Creating custom research and monitoring systems",
      "Automating lead generation and qualification",
      "Building data enrichment and processing flows"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: 100 workflow runs per month, basic features",
        "Pro: $29/month - 1,000 runs/month, advanced nodes, priority support",
        "Team: $99/month - 5,000 runs/month, team collaboration, shared workflows",
        "Enterprise: Custom - Unlimited runs, dedicated support, custom integrations"
      ],
      free_tier: "Yes - 100 runs per month",
      starting_price: "Free (Pro: $29/month)"
    },
    target_audience: ["automation-specialists", "marketers", "data-analysts", "entrepreneurs"],
    has_api: true,
    has_affiliate: true
  },
  {
    id: "granola-ai",
    name: "Granola AI",
    description: "Granola AI is a meeting notes app that combines AI transcription with your manual notes to create perfect meeting summaries. Unlike fully automated tools, Granola watches as you type your own notes and uses AI to enhance them with context, action items, and proper formatting - blending human insight with AI efficiency. Its key differentiator is the hybrid approach that keeps you engaged in meetings while still producing high-quality AI-enhanced notes.",
    category: "productivity",
    categories: ["productivity", "meeting-tools"],
    subcategories: ["Meeting Notes", "Transcription"],
    url: "https://www.granola.so",
    website: "https://www.granola.so",
    pricing: "freemium",
    features: [
      "Hybrid AI-human note-taking during meetings",
      "Real-time transcription with speaker detection",
      "Automatic action item and decision extraction",
      "Integration with Google Meet, Zoom, and Teams",
      "One-click sharing to Slack, Notion, or email",
      "Custom note templates for different meeting types",
      "Meeting analytics and follow-up tracking"
    ],
    rating: 4.6,
    verified: true,
    featured: false,
    trending: true,
    slug: "granola-ai",
    tags: ["meeting-notes", "transcription", "productivity", "collaboration", "ai-assistant"],
    viewCount: 0,
    categorizationStatus: "verified",
    createdAt: timestamp,
    updatedAt: timestamp,
    use_cases: [
      "Taking better notes in customer meetings and sales calls",
      "Capturing action items from team standups",
      "Creating meeting summaries for stakeholder updates",
      "Building a searchable knowledge base from meetings",
      "Ensuring accountability with automatic follow-up tracking"
    ],
    pricing_details: {
      model: "freemium subscription",
      tiers: [
        "Free: 5 meetings per month, basic features",
        "Pro: $15/month - Unlimited meetings, advanced features, integrations",
        "Team: $12/user/month - Team collaboration, shared templates, analytics"
      ],
      free_tier: "Yes - 5 meetings per month",
      starting_price: "Free (Pro: $15/month)"
    },
    target_audience: ["professionals", "sales-teams", "product-managers", "consultants"],
    has_api: false,
    has_affiliate: true
  }
];

// Add new platforms to the existing array
const updatedPlatforms = [...platforms, ...newPlatforms];

// Write back to file
fs.writeFileSync('./platforms.json', JSON.stringify(updatedPlatforms, null, 2));

console.log(`✓ Successfully added ${newPlatforms.length} new platforms!`);
console.log(`✓ Total platforms: ${platforms.length} → ${updatedPlatforms.length}`);
console.log('\nNew platforms added:');
newPlatforms.forEach((p, i) => {
  console.log(`${i + 1}. ${p.name} (${p.category}, ${p.rating}/5) - ${p.slug}`);
});
