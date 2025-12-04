import { useState } from 'react';
import type { SubmitToolForm } from '../types';

function SubmitTool() {
  const [form, setForm] = useState<SubmitToolForm>({
    name: '',
    description: '',
    website: '',
    category: 'ml-frameworks',
    pricing: '',
    contactEmail: '',
    wantsFeatured: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const SUBMISSION_FEE = 49;
  const FEATURED_PRICING = {
    basic: 99,
    premium: 199,
    enterprise: 299,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calculate total price
      let totalPrice = SUBMISSION_FEE;
      if (form.wantsFeatured && form.featuredTier) {
        totalPrice += FEATURED_PRICING[form.featuredTier];
      }

      const response = await fetch('/api/submit-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalPrice }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit. Please try again.');
    }

    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="container" style={{ maxWidth: '800px', margin: '60px auto', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        <h1 style={{ marginBottom: '16px' }}>Thank You!</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
          Your AI tool submission has been received. We'll review it and add it to our directory within 24-48 hours.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '60px auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '12px' }}>Submit Your AI Tool</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          Get your AI platform listed in our directory of 693+ curated tools
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
        {/* Basic Information */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Basic Information</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tool Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
              placeholder="e.g., GPT-4, Midjourney, etc."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Description *
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit',
              }}
              placeholder="Brief description of your AI tool (50-200 characters)"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Website URL *
            </label>
            <input
              type="url"
              required
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
              placeholder="https://your-ai-tool.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Category *
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            >
              <option value="ml-frameworks">ML Frameworks</option>
              <option value="generative-ai">Generative AI</option>
              <option value="computer-vision">Computer Vision</option>
              <option value="nlp">NLP</option>
              <option value="llms">LLMs</option>
              <option value="analytics-bi">Analytics & BI</option>
              <option value="code-ai">Code AI</option>
              <option value="image-generation">Image Generation</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Pricing Model *
            </label>
            <input
              type="text"
              required
              value={form.pricing}
              onChange={(e) => setForm({ ...form, pricing: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
              placeholder="e.g., Free, Freemium, $10/month, etc."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Contact Email *
            </label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Featured Listing Option */}
        <div style={{ marginBottom: '32px', padding: '24px', background: '#f8f9ff', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Featured Listing (Optional)</h2>

          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.wantsFeatured}
              onChange={(e) => setForm({ ...form, wantsFeatured: e.target.checked })}
              style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '500' }}>
              Upgrade to Featured Listing for more visibility
            </span>
          </label>

          {form.wantsFeatured && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <label
                style={{
                  padding: '20px',
                  border: form.featuredTier === 'basic' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'white',
                }}
              >
                <input
                  type="radio"
                  name="featuredTier"
                  value="basic"
                  checked={form.featuredTier === 'basic'}
                  onChange={(e) => setForm({ ...form, featuredTier: e.target.value as any })}
                  style={{ marginRight: '12px' }}
                />
                <strong>Basic Featured</strong> - ${FEATURED_PRICING.basic}/month
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px', marginLeft: '28px' }}>
                  ⭐ Featured badge, higher placement
                </div>
              </label>

              <label
                style={{
                  padding: '20px',
                  border: form.featuredTier === 'premium' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'white',
                }}
              >
                <input
                  type="radio"
                  name="featuredTier"
                  value="premium"
                  checked={form.featuredTier === 'premium'}
                  onChange={(e) => setForm({ ...form, featuredTier: e.target.value as any })}
                  style={{ marginRight: '12px' }}
                />
                <strong>Premium Featured</strong> - ${FEATURED_PRICING.premium}/month
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px', marginLeft: '28px' }}>
                  ⭐ Top 3 placement, custom description, priority support
                </div>
              </label>

              <label
                style={{
                  padding: '20px',
                  border: form.featuredTier === 'enterprise' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'white',
                }}
              >
                <input
                  type="radio"
                  name="featuredTier"
                  value="enterprise"
                  checked={form.featuredTier === 'enterprise'}
                  onChange={(e) => setForm({ ...form, featuredTier: e.target.value as any })}
                  style={{ marginRight: '12px' }}
                />
                <strong>Enterprise Featured</strong> - ${FEATURED_PRICING.enterprise}/month
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px', marginLeft: '28px' }}>
                  🏆 #1 placement, custom branding, dedicated account manager
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div style={{ marginBottom: '32px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Submission Fee:</span>
            <span style={{ fontWeight: '600' }}>${SUBMISSION_FEE}</span>
          </div>
          {form.wantsFeatured && form.featuredTier && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Featured Listing (First Month):</span>
              <span style={{ fontWeight: '600' }}>${FEATURED_PRICING[form.featuredTier]}</span>
            </div>
          )}
          <div style={{ borderTop: '2px solid #ddd', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
            <span style={{ fontWeight: '700' }}>Total:</span>
            <span style={{ fontWeight: '700', color: '#667eea' }}>
              ${SUBMISSION_FEE + (form.wantsFeatured && form.featuredTier ? FEATURED_PRICING[form.featuredTier] : 0)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '16px',
            background: submitting ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Processing...' : 'Continue to Payment'}
        </button>

        <p style={{ marginTop: '16px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          Secure payment powered by Stripe. Your listing will be reviewed and published within 24-48 hours.
        </p>
      </form>
    </div>
  );
}

export default SubmitTool;
