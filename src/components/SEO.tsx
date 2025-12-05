import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({
  title = 'AI Platforms Directory - Discover 700+ AI Tools & Platforms',
  description = 'Comprehensive directory of 700+ AI platforms, tools, and services. Compare features, pricing, and reviews of LLMs, generative AI, computer vision, NLP, and more. Updated daily.',
  keywords = 'AI platforms, artificial intelligence tools, machine learning platforms, AI directory, LLM comparison, generative AI, AI tools list, best AI platforms 2024, AI services, AI software',
  image = 'https://aiplatformslist.com/og-image.png',
  url = 'https://aiplatformslist.com',
  type = 'website'
}: SEOProps) {
  const siteTitle = title.includes('AI Platforms Directory') ? title : `${title} | AI Platforms Directory`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AI Platforms Directory" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={url} />

      {/* Schema.org for Google */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "AI Platforms Directory",
          "description": description,
          "url": url,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${url}/?search={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
}
