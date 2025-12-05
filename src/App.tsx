import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SubmitTool from './pages/SubmitTool';
import PlatformDetail from './pages/PlatformDetail';
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<SubmitTool />} />
          <Route path="/platform/:slug" element={<PlatformDetail />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/dmca" element={<DMCA />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
