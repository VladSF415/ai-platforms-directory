import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Platform } from '../types';
import { analytics } from '../utils/analytics';
import { SoftwareApplicationSchema } from '../components/SoftwareApplicationSchema';
import { BreadcrumbSchema } from '../components/BreadcrumbSchema';
import { SocialMetaTags } from '../components/SocialMetaTags';
import './PlatformDetailRedesign.css';

function PlatformDetailRedesign() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedGuide, setRelatedGuide] = useState<any>(null);

  useEffect(() => {
    fetchPlatform();
  }, [slug]);

  useEffect(() => {
    if (platform?.category) {
      fetchRelatedGuide(platform.category);
    }
  }, [platform]);

  // Track platform view when loaded
  useEffect(() => {
    if (platform) {
      analytics.viewPlatform(platform.name, platform.id);
    }
  }, [platform]);

  const fetchPlatform = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/platforms/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setPlatform(data);
      } else {
        setPlatform(null);
      }
    } catch (error) {
      console.error('Failed to fetch platform:', error);
      setPlatform(null);
    }
    setLoading(false);
  };

  const getCategoryPillarSlug = (category: string): string | null => {
    const mapping: Record<string, string> = {
      'computer-vision': 'computer-vision',
      'ml-frameworks': 'ml-frameworks',
      'code-ai': 'code-ai',
      'llms': 'llms',
      'generative-ai': 'generative-ai',
      'nlp': 'nlp',
      'image-generation': 'image-generation',
      'analytics-bi': 'analytics-bi',
      'video-ai': 'video-ai',
      'video-generation': 'video-generation',
      'agent-platforms': 'agent-platforms',
    };
    return mapping[category] || null;
  };

  const fetchRelatedGuide = async (category: string) => {
    const pillarSlug = getCategoryPillarSlug(category);
    if (!pillarSlug) return;

    try {
      const response = await fetch(`/api/pillar/${pillarSlug}`);
      if (response.ok) {
        const data = await response.json();
        setRelatedGuide(data);
      }
    } catch (error) {
      console.error('Failed to fetch related guide:', error);
    }
  };

  const handleVisit = () => {
    if (!platform) return;

    const url = platform.affiliate_url || platform.website || platform.url || '';

    // Track click in backend
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId: platform.id, type: 'click' }),
    }).catch(() => {});

    // Track click in Google Analytics
    analytics.clickPlatform(platform.name, platform.id, url);

    window.open(url, '_blank');
  };

  const getCategoryName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'computer-vision': 'Computer Vision',
      'ml-frameworks': 'ML Frameworks',
      'code-ai': 'Code AI',
      'llms': 'Large Language Models',
      'generative-ai': 'Generative AI',
      'nlp': 'Natural Language Processing',
      'image-generation': 'Image Generation',
      'analytics-bi': 'Analytics & BI',
      'video-ai': 'Video AI',
      'video-generation': 'Video Generation',
      'search-ai': 'Search AI',
      'agent-platforms': 'Agent Platforms',
      'seo-tools': 'SEO Tools',
    };
    return categoryMap[category] || category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="premium-platform-loading">
        <div className="loading-spinner"></div>
        <p>Loading platform details...</p>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="premium-platform-not-found">
        <h1>Platform Not Found</h1>
        <p>The platform you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="back-btn-premium">
          ← Back to Directory
        </button>
      </div>
    );
  }

  // Generate breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: 'https://aiplatformslist.com/' },
    {
      name: getCategoryName(platform.category),
      url: `https://aiplatformslist.com/category/${platform.category}`,
    },
    {
      name: platform.name,
      url: `https://aiplatformslist.com/platform/${platform.slug || platform.id}`,
    },
  ];

  return (
    <div className="premium-platform-detail">
      {/* Social Meta Tags for sharing */}
      <SocialMetaTags
        title={`${platform.name} - AI Platform Review & Details (2026)`}
        description={platform.description || `Explore ${platform.name}, an AI platform in the ${getCategoryName(platform.category)} category. Compare features, pricing, and reviews.`}
        url={`https://aiplatformslist.com/platform/${platform.slug || platform.id}`}
        type="article"
      />

      {/* Schema Markup for SEO */}
      <SoftwareApplicationSchema platform={platform} />
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Navigation Bar */}
      <nav className="premium-nav">
        <button onClick={() => navigate('/')} className="premium-back-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Directory
        </button>
        <div className="premium-breadcrumb">
          <span onClick={() => navigate('/')} className="breadcrumb-link">Home</span>
          <span className="breadcrumb-separator">/</span>
          <span onClick={() => navigate(`/category/${platform.category}`)} className="breadcrumb-link">
            {getCategoryName(platform.category)}
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{platform.name}</span>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="premium-hero">
        <div className="premium-hero-content">
          <div className="hero-badges fade-in" style={{ animationDelay: '0.1s' }}>
            {platform.verified && (
              <span className="hero-badge verified">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verified
              </span>
            )}
            {platform.featured && (
              <span className="hero-badge featured">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L9.5 6H13.5L10.5 8.5L11.5 12.5L8 10L4.5 12.5L5.5 8.5L2.5 6H6.5L8 2Z" fill="currentColor"/>
                </svg>
                Featured
              </span>
            )}
            <span className="hero-badge category">{getCategoryName(platform.category)}</span>
          </div>

          <h1 className="premium-hero-title fade-in" style={{ animationDelay: '0.2s' }}>
            {platform.name}
          </h1>

          <p className="premium-hero-description fade-in" style={{ animationDelay: '0.3s' }}>
            {platform.description}
          </p>

          <div className="premium-hero-actions fade-in" style={{ animationDelay: '0.4s' }}>
            <button onClick={handleVisit} className="premium-cta-primary">
              Visit {platform.name}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {platform.pricing && (
              <span className="pricing-badge">{platform.pricing}</span>
            )}
          </div>

          {/* Rating Display */}
          {platform.rating && (
            <div className="premium-hero-rating fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill={i < Math.round(platform.rating!) ? "#D4A574" : "none"} stroke={i < Math.round(platform.rating!) ? "#D4A574" : "#8B7355"} strokeWidth="1.5">
                    <path d="M12 2L14.5 8H20.5L16 12L17.5 18L12 14.5L6.5 18L8 12L3.5 8H9.5L12 2Z"/>
                  </svg>
                ))}
              </div>
              <span className="rating-number">{platform.rating.toFixed(1)}</span>
              <span className="rating-label">out of 5.0</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="premium-content">
        <div className="premium-grid">
          {/* Features Section */}
          {platform.features && platform.features.length > 0 && (
            <section className="premium-section features-section fade-in">
              <h2 className="section-title">Key Features</h2>
              <div className="features-grid">
                {platform.features.map((feature, i) => (
                  <div key={i} className="feature-card" style={{ animationDelay: `${0.1 * i}s` }}>
                    <div className="feature-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.5 6L7.5 15L3.5 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="feature-text">{feature}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Use Cases Section */}
          {platform.use_cases && platform.use_cases.length > 0 && (
            <section className="premium-section use-cases-section fade-in">
              <h2 className="section-title">Use Cases</h2>
              <div className="use-cases-grid">
                {platform.use_cases.map((useCase, i) => (
                  <div key={i} className="use-case-card" style={{ animationDelay: `${0.1 * i}s` }}>
                    <div className="use-case-number">{String(i + 1).padStart(2, '0')}</div>
                    <p className="use-case-text">{useCase}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags Section */}
          {platform.tags && platform.tags.length > 0 && (
            <section className="premium-section tags-section fade-in">
              <h2 className="section-title">Topics & Technologies</h2>
              <div className="premium-tags">
                {platform.tags.map((tag, i) => (
                  <span key={i} className="premium-tag" style={{ animationDelay: `${0.05 * i}s` }}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* CTA Card */}
          <section className="premium-section cta-card fade-in">
            <div className="cta-content">
              <h3 className="cta-title">Ready to get started?</h3>
              <p className="cta-description">
                Explore {platform.name} and see how it can transform your workflow.
              </p>
              <button onClick={handleVisit} className="cta-button-secondary">
                Visit Official Website
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </section>

          {/* Related Guide Section */}
          {relatedGuide && (
            <section className="premium-section guide-card fade-in">
              <div className="guide-label">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4H16V16H4V4Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Related Guide
              </div>
              <h3 className="guide-title">{relatedGuide.title}</h3>
              <p className="guide-description">{relatedGuide.metaDescription}</p>
              <button
                onClick={() => navigate(`/guide/${getCategoryPillarSlug(platform.category)}`)}
                className="guide-button"
              >
                Read Full Guide →
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlatformDetailRedesign;
