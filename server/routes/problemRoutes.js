import express from 'express';
import Problem from '../models/Problem.js';

const router = express.Router();

// GET /api/problems — List all problems
router.get('/', async (req, res) => {
  try {
    const problems = await Problem.find()
      .select('title description difficulty createdAt')
      .sort({ difficulty: 1 });
    res.json({ success: true, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/problems/:id — Get problem details
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found.' });
    }
    res.json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
