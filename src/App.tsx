import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SubmitTool from './pages/SubmitTool';
import PlatformDetail from './pages/PlatformDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<SubmitTool />} />
        <Route path="/platform/:slug" element={<PlatformDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
