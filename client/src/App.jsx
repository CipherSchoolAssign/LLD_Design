import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProblemList from './pages/ProblemList';
import ProblemDetail from './pages/ProblemDetail';
import Feedback from './pages/Feedback';
import History from './pages/History';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <a href="/" className="nav-brand">
          <span className="nav-icon">⚡</span>
          LLD Practice
        </a>
        <div className="nav-links">
          <a href="/" className="nav-link">Problems</a>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProblemList />} />
          <Route path="/problem/:id" element={<ProblemDetail />} />
          <Route path="/feedback/:id" element={<Feedback />} />
          <Route path="/history/:problemId" element={<History />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>LLD Practice Platform — Built for learning, not for production.</p>
      </footer>
    </BrowserRouter>
  );
}

export default App;
