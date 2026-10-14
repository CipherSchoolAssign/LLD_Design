import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProblems } from '../services/api';

const difficultyColors = {
  Easy: '#00c853',
  Medium: '#ff9100',
  Hard: '#ff1744',
};

const difficultyIcons = {
  Easy: '🟢',
  Medium: '🟡',
  Hard: '🔴',
};

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProblems()
      .then(setProblems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="hero-section">
        <h1 className="hero-title">LLD Practice Arena</h1>
        <p className="hero-subtitle">
          Master Low-Level Design through practice, feedback, and iteration.
          Choose a problem and start designing.
        </p>
      </div>

      <div className="problems-grid">
        {problems.map((problem) => (
          <Link
            key={problem._id}
            to={`/problem/${problem._id}`}
            className="problem-card"
          >
            <div className="problem-card-header">
              <span
                className="difficulty-badge"
                style={{ backgroundColor: difficultyColors[problem.difficulty] + '22', color: difficultyColors[problem.difficulty], borderColor: difficultyColors[problem.difficulty] + '44' }}
              >
                {difficultyIcons[problem.difficulty]} {problem.difficulty}
              </span>
            </div>
            <h2 className="problem-card-title">{problem.title}</h2>
            <p className="problem-card-desc">
              {problem.description.length > 140
                ? problem.description.substring(0, 140) + '...'
                : problem.description}
            </p>
            <div className="problem-card-footer">
              <span className="start-btn">Start Practice →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
