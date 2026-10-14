import express from 'express';
import Attempt from '../models/Attempt.js';
import Problem from '../models/Problem.js';
import { validateSubmission, evaluateWithAI } from '../services/evaluator.js';

const router = express.Router();

// POST /api/attempts — Submit a new attempt
router.post('/', async (req, res) => {
  try {
    const { lessonerId, problemId, content, format } = req.body;

    // --- Input Validation ---
    if (!lessonerId || !problemId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: lessonerId, problemId, content.',
      });
    }

    // Check problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found.' });
    }

    // --- Deterministic Validation ---
    const validation = validateSubmission(content);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Submission validation failed.',
        validationErrors: validation.errors,
      });
    }

    // --- Calculate Attempt Number ---
    const previousAttempts = await Attempt.countDocuments({ lessonerId, problemId });
    const attemptNumber = previousAttempts + 1;

    // --- Save Submission BEFORE Evaluation (prevents data loss) ---
    const attempt = new Attempt({
      lessonerId,
      problemId,
      attemptNumber,
      content,
      format: format || 'combined',
      status: 'evaluating',
      submittedAt: new Date(),
    });
    await attempt.save();

    // --- AI Evaluation ---
    try {
      const evaluationResult = await evaluateWithAI(
        problem.title,
        problem.requirements,
        content
      );

      attempt.evaluation = {
        evaluatorType: 'ai',
        overallScore: evaluationResult.overallScore,
        feedback: evaluationResult.feedback,
        summary: evaluationResult.summary,
        evaluatedAt: new Date(),
      };
      attempt.status = 'completed';
      await attempt.save();
    } catch (evalError) {
      // Evaluation failed — mark as failed, but submission is saved
      attempt.status = 'failed';
      attempt.evaluation = {
        evaluatorType: 'ai',
        errorMessage: evalError.message,
      };
      await attempt.save();

      return res.status(200).json({
        success: true,
        data: attempt,
        warning: 'Submission saved, but AI evaluation failed. You can retry evaluation.',
      });
    }

    res.status(201).json({ success: true, data: attempt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/attempts/:id/retry-evaluation — Retry evaluation for a failed attempt
router.post('/:id/retry-evaluation', async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found.' });
    }

    if (attempt.status !== 'failed') {
      return res.status(400).json({
        success: false,
        error: `Cannot retry evaluation. Current status is "${attempt.status}". Only failed attempts can be retried.`,
      });
    }

    const problem = await Problem.findById(attempt.problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Associated problem not found.' });
    }

    attempt.status = 'evaluating';
    await attempt.save();

    try {
      const evaluationResult = await evaluateWithAI(
        problem.title,
        problem.requirements,
        attempt.content
      );

      attempt.evaluation = {
        evaluatorType: 'ai',
        overallScore: evaluationResult.overallScore,
        feedback: evaluationResult.feedback,
        summary: evaluationResult.summary,
        evaluatedAt: new Date(),
      };
      attempt.status = 'completed';
      await attempt.save();

      res.json({ success: true, data: attempt });
    } catch (evalError) {
      attempt.status = 'failed';
      attempt.evaluation = {
        evaluatorType: 'ai',
        errorMessage: evalError.message,
      };
      await attempt.save();

      res.status(200).json({
        success: true,
        data: attempt,
        warning: 'Evaluation failed again. Please check your Gemini API key or try later.',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/attempts/history/:problemId — Get attempt history for a problem
router.get('/history/:problemId', async (req, res) => {
  try {
    const { lessonerId } = req.query;
    if (!lessonerId) {
      return res.status(400).json({ success: false, error: 'lessonerId query parameter is required.' });
    }

    const attempts = await Attempt.find({
      lessonerId,
      problemId: req.params.problemId,
    })
      .sort({ attemptNumber: -1 })
      .select('attemptNumber status evaluation.overallScore evaluation.summary submittedAt format');

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/attempts/:id — Get single attempt with full feedback
router.get('/:id', async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id).populate('problemId', 'title difficulty');
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found.' });
    }
    res.json({ success: true, data: attempt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
