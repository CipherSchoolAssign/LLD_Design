import { validateSubmission, evaluateWithAI, parseAIResponse, RUBRIC_CRITERIA } from '../services/evaluator.js';

// ─────────────────────────────────────────────────────
// 1. Deterministic Validation
// ─────────────────────────────────────────────────────

describe('Deterministic Validation — validateSubmission', () => {
  test('rejects empty submission', () => {
    const result = validateSubmission('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Submission is empty.');
  });

  test('rejects null submission', () => {
    const result = validateSubmission(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Submission is empty.');
  });

  test('rejects whitespace-only submission', () => {
    const result = validateSubmission('   \n\t  ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Submission is empty.');
  });

  test('rejects too-short submission', () => {
    const result = validateSubmission('parking lot class');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Submission is too short. Please provide a more detailed design with classes, responsibilities, and reasoning.'
    );
  });

  test('rejects submission without design terms (random text > 50 chars)', () => {
    const randomText = 'The quick brown fox jumps over the lazy dog and then runs around in circles.';
    const result = validateSubmission(randomText);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/design elements/);
  });

  test('accepts valid submission with class keyword', () => {
    const content = `
      class ParkingLot {
        This class is responsible for managing parking levels and spots.
        It has methods for addVehicle and removeVehicle.
      }
    `;
    const result = validateSubmission(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('accepts valid submission with design terms', () => {
    const content = `
      The ParkingSpot interface defines the contract for different spot types.
      Each vehicle type has a responsibility to know its size.
      The relationship between ParkingLot and Level is composition.
      I used the Strategy pattern for the pricing algorithm.
    `;
    const result = validateSubmission(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('accepts code-style submission', () => {
    const content = `
      class Vehicle {
        constructor(type, plate) {
          this.type = type;
          this.plate = plate;
        }
        getType() { return this.type; }
      }
      
      class ParkingSpot {
        constructor(level, number) {
          this.level = level;
          this.number = number;
          this.vehicle = null;
        }
        
        isAvailable() { return this.vehicle === null; }
        
        park(vehicle) {
          this.vehicle = vehicle;
        }
      }
    `;
    const result = validateSubmission(content);
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────
// 2. Edge Cases
// ─────────────────────────────────────────────────────

describe('Edge Cases', () => {
  test('handles exactly 50 characters with design term', () => {
    const content = 'The class is responsible for this abstract method.';
    const result = validateSubmission(content);
    expect(result.valid).toBe(true);
  });

  test('handles submission with only code (no English text)', () => {
    const code = `
      class A { method() {} }
      class B extends A { 
        anotherMethod() { return new A(); }
      }
    `;
    const result = validateSubmission(code);
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────
// 3. Module Exports
// ─────────────────────────────────────────────────────

describe('Evaluator Module Exports', () => {
  test('exports validateSubmission function', () => {
    expect(typeof validateSubmission).toBe('function');
  });

  test('exports evaluateWithAI function', () => {
    expect(typeof evaluateWithAI).toBe('function');
  });

  test('exports parseAIResponse function', () => {
    expect(typeof parseAIResponse).toBe('function');
  });

  test('exports RUBRIC_CRITERIA array with all 6 criteria', () => {
    expect(Array.isArray(RUBRIC_CRITERIA)).toBe(true);
    expect(RUBRIC_CRITERIA.length).toBe(6);
    expect(RUBRIC_CRITERIA).toContain('Requirement Understanding');
    expect(RUBRIC_CRITERIA).toContain('Class Responsibilities & Cohesion');
    expect(RUBRIC_CRITERIA).toContain('Coupling & Encapsulation');
    expect(RUBRIC_CRITERIA).toContain('Design Patterns & Abstraction');
    expect(RUBRIC_CRITERIA).toContain('Extensibility');
    expect(RUBRIC_CRITERIA).toContain('Explanation Quality');
  });
});

// ─────────────────────────────────────────────────────
// 4. AI Response Parsing — parseAIResponse
// ─────────────────────────────────────────────────────

// Helper: builds a valid 6-criterion AI response object
const buildValidResponse = (overrides = {}) => ({
  overallScore: 7,
  summary: 'Good design with some areas for improvement.',
  feedback: [
    { criterion: 'Requirement Understanding', score: 8, evidence: 'Covered all requirements', concern: 'Missing edge case', suggestion: 'Add error handling', confidence: 'high' },
    { criterion: 'Class Responsibilities & Cohesion', score: 7, evidence: 'Classes are focused', concern: 'Manager class is large', suggestion: 'Extract helper class', confidence: 'high' },
    { criterion: 'Coupling & Encapsulation', score: 6, evidence: 'Used private fields', concern: 'Direct field access in tests', suggestion: 'Add getter methods', confidence: 'medium' },
    { criterion: 'Design Patterns & Abstraction', score: 7, evidence: 'Strategy pattern used', concern: 'Could use Factory', suggestion: 'Apply Factory for object creation', confidence: 'medium' },
    { criterion: 'Extensibility', score: 8, evidence: 'Interface-based design', concern: 'Hardcoded enum values', suggestion: 'Use configuration', confidence: 'high' },
    { criterion: 'Explanation Quality', score: 7, evidence: 'Clear reasoning provided', concern: 'Missing trade-off analysis', suggestion: 'Add trade-off discussion', confidence: 'high' },
  ],
  ...overrides,
});

describe('AI Response Parsing — parseAIResponse', () => {
  test('parses valid JSON response correctly', () => {
    const validJSON = JSON.stringify(buildValidResponse());
    const result = parseAIResponse(validJSON, 'TestProvider');

    expect(result.overallScore).toBe(7);
    expect(result.summary).toBe('Good design with some areas for improvement.');
    expect(result.feedback).toHaveLength(6);
    expect(result.feedback[0].criterion).toBe('Requirement Understanding');
    expect(result.feedback[0].score).toBe(8);
    expect(result.feedback[0].evidence).toBe('Covered all requirements');
    expect(result.feedback[0].concern).toBe('Missing edge case');
    expect(result.feedback[0].suggestion).toBe('Add error handling');
    expect(result.feedback[0].confidence).toBe('high');
  });

  test('parses JSON wrapped in ```json markdown fences', () => {
    const wrapped = '```json\n' + JSON.stringify(buildValidResponse()) + '\n```';
    const result = parseAIResponse(wrapped, 'TestProvider');

    expect(result.overallScore).toBe(7);
    expect(result.feedback).toHaveLength(6);
  });

  test('parses JSON wrapped in plain ``` fences', () => {
    const wrapped = '```\n' + JSON.stringify(buildValidResponse()) + '\n```';
    const result = parseAIResponse(wrapped, 'TestProvider');

    expect(result.overallScore).toBe(7);
    expect(result.feedback).toHaveLength(6);
  });

  test('throws on completely invalid JSON', () => {
    expect(() => parseAIResponse('not json at all', 'TestProvider'))
      .toThrow('TestProvider returned invalid JSON');
  });

  test('throws on truncated JSON', () => {
    const truncated = '{"overallScore": 7, "feedback": [{"criterion":';
    expect(() => parseAIResponse(truncated, 'TestProvider'))
      .toThrow('TestProvider returned invalid JSON');
  });

  test('throws on empty string', () => {
    expect(() => parseAIResponse('', 'TestProvider'))
      .toThrow('TestProvider returned invalid JSON');
  });

  test('throws when overallScore is missing', () => {
    const noScore = JSON.stringify({ summary: 'test', feedback: Array(6).fill({ criterion: 'X', score: 5 }) });
    expect(() => parseAIResponse(noScore, 'TestProvider'))
      .toThrow('TestProvider response missing required fields');
  });

  test('throws when feedback array is missing', () => {
    const noFeedback = JSON.stringify({ overallScore: 7, summary: 'test' });
    expect(() => parseAIResponse(noFeedback, 'TestProvider'))
      .toThrow('TestProvider response missing required fields');
  });

  test('throws when feedback is not an array', () => {
    const notArray = JSON.stringify({ overallScore: 7, feedback: 'not an array' });
    expect(() => parseAIResponse(notArray, 'TestProvider'))
      .toThrow('TestProvider response missing required fields');
  });

  test('throws when feedback has wrong number of items (not 6)', () => {
    const response = buildValidResponse();
    response.feedback = response.feedback.slice(0, 4); // Only 4 items
    expect(() => parseAIResponse(JSON.stringify(response), 'TestProvider'))
      .toThrow('Expected 6 feedback items, got 4');
  });

  test('clamps overallScore to [1, 10] range — score too high', () => {
    const response = buildValidResponse({ overallScore: 15 });
    const result = parseAIResponse(JSON.stringify(response), 'TestProvider');
    expect(result.overallScore).toBe(10);
  });

  test('clamps overallScore to [1, 10] range — score too low', () => {
    const response = buildValidResponse({ overallScore: -3 });
    const result = parseAIResponse(JSON.stringify(response), 'TestProvider');
    expect(result.overallScore).toBe(1);
  });

  test('clamps individual feedback scores to [1, 10]', () => {
    const response = buildValidResponse();
    response.feedback[0].score = -1;
    response.feedback[1].score = 99;
    const result = parseAIResponse(JSON.stringify(response), 'TestProvider');
    expect(result.feedback[0].score).toBe(1);
    expect(result.feedback[1].score).toBe(10);
  });

  test('provides defaults for missing optional feedback fields', () => {
    const response = buildValidResponse();
    // Remove optional fields from one item
    response.feedback[2] = { score: 6 }; // no criterion, evidence, suggestion, confidence
    const result = parseAIResponse(JSON.stringify(response), 'TestProvider');

    expect(result.feedback[2].criterion).toBe('Unknown');
    expect(result.feedback[2].evidence).toBe('No evidence provided.');
    expect(result.feedback[2].suggestion).toBe('No suggestion provided.');
    expect(result.feedback[2].confidence).toBe('medium');
  });

  test('normalizes invalid confidence to "medium"', () => {
    const response = buildValidResponse();
    response.feedback[0].confidence = 'super_high';
    const result = parseAIResponse(JSON.stringify(response), 'TestProvider');
    expect(result.feedback[0].confidence).toBe('medium');
  });

  test('uses default summary when missing', () => {
    const response = buildValidResponse();
    delete response.summary;
    const result = parseAIResponse(JSON.stringify(response), 'TestProvider');
    expect(result.summary).toBe('Evaluation complete.');
  });

  test('includes source name in error messages', () => {
    expect(() => parseAIResponse('bad', 'Gemini')).toThrow(/Gemini/);
    expect(() => parseAIResponse('bad', 'OpenRouter')).toThrow(/OpenRouter/);
  });
});

// ─────────────────────────────────────────────────────
// 5. AI Evaluation — Error Handling & Fallback
// ─────────────────────────────────────────────────────

describe('AI Evaluation — Error Handling', () => {
  test('evaluateWithAI throws when both API keys are not set', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
    process.env.OPENROUTER_API_KEY = 'your_openrouter_api_key_here';

    await expect(
      evaluateWithAI('Test Problem', ['Req 1'], 'Some submission content here with class details')
    ).rejects.toThrow('Both evaluators failed');

    process.env.GEMINI_API_KEY = originalGemini;
    process.env.OPENROUTER_API_KEY = originalOpenRouter;
  });

  test('evaluateWithAI throws when both API keys are empty', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = '';
    process.env.OPENROUTER_API_KEY = '';

    await expect(
      evaluateWithAI('Test Problem', ['Req 1'], 'Some submission content here with class details')
    ).rejects.toThrow('Both evaluators failed');

    process.env.GEMINI_API_KEY = originalGemini;
    process.env.OPENROUTER_API_KEY = originalOpenRouter;
  });

  test('evaluateWithAI error message mentions both Gemini and OpenRouter on dual failure', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = '';
    process.env.OPENROUTER_API_KEY = '';

    try {
      await evaluateWithAI('Test', ['R1'], 'class Foo is responsible for method bar');
    } catch (err) {
      expect(err.message).toMatch(/Both evaluators failed/);
      expect(err.message).toMatch(/Gemini/i);
      expect(err.message).toMatch(/OpenRouter/i);
    }

    process.env.GEMINI_API_KEY = originalGemini;
    process.env.OPENROUTER_API_KEY = originalOpenRouter;
  });
});

describe('Fallback Behaviour', () => {
  test('Gemini key missing but OpenRouter key set — should attempt fallback', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = ''; // Missing Gemini key
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-invalid-key'; // Invalid but present

    // Should not throw "GEMINI_API_KEY is not configured" alone —
    // it should proceed to OpenRouter and ultimately fail with "Both evaluators failed"
    await expect(
      evaluateWithAI('Test', ['Req'], 'class Design with responsible method pattern interface')
    ).rejects.toThrow('Both evaluators failed');

    process.env.GEMINI_API_KEY = originalGemini;
    process.env.OPENROUTER_API_KEY = originalOpenRouter;
  });

  test('Both keys set to placeholder values — both providers should be tried and fail', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
    process.env.OPENROUTER_API_KEY = 'your_openrouter_api_key_here';

    await expect(
      evaluateWithAI('Test', ['Req'], 'class Foo responsible for abstract interface method attribute')
    ).rejects.toThrow('Both evaluators failed');

    process.env.GEMINI_API_KEY = originalGemini;
    process.env.OPENROUTER_API_KEY = originalOpenRouter;
  });

  test('Gemini key present but invalid, OpenRouter key empty — should try both and fail', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = 'invalid-key-12345';
    process.env.OPENROUTER_API_KEY = '';

    await expect(
      evaluateWithAI('Test', ['Req'], 'class Vehicle responsible for encapsulation interface method')
    ).rejects.toThrow('Both evaluators failed');

    process.env.GEMINI_API_KEY = originalGemini;
    process.env.OPENROUTER_API_KEY = originalOpenRouter;
  });
});
