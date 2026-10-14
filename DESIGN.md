# Design Note — LLD Practice Platform MVP

## 1. MVP Scope

A minimal, end-to-end practice flow:
- **3–5 curated LLD problems** (Parking Lot, Elevator System, Vending Machine, Library Management, Splitwise)
- **Text + code submission** — learner writes classes, responsibilities, relationships, and reasoning
- **AI-powered rubric evaluation** — 6-dimension structured feedback via Gemini API
- **Attempt history** — all past attempts per problem with scores and feedback
- **Retry flow** — re-attempt with previous feedback visible for comparison

## 2. User Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Problem     │────▶│  Practice /      │────▶│  Submit      │
│  Dashboard   │     │  Write Solution  │     │  Solution    │
└─────────────┘     └──────────────────┘     └──────┬──────┘
                                                     │
                                                     ▼
                    ┌──────────────────┐     ┌──────────────┐
                    │  Review          │◀────│  View        │
                    │  History         │     │  Feedback    │
                    └──────────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  Try Again       │
                    │  (New Attempt)   │
                    └──────────────────┘
```

## 3. Domain Model

### Core Entities

```
Problem
├── _id (ObjectId)
├── title (String)
├── description (String)
├── requirements (String[])
├── hints (String[])
├── difficulty (Enum: Easy | Medium | Hard)
└── createdAt (Date)

Attempt
├── _id (ObjectId)
├── lessonerId (String)          // Simple ID, no auth
├── problemId (ref → Problem)
├── attemptNumber (Number)
├── content (String)             // The learner's solution text/code
├── format (Enum: text | code)
├── status (Enum: submitted | evaluating | completed | failed)
├── evaluation (Embedded Object)
│   ├── evaluatorType (Enum: ai | rule-based)
│   ├── overallScore (Number)
│   ├── feedback (Embedded Array)
│   │   ├── criterion (String)
│   │   ├── score (Number, 1-10)
│   │   ├── evidence (String)
│   │   ├── concern (String)
│   │   ├── suggestion (String)
│   │   └── confidence (Enum: high | medium | low)
│   ├── summary (String)
│   └── evaluatedAt (Date)
├── submittedAt (Date)
└── createdAt (Date)
```

### Design Decisions

1. **Attempt embeds evaluation and feedback** — instead of separate collections, we embed evaluation as a sub-document within Attempt. This is a MongoDB best practice since evaluation is always read with its attempt, and we avoid unnecessary joins. The data is never accessed independently.

2. **Two models, not five** — `Problem` and `Attempt` cover the entire domain. Submission, Evaluation, and Feedback are embedded within Attempt since they share the same lifecycle. This reduces complexity for a 5-hour MVP.

3. **LessonerId without auth** — we use a UUID generated on the client and stored in localStorage. This avoids auth complexity while still supporting per-learner history.

## 4. Evaluation Approach

### 4.1 Two-Layer Evaluation

| Layer | Type | What it checks |
|-------|------|---------------|
| **Deterministic** | Rule-based | Empty submission, minimum length, required sections (classes, responsibilities) |
| **AI-Powered** | Gemini API | Design quality across 6 rubric dimensions |

### 4.2 Rubric Dimensions

| # | Criterion | What it evaluates |
|---|-----------|------------------|
| 1 | Requirement Understanding | Did the learner address the problem requirements? |
| 2 | Class Responsibilities & Cohesion | Are classes well-defined with single responsibilities? |
| 3 | Coupling & Encapsulation | Are classes loosely coupled? Is internal state protected? |
| 4 | Design Patterns & Abstraction | Are patterns applied appropriately (not forced)? |
| 5 | Extensibility | Can the design accommodate new requirements without rewriting? |
| 6 | Explanation Quality | Is the reasoning clear and well-articulated? |

### 4.3 AI Evaluation Strategy

- **Structured prompt** with fixed rubric — forces consistent output format
- **Evidence-based feedback** — AI must quote from the learner's submission
- **JSON output** — parsed and stored as structured data, not raw text
- **Confidence scores** — AI reports its confidence for each criterion
- **Dual-provider fallback** — Gemini is the primary evaluator; OpenRouter (free models) serves as automatic fallback

### 4.4 Failure Handling & Provider Fallback

```
Submission → Save to DB (status: evaluating)
          → Try Gemini evaluation
              ├── Success → Parse JSON → status: completed
              └── Failure → Try OpenRouter fallback
                              ├── Success → Parse JSON → status: completed
                              └── Failure → status: failed → Learner can retry
```

- Submission is **saved to DB before** evaluation starts → no data loss
- **Gemini failure** (rate limit, timeout, API key missing) → automatic fallback to OpenRouter free models
- **OpenRouter failure** → status set to `failed`, learner can retry evaluation
- If AI returns invalid JSON → fallback to `failed` status with error message
- Both providers use **the same structured prompt and response parser** → consistent feedback format
- No queue/worker needed — evaluation runs inline (acceptable for MVP)

## 5. API Design

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/problems` | List all problems |
| GET | `/api/problems/:id` | Get problem details |
| POST | `/api/attempts` | Submit a new attempt |
| POST | `/api/attempts/:id/retry-evaluation` | Retry failed evaluation |
| GET | `/api/attempts/history/:problemId` | Get attempt history for a problem |
| GET | `/api/attempts/:id` | Get single attempt with feedback |

## 6. Key Trade-offs

| Decision | Trade-off | Justification |
|----------|-----------|---------------|
| Embedded sub-documents vs separate collections | Less flexibility for querying feedback independently | Feedback is never accessed without its attempt; embedding simplifies reads |
| Inline evaluation vs background queue | Blocks the response during AI evaluation (~5-10s) | Acceptable for MVP; no infra complexity needed |
| Text/code only vs diagrams | Cannot evaluate visual design artifacts | Text/code provides sufficient evidence of design quality for MVP |
| No auth vs full auth | Cannot identify learners across devices | localStorage UUID is sufficient for prototype |
| Fixed rubric vs customizable | Cannot adapt evaluation per problem type | Consistency across problems is more important for MVP |

## 7. Extensibility (Change Tests)

### Change Test A: Add diagram support
- Add `diagram` to the `format` enum on Attempt
- Add a new renderer component in the frontend
- Evaluation prompt needs minor adjustment to handle diagram descriptions
- **Domain model does not change** ✓

### Change Test B: Add rule-based or human evaluator
- The `evaluatorType` field already supports `ai | rule-based`
- Create a new evaluator function with the same interface: `evaluate(submission, rubric) → feedback[]`
- Switch evaluator based on configuration or problem type
- **Practice flow does not change** ✓
