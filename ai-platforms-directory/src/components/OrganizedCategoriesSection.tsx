import { Link } from 'react-router-dom';
import { CATEGORY_SECTIONS, organizeCategories } from '../utils/category-organization';
import type { Category } from '../utils/category-organization';
import './OrganizedCategoriesSection.css';

interface OrganizedCategoriesSectionProps {
  categories: Category[];
}

export default function OrganizedCategoriesSection({ categories }: OrganizedCategoriesSectionProps) {
  const organized = organizeCategories(categories);

  return (
    <div className="organized-categories-section">
      <div className="organized-categories-container">
        <h2 className="organized-categories-title">
          Browse AI Tools by Category
        </h2>
        <p className="organized-categories-subtitle">
          {categories.length}+ categories organized by type - find exactly what you need
        </p>

        <div className="organized-categories-grid">
        {CATEGORY_SECTIONS.map((section) => {
          const sectionCategories = organized.get(section.id) || [];

          // Skip "other" section - too many uncategorized categories (creates visual clutter)
          if (section.id === 'other') return null;

          // Skip sections with no categories
          if (sectionCategories.length === 0) return null;

          const isFeatured = section.featured;

          return (
            <div
              key={section.id}
              className={`category-section ${isFeatured ? 'featured' : ''}`}
            >
              {/* Section Header */}
              <div className="category-section-header">
                <span className="category-section-icon" aria-hidden="true">
                  {section.icon}
                </span>
                <div>
                  <h3 className="category-section-title">
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="category-section-description">
                      {section.description}
                    </p>
                  )}
                </div>
                <span className="category-section-count">
                  {sectionCategories.length} {sectionCategories.length === 1 ? 'category' : 'categories'}
                </span>
              </div>

              {/* Category List */}
              <ul className="category-section-list">
                {sectionCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      to={`/category/${category.slug}`}
                      className="category-link"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <span className="category-name">{category.name}</span>
                      <span className="category-count">{category.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
