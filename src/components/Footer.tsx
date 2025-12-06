import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* About Section */}
          <div className="footer-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                src="/logo.png"
                alt="AI Platforms Directory Logo"
                style={{ width: '40px', height: '40px', borderRadius: '8px' }}
              />
              <h3 style={{ margin: 0 }}>AI Platforms Directory</h3>
            </div>
            <p>
              The most comprehensive directory of AI platforms, tools, and services.
              Discover, compare, and choose the best AI solutions for your needs.
            </p>
            <div className="footer-stats">
              <div className="stat">
                <strong>700+</strong>
                <span>AI Platforms</span>
              </div>
              <div className="stat">
                <strong>9+</strong>
                <span>Categories</span>
              </div>
              <div className="stat">
                <strong>Daily</strong>
                <span>Updates</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/submit">Submit Platform</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-section">
            <h4>Popular Categories</h4>
            <ul>
              <li><Link to="/?category=llms">Large Language Models</Link></li>
              <li><Link to="/?category=generative-ai">Generative AI</Link></li>
              <li><Link to="/?category=code-ai">Code AI</Link></li>
              <li><Link to="/?category=image-generation">Image Generation</Link></li>
              <li><Link to="/?category=video-ai">Video AI</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h4>Legal & Policies</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/cookie-policy">Cookie Policy</Link></li>
              <li><Link to="/dmca">DMCA Policy</Link></li>
              <li><Link to="/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} AI Platforms Directory. Operated by <strong>Badly Creative LLC</strong>. All rights reserved.
            </p>
            <div className="footer-links">
              <Link to="/sitemap.xml">Sitemap</Link>
              <span className="separator">•</span>
              <Link to="/rss">RSS Feed</Link>
              <span className="separator">•</span>
              <a href="https://github.com/VladSF415/ai-platforms-directory" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
