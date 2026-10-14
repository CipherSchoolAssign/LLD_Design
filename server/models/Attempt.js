import mongoose from 'mongoose';

// Feedback per rubric criterion — embedded within evaluation
const feedbackItemSchema = new mongoose.Schema({
  criterion: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  evidence: {
    type: String,
    required: true,
  },
  concern: {
    type: String,
    default: '',
  },
  suggestion: {
    type: String,
    required: true,
  },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
}, { _id: false });

// Evaluation result — embedded within attempt
const evaluationSchema = new mongoose.Schema({
  evaluatorType: {
    type: String,
    enum: ['ai', 'rule-based'],
    default: 'ai',
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 10,
  },
  feedback: {
    type: [feedbackItemSchema],
    default: [],
  },
  summary: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  evaluatedAt: {
    type: Date,
  },
}, { _id: false });

// Main Attempt schema — represents one complete practice attempt
const attemptSchema = new mongoose.Schema({
  lessonerId: {
    type: String,
    required: true,
    index: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true,
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  content: {
    type: String,
    required: true,
  },
  format: {
    type: String,
    enum: ['text', 'code', 'combined'],
    default: 'combined',
  },
  status: {
    type: String,
    enum: ['submitted', 'evaluating', 'completed', 'failed'],
    default: 'submitted',
  },
  evaluation: {
    type: evaluationSchema,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient history queries
attemptSchema.index({ lessonerId: 1, problemId: 1, attemptNumber: -1 });

const Attempt = mongoose.model('Attempt', attemptSchema);
export default Attempt;
