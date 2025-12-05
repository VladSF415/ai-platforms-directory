import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Platform } from '../types';
import { analytics } from '../utils/analytics';

function PlatformDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatform();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="loading">Loading platform details...</div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="platform-detail-not-found">
        <h1>PLATFORM NOT FOUND</h1>
        <p>The platform you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="back-to-directory-btn">
          ← BACK TO DIRECTORY
        </button>
      </div>
    );
  }

  return (
    <div className="platform-detail">
      {/* Header */}
      <div className="platform-detail-header">
        <div className="platform-detail-container">
          <button onClick={() => navigate('/')} className="back-link-btn">
            ← BACK TO DIRECTORY
          </button>

          <div className="platform-detail-title-section">
            <div>
              <h1 className="platform-detail-title">{platform.name}</h1>

              <div className="platform-detail-badges">
                {platform.featured && <span className="badge featured">⭐ FEATURED</span>}
                {platform.verified && <span className="badge verified">✓ VERIFIED</span>}
                {platform.pricing && <span className="badge pricing">💰 {platform.pricing}</span>}
              </div>

              <p className="platform-detail-description">{platform.description}</p>
            </div>
          </div>

          <button onClick={handleVisit} className="platform-detail-visit-btn">
            VISIT {platform.name} →
          </button>
        </div>
      </div>

      {/* Details Section */}
      <div className="platform-detail-content">
        <div className="platform-detail-grid">
          {/* Rating */}
          {platform.rating && (
            <div className="platform-detail-section">
              <h2>RATING</h2>
              <div className="platform-detail-rating">
                <div className="platform-detail-stars">
                  {'★'.repeat(Math.round(platform.rating))}{'☆'.repeat(5 - Math.round(platform.rating))}
                </div>
                <span className="platform-detail-rating-number">{platform.rating.toFixed(1)}</span>
                <span className="platform-detail-rating-max">/ 5.0</span>
              </div>
            </div>
          )}

          {/* Features */}
          {platform.features && platform.features.length > 0 && (
            <div className="platform-detail-section">
              <h2>KEY FEATURES</h2>
              <div className="platform-detail-features">
                {platform.features.map((feature, i) => (
                  <div key={i} className="platform-detail-feature">
                    ✓ {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {platform.tags && platform.tags.length > 0 && (
            <div className="platform-detail-section">
              <h2>TAGS</h2>
              <div className="platform-detail-tags">
                {platform.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="platform-detail-section">
            <h2>CATEGORY</h2>
            <div className="platform-detail-category">
              {platform.category?.replace(/-/g, ' ').toUpperCase()}
            </div>
          </div>

          {/* Visit CTA */}
          <div className="platform-detail-cta">
            <h3>READY TO TRY {platform.name}?</h3>
            <button onClick={handleVisit} className="platform-detail-cta-btn">
              VISIT OFFICIAL WEBSITE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformDetail;
