import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Platform, Category } from '../types';

function Home() {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFeatured, setShowFeatured] = useState(false);

  useEffect(() => {
    fetchPlatforms();
    fetchCategories();
  }, [selectedCategory, search, showFeatured]);

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (search) params.append('search', search);
      if (showFeatured) params.append('featured', 'true');
      params.append('limit', '100');

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

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>AI Platforms Directory</h1>
          <p>Discover 693+ curated AI tools and platforms</p>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search AI tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a
              href="/submit"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
            >
              Submit Your AI Tool
            </a>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="filters">
          <button
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </button>
          {categories.slice(0, 8).map((cat) => (
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
        ) : (
          <>
            <div className="stats">
              <div className="stat">
                <div className="stat-number">{platforms.length}</div>
                <div className="stat-label">Platforms</div>
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
                  style={{ cursor: 'pointer' }}
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
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
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
