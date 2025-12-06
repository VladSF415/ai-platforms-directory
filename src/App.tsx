import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ScrollButtons from './components/ScrollButtons';
import Home from './pages/Home';
import SubmitTool from './pages/SubmitTool';
import PlatformDetail from './pages/PlatformDetail';
import CategoryPage from './pages/CategoryPage';
import PillarPage from './pages/PillarPage';
import ComparisonPage from './pages/ComparisonPage';
import AlternativesPage from './pages/AlternativesPage';
import BestOfPage from './pages/BestOfPage';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookiePolicy from './pages/legal/CookiePolicy';
import DMCA from './pages/legal/DMCA';
import Disclaimer from './pages/legal/Disclaimer';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<SubmitTool />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/guide/:slug" element={<PillarPage />} />
          <Route path="/compare/:slug" element={<ComparisonPage />} />
          <Route path="/alternatives/:slug" element={<AlternativesPage />} />
          <Route path="/best/:slug" element={<BestOfPage />} />
          <Route path="/platform/:slug" element={<PlatformDetail />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/dmca" element={<DMCA />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Routes>
        <ScrollButtons />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
