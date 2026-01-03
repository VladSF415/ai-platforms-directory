import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { Platform, Category } from '../types';
import { analytics } from '../utils/analytics';
import { FAQSchema, VisualFAQ } from '../components/FAQSchema';
import { SocialMetaTags } from '../components/SocialMetaTags';
import { StructuredData, createItemListSchema, createWebsiteSchema, createOrganizationSchema, createDatasetSchema } from '../components/StructuredData';

// Category icon mapping
const categoryIcons: Record<string, string> = {
  'llms': '🤖',
  'generative-ai': '✨',
  'code-ai': '💻',
  'computer-vision': '👁️',
  'nlp': '📝',
  'image-generation': '🎨',
  'video-ai': '🎬',
  'video-generation': '📹',
  'analytics-bi': '📊',
  'ml-frameworks': '🔧',
  'agent-platforms': '🤝',
  'search-ai': '🔍',
  'audio-ai': '🎵',
  'workflow-automation': '⚙️',
  'enterprise-ai-platforms': '🏢',
  'healthcare-ai': '⚕️',
  'legal-ai': '⚖️',
  'data-governance': '🔐',
  'llm-ops': '🛠️',
  'marketplace-ai': '🏪',
  'website-ai': '🌐',
};

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

  // Platform click now handled by Link components

  // Condensed FAQ data
  const faqs = [
    {
      question: 'What is the best AI tool in 2026?',
      answer: `The "best" AI tool depends on your specific needs. For general conversational AI, ChatGPT and Claude lead the market. For image generation, Midjourney and DALL-E 3 are top choices. For coding, GitHub Copilot and Cursor dominate. Our directory features ${totalPlatforms}+ platforms across all categories to help you find the perfect match for your use case.`
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
    <div>
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
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '20px', letterSpacing: '-1px', color: '#000000', lineHeight: '1.2' }}>
            AI Platforms Directory - Discover {totalPlatforms}+ AI Tools & Platforms (2026)
          </h1>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', maxWidth: '900px', margin: '0 auto 15px', color: '#000000', lineHeight: '1.6' }}>
            THE MOST COMPREHENSIVE DIRECTORY OF AI PLATFORMS, TOOLS, AND SOFTWARE. COMPARE FEATURES,
            PRICING, AND REVIEWS ACROSS {categories.length}+ CATEGORIES.
          </p>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '30px', fontWeight: '600' }}>
            🔄 Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <a href="/submit" className="submit-btn">
            SUBMIT YOUR AI TOOL
          </a>
        </div>
      </div>

      {/* Visual Category Grid - Immediately accessible */}
      <div className="container" style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: '900', textAlign: 'center' }}>
          Browse by Category
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          {categories.slice(0, 12).map((category) => (
            <button
              key={category.slug}
              onClick={() => navigate(`/category/${category.slug}`)}
              aria-label={`Browse ${category.name} category with ${category.count} tools`}
              style={{
                border: '4px solid #000',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#fff',
                textAlign: 'center',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/category/${category.slug}`);
                }
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }} aria-hidden="true">
                {categoryIcons[category.slug] || '⚡'}
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '900',
                marginBottom: '8px',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace"
              }}>
                {category.name}
              </h3>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#666',
                fontFamily: "'Courier New', monospace"
              }}>
                {category.count} tools
              </div>
            </button>
          ))}
        </div>
        {categories.length > 12 && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                const el = document.getElementById('all-categories');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                padding: '14px 28px',
                background: '#000',
                color: '#fff',
                border: '4px solid #000',
                fontFamily: "'Courier New', monospace",
                fontWeight: '900',
                fontSize: '14px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              View All {categories.length} Categories →
            </button>
          </div>
        )}
      </div>

      {/* Featured Platforms Section */}
      {featuredPlatforms.length > 0 && (
        <div style={{ background: '#f5f5f5', padding: '60px 0', marginBottom: '60px' }}>
          <div className="container">
            <h2 style={{ fontSize: '32px', marginBottom: '15px', fontWeight: '900', textAlign: 'center' }}>
              ⭐ Featured AI Tools
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '40px', fontSize: '18px', opacity: 0.8 }}>
              Top-rated platforms trusted by thousands of users
            </p>

            <div className="platforms-grid">
              {featuredPlatforms.map((platform) => (
                <Link
                  key={platform.id}
                  to={`/platform/${platform.slug || platform.id}`}
                  className="platform-card"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
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
        <div className="container" style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '15px', fontWeight: '900', textAlign: 'center' }}>
            🆕 Recently Added
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '40px', fontSize: '18px', opacity: 0.8 }}>
            Discover the latest AI tools added to our directory
          </p>

          <div className="platforms-grid">
            {recentPlatforms.map((platform) => (
              <Link
                key={platform.id}
                to={`/platform/${platform.slug || platform.id}`}
                className="platform-card"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
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
      <div style={{ background: '#000000', padding: '60px 0', marginBottom: '60px', borderTop: '8px solid #000000', borderBottom: '8px solid #000000' }}>
        <div className="container">
          <h2 style={{
            fontSize: '32px',
            marginBottom: '15px',
            fontWeight: '900',
            textAlign: 'center',
            color: '#ffffff',
            textTransform: 'uppercase',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '-1px'
          }}>
            📚 Featured Resources & Guides
          </h2>
          <p style={{
            textAlign: 'center',
            marginBottom: '40px',
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: '700',
            textTransform: 'uppercase',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '1px'
          }}>
            Expert guides to help you choose the perfect AI platform for your needs
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* How to Choose AI Platforms */}
            <button
              onClick={() => navigate('/how-to-choose-ai-platforms')}
              aria-label="Read: How to Choose AI Platforms"
              style={{
                border: '4px solid #000',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#fff',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }} aria-hidden="true">🎯</div>
              <h3 style={{
                fontWeight: '900',
                marginBottom: '12px',
                fontSize: '20px',
                lineHeight: '1.3',
                fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase'
              }}>
                How to Choose AI Platforms
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '18px'
              }}>
                Complete decision framework with interactive quiz to find the perfect AI platform for your needs. Compare {totalPlatforms}+ tools across 12 criteria.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '900',
                gap: '5px',
                color: '#000000',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace"
              }}>
                Take the Quiz →
              </div>
            </button>

            {/* Machine Learning Tools Directory */}
            <button
              onClick={() => navigate('/machine-learning-tools-directory')}
              aria-label="Browse: Machine Learning Tools Directory"
              style={{
                border: '4px solid #000',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#fff',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }} aria-hidden="true">🤖</div>
              <h3 style={{
                fontWeight: '900',
                marginBottom: '12px',
                fontSize: '20px',
                lineHeight: '1.3',
                fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase'
              }}>
                ML Tools Directory
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '18px'
              }}>
                Comprehensive directory of machine learning frameworks and platforms. Compare features, pricing, and capabilities side-by-side.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '900',
                gap: '5px',
                color: '#000000',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace"
              }}>
                Compare ML Tools →
              </div>
            </button>

            {/* Natural Language Processing Tools */}
            <button
              onClick={() => navigate('/natural-language-processing-tools')}
              aria-label="Explore: Natural Language Processing Tools"
              style={{
                border: '4px solid #000',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#fff',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }} aria-hidden="true">📝</div>
              <h3 style={{
                fontWeight: '900',
                marginBottom: '12px',
                fontSize: '20px',
                lineHeight: '1.3',
                fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase'
              }}>
                NLP Tools & Platforms
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '18px'
              }}>
                Discover the best natural language processing tools for text analytics, sentiment analysis, NER, and more. Match by use case.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '900',
                gap: '5px',
                color: '#000000',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace"
              }}>
                Find Your NLP Tool →
              </div>
            </button>

            {/* Computer Vision Platforms */}
            <button
              onClick={() => navigate('/computer-vision-platforms')}
              aria-label="Discover: Computer Vision Platforms"
              style={{
                border: '4px solid #000',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#fff',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }} aria-hidden="true">👁️</div>
              <h3 style={{
                fontWeight: '900',
                marginBottom: '12px',
                fontSize: '20px',
                lineHeight: '1.3',
                fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase'
              }}>
                Computer Vision Platforms
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '18px'
              }}>
                Explore computer vision tools for image recognition, object detection, and facial analysis. Calculate ROI for your business.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '900',
                gap: '5px',
                color: '#000000',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace"
              }}>
                Calculate ROI →
              </div>
            </button>

            {/* Enterprise AI Solutions */}
            <button
              onClick={() => navigate('/enterprise-ai-solutions')}
              aria-label="Explore: Enterprise AI Solutions"
              style={{
                border: '4px solid #000',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#fff',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }} aria-hidden="true">🏢</div>
              <h3 style={{
                fontWeight: '900',
                marginBottom: '12px',
                fontSize: '20px',
                lineHeight: '1.3',
                fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase'
              }}>
                Enterprise AI Solutions
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '18px'
              }}>
                Enterprise-grade AI platforms with focus on security, scalability, and compliance. Assess your organization's readiness.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '900',
                gap: '5px',
                color: '#000000',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace"
              }}>
                Take Assessment →
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Condensed SEO Content Section */}
      <div className="container seo-content-section" style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }}>
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '900' }}>
            What is an AI Platform Directory?
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px' }}>
            An AI platform directory is a curated collection of artificial intelligence tools designed to help
            businesses, developers, and individuals discover the right AI solutions. Our directory features {totalPlatforms}+
            AI platforms across {categories.length}+ specialized categories, from large language models (LLMs) to computer
            vision and code assistants. Whether you're looking for ChatGPT alternatives, AI image generators, or business intelligence tools,
            our comprehensive database provides detailed information on features, pricing, and user reviews.
          </p>
        </section>

        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '900' }}>
            Why Use Our AI Tools Directory?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ border: '3px solid #000', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
              <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>Comprehensive Coverage</h3>
              <p style={{ lineHeight: '1.6' }}>
                {totalPlatforms}+ AI platforms across all major categories, updated daily with new discoveries.
              </p>
            </div>
            <div style={{ border: '3px solid #000', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
              <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>Easy Comparison</h3>
              <p style={{ lineHeight: '1.6' }}>
                Compare features, pricing, and capabilities side-by-side to find the perfect fit.
              </p>
            </div>
            <div style={{ border: '3px solid #000', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⭐</div>
              <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>Curated Quality</h3>
              <p style={{ lineHeight: '1.6' }}>
                Hand-picked and verified AI tools, filtered for quality and real-world usefulness.
              </p>
            </div>
            <div style={{ border: '3px solid #000', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔄</div>
              <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>Always Updated</h3>
              <p style={{ lineHeight: '1.6' }}>
                Automated discovery system adds new platforms daily. Never miss emerging AI tools.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: '900' }}>
            Frequently Asked Questions
          </h2>
          <VisualFAQ faqs={faqs} />
        </section>

        {/* Featured Guides Section */}
        {pillarPages.length > 0 && (
          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '15px', fontWeight: '900', textAlign: 'center' }}>
              📚 Featured AI Guides
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '40px', fontSize: '18px', opacity: 0.8 }}>
              In-depth guides to help you master AI tools and make informed decisions
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {pillarPages.slice(0, 6).map((guide) => (
                <button
                  key={guide.slug}
                  onClick={() => navigate(`/guide/${guide.slug}`)}
                  aria-label={`Read guide: ${guide.title}`}
                  style={{
                    border: '3px solid #000',
                    padding: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: '#fff',
                    textAlign: 'left',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0 #000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/guide/${guide.slug}`);
                    }
                  }}
                >
                  <h3 style={{
                    fontWeight: '900',
                    marginBottom: '12px',
                    fontSize: '20px',
                    lineHeight: '1.3'
                  }}>
                    {guide.title}
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    opacity: 0.8,
                    marginBottom: '15px'
                  }}>
                    {guide.metaDescription}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    gap: '5px'
                  }}>
                    Read Guide →
                  </div>
                </button>
              ))}
            </div>
            {pillarPages.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                  onClick={() => navigate('/guides')}
                  style={{
                    padding: '14px 28px',
                    background: '#000',
                    color: '#fff',
                    border: '4px solid #000',
                    fontFamily: "'Courier New', monospace",
                    fontWeight: '900',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  View All Guides →
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* All Platforms Section */}
      <div className="container" ref={resultsRef} id="all-categories">
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
              fontFamily: "'Courier New', monospace",
              textTransform: 'uppercase'
            }}>
              SEARCH RESULTS FOR: "{search}"
            </h2>
            <button
              onClick={() => setSearchParams({})}
              style={{
                padding: '12px 24px',
                background: '#ffffff',
                color: '#000000',
                border: '3px solid #ffffff',
                fontFamily: "'Courier New', monospace",
                fontWeight: 900,
                fontSize: '14px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#000000';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#000000';
              }}
            >
              CLEAR SEARCH
            </button>
          </div>
        ) : (
          <h2 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: '900', textAlign: 'center' }}>
            Browse All AI Tools
          </h2>
        )}

        <div className="filters">
          <button
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              className={`filter-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
          <button
            className={`filter-btn ${showFeatured ? 'active' : ''}`}
            onClick={() => setShowFeatured(!showFeatured)}
          >
            ⭐ Featured
          </button>
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
              fontFamily: "'Courier New', monospace",
              textTransform: 'uppercase'
            }}>
              NO RESULTS FOUND
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '24px',
              fontFamily: "'Courier New', monospace"
            }}>
              No AI tools match "{search}". Try a different search term.
            </p>
            <button
              onClick={() => setSearchParams({})}
              style={{
                padding: '14px 28px',
                background: '#000000',
                color: '#ffffff',
                border: '4px solid #000000',
                fontFamily: "'Courier New', monospace",
                fontWeight: 900,
                fontSize: '14px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
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
                <div className="stat-number">{categories.length}</div>
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
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
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
