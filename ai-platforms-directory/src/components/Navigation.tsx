import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';
import MegaMenu from './MegaMenu';
import { Category } from '../utils/category-organization';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch ALL categories (no limit)
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
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
        setIsResourcesOpen(false);
      }
    };

    if (isMenuOpen || isCategoriesOpen || isResourcesOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen, isCategoriesOpen, isResourcesOpen]);

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
    setIsResourcesOpen(false);
  };

  const toggleResources = () => {
    setIsResourcesOpen(!isResourcesOpen);
    setIsCategoriesOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsCategoriesOpen(false);
    setIsResourcesOpen(false);
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
            aria-label="Search AI tools"
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
              aria-expanded={isCategoriesOpen}
              aria-haspopup="true"
              aria-label="Browse categories menu"
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <MegaMenu
              isOpen={isCategoriesOpen}
              onClose={() => setIsCategoriesOpen(false)}
              categories={categories}
            />
          </li>
          <li style={{ position: 'relative' }}>
            <button
              onClick={toggleResources}
              className="nav-dropdown-trigger"
              aria-expanded={isResourcesOpen}
              aria-haspopup="true"
              aria-label="Resources menu"
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
              Resources
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isResourcesOpen && (
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
                <Link
                  to="/how-to-choose-ai-platforms"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '14px 18px',
                    background: '#000000',
                    color: '#ffffff',
                    textDecoration: 'none',
                    border: '4px solid #000000',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '13px',
                    letterSpacing: '1px',
                    marginBottom: '8px'
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
                  🎯 How to Choose AI Platforms
                </Link>
                <Link
                  to="/machine-learning-tools-directory"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '14px 18px',
                    background: '#000000',
                    color: '#ffffff',
                    textDecoration: 'none',
                    border: '4px solid #000000',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '13px',
                    letterSpacing: '1px',
                    marginBottom: '8px'
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
                  🤖 ML Tools Directory
                </Link>
                <Link
                  to="/natural-language-processing-tools"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '14px 18px',
                    background: '#000000',
                    color: '#ffffff',
                    textDecoration: 'none',
                    border: '4px solid #000000',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '13px',
                    letterSpacing: '1px',
                    marginBottom: '8px'
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
                  📝 NLP Tools
                </Link>
                <Link
                  to="/computer-vision-platforms"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '14px 18px',
                    background: '#000000',
                    color: '#ffffff',
                    textDecoration: 'none',
                    border: '4px solid #000000',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '13px',
                    letterSpacing: '1px',
                    marginBottom: '8px'
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
                  👁️ Computer Vision Platforms
                </Link>
                <Link
                  to="/enterprise-ai-solutions"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '14px 18px',
                    background: '#000000',
                    color: '#ffffff',
                    textDecoration: 'none',
                    border: '4px solid #000000',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '13px',
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
                  🏢 Enterprise AI Solutions
                </Link>
              </div>
            )}
          </li>
          <li>
            <Link to="/guides" onClick={closeMenu}>Guides</Link>
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
              aria-label="Search AI tools"
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
            <li>
              <button
                onClick={toggleCategories}
                className="mobile-dropdown-trigger"
                aria-expanded={isCategoriesOpen}
                aria-haspopup="true"
                aria-label="Browse categories menu"
              >
                Categories
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </li>
            <li>
              <Link to="/guides" onClick={closeMenu}>Guides</Link>
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
