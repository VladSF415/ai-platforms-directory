import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SocialMetaTags } from '../components/SocialMetaTags';
import './legal/LegalPage.css';

export default function Guides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pillar');
      const data = await response.json();
      setGuides(data);
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    }
    setLoading(false);
  };

  // Extract unique categories from guides
  const categories = Array.from(new Set(guides.map(g => g.category).filter(Boolean)));

  const filteredGuides = selectedCategory === 'all'
    ? guides
    : guides.filter(g => g.category === selectedCategory);

  return (
    <>
      <SocialMetaTags
        title="AI Tools Guides & Resources - Expert Insights & Comparisons"
        description="Comprehensive guides, comparisons, and resources to help you choose the best AI tools. Expert insights on LLMs, generative AI, code assistants, and more."
        url="https://aiplatformslist.com/guides"
        type="website"
      />

      <div className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <Link to="/" className="back-link">← Back to Directory</Link>
            <h1>AI Tools Guides & Resources</h1>
            <p className="last-updated">
              Expert insights to help you navigate the AI landscape
            </p>
          </div>

          <div className="legal-content">
            {/* Introduction */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={{
                padding: '2rem',
                background: '#f5f5f5',
                border: '4px solid #000',
                marginBottom: '2rem'
              }}>
                <h2 style={{ marginTop: 0, fontSize: '24px', fontWeight: '900' }}>
                  What You'll Find Here
                </h2>
                <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '1rem' }}>
                  Our comprehensive guides help you understand different AI tool categories, compare top platforms,
                  and make informed decisions for your specific needs. Each guide includes:
                </p>
                <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  <li><strong>Category Overviews:</strong> Understand what each AI category offers</li>
                  <li><strong>Platform Comparisons:</strong> Side-by-side feature and pricing comparisons</li>
                  <li><strong>Use Case Examples:</strong> Real-world applications and best practices</li>
                  <li><strong>Selection Criteria:</strong> How to choose the right tool for your needs</li>
                  <li><strong>Expert Recommendations:</strong> Top picks for different scenarios</li>
                </ul>
              </div>
            </section>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '1rem' }}>
                  Filter by Category
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    style={{
                      padding: '10px 20px',
                      background: selectedCategory === 'all' ? '#000' : '#fff',
                      color: selectedCategory === 'all' ? '#fff' : '#000',
                      border: '3px solid #000',
                      fontFamily: "'Courier New', monospace",
                      fontWeight: '900',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    All Guides ({guides.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat as string)}
                      style={{
                        padding: '10px 20px',
                        background: selectedCategory === cat ? '#000' : '#fff',
                        color: selectedCategory === cat ? '#fff' : '#000',
                        border: '3px solid #000',
                        fontFamily: "'Courier New', monospace",
                        fontWeight: '900',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Guides Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '18px', fontFamily: "'Courier New', monospace" }}>
                  Loading guides...
                </div>
              </div>
            ) : filteredGuides.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: '#f5f5f5',
                border: '4px solid #000'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📚</div>
                <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '1rem' }}>
                  No Guides Yet
                </h3>
                <p style={{ fontSize: '16px', color: '#666' }}>
                  Check back soon for comprehensive AI tool guides.
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '25px',
                  marginBottom: '3rem'
                }}>
                  {filteredGuides.map((guide) => (
                    <div
                      key={guide.slug}
                      onClick={() => navigate(`/guide/${guide.slug}`)}
                      style={{
                        border: '4px solid #000',
                        padding: '28px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: '#fff'
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
                      {guide.category && (
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: '#FFFF00',
                          border: '2px solid #000',
                          fontSize: '11px',
                          fontWeight: '900',
                          fontFamily: "'Courier New', monospace",
                          textTransform: 'uppercase',
                          marginBottom: '15px'
                        }}>
                          {guide.category}
                        </div>
                      )}

                      <h3 style={{
                        fontWeight: '900',
                        marginBottom: '15px',
                        fontSize: '22px',
                        lineHeight: '1.3',
                        fontFamily: "'Courier New', monospace"
                      }}>
                        {guide.title}
                      </h3>

                      <p style={{
                        fontSize: '15px',
                        lineHeight: '1.7',
                        color: '#333',
                        marginBottom: '20px'
                      }}>
                        {guide.metaDescription || guide.description}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '15px',
                        borderTop: '3px solid #000'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          fontFamily: "'Courier New', monospace"
                        }}>
                          Read Guide →
                        </div>
                        {guide.readingTime && (
                          <div style={{
                            fontSize: '12px',
                            color: '#666',
                            fontFamily: "'Courier New', monospace"
                          }}>
                            {guide.readingTime} min read
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  textAlign: 'center',
                  fontSize: '16px',
                  color: '#666',
                  fontFamily: "'Courier New', monospace",
                  padding: '2rem 0',
                  borderTop: '4px solid #000'
                }}>
                  Showing {filteredGuides.length} {filteredGuides.length === 1 ? 'guide' : 'guides'}
                </div>
              </>
            )}

            {/* How to Choose Section */}
            <section style={{
              marginTop: '4rem',
              padding: '2.5rem',
              background: '#000',
              color: '#fff',
              border: '4px solid #000'
            }}>
              <h2 style={{
                marginTop: 0,
                fontSize: '28px',
                fontWeight: '900',
                fontFamily: "'Courier New', monospace",
                marginBottom: '1.5rem'
              }}>
                How to Choose the Right AI Tool
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    marginBottom: '10px',
                    color: '#FFFF00'
                  }}>
                    1. Define Your Use Case
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.7', opacity: 0.9 }}>
                    Start by clearly identifying what you need the AI tool to accomplish. Are you looking for
                    content creation, code assistance, data analysis, or automation?
                  </p>
                </div>

                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    marginBottom: '10px',
                    color: '#FFFF00'
                  }}>
                    2. Consider Your Budget
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.7', opacity: 0.9 }}>
                    AI platforms range from free tools to enterprise solutions. Compare pricing tiers, free trials,
                    and what features are included at each level.
                  </p>
                </div>

                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    marginBottom: '10px',
                    color: '#FFFF00'
                  }}>
                    3. Evaluate Integration
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.7', opacity: 0.9 }}>
                    Check if the AI tool integrates with your existing workflow, tech stack, and favorite applications.
                    API access and pre-built integrations save time.
                  </p>
                </div>

                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    marginBottom: '10px',
                    color: '#FFFF00'
                  }}>
                    4. Test Before Committing
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.7', opacity: 0.9 }}>
                    Test output quality, speed, accuracy, and reliability. Read user reviews, compare benchmarks,
                    and try free trials before committing to paid plans.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA to Directory */}
            <div style={{
              marginTop: '3rem',
              padding: '2.5rem',
              background: '#f5f5f5',
              border: '4px solid #000',
              textAlign: 'center'
            }}>
              <h3 style={{
                marginTop: 0,
                fontSize: '24px',
                fontWeight: '900',
                fontFamily: "'Courier New', monospace",
                marginBottom: '1rem'
              }}>
                Ready to Explore AI Tools?
              </h3>
              <p style={{ fontSize: '16px', marginBottom: '2rem', lineHeight: '1.6' }}>
                Browse our comprehensive directory of 150+ AI platforms across all major categories
              </p>
              <Link
                to="/"
                style={{
                  display: 'inline-block',
                  padding: '16px 32px',
                  background: '#000',
                  color: '#fff',
                  textDecoration: 'none',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: '900',
                  fontSize: '15px',
                  textTransform: 'uppercase',
                  border: '4px solid #000',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#000';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                Browse AI Directory →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
