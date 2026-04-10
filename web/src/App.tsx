import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Preview from './pages/Preview';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse/*" element={<Home />} />
        <Route path="/preview/*" element={<Preview />} />
      </Routes>
    </HashRouter>
  );
}
