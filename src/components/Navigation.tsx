import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

interface Category {
  name: string;
  slug: string;
  count: number;
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.slice(0, 12)))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-container')) {
        setIsMenuOpen(false);
        setIsCategoriesOpen(false);
      }
    };

    if (isMenuOpen || isCategoriesOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen, isCategoriesOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
      setSearchQuery('');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsCategoriesOpen(false);
  };

  const toggleCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsCategoriesOpen(false);
  };

  return (
    <nav className={`main-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo and Brand */}
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <img src="/logo.png" alt="AI Platforms Directory Logo" />
          <span className="nav-brand">
            AI Platforms<span className="nav-brand-sub">Directory</span>
          </span>
        </Link>

        {/* Desktop Search */}
        <form className="nav-search desktop-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search AI tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        {/* Desktop Menu */}
        <ul className="nav-menu desktop-menu">
          <li>
            <Link to="/" onClick={closeMenu}>Home</Link>
          </li>
          <li style={{ position: 'relative' }}>
            <button
              onClick={toggleCategories}
              className="nav-dropdown-trigger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                color: 'white',
                background: 'none',
                border: '3px solid transparent',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: '13px',
                fontFamily: "'Courier New', 'Courier', monospace",
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Categories
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isCategoriesOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                background: '#ffffff',
                border: '6px solid #000000',
                padding: '20px',
                minWidth: '400px',
                zIndex: 1000
              }}>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}`}
                    onClick={closeMenu}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      margin: '6px 0',
                      background: '#000000',
                      color: '#ffffff',
                      textDecoration: 'none',
                      border: '4px solid #000000',
                      fontFamily: "'Courier New', 'Courier', monospace",
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      fontSize: '14px',
                      letterSpacing: '1px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#000000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#000000';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                  >
                    <span>{category.name}</span>
                    <span style={{ fontWeight: 900 }}>{category.count}</span>
                  </Link>
                ))}
                <Link
                  to="/"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '16px',
                    marginTop: '12px',
                    borderTop: '4px solid #000000',
                    color: '#000000',
                    textDecoration: 'none',
                    fontWeight: 900,
                    fontSize: '14px',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  View All Categories →
                </Link>
              </div>
            )}
          </li>
          <li>
            <Link to="/about" onClick={closeMenu}>About</Link>
          </li>
          <li>
            <Link to="/submit" className="nav-cta" onClick={closeMenu}>
              Submit Tool
            </Link>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <button
          className={`nav-hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
          {/* Mobile Search */}
          <form className="nav-search mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search AI tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          <ul className="mobile-menu-list">
            <li>
              <Link to="/" onClick={closeMenu}>Home</Link>
            </li>
            <li className="mobile-dropdown">
              <button onClick={toggleCategories} className="mobile-dropdown-trigger">
                Categories
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isCategoriesOpen && (
                <div style={{ padding: '12px 0' }}>
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      to={`/category/${category.slug}`}
                      onClick={closeMenu}
                      style={{
                        display: 'block',
                        padding: '12px 18px',
                        margin: '6px 0',
                        background: '#000000',
                        color: '#ffffff',
                        textDecoration: 'none',
                        border: '3px solid #000000',
                        fontFamily: "'Courier New', 'Courier', monospace",
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        fontSize: '13px',
                        letterSpacing: '1px'
                      }}
                    >
                      {category.name} ({category.count})
                    </Link>
                  ))}
                  <Link
                    to="/"
                    onClick={closeMenu}
                    style={{
                      display: 'block',
                      padding: '12px 18px',
                      marginTop: '12px',
                      background: '#000000',
                      color: '#ffffff',
                      textDecoration: 'none',
                      border: '4px solid #000000',
                      fontFamily: "'Courier New', 'Courier', monospace",
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      fontSize: '14px',
                      letterSpacing: '1px'
                    }}
                  >
                    View All Categories →
                  </Link>
                </div>
              )}
            </li>
            <li>
              <Link to="/about" onClick={closeMenu}>About</Link>
            </li>
            <li>
              <Link to="/submit" onClick={closeMenu}>Submit Tool</Link>
            </li>
          </ul>

          {/* Mobile Menu Footer */}
          <div className="mobile-menu-footer">
            <div className="mobile-menu-links">
              <Link to="/privacy" onClick={closeMenu}>Privacy</Link>
              <Link to="/terms" onClick={closeMenu}>Terms</Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && <div className="mobile-menu-overlay" onClick={closeMenu}></div>}
      </div>
    </nav>
  );
}
