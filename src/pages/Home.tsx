import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Platform, Category } from '../types';
import { analytics } from '../utils/analytics';
import { FAQSchema, VisualFAQ } from '../components/FAQSchema';
import { SocialMetaTags } from '../components/SocialMetaTags';

function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  const handlePlatformClick = (platform: Platform) => {
    // Navigate to platform detail page
    navigate(`/platform/${platform.slug || platform.id}`);
  };

  // FAQ data for schema
  const faqs = [
    {
      question: 'What is the best AI tool in 2025?',
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
      question: 'What are LLMs (Large Language Models)?',
      answer: 'Large Language Models (LLMs) are AI systems trained on vast amounts of text data to understand and generate human-like text. Examples include ChatGPT (GPT-4), Claude, Gemini, and LLaMA. They excel at tasks like content creation, code generation, question answering, translation, and conversational AI. Our directory features 30+ LLM platforms with detailed comparisons.'
    },
    {
      question: 'Can I submit my AI tool to this directory?',
      answer: 'Yes! We accept AI tool submissions from developers and companies. Click the "Submit Your AI Tool" button to add your platform. Basic listings are $49, with featured placement options available starting at $99/month. All submissions are reviewed before going live.'
    },
    {
      question: 'How often is the directory updated?',
      answer: 'Our directory is updated daily through an automated discovery system powered by DeepSeek AI. We continuously monitor for new AI platforms, pricing changes, and feature updates. Platform information is verified and enriched with detailed descriptions, use cases, and pricing details.'
    },
    {
      question: 'What categories of AI tools do you cover?',
      answer: `We cover ${categories.length}+ categories including: Large Language Models (LLMs), Generative AI, Code AI Assistants, Computer Vision, Natural Language Processing (NLP), Image Generation, Video AI, Machine Learning Frameworks, Analytics & BI, Agent Platforms, and more. Each category has dedicated landing pages with comprehensive guides.`
    },
    {
      question: 'Are the AI tools on this site affiliate links?',
      answer: 'Some platforms in our directory participate in affiliate programs, which helps us maintain and improve the service. We only list AI tools based on their quality and usefulness, regardless of affiliate status. Affiliate participation does not influence our curation or recommendations.'
    }
  ];

  return (
    <div>
      {/* Social Meta Tags for sharing */}
      <SocialMetaTags
        title="AI Platforms Directory - Discover 150+ AI Tools & Software (2025)"
        description="The most comprehensive directory of AI platforms, tools, and software. Compare features, pricing, and reviews across LLMs, generative AI, code assistants, computer vision, NLP, and more. Updated daily."
        url="https://aiplatformslist.com/"
        type="website"
      />

      {/* FAQ Schema for SEO */}
      <FAQSchema faqs={faqs} />

      <div className="container" style={{ paddingTop: '60px', paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '-2px', color: '#000000' }}>
            DISCOVER {totalPlatforms}+ AI TOOLS
          </h1>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', maxWidth: '900px', margin: '0 auto 30px', color: '#000000', lineHeight: '1.6' }}>
            THE MOST COMPREHENSIVE DIRECTORY OF AI PLATFORMS, TOOLS, AND SOFTWARE. COMPARE FEATURES,
            PRICING, AND REVIEWS ACROSS {categories.length}+ CATEGORIES INCLUDING LLMS, GENERATIVE AI,
            CODE ASSISTANTS, COMPUTER VISION, NLP, AND MORE.
          </p>
          <a href="/submit" className="submit-btn">
            SUBMIT YOUR AI TOOL
          </a>
        </div>
      </div>

      {/* SEO Content Section */}
      <div className="container seo-content-section" style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }}>
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '900' }}>
            What is an AI Platform Directory?
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px' }}>
            An AI platform directory is a curated collection of artificial intelligence tools, software, and services designed to help
            businesses, developers, and individuals discover the right AI solutions for their needs. Our directory features {totalPlatforms}+
            AI platforms across {categories.length}+ specialized categories, from large language models (LLMs) and generative AI to computer
            vision, natural language processing, and code assistants.
          </p>
          <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '20px' }}>
            Whether you're looking for the best ChatGPT alternatives, AI image generators, coding assistants, or business intelligence tools,
            our comprehensive database provides detailed information on features, pricing, use cases, and user reviews. Each platform listing
            includes direct links, pricing information, and comparisons to help you make informed decisions.
          </p>
        </section>

        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '900' }}>
            Top AI Tool Categories
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>🤖 Large Language Models (LLMs)</h3>
              <p style={{ lineHeight: '1.6' }}>
                Discover powerful language models like ChatGPT, Claude, GPT-4, and open-source alternatives. Compare capabilities,
                pricing, and use cases for content generation, coding, research, and conversational AI.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>🎨 Generative AI Tools</h3>
              <p style={{ lineHeight: '1.6' }}>
                Explore cutting-edge generative AI platforms for creating text, images, videos, and audio. From Midjourney and DALL-E
                to music generators and video synthesis tools.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>💻 Code AI Assistants</h3>
              <p style={{ lineHeight: '1.6' }}>
                Find the best AI coding tools including GitHub Copilot alternatives, code completion, debugging assistants, and
                automated testing platforms to boost developer productivity.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>👁️ Computer Vision</h3>
              <p style={{ lineHeight: '1.6' }}>
                Access advanced computer vision platforms for object detection, facial recognition, image classification, OCR, and
                visual AI applications across industries.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>📝 Natural Language Processing</h3>
              <p style={{ lineHeight: '1.6' }}>
                Discover NLP tools for text analysis, sentiment detection, entity extraction, translation, summarization, and
                language understanding capabilities.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>🎬 Video & Image AI</h3>
              <p style={{ lineHeight: '1.6' }}>
                Find AI video editing, generation, and image creation tools. From text-to-video platforms to AI-powered editing
                suites and image enhancement software.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '900' }}>
            How to Choose the Right AI Tool
          </h2>
          <div style={{ background: '#f5f5f5', border: '4px solid #000', padding: '30px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>1. Define Your Use Case</h3>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
              Start by clearly identifying what you need the AI tool to accomplish. Are you looking for content creation, code assistance,
              data analysis, or automation? Different tools excel at different tasks.
            </p>

            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>2. Consider Pricing & Budget</h3>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
              AI platforms range from free tools to enterprise solutions costing thousands per month. Compare pricing tiers, free trials,
              and what features are included at each level. Many tools offer freemium models with generous free tiers.
            </p>

            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>3. Evaluate Integration Capabilities</h3>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
              Check if the AI tool integrates with your existing workflow, tech stack, and favorite applications. API access, SDKs,
              and pre-built integrations can save significant implementation time.
            </p>

            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>4. Review Performance & Quality</h3>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
              Test output quality, speed, accuracy, and reliability. Read user reviews, compare benchmarks, and try free trials before
              committing to paid plans. Different models have different strengths.
            </p>

            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>5. Check Support & Documentation</h3>
            <p style={{ lineHeight: '1.6' }}>
              Ensure the platform offers adequate documentation, tutorials, customer support, and community resources. Good support
              can make the difference between success and frustration.
            </p>
          </div>
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

        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: '900' }}>
            Frequently Asked Questions
          </h2>
          <VisualFAQ faqs={faqs} />
        </section>

        {/* Featured Guides Section */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '15px', fontWeight: '900', textAlign: 'center' }}>
            Featured AI Guides
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '40px', fontSize: '18px', opacity: 0.8 }}>
            In-depth guides to help you master AI tools and make informed decisions
          </p>

          {pillarPages.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {pillarPages.map((guide) => (
                <div
                  key={guide.slug}
                  onClick={() => navigate(`/guide/${guide.slug}`)}
                  style={{
                    border: '3px solid #000',
                    padding: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0 #000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
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
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="container" ref={resultsRef}>
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
                <div
                  key={platform.id}
                  className="platform-card"
                  onClick={() => handlePlatformClick(platform)}
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
                    <button
                      className="visit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlatformClick(platform);
                      }}
                    >
                      Visit →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
