import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { Platform, Category } from '../types';
import { analytics } from '../utils/analytics';
import { FAQSchema, VisualFAQ } from '../components/FAQSchema';
import { SocialMetaTags } from '../components/SocialMetaTags';
import { StructuredData, createItemListSchema, createWebsiteSchema, createOrganizationSchema, createDatasetSchema } from '../components/StructuredData';
import OrganizedCategoriesSection from '../components/OrganizedCategoriesSection';
import type { Category as OrgCategory } from '../utils/category-organization';
import '../styles/HomePage.css';

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
      <section className="hero-section">
        <div className="homepage-container">
          <div className="hero-content">
            <h1 className="hero-title">
              AI Platforms Directory - Discover {totalPlatforms}+ AI Tools & Platforms (2026)
            </h1>
            <p className="hero-description">
              THE MOST COMPREHENSIVE DIRECTORY OF AI PLATFORMS, TOOLS, AND SOFTWARE. COMPARE FEATURES,
              PRICING, AND REVIEWS ACROSS {categories.length}+ CATEGORIES.
            </p>
            <div className="hero-update">
              🔄 Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <a href="/submit" className="hero-cta">
              SUBMIT YOUR AI TOOL
            </a>
          </div>
        </div>
      </section>

      {/* Organized Categories Section - Visible Organization */}
      <OrganizedCategoriesSection categories={categories as OrgCategory[]} />

      {/* Featured Platforms Section */}
      {featuredPlatforms.length > 0 && (
        <section className="featured-section">
          <div className="homepage-container">
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
        </section>
      )}

      {/* Recently Added Section */}
      {recentPlatforms.length > 0 && (
        <section className="recent-section">
          <div className="homepage-container">
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
        </section>
      )}

      {/* Featured Resources Section */}
      <section className="resources-section">
        <div className="homepage-container">
          <div className="section-header">
            <h2 className="section-title">
              📚 Featured Resources & Guides
            </h2>
            <p className="section-subtitle">
              Expert guides to help you choose the perfect AI platform for your needs
            </p>
          </div>

          <div className="resource-grid">
            {/* How to Choose AI Platforms */}
            <button
              onClick={() => navigate('/how-to-choose-ai-platforms')}
              aria-label="Read: How to Choose AI Platforms"
              className="resource-card"
            >
              <span className="resource-icon" aria-hidden="true">🎯</span>
              <h3 className="resource-title">
                How to Choose AI Platforms
              </h3>
              <p className="resource-description">
                Complete decision framework with interactive quiz to find the perfect AI platform for your needs. Compare {totalPlatforms}+ tools across 12 criteria.
              </p>
              <div className="resource-link">
                Take the Quiz →
              </div>
            </button>

            {/* Machine Learning Tools Directory */}
            <button
              onClick={() => navigate('/machine-learning-tools-directory')}
              aria-label="Browse: Machine Learning Tools Directory"
              className="resource-card"
            >
              <span className="resource-icon" aria-hidden="true">🤖</span>
              <h3 className="resource-title">ML Tools Directory</h3>
              <p className="resource-description">
                Comprehensive directory of machine learning frameworks and platforms. Compare features, pricing, and capabilities side-by-side.
              </p>
              <div className="resource-link">Compare ML Tools →</div>
            </button>

            {/* Natural Language Processing Tools */}
            <button
              onClick={() => navigate('/natural-language-processing-tools')}
              aria-label="Explore: Natural Language Processing Tools"
              className="resource-card"
            >
              <span className="resource-icon" aria-hidden="true">📝</span>
              <h3 className="resource-title">NLP Tools & Platforms</h3>
              <p className="resource-description">
                Discover the best natural language processing tools for text analytics, sentiment analysis, NER, and more. Match by use case.
              </p>
              <div className="resource-link">Find Your NLP Tool →</div>
            </button>

            {/* Computer Vision Platforms */}
            <button
              onClick={() => navigate('/computer-vision-platforms')}
              aria-label="Discover: Computer Vision Platforms"
              className="resource-card"
            >
              <span className="resource-icon" aria-hidden="true">👁️</span>
              <h3 className="resource-title">Computer Vision Platforms</h3>
              <p className="resource-description">
                Explore computer vision tools for image recognition, object detection, and facial analysis. Calculate ROI for your business.
              </p>
              <div className="resource-link">Calculate ROI →</div>
            </button>

            {/* Enterprise AI Solutions */}
            <button
              onClick={() => navigate('/enterprise-ai-solutions')}
              aria-label="Explore: Enterprise AI Solutions"
              className="resource-card"
            >
              <span className="resource-icon" aria-hidden="true">🏢</span>
              <h3 className="resource-title">Enterprise AI Solutions</h3>
              <p className="resource-description">
                Enterprise-grade AI platforms with focus on security, scalability, and compliance. Assess your organization's readiness.
              </p>
              <div className="resource-link">Take Assessment →</div>
            </button>
          </div>
        </div>
      </section>

      {/* Condensed SEO Content Section */}
      <section className="content-section">
        <div className="homepage-container">
          <div className="content-block">
            <h2 className="content-title">What is an AI Platform Directory?</h2>
            <p className="content-text">
              An AI platform directory is a curated collection of artificial intelligence tools designed to help
              businesses, developers, and individuals discover the right AI solutions. Our directory features {totalPlatforms}+
              AI platforms across {categories.length}+ specialized categories, from large language models (LLMs) to computer
              vision and code assistants. Whether you're looking for ChatGPT alternatives, AI image generators, or business intelligence tools,
              our comprehensive database provides detailed information on features, pricing, and user reviews.
            </p>
          </div>

          <div className="content-block">
            <h2 className="content-title">Why Use Our AI Tools Directory?</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-icon">📊</span>
                <h3 className="feature-title">Comprehensive Coverage</h3>
                <p className="feature-description">
                  {totalPlatforms}+ AI platforms across all major categories, updated daily with new discoveries.
                </p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🔍</span>
                <h3 className="feature-title">Easy Comparison</h3>
                <p className="feature-description">
                  Compare features, pricing, and capabilities side-by-side to find the perfect fit.
                </p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">⭐</span>
                <h3 className="feature-title">Curated Quality</h3>
                <p className="feature-description">
                  Hand-picked and verified AI tools, filtered for quality and real-world usefulness.
                </p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🔄</span>
                <h3 className="feature-title">Always Updated</h3>
                <p className="feature-description">
                  Automated discovery system adds new platforms daily. Never miss emerging AI tools.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="content-block">
            <h2 className="content-title">Frequently Asked Questions</h2>
            <VisualFAQ faqs={faqs} />
          </div>

          {/* Featured Guides Section */}
          {pillarPages.length > 0 && (
            <div className="content-block">
              <div className="section-header">
                <h2 className="section-title">📚 Featured AI Guides</h2>
                <p className="section-subtitle">
                  In-depth guides to help you master AI tools and make informed decisions
                </p>
              </div>

              <div className="guide-grid">
                {pillarPages.slice(0, 6).map((guide) => (
                  <button
                    key={guide.slug}
                    onClick={() => navigate(`/guide/${guide.slug}`)}
                    aria-label={`Read guide: ${guide.title}`}
                    className="guide-card"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/guide/${guide.slug}`);
                      }
                    }}
                  >
                    <h3 className="guide-title">{guide.title}</h3>
                    <p className="guide-description">{guide.metaDescription}</p>
                    <div className="guide-link">Read Guide →</div>
                  </button>
                ))}
              </div>
              {pillarPages.length > 6 && (
                <div className="guide-cta">
                  <button onClick={() => navigate('/guides')} className="guide-button">
                    View All Guides →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* All Platforms Section */}
      <section className="search-results-section">
        <div className="homepage-container" ref={resultsRef} id="all-categories">
        {search ? (
          <div className="search-header">
            <h2 className="search-title">
              SEARCH RESULTS FOR: "{search}"
            </h2>
            <button onClick={() => setSearchParams({})} className="clear-button">
              CLEAR SEARCH
            </button>
          </div>
        ) : (
          <div className="section-header">
            <h2 className="section-title">Browse All AI Tools</h2>
          </div>
        )}

        {/* Filters - Only show when searching or filtering */}
        {(search || selectedCategory !== 'all' || showFeatured) && (
          <div className="filters" style={{ marginBottom: '30px' }}>
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('all');
                setShowFeatured(false);
              }}
            >
              All Categories
            </button>
            <button
              className={`filter-btn ${showFeatured ? 'active' : ''}`}
              onClick={() => setShowFeatured(!showFeatured)}
            >
              ⭐ Featured Only
            </button>
            {selectedCategory !== 'all' && (
              <button
                className="filter-btn active"
                style={{ background: '#ffff00', borderColor: '#000' }}
              >
                {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading amazing AI tools...</div>
        ) : platforms.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3 className="no-results-title">NO RESULTS FOUND</h3>
            <p className="no-results-text">
              No AI tools match "{search}". Try a different search term.
            </p>
            <button onClick={() => setSearchParams({})} className="no-results-button">
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
      </section>
    </div>
  );
}

export default Home;
