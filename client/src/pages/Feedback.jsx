import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAttempt, retryEvaluation } from '../services/api';

const scoreColor = (score) => {
  if (score >= 8) return '#00c853';
  if (score >= 6) return '#ff9100';
  if (score >= 4) return '#ff6d00';
  return '#ff1744';
};

const confidenceBadge = {
  high: { bg: '#00c85322', color: '#00c853', label: '● High' },
  medium: { bg: '#ff910022', color: '#ff9100', label: '● Medium' },
  low: { bg: '#ff174422', color: '#ff1744', label: '● Low' },
};

export default function Feedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  const loadAttempt = () => {
    setLoading(true);
    fetchAttempt(id)
      .then(setAttempt)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAttempt();
  }, [id]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const result = await retryEvaluation(id);
      setAttempt(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="page-container">
        <div className="error-banner">Attempt not found.</div>
      </div>
    );
  }

  const { evaluation, status, problemId } = attempt;
  const problemTitle = problemId?.title || 'Problem';

  return (
    <div className="page-container">
      <Link to={`/problem/${attempt.problemId?._id || attempt.problemId}`} className="back-link">
        ← Back to Problem
      </Link>

      <div className="feedback-header">
        <div>
          <h1>Feedback — Attempt #{attempt.attemptNumber}</h1>
          <p className="feedback-subtitle">{problemTitle}</p>
        </div>
        <span className={`status-badge status-${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Failed State */}
      {status === 'failed' && (
        <div className="failed-section">
          <div className="error-banner">
            <p>⚠️ AI evaluation failed: {evaluation?.errorMessage || 'Unknown error'}</p>
            <p>Your submission is saved. You can retry evaluation.</p>
          </div>
          <button
            className="retry-btn"
            onClick={handleRetry}
            disabled={retrying}
          >
            {retrying ? 'Retrying...' : '🔄 Retry Evaluation'}
          </button>
        </div>
      )}

      {/* Evaluating State */}
      {status === 'evaluating' && (
        <div className="evaluating-section">
          <div className="spinner"></div>
          <p>Your submission is being evaluated by AI...</p>
        </div>
      )}

      {/* Completed State — Show Feedback */}
      {status === 'completed' && evaluation && (
        <>
          {/* Overall Score */}
          <div className="overall-score-card">
            <div className="score-circle" style={{ borderColor: scoreColor(evaluation.overallScore) }}>
              <span className="score-value" style={{ color: scoreColor(evaluation.overallScore) }}>
                {evaluation.overallScore}
              </span>
              <span className="score-max">/10</span>
            </div>
            <div className="score-summary">
              <h3>Overall Assessment</h3>
              <p>{evaluation.summary}</p>
            </div>
          </div>

          {/* Per-Criterion Feedback */}
          <div className="criteria-grid">
            {evaluation.feedback.map((item, idx) => (
              <div key={idx} className="criterion-card">
                <div className="criterion-header">
                  <h3>{item.criterion}</h3>
                  <div className="criterion-meta">
                    <span
                      className="criterion-score"
                      style={{ color: scoreColor(item.score), borderColor: scoreColor(item.score) }}
                    >
                      {item.score}/10
                    </span>
                    <span
                      className="confidence-badge"
                      style={{
                        backgroundColor: confidenceBadge[item.confidence]?.bg,
                        color: confidenceBadge[item.confidence]?.color,
                      }}
                    >
                      {confidenceBadge[item.confidence]?.label}
                    </span>
                  </div>
                </div>

                <div className="criterion-body">
                  <div className="feedback-item">
                    <span className="feedback-label">📌 Evidence</span>
                    <p className="feedback-evidence">{item.evidence}</p>
                  </div>

                  {item.concern && (
                    <div className="feedback-item">
                      <span className="feedback-label">⚠️ Concern</span>
                      <p className="feedback-concern">{item.concern}</p>
                    </div>
                  )}

                  <div className="feedback-item">
                    <span className="feedback-label">💡 Suggestion</span>
                    <p className="feedback-suggestion">{item.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submission Content */}
          <details className="submission-details">
            <summary>📝 View Your Submission</summary>
            <pre className="submission-content">{attempt.content}</pre>
          </details>
        </>
      )}

      {/* Action Buttons */}
      <div className="feedback-actions">
        <button
          className="try-again-btn"
          onClick={() => navigate(`/problem/${attempt.problemId?._id || attempt.problemId}`)}
        >
          🔄 Try Again
        </button>
        <Link
          to={`/history/${attempt.problemId?._id || attempt.problemId}`}
          className="view-history-btn"
        >
          📊 View All Attempts
        </Link>
      </div>
    </div>
  );
}
