import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './MegaMenu.css';
import {
  Category,
  CATEGORY_SECTIONS,
  organizeCategories,
  getFeaturedCategories
} from '../utils/category-organization';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  loading?: boolean;
}

export default function MegaMenu({ isOpen, onClose, categories, loading = false }: MegaMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-expand featured sections on mobile
  useEffect(() => {
    if (isMobile) {
      const featuredIds = CATEGORY_SECTIONS
        .filter(s => s.featured)
        .map(s => s.id);
      setExpandedSections(new Set(featuredIds));
    } else {
      // Desktop: expand all
      setExpandedSections(new Set(CATEGORY_SECTIONS.map(s => s.id)));
    }
  }, [isMobile]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus within menu
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled])'
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleLinkClick = () => {
    onClose();
    setSearchQuery('');
  };

  const scrollToAllCategories = () => {
    onClose();
    // Scroll to all categories section on home page
    const el = document.getElementById('all-categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isOpen) return null;

  // Organize categories into sections
  const organized = organizeCategories(categories);
  const featuredCategories = getFeaturedCategories(categories);

  // Filter categories by search
  const filteredCategories = searchQuery
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  // Filter sections to only show those with categories
  const activeSections = CATEGORY_SECTIONS.filter(section => {
    const sectionCategories = organized.get(section.id) || [];
    return sectionCategories.length > 0;
  });

  return (
    <div
      ref={menuRef}
      className="mega-menu-dropdown"
      role="dialog"
      aria-label="Categories menu"
      aria-modal="true"
    >
      {loading ? (
        <div className="mega-menu-loading">
          <div className="mega-menu-loading-spinner" aria-hidden="true"></div>
          <div className="mega-menu-loading-text">Loading Categories...</div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mega-menu-search">
            <label htmlFor="mega-menu-search" className="sr-only">
              Search categories
            </label>
            <input
              id="mega-menu-search"
              type="text"
              className="mega-menu-search-input"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search categories"
            />
          </div>

          {/* Featured Categories (Quick Access) */}
          {!searchQuery && featuredCategories.length > 0 && (
            <div className="mega-menu-featured">
              <h3 className="mega-menu-featured-title">⚡ Most Popular</h3>
              <div className="mega-menu-featured-grid">
                {featuredCategories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}`}
                    className="mega-menu-featured-item"
                    onClick={handleLinkClick}
                  >
                    <span>{category.name}</span>
                    <span className="mega-menu-featured-count">{category.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="mega-menu-sections">
            {searchQuery ? (
              // Search Results
              filteredCategories.length > 0 ? (
                <div className="mega-menu-section">
                  <div className="mega-menu-section-header">
                    <span className="mega-menu-section-icon">🔍</span>
                    <h3 className="mega-menu-section-title">
                      Search Results ({filteredCategories.length})
                    </h3>
                  </div>
                  <div className="mega-menu-section-grid">
                    {filteredCategories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/category/${category.slug}`}
                        className="mega-menu-category-link"
                        onClick={handleLinkClick}
                      >
                        <span className="mega-menu-category-name">{category.name}</span>
                        <span className="mega-menu-category-count">{category.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mega-menu-empty">
                  <div className="mega-menu-empty-icon">🔍</div>
                  <h3 className="mega-menu-empty-title">No Results Found</h3>
                  <p className="mega-menu-empty-text">
                    Try a different search term
                  </p>
                </div>
              )
            ) : (
              // Organized Sections
              activeSections.map((section) => {
                const sectionCategories = organized.get(section.id) || [];
                if (sectionCategories.length === 0) return null;

                const isExpanded = expandedSections.has(section.id);
                const sectionClassName = `mega-menu-section ${section.featured ? 'featured' : ''} ${isExpanded ? 'expanded' : ''}`;

                return (
                  <div key={section.id} className={sectionClassName}>
                    {/* Section Header */}
                    <div
                      className="mega-menu-section-header"
                      onClick={() => isMobile && toggleSection(section.id)}
                      role={isMobile ? 'button' : undefined}
                      tabIndex={isMobile ? 0 : undefined}
                      onKeyPress={(e) => {
                        if (isMobile && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          toggleSection(section.id);
                        }
                      }}
                      aria-expanded={isMobile ? isExpanded : undefined}
                      aria-controls={isMobile ? `section-${section.id}` : undefined}
                    >
                      <span className="mega-menu-section-icon" aria-hidden="true">
                        {section.icon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <h3 className="mega-menu-section-title">
                          {section.title}
                          <span className="sr-only">
                            ({sectionCategories.length} categories)
                          </span>
                        </h3>
                        {section.description && (
                          <div className="mega-menu-section-desc">
                            {section.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section Content */}
                    <div
                      id={isMobile ? `section-${section.id}` : undefined}
                      className="mega-menu-section-content"
                    >
                      <div className="mega-menu-section-grid">
                        {sectionCategories.map((category) => (
                          <Link
                            key={category.slug}
                            to={`/category/${category.slug}`}
                            className="mega-menu-category-link"
                            onClick={handleLinkClick}
                          >
                            <span className="mega-menu-category-name">
                              {category.name}
                            </span>
                            <span className="mega-menu-category-count">
                              {category.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="mega-menu-footer">
            <button
              onClick={scrollToAllCategories}
              className="mega-menu-footer-btn"
            >
              📋 View All {categories.length} Categories
            </button>
            <Link
              to="/submit"
              className="mega-menu-footer-btn secondary"
              onClick={handleLinkClick}
            >
              ➕ Submit New Tool
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
