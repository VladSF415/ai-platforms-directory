import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { Platform, Category } from '../types';
import { analytics } from '../utils/analytics';
import { FAQSchema, VisualFAQ } from '../components/FAQSchema';
import { SocialMetaTags } from '../components/SocialMetaTags';
import { StructuredData, createItemListSchema, createWebsiteSchema, createOrganizationSchema, createDatasetSchema } from '../components/StructuredData';
import { CategoryMegaMenu } from '../components/CategoryMegaMenu';

// Main curated categories for display
const MAIN_CATEGORIES = [
  'llms', 'ml-frameworks', 'computer-vision', 'nlp', 'generative-ai',
  'image-generation', 'video-generation', 'design-creative', 'audio-ai', 'video-ai',
  'code-ai', 'developer-tools', 'ai-code-assistants', 'testing-automation', 'no-code', 'workflow-automation',
  'enterprise-ai-platforms', 'analytics-bi', 'productivity', 'agent-platforms',
  'healthcare-ai', 'legal-ai', 'hr-tools', 'ecommerce-ai', 'search-ai'
];

function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredPlatforms, setFeaturedPlatforms] = useState<Platform[]>([]);
  const [recentPlatforms, setRecentPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const search = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFeatured, setShowFeatured] = useState(false);
  const [totalPlatforms, setTotalPlatforms] = useState(0);
  const [pillarPages, setPillarPages] = useState<any[]>([]);
  const [featuredBlogPosts, setFeaturedBlogPosts] = useState<any[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlatforms();
    fetchCategories();
    fetchFeaturedPlatforms();
    fetchRecentPlatforms();
  }, [selectedCategory, search, showFeatured]);

  // Auto-scroll to results when search is active
  useEffect(() => {
    if (search && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [search]);

  // Fetch pillar pages for Featured Guides section
  useEffect(() => {
    fetch('/api/pillar')
      .then(res => res.json())
      .then(data => setPillarPages(data))
      .catch(err => console.error('Failed to fetch pillar pages:', err));
  }, []);

  // Fetch featured blog posts (Make, n8n, Lovable)
  useEffect(() => {
    const blogSlugs = ['make-com-complete-guide-2026', 'n8n-vs-zapier-vs-make-comparison-2026', 'lovable-ai-app-builder-48-hour-guide'];
    Promise.all(
      blogSlugs.map(slug =>
        fetch(`/api/blog/${slug}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )
    )
      .then(posts => setFeaturedBlogPosts(posts.filter(p => p !== null)))
      .catch(err => console.error('Failed to fetch blog posts:', err));
  }, []);

  // Fetch total platform count on mount
  useEffect(() => {
    fetch('/api/platforms?limit=0')
      .then(res => res.json())
      .then(data => setTotalPlatforms(data.total))
      .catch(err => console.error('Failed to fetch total count:', err));
  }, []);

  // Track search with debounce
  useEffect(() => {
    if (search) {
      const timer = setTimeout(() => {
        analytics.search(search, platforms.length);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [search, platforms.length]);

  // Track category filter
  useEffect(() => {
    if (selectedCategory !== 'all') {
      analytics.filterCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (search) params.append('search', search);
      if (showFeatured) params.append('featured', 'true');
      params.append('limit', '1000'); // Show all platforms

      const response = await fetch(`/api/platforms?${params}`);
      const data = await response.json();
      setPlatforms(data.platforms);
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchFeaturedPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms?featured=true&limit=8');
      const data = await response.json();
      setFeaturedPlatforms(data.platforms);
    } catch (error) {
      console.error('Failed to fetch featured platforms:', error);
    }
  };

  const fetchRecentPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms?limit=6&sort=created_at&order=desc');
      const data = await response.json();
      setRecentPlatforms(data.platforms);
    } catch (error) {
      console.error('Failed to fetch recent platforms:', error);
    }
  };

  // Condensed FAQ data
  const faqs = [
    {
      question: 'What is the best AI tool in 2026?',
      answer: `The "best" AI tool depends on your specific needs. For general conversational AI, ChatGPT and Claude lead the market. For image generation, Midjourney and DALL-E 3 are top choices. For coding, GitHub Copilot and Cursor dominate. Our directory features ${totalPlatforms}+ platforms across ${MAIN_CATEGORIES.length}+ categories to help you find the perfect match for your use case.`
    },
    {
      question: 'Are there free AI tools available?',
      answer: 'Yes! Many AI platforms offer generous free tiers. Popular free options include ChatGPT (GPT-3.5), Claude AI (limited free usage), Stable Diffusion (open-source image generation), and various open-source ML frameworks. Use our filters to find free AI tools in any category.'
    },
    {
      question: 'How do I choose between different AI platforms?',
      answer: 'Consider these factors: (1) Your specific use case and requirements, (2) Pricing and budget constraints, (3) Integration capabilities with your existing tools, (4) Output quality and performance benchmarks, (5) API access and customization options, (6) Support and documentation quality. Try free trials when available to test before committing.'
    },
    {
      question: 'Can I submit my AI tool to this directory?',
      answer: 'Yes! We accept AI tool submissions from developers and companies. Click the "Submit Your AI Tool" button to add your platform. Basic listings are $49, with featured placement options available starting at $99/month. All submissions are reviewed before going live.'
    }
  ];

  return (
    <div className="app-container">
      {/* Social Meta Tags for sharing */}
      <SocialMetaTags
        title="AI Platforms Directory - Discover 1000+ AI Tools & Software (2026)"
        description="The most comprehensive directory of AI platforms, tools, and software. Compare features, pricing, and reviews across LLMs, generative AI, code assistants, computer vision, NLP, and more. Updated daily."
        url="https://aiplatformslist.com/"
        type="website"
      />

      {/* FAQ Schema for SEO */}
      <FAQSchema faqs={faqs} />

      {/* Structured Data for Rich Snippets */}
      <StructuredData data={createWebsiteSchema()} />
      <StructuredData data={createOrganizationSchema()} />
      <StructuredData data={createItemListSchema(platforms.slice(0, 50))} />
      <StructuredData data={createDatasetSchema(totalPlatforms)} />

      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            AI Platforms Directory - Discover {totalPlatforms}+ AI Tools & Platforms (2026)
          </h1>
          <p className="hero-subtitle">
            THE MOST COMPREHENSIVE DIRECTORY OF AI PLATFORMS, TOOLS, AND SOFTWARE. COMPARE FEATURES,
            PRICING, AND REVIEWS ACROSS {MAIN_CATEGORIES.length}+ CATEGORIES.
          </p>
          <div className="last-updated">
            🔄 Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <a href="/submit" className="submit-btn">
            SUBMIT YOUR AI TOOL
          </a>
        </div>
      </div>

      {/* Category Mega Menu */}
      <div className="section container">
        <div className="section-header">
          <h2 className="section-title">
            Browse by Category
          </h2>
        </div>
        <CategoryMegaMenu categories={categories} />
      </div>

      {/* Featured Platforms Section */}
      {featuredPlatforms.length > 0 && (
        <div className="section-gray">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                ⭐ Featured AI Tools
              </h2>
              <p className="section-subtitle">
                Top-rated platforms trusted by thousands of users
              </p>
            </div>

            <div className="platforms-grid">
              {featuredPlatforms.map((platform) => (
                <Link
                  key={platform.id}
                  to={`/platform/${platform.slug || platform.id}`}
                  className="platform-card"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    analytics.viewPlatform(platform.name, platform.id);
                  }}
                >
                  <div className="platform-header">
                    <div>
                      <div className="platform-name">{platform.name}</div>
                    </div>
                    <div className="platform-badges">
                      <span className="badge featured">⭐ Featured</span>
                      {platform.verified && (
                        <span className="badge verified">✓ Verified</span>
                      )}
                    </div>
                  </div>

                  <div className="platform-description">
                    {platform.description}
                  </div>

                  {platform.tags && platform.tags.length > 0 && (
                    <div className="platform-tags">
                      {platform.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="platform-footer">
                    <div>
                      {platform.rating && (
                        <div className="rating">
                          ★ {platform.rating.toFixed(1)}
                        </div>
                      )}
                      {platform.pricing && (
                        <div className="platform-pricing">
                          {platform.pricing}
                        </div>
                      )}
                    </div>
                    <span className="visit-btn">
                      Visit →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently Added Section */}
      {recentPlatforms.length > 0 && (
        <div className="container section">
          <div className="section-header">
            <h2 className="section-title">
              🆕 Recently Added
            </h2>
            <p className="section-subtitle">
              Discover the latest AI tools added to our directory
            </p>
          </div>

          <div className="platforms-grid">
            {recentPlatforms.map((platform) => (
              <Link
                key={platform.id}
                to={`/platform/${platform.slug || platform.id}`}
                className="platform-card"
                onClick={() => {
                  window.scrollTo(0, 0);
                  analytics.viewPlatform(platform.name, platform.id);
                }}
              >
                <div className="platform-header">
                  <div>
                    <div className="platform-name">{platform.name}</div>
                  </div>
                  <div className="platform-badges">
                    {platform.featured && (
                      <span className="badge featured">⭐ Featured</span>
                    )}
                    {platform.verified && (
                      <span className="badge verified">✓ Verified</span>
                    )}
                  </div>
                </div>

                <div className="platform-description">
                  {platform.description}
                </div>

                {platform.tags && platform.tags.length > 0 && (
                  <div className="platform-tags">
                    {platform.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="platform-footer">
                  <div>
                    {platform.rating && (
                      <div className="rating">
                        ★ {platform.rating.toFixed(1)}
                      </div>
                    )}
                    {platform.pricing && (
                      <div className="platform-pricing">
                        {platform.pricing}
                      </div>
                    )}
                  </div>
                  <span className="visit-btn">
                    Visit →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Resources Section */}
      <div className="section-dark">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              📚 Featured Resources & Guides
            </h2>
            <p className="section-subtitle">
              Expert guides to help you choose the perfect AI platform for your needs
            </p>
          </div>

          <div className="resources-grid">
            {/* How to Choose AI Platforms */}
            <button
              onClick={() => navigate('/how-to-choose-ai-platforms')}
              className="resource-card"
              aria-label="Read: How to Choose AI Platforms"
            >
              <div className="resource-icon" aria-hidden="true">🎯</div>
              <h3 className="resource-title">
                How to Choose AI Platforms
              </h3>
              <p className="resource-desc">
                Complete decision framework with interactive quiz to find the perfect AI platform for your needs. Compare {totalPlatforms}+ tools across 12 criteria.
              </p>
              <div className="resource-link">
                Take the Quiz →
              </div>
            </button>

            {/* Machine Learning Tools Directory */}
            <button
              onClick={() => navigate('/machine-learning-tools-directory')}
              className="resource-card"
              aria-label="Browse: Machine Learning Tools Directory"
            >
              <div className="resource-icon" aria-hidden="true">🤖</div>
              <h3 className="resource-title">
                ML Tools Directory
              </h3>
              <p className="resource-desc">
                Comprehensive directory of machine learning frameworks and platforms. Compare features, pricing, and capabilities side-by-side.
              </p>
              <div className="resource-link">
                Compare ML Tools →
              </div>
            </button>

            {/* Natural Language Processing Tools */}
            <button
              onClick={() => navigate('/natural-language-processing-tools')}
              className="resource-card"
              aria-label="Explore: Natural Language Processing Tools"
            >
              <div className="resource-icon" aria-hidden="true">📝</div>
              <h3 className="resource-title">
                NLP Tools & Platforms
              </h3>
              <p className="resource-desc">
                Discover the best natural language processing tools for text analytics, sentiment analysis, NER, and more. Match by use case.
              </p>
              <div className="resource-link">
                Find Your NLP Tool →
              </div>
            </button>

            {/* Computer Vision Platforms */}
            <button
              onClick={() => navigate('/computer-vision-platforms')}
              className="resource-card"
              aria-label="Discover: Computer Vision Platforms"
            >
              <div className="resource-icon" aria-hidden="true">👁️</div>
              <h3 className="resource-title">
                Computer Vision Platforms
              </h3>
              <p className="resource-desc">
                Explore computer vision tools for image recognition, object detection, and facial analysis. Calculate ROI for your business.
              </p>
              <div className="resource-link">
                Calculate ROI →
              </div>
            </button>

            {/* Enterprise AI Solutions */}
            <button
              onClick={() => navigate('/enterprise-ai-solutions')}
              className="resource-card"
              aria-label="Explore: Enterprise AI Solutions"
            >
              <div className="resource-icon" aria-hidden="true">🏢</div>
              <h3 className="resource-title">
                Enterprise AI Solutions
              </h3>
              <p className="resource-desc">
                Enterprise-grade AI platforms with focus on security, scalability, and compliance. Assess your organization's readiness.
              </p>
              <div className="resource-link">
                Take Assessment →
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Blog Posts Section */}
      {featuredBlogPosts.length > 0 && (
        <div className="section-blog-posts">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                📖 Featured Blog Posts & Guides
              </h2>
              <p className="section-subtitle">
                In-depth guides on automation platforms, AI development, and workflow optimization
              </p>
            </div>

            <div className="blog-posts-grid">
              {featuredBlogPosts.map((post) => (
                <button
                  key={post.slug}
                  onClick={() => {
                    navigate(`/blog/${post.slug}`);
                    window.scrollTo(0, 0);
                  }}
                  className="blog-post-card"
                  aria-label={`Read: ${post.title}`}
                >
                  <div className="blog-header">
                    <span className="read-time">📖 {post.readTime}</span>
                    <span className="trust-badge">✓ Verified</span>
                  </div>

                  <h3 className="blog-title">
                    {post.title}
                  </h3>

                  <p className="blog-excerpt">
                    {post.excerpt}
                  </p>

                  <div className="blog-meta">
                    <span className="blog-author">
                      By {post.author}
                    </span>
                    <span className="blog-date">
                      {new Date(post.publishedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="blog-keywords">
                    {post.keywords?.slice(0, 3).map((keyword: string, i: number) => (
                      <span key={i} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>

                  <div className="blog-cta">
                    Read Full Article →
                  </div>
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={() => {
                  navigate('/blog');
                  window.scrollTo(0, 0);
                }}
                className="view-all-btn"
              >
                View All Blog Posts →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Condensed SEO Content Section */}
      <div className="container section">
        <section style={{ marginBottom: '60px' }}>
          <h2 className="section-title">
            What is an AI Platform Directory?
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px' }}>
            An AI platform directory is a curated collection of artificial intelligence tools designed to help
            businesses, developers, and individuals discover the right AI solutions. Our directory features {totalPlatforms}+
            AI platforms across {MAIN_CATEGORIES.length}+ specialized categories, from large language models (LLMs) to computer
            vision and code assistants. Whether you're looking for ChatGPT alternatives, AI image generators, or business intelligence tools,
            our comprehensive database provides detailed information on features, pricing, and user reviews.
          </p>
        </section>

        <section style={{ marginBottom: '60px' }}>
          <h2 className="section-title">
            Why Use Our AI Tools Directory?
          </h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📊</div>
              <h3 className="info-title">Comprehensive Coverage</h3>
              <p style={{ lineHeight: '1.6' }}>
                {totalPlatforms}+ AI platforms across all major categories, updated daily with new discoveries.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔍</div>
              <h3 className="info-title">Easy Comparison</h3>
              <p style={{ lineHeight: '1.6' }}>
                Compare features, pricing, and capabilities side-by-side to find the perfect fit.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">⭐</div>
              <h3 className="info-title">Curated Quality</h3>
              <p style={{ lineHeight: '1.6' }}>
                Hand-picked and verified AI tools, filtered for quality and real-world usefulness.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔄</div>
              <h3 className="info-title">Always Updated</h3>
              <p style={{ lineHeight: '1.6' }}>
                Automated discovery system adds new platforms daily. Never miss emerging AI tools.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ marginBottom: '60px' }}>
          <h2 className="section-title">
            Frequently Asked Questions
          </h2>
          <VisualFAQ faqs={faqs} />
        </section>

        {/* Featured Guides Section - Dynamic */}
        {pillarPages.length > 0 && (
          <section style={{ marginBottom: '60px' }}>
            <div className="section-header">
              <h2 className="section-title">
                📚 Featured AI Guides
              </h2>
              <p className="section-subtitle">
                In-depth guides to help you master AI tools and make informed decisions
              </p>
            </div>

            <div className="resources-grid">
              {pillarPages.slice(0, 6).map((guide) => (
                <button
                  key={guide.slug}
                  onClick={() => navigate(`/guide/${guide.slug}`)}
                  className="resource-card"
                  aria-label={`Read guide: ${guide.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/guide/${guide.slug}`);
                    }
                  }}
                >
                  <h3 className="resource-title">
                    {guide.title}
                  </h3>
                  <p className="resource-desc">
                    {guide.metaDescription}
                  </p>
                  <div className="resource-link">
                    Read Guide →
                  </div>
                </button>
              ))}
            </div>
            {pillarPages.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                  onClick={() => navigate('/guides')}
                  className="view-all-btn"
                >
                  View All Guides →
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* All Platforms Section */}
      <div className="container section" ref={resultsRef} id="all-categories">
        {search ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '30px',
            padding: '20px',
            background: '#000000',
            border: '4px solid #000000'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: '#ffffff',
              margin: 0,
              fontFamily: 'inherit',
              textTransform: 'uppercase'
            }}>
              SEARCH RESULTS FOR: "{search}"
            </h2>
            <button
              onClick={() => setSearchParams({})}
              className="view-all-btn"
              style={{
                background: '#ffffff',
                color: '#000000',
                border: '3px solid #ffffff'
              }}
            >
              CLEAR SEARCH
            </button>
          </div>
        ) : (
          <div className="section-header">
            <h2 className="section-title">
              Browse All AI Tools
            </h2>
          </div>
        )}

        <div className="categories-organized">
          {/* Top Controls */}
          <div className="category-controls">
            <button
              className={`control-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </button>
            <button
              className={`control-btn featured-btn ${showFeatured ? 'active' : ''}`}
              onClick={() => setShowFeatured(!showFeatured)}
            >
              ⭐ Featured Only
            </button>
          </div>

          {/* Organized Category Groups */}
          <div className="category-groups">
            {/* AI Infrastructure */}
            <div className="category-group">
              <h3 className="group-title">🧠 AI Infrastructure</h3>
              <div className="group-categories">
                {['llms', 'ml-frameworks', 'computer-vision', 'nlp', 'generative-ai'].map(slug => {
                  const cat = categories.find(c => c.slug === slug);
                  return cat ? (
                    <button
                      key={cat.slug}
                      className={`category-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-count">{cat.count}</span>
                    </button>
                  ) : null;
                })}
              </div>
            </div>

            {/* Creative & Design */}
            <div className="category-group">
              <h3 className="group-title">🎨 Creative & Design</h3>
              <div className="group-categories">
                {['image-generation', 'video-generation', 'design-creative', 'audio-ai', 'video-ai'].map(slug => {
                  const cat = categories.find(c => c.slug === slug);
                  return cat ? (
                    <button
                      key={cat.slug}
                      className={`category-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-count">{cat.count}</span>
                    </button>
                  ) : null;
                })}
              </div>
            </div>

            {/* Development */}
            <div className="category-group">
              <h3 className="group-title">💻 Development & Automation</h3>
              <div className="group-categories">
                {['code-ai', 'developer-tools', 'ai-code-assistants', 'testing-automation', 'no-code', 'workflow-automation'].map(slug => {
                  const cat = categories.find(c => c.slug === slug);
                  return cat ? (
                    <button
                      key={cat.slug}
                      className={`category-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-count">{cat.count}</span>
                    </button>
                  ) : null;
                })}
              </div>
            </div>

            {/* Business & Productivity */}
            <div className="category-group">
              <h3 className="group-title">📊 Business & Productivity</h3>
              <div className="group-categories">
                {['enterprise-ai-platforms', 'analytics-bi', 'productivity', 'workflow-automation', 'agent-platforms'].map(slug => {
                  const cat = categories.find(c => c.slug === slug);
                  return cat ? (
                    <button
                      key={cat.slug}
                      className={`category-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-count">{cat.count}</span>
                    </button>
                  ) : null;
                })}
              </div>
            </div>

            {/* Industry Specific */}
            <div className="category-group">
              <h3 className="group-title">🏥 Industry Specific</h3>
              <div className="group-categories">
                {['healthcare-ai', 'legal-ai', 'hr-tools', 'ecommerce-ai', 'search-ai'].map(slug => {
                  const cat = categories.find(c => c.slug === slug);
                  return cat ? (
                    <button
                      key={cat.slug}
                      className={`category-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-count">{cat.count}</span>
                    </button>
                  ) : null;
                })}
              </div>
            </div>

            {/* More Categories */}
            <div className="category-group more-categories">
              <h3 className="group-title">📁 More Categories</h3>
              <div className="group-categories">
                {categories
                  .filter(cat => ![
                    'llms', 'ml-frameworks', 'computer-vision', 'nlp', 'generative-ai',
                    'image-generation', 'video-generation', 'design-creative', 'audio-ai', 'video-ai',
                    'code-ai', 'developer-tools', 'ai-code-assistants', 'testing-automation', 'no-code', 'workflow-automation',
                    'enterprise-ai-platforms', 'analytics-bi', 'productivity', 'agent-platforms',
                    'healthcare-ai', 'legal-ai', 'hr-tools', 'ecommerce-ai', 'search-ai'
                  ].includes(cat.slug))
                  .slice(0, 15)
                  .map(cat => (
                    <button
                      key={cat.slug}
                      className={`category-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-count">{cat.count}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading amazing AI tools...</div>
        ) : platforms.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f5f5f5',
            border: '4px solid #000000'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>🔍</div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 900,
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              NO RESULTS FOUND
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '24px'
            }}>
              No AI tools match "{search}". Try a different search term.
            </p>
            <button
              onClick={() => setSearchParams({})}
              className="view-all-btn"
            >
              SHOW ALL TOOLS
            </button>
          </div>
        ) : (
          <>
            <div className="stats">
              <div className="stat">
                <div className="stat-number">{platforms.length}</div>
                <div className="stat-label">{search ? 'Results' : 'Platforms'}</div>
              </div>
              <div className="stat">
                <div className="stat-number">{MAIN_CATEGORIES.length}</div>
                <div className="stat-label">Categories</div>
              </div>
              <div className="stat">
                <div className="stat-number">
                  {platforms.filter(p => p.featured).length}
                </div>
                <div className="stat-label">Featured</div>
              </div>
            </div>

            <div className="platforms-grid">
              {platforms.map((platform) => (
                <Link
                  key={platform.id}
                  to={`/platform/${platform.slug || platform.id}`}
                  className="platform-card"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    analytics.viewPlatform(platform.name, platform.id);
                  }}
                >
                  <div className="platform-header">
                    <div>
                      <div className="platform-name">{platform.name}</div>
                    </div>
                    <div className="platform-badges">
                      {platform.featured && (
                        <span className="badge featured">⭐ Featured</span>
                      )}
                      {platform.verified && (
                        <span className="badge verified">✓ Verified</span>
                      )}
                    </div>
                  </div>

                  <div className="platform-description">
                    {platform.description}
                  </div>

                  {platform.tags && platform.tags.length > 0 && (
                    <div className="platform-tags">
                      {platform.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="platform-footer">
                    <div>
                      {platform.rating && (
                        <div className="rating">
                          ★ {platform.rating.toFixed(1)}
                        </div>
                      )}
                      {platform.pricing && (
                        <div className="platform-pricing">
                          {platform.pricing}
                        </div>
                      )}
                    </div>
                    <span className="visit-btn">
                      Visit →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
