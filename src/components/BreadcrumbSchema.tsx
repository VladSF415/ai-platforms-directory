import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * BreadcrumbList Schema Component
 * Generates JSON-LD structured data for breadcrumb navigation
 *
 * Schema Type: https://schema.org/BreadcrumbList
 * Benefits: Breadcrumb display in Google SERPs, better site structure understanding
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  useEffect(() => {
    // Create schema script tag
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-schema';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById('breadcrumb-schema');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [items]);

  return null; // This component doesn't render anything visible
}

/**
 * Visual Breadcrumb Component (optional - for UI)
 */
interface VisualBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function VisualBreadcrumb({ items }: VisualBreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb navigation">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {index > 0 && <span className="breadcrumb-separator"> → </span>}
          <a href={item.url} className="breadcrumb-link">
            {item.name}
          </a>
        </span>
      ))}
    </nav>
  );
}
