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
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>Platform Not Found</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          The platform you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          ← Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px', color: 'white' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            ← Back to Directory
          </button>

          <div style={{ display: 'flex', alignItems: 'start', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{platform.name}</h1>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {platform.featured && (
                  <span style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '6px 14px', borderRadius: '6px', fontSize: '14px' }}>
                    ⭐ Featured
                  </span>
                )}
                {platform.verified && (
                  <span style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '6px 14px', borderRadius: '6px', fontSize: '14px' }}>
                    ✓ Verified
                  </span>
                )}
                {platform.pricing && (
                  <span style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '6px 14px', borderRadius: '6px', fontSize: '14px' }}>
                    💰 {platform.pricing}
                  </span>
                )}
              </div>

              <p style={{ fontSize: '1.2rem', lineHeight: '1.6', opacity: 0.95 }}>
                {platform.description}
              </p>
            </div>
          </div>

          <button
            onClick={handleVisit}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            Visit {platform.name} →
          </button>
        </div>
      </div>

      {/* Details Section */}
      <div className="container" style={{ maxWidth: '900px', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gap: '30px' }}>
          {/* Rating */}
          {platform.rating && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Rating</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '2rem', color: '#f59e0b' }}>
                  {'★'.repeat(Math.round(platform.rating))}{'☆'.repeat(5 - Math.round(platform.rating))}
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: '600' }}>{platform.rating.toFixed(1)}</span>
                <span style={{ color: '#666' }}>/ 5.0</span>
              </div>
            </div>
          )}

          {/* Features */}
          {platform.features && platform.features.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Key Features</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {platform.features.map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#f8f9ff',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e0e7ff',
                    }}
                  >
                    ✓ {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {platform.tags && platform.tags.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Tags</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {platform.tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#667eea',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Category</h2>
            <div
              style={{
                display: 'inline-block',
                background: '#f3f4f6',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {platform.category?.replace(/-/g, ' ')}
            </div>
          </div>

          {/* Visit CTA */}
          <div style={{ marginTop: '20px', padding: '30px', background: '#f8f9ff', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Ready to try {platform.name}?</h3>
            <button
              onClick={handleVisit}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 40px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
            >
              Visit Official Website →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformDetail;
