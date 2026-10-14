import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProblem, submitAttempt, fetchAttemptHistory } from '../services/api';

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    Promise.all([fetchProblem(id), fetchAttemptHistory(id)])
      .then(([prob, hist]) => {
        setProblem(prob);
        setHistory(hist);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please write your design solution before submitting.');
      return;
    }
    if (content.trim().length < 50) {
      setError('Your solution is too short. Please provide more detail about classes, responsibilities, and reasoning.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await submitAttempt(id, content);
      navigate(`/feedback/${result.data._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="page-container">
        <div className="error-banner">Problem not found.</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/" className="back-link">← Back to Problems</Link>

      <div className="problem-detail-header">
        <h1>{problem.title}</h1>
        <span className={`difficulty-tag difficulty-${problem.difficulty.toLowerCase()}`}>
          {problem.difficulty}
        </span>
      </div>

      <p className="problem-description">{problem.description}</p>

      <div className="requirements-section">
        <h3>📋 Requirements</h3>
        <ul className="requirements-list">
          {problem.requirements.map((req, i) => (
            <li key={i}>{req}</li>
          ))}
        </ul>
      </div>

      {problem.hints && problem.hints.length > 0 && (
        <div className="hints-section">
          <button
            className="hints-toggle"
            onClick={() => setShowHints(!showHints)}
          >
            {showHints ? '🙈 Hide Hints' : '💡 Show Hints'}
          </button>
          {showHints && (
            <ul className="hints-list">
              {problem.hints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Past Attempts Section */}
      {history.length > 0 && (
        <div className="history-inline">
          <h3>📊 Previous Attempts ({history.length})</h3>
          <div className="history-chips">
            {history.map((attempt) => (
              <Link
                key={attempt._id}
                to={`/feedback/${attempt._id}`}
                className={`history-chip status-${attempt.status}`}
              >
                <span className="chip-number">#{attempt.attemptNumber}</span>
                <span className="chip-score">
                  {attempt.status === 'completed'
                    ? `${attempt.evaluation?.overallScore}/10`
                    : attempt.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Submission Editor */}
      <div className="editor-section">
        <h3>✍️ Your Design Solution</h3>
        <p className="editor-hint">
          Describe your classes, responsibilities, relationships, patterns used, and reasoning.
          You can include code snippets too.
        </p>
        <textarea
          className="design-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Design your solution for "${problem.title}" here...\n\nExample structure:\n\n## Classes & Responsibilities\n- ClassName: responsible for...\n\n## Relationships\n- ClassA uses ClassB for...\n\n## Design Patterns Used\n- Strategy pattern for...\n\n## Trade-offs & Reasoning\n- I chose X over Y because...`}
          rows={20}
          disabled={submitting}
        />
        <div className="editor-footer">
          <span className="char-count">{content.length} characters</span>
          {error && <span className="error-text">⚠️ {error}</span>}
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span> Evaluating with AI...
              </>
            ) : (
              '🚀 Submit for Evaluation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
