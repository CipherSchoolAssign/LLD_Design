import { GoogleGenerativeAI } from '@google/generative-ai';

// The fixed rubric dimensions for LLD evaluation
export const RUBRIC_CRITERIA = [
  'Requirement Understanding',
  'Class Responsibilities & Cohesion',
  'Coupling & Encapsulation',
  'Design Patterns & Abstraction',
  'Extensibility',
  'Explanation Quality',
];

// ---------- Deterministic Validation ----------

export const validateSubmission = (content) => {
  const errors = [];

  if (!content || content.trim().length === 0) {
    errors.push('Submission is empty.');
    return { valid: false, errors };
  }

  if (content.trim().length < 50) {
    errors.push('Submission is too short. Please provide a more detailed design with classes, responsibilities, and reasoning.');
  }

  const lowerContent = content.toLowerCase();
  const hasClasses = /class\s+\w+|classes?:/i.test(content);
  const hasDesignTerms = ['responsibility', 'interface', 'method', 'attribute', 'property', 'function', 'relationship', 'pattern', 'encapsulat', 'abstract'].some(term => lowerContent.includes(term));

  if (content.trim().length > 50 && !hasClasses && !hasDesignTerms) {
    errors.push('Submission does not appear to contain design elements. Please include class definitions, responsibilities, or design reasoning.');
  }

  return { valid: errors.length === 0, errors };
};

// ---------- Prompt Builder ----------

const buildEvaluationPrompt = (problemTitle, problemRequirements, submissionContent) => {
  return `You are a Principal Software Architect evaluating a Low-Level Design (LLD) solution.

PROBLEM: ${problemTitle}

REQUIREMENTS:
${problemRequirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

LEARNER'S SUBMISSION:
${submissionContent}

EVALUATION RUBRIC — Score each criterion from 1 to 10:
1. Requirement Understanding — Did the learner address the problem requirements?
2. Class Responsibilities & Cohesion — Are classes well-defined with single responsibilities?
3. Coupling & Encapsulation — Are classes loosely coupled? Is internal state protected?
4. Design Patterns & Abstraction — Are patterns applied appropriately (not forced)?
5. Extensibility — Can the design accommodate new requirements without rewriting?
6. Explanation Quality — Is the reasoning clear and well-articulated?

INSTRUCTIONS:
- For each criterion, you MUST quote specific evidence from the learner's submission.
- Identify at least one genuine concern or weakness per criterion.
- Provide a concrete, actionable suggestion for improvement per criterion.
- Be fair: multiple valid designs exist. Do not penalize for choosing a different valid approach.
- Be strict: do not inflate scores. A score of 5-6 means competent but with room for improvement.

RESPOND WITH EXACTLY THIS JSON FORMAT (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "feedback": [
    {
      "criterion": "Requirement Understanding",
      "score": <number 1-10>,
      "evidence": "<exact quote or reference from submission>",
      "concern": "<identified weakness>",
      "suggestion": "<actionable improvement>",
      "confidence": "high"
    },
    {
      "criterion": "Class Responsibilities & Cohesion",
      "score": <number 1-10>,
      "evidence": "<exact quote or reference from submission>",
      "concern": "<identified weakness>",
      "suggestion": "<actionable improvement>",
      "confidence": "high"
    },
    {
      "criterion": "Coupling & Encapsulation",
      "score": <number 1-10>,
      "evidence": "<exact quote or reference from submission>",
      "concern": "<identified weakness>",
      "suggestion": "<actionable improvement>",
      "confidence": "high"
    },
    {
      "criterion": "Design Patterns & Abstraction",
      "score": <number 1-10>,
      "evidence": "<exact quote or reference from submission>",
      "concern": "<identified weakness>",
      "suggestion": "<actionable improvement>",
      "confidence": "medium"
    },
    {
      "criterion": "Extensibility",
      "score": <number 1-10>,
      "evidence": "<exact quote or reference from submission>",
      "concern": "<identified weakness>",
      "suggestion": "<actionable improvement>",
      "confidence": "medium"
    },
    {
      "criterion": "Explanation Quality",
      "score": <number 1-10>,
      "evidence": "<exact quote or reference from submission>",
      "concern": "<identified weakness>",
      "suggestion": "<actionable improvement>",
      "confidence": "high"
    }
  ]
}`;
};

// ---------- Parse & Validate AI Response ----------

export const parseAIResponse = (responseText, source) => {
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`${source} returned invalid JSON. Raw: ${responseText.substring(0, 200)}`);
  }

  if (!parsed.overallScore || !parsed.feedback || !Array.isArray(parsed.feedback)) {
    throw new Error(`${source} response missing required fields.`);
  }
  if (parsed.feedback.length !== 6) {
    throw new Error(`${source}: Expected 6 feedback items, got ${parsed.feedback.length}.`);
  }

  parsed.overallScore = Math.min(10, Math.max(1, parsed.overallScore));
  parsed.feedback = parsed.feedback.map((item) => ({
    criterion: item.criterion || 'Unknown',
    score: Math.min(10, Math.max(1, item.score || 5)),
    evidence: item.evidence || 'No evidence provided.',
    concern: item.concern || '',
    suggestion: item.suggestion || 'No suggestion provided.',
    confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'medium',
  }));

  return {
    overallScore: parsed.overallScore,
    summary: parsed.summary || 'Evaluation complete.',
    feedback: parsed.feedback,
  };
};

// ---------- Gemini Evaluator ----------

const evaluateWithGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
});
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ---------- OpenRouter Fallback ----------

// Free models on OpenRouter to try in order (first available wins)
const OPENROUTER_FREE_MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];


const evaluateWithOpenRouter = async (prompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  console.log('[OpenRouter] Trying free model router...');

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'LLD Practice Platform',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content:
              'You are a Principal Software Architect evaluating Low-Level Design solutions. Follow the user prompt exactly and return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('[OpenRouter] API error:', data);

    throw new Error(
      `HTTP ${response.status}: ${
        data.error?.message || JSON.stringify(data.error || data)
      }`
    );
  }

  const text = data.choices?.[0]?.message?.content;

  if (!text || typeof text !== 'string') {
    throw new Error(
      'OpenRouter returned an empty or invalid response.'
    );
  }

  console.log(
    `[OpenRouter] Success. Model used: ${data.model || 'unknown'}`
  );

  return text;
};


// ---------- Main Evaluator (Gemini → OpenRouter fallback) ----------

export const evaluateWithAI = async (problemTitle, problemRequirements, submissionContent) => {
  const prompt = buildEvaluationPrompt(problemTitle, problemRequirements, submissionContent);

  // Try Gemini first
  try {
    console.log('[Evaluator] Trying Gemini...');
    const responseText = await evaluateWithGemini(prompt);
    const result = parseAIResponse(responseText, 'Gemini');
    console.log('[Evaluator] Gemini succeeded.');
    return result;
  } catch (geminiError) {
    console.warn(`[Evaluator] Gemini failed: ${geminiError.message}. Trying OpenRouter fallback...`);
  }

  // Fallback to OpenRouter
  try {
    const responseText = await evaluateWithOpenRouter(prompt);
    const result = parseAIResponse(responseText, 'OpenRouter');
    console.log('[Evaluator] OpenRouter fallback succeeded.');
    return result;
  } catch (openRouterError) {
    throw new Error(
      `Both evaluators failed. Gemini: overloaded/unavailable. OpenRouter: ${openRouterError.message}`
    );
  }
};
