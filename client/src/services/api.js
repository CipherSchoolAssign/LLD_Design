const API_BASE = '/api';

// Generate or retrieve a simple learner ID (no auth needed)
export const getLessonerId = () => {
  let id = localStorage.getItem('lld_lessoner_id');
  if (!id) {
    id = 'learner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('lld_lessoner_id', id);
  }
  return id;
};

// ---- Problem APIs ----

export const fetchProblems = async () => {
  const res = await fetch(`${API_BASE}/problems`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const fetchProblem = async (id) => {
  const res = await fetch(`${API_BASE}/problems/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

// ---- Attempt APIs ----

export const submitAttempt = async (problemId, content, format = 'combined') => {
  const res = await fetch(`${API_BASE}/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lessonerId: getLessonerId(),
      problemId,
      content,
      format,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || data.validationErrors?.join(', '));
  return data;
};

export const retryEvaluation = async (attemptId) => {
  const res = await fetch(`${API_BASE}/attempts/${attemptId}/retry-evaluation`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
};

export const fetchAttemptHistory = async (problemId) => {
  const lessonerId = getLessonerId();
  const res = await fetch(`${API_BASE}/attempts/history/${problemId}?lessonerId=${lessonerId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};

export const fetchAttempt = async (id) => {
  const res = await fetch(`${API_BASE}/attempts/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
};
