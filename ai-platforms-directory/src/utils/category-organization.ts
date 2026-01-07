/**
 * Category Organization for AI Platforms Directory Mega Menu
 * Groups categories logically for better navigation
 */

export interface Category {
  name: string;
  slug: string;
  count: number;
  icon?: string;
}

export interface CategorySection {
  id: string;
  title: string;
  icon: string;
  description?: string;
  featured?: boolean;
  categories: string[]; // category slugs
}

/**
 * Organized category sections for mega menu
 * Sections are displayed in this order
 */
export const CATEGORY_SECTIONS: CategorySection[] = [
  {
    id: 'ai-models',
    title: 'AI Models & LLMs',
    icon: '🤖',
    description: 'Large language models and foundation models',
    featured: true,
    categories: [
      'llm',
      'large-language-models',
      'chatbots',
      'conversational-ai',
      'ai-assistants',
      'foundation-models'
    ]
  },
  {
    id: 'code-dev',
    title: 'Code & Development',
    icon: '💻',
    description: 'AI tools for developers and programmers',
    featured: true,
    categories: [
      'code-ai',
      'code-assistant',
      'developer-tools',
      'ai-code-editor',
      'code-completion',
      'code-review',
      'debugging',
      'testing-automation',
      'devops-ai'
    ]
  },
  {
    id: 'creative',
    title: 'Creative & Design',
    icon: '🎨',
    description: 'Generate and edit visual content',
    featured: true,
    categories: [
      'image-generation',
      'generative-art',
      'video-generation',
      'video-editing',
      'graphic-design',
      'creative-ai',
      '3d-modeling',
      'animation',
      'photo-editing'
    ]
  },
  {
    id: 'content-writing',
    title: 'Content & Writing',
    icon: '✍️',
    description: 'Writing, copywriting, and content creation',
    categories: [
      'content-creation',
      'writing-assistant',
      'copywriting',
      'blog-writing',
      'seo-content',
      'email-writing',
      'social-media',
      'marketing-content'
    ]
  },
  {
    id: 'business',
    title: 'Business & Productivity',
    icon: '💼',
    description: 'Workflow automation and business tools',
    categories: [
      'workflow-automation',
      'business-productivity',
      'task-automation',
      'process-automation',
      'meeting-assistant',
      'email-automation',
      'crm-ai',
      'sales-ai',
      'customer-support'
    ]
  },
  {
    id: 'data-analytics',
    title: 'Data & Analytics',
    icon: '📊',
    description: 'Data analysis, BI, and insights',
    categories: [
      'data-analysis',
      'business-intelligence',
      'predictive-analytics',
      'data-visualization',
      'database-ai',
      'sql-ai',
      'spreadsheet-ai'
    ]
  },
  {
    id: 'voice-audio',
    title: 'Voice & Audio',
    icon: '🗣️',
    description: 'Speech, voice, and audio AI',
    categories: [
      'text-to-speech',
      'speech-to-text',
      'voice-synthesis',
      'voice-cloning',
      'audio-generation',
      'music-generation',
      'podcast-ai',
      'transcription'
    ]
  },
  {
    id: 'research-education',
    title: 'Research & Education',
    icon: '🎓',
    description: 'Academic and learning tools',
    categories: [
      'research-assistant',
      'academic-writing',
      'education-ai',
      'learning-assistant',
      'tutoring-ai',
      'study-tools'
    ]
  },
  {
    id: 'no-code',
    title: 'No-Code & Low-Code',
    icon: '🔨',
    description: 'Build without coding',
    categories: [
      'no-code-development',
      'low-code-platform',
      'app-builder',
      'website-builder',
      'automation-platform',
      'vibe-coding'
    ]
  },
  {
    id: 'enterprise',
    title: 'Enterprise Solutions',
    icon: '🏢',
    description: 'Large-scale business AI',
    categories: [
      'enterprise-ai',
      'ai-infrastructure',
      'mlops',
      'ai-platform',
      'cloud-ai',
      'ai-security'
    ]
  },
  {
    id: 'industry-specific',
    title: 'Industry-Specific',
    icon: '🏥',
    description: 'Specialized AI for specific industries',
    categories: [
      'healthcare-ai',
      'medical-ai',
      'legal-ai',
      'finance-ai',
      'real-estate-ai',
      'hr-ai',
      'recruiting-ai',
      'ecommerce-ai'
    ]
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision',
    icon: '👁️',
    description: 'Image recognition and visual AI',
    categories: [
      'computer-vision',
      'object-detection',
      'facial-recognition',
      'ocr',
      'image-recognition',
      'video-analysis'
    ]
  },
  {
    id: 'nlp',
    title: 'NLP & Text',
    icon: '📝',
    description: 'Natural language processing',
    categories: [
      'nlp',
      'natural-language-processing',
      'text-analysis',
      'sentiment-analysis',
      'language-translation',
      'text-classification'
    ]
  },
  {
    id: 'ml-platforms',
    title: 'ML & Data Science',
    icon: '🧪',
    description: 'Machine learning platforms',
    categories: [
      'machine-learning',
      'deep-learning',
      'ml-platform',
      'automl',
      'model-training',
      'feature-engineering',
      'data-science'
    ]
  },
  {
    id: 'other',
    title: 'Other Categories',
    icon: '⚡',
    description: 'Additional AI tools',
    categories: [] // Catch-all for uncategorized
  }
];

/**
 * Get the section for a given category slug
 */
export function getCategorySection(categorySlug: string): CategorySection | null {
  for (const section of CATEGORY_SECTIONS) {
    if (section.categories.includes(categorySlug)) {
      return section;
    }
  }
  return null;
}

/**
 * Organize categories into sections
 */
export function organizeCategories(categories: Category[]): Map<string, Category[]> {
  const organized = new Map<string, Category[]>();

  // Initialize all sections
  CATEGORY_SECTIONS.forEach(section => {
    organized.set(section.id, []);
  });

  // Distribute categories into sections
  categories.forEach(category => {
    let assigned = false;

    for (const section of CATEGORY_SECTIONS) {
      if (section.categories.includes(category.slug)) {
        const existing = organized.get(section.id) || [];
        existing.push(category);
        organized.set(section.id, existing);
        assigned = true;
        break;
      }
    }

    // If not assigned to any section, put in "other"
    if (!assigned) {
      const other = organized.get('other') || [];
      other.push(category);
      organized.set('other', other);
    }
  });

  return organized;
}

/**
 * Get featured/popular categories (for quick access)
 */
export function getFeaturedCategories(categories: Category[]): Category[] {
  const featuredSlugs = [
    'llm',
    'code-ai',
    'image-generation',
    'video-generation',
    'content-creation',
    'workflow-automation'
  ];

  return categories
    .filter(cat => featuredSlugs.includes(cat.slug))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}
