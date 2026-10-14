import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAttemptHistory, fetchProblem } from '../services/api';

const statusColors = {
  completed: '#00c853',
  failed: '#ff1744',
  evaluating: '#ff9100',
  submitted: '#448aff',
};

export default function History() {
  const { problemId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchAttemptHistory(problemId), fetchProblem(problemId)])
      .then(([hist, prob]) => {
        setAttempts(hist);
        setProblem(prob);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [problemId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to={`/problem/${problemId}`} className="back-link">
        ← Back to Problem
      </Link>

      <h1 className="history-title">
        Attempt History
      </h1>
      {problem && <p className="history-subtitle">{problem.title}</p>}

      {attempts.length === 0 ? (
        <div className="empty-state">
          <p>📝 No attempts yet. Go solve the problem!</p>
          <Link to={`/problem/${problemId}`} className="start-btn-link">
            Start Practice →
          </Link>
        </div>
      ) : (
        <div className="history-list">
          {attempts.map((attempt) => (
            <Link
              key={attempt._id}
              to={`/feedback/${attempt._id}`}
              className="history-card"
            >
              <div className="history-card-left">
                <span className="attempt-number">#{attempt.attemptNumber}</span>
                <div className="attempt-info">
                  <span className="attempt-date">
                    {new Date(attempt.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    className="attempt-status"
                    style={{ color: statusColors[attempt.status] }}
                  >
                    {attempt.status}
                  </span>
                </div>
              </div>
              <div className="history-card-right">
                {attempt.status === 'completed' && attempt.evaluation?.overallScore != null && (
                  <div className="history-score">
                    <span className="score-num">{attempt.evaluation.overallScore}</span>
                    <span className="score-denom">/10</span>
                  </div>
                )}
                {attempt.status === 'failed' && (
                  <span className="failed-tag">Failed</span>
                )}
                <span className="view-arrow">→</span>
              </div>
            </Link>
          ))}

          {/* Score Trend */}
          {attempts.filter((a) => a.status === 'completed').length > 1 && (
            <div className="score-trend">
              <h3>📈 Score Trend</h3>
              <div className="trend-bar">
                {[...attempts]
                  .filter((a) => a.status === 'completed')
                  .reverse()
                  .map((attempt, idx) => (
                    <div
                      key={attempt._id}
                      className="trend-point"
                      style={{
                        height: `${(attempt.evaluation?.overallScore || 0) * 10}%`,
                        backgroundColor: statusColors.completed,
                      }}
                      title={`Attempt #${attempt.attemptNumber}: ${attempt.evaluation?.overallScore}/10`}
                    >
                      <span className="trend-label">#{attempt.attemptNumber}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
