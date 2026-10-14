# LLD Practice Platform

A focused practice platform that helps learners practice Low-Level Design (LLD), submit solutions, and receive structured AI-powered feedback.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **MongoDB** running locally on port 27017 (or update `.env`)
- **Gemini API Key** (free from [Google AI Studio](https://aistudio.google.com/app/apikey))
- **OpenRouter API Key** _(optional, used as fallback)_ — free from [OpenRouter](https://openrouter.ai/keys)

### Setup & Run

```bash
# 1. Clone the repo
git clone https://github.com/2812shweta/CipherSchools.git
cd CipherSchools

# 2. Setup Backend
cd server
npm install

# 3. Configure environment variables
#    Edit server/.env and set:
#      GEMINI_API_KEY=<your key from Google AI Studio>
#      GEMINI_MODEL=gemini-3.5-flash        # or any supported Gemini model
#      OPENROUTER_API_KEY=<your key>          # optional fallback provider
#      MONGODB_URI=mongodb://localhost:27017  # or your Atlas URI
npm run dev

# 4. Setup Frontend (new terminal)
cd client
npm install
npm run dev
```

The backend runs on **http://localhost:5000** and frontend on **http://localhost:5173**.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `PORT` | No | `5000` | Backend server port |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key for primary AI evaluation |
| `GEMINI_MODEL` | No | `gemini-3.5-flash` | Gemini model to use |
| `OPENROUTER_API_KEY` | No | — | OpenRouter API key for fallback AI evaluation |

### Running Tests

```bash
cd server
npm test
```

## 📋 Features

- **5 curated LLD problems** — Parking Lot, Elevator, Vending Machine, Library, Splitwise
- **Text + code submission** — Write classes, responsibilities, relationships, and reasoning
- **AI-powered rubric feedback** — 6-dimension structured evaluation via Google Gemini
- **Gemini → OpenRouter fallback** — If Gemini is unavailable/rate-limited, evaluation automatically falls back to OpenRouter free models
- **Attempt history** — Track improvement across attempts with score trends
- **Retry on failure** — If AI evaluation fails, submission is saved and can be retried

## 🤖 AI Evaluation — Dual-Provider Fallback

The evaluator uses a **Gemini-primary, OpenRouter-fallback** strategy:

```
Submit → Deterministic validation → Gemini AI → ✅ Result
                                        ↓ (failure)
                                   OpenRouter AI → ✅ Result
                                        ↓ (failure)
                                   Status = "failed" → Retry later
```

1. **Gemini** (primary) — Uses `@google/generative-ai` SDK with the model specified by `GEMINI_MODEL`.
2. **OpenRouter** (fallback) — Uses the `openrouter/free` route, which automatically picks from available free models (Mistral 7B, Qwen 2.5, Gemma 2, Llama 3.2).
3. **Both fail** — Submission is saved with status `failed`. The learner can retry evaluation without re-submitting.

This ensures high availability: even if Gemini is rate-limited or down, learners still get feedback.

## 🏗️ Architecture

```
CipherSchools/
├── server/                    # Express.js backend
│   ├── config/db.js           # MongoDB connection
│   ├── models/
│   │   ├── Problem.js         # LLD problem definitions
│   │   └── Attempt.js         # Attempts with embedded evaluation & feedback
│   ├── routes/
│   │   ├── problemRoutes.js   # Problem CRUD endpoints
│   │   └── attemptRoutes.js   # Submission, feedback, history endpoints
│   ├── services/
│   │   ├── evaluator.js       # Deterministic validation + AI evaluation (Gemini + OpenRouter)
│   │   └── seedProblems.js    # Seed data for 5 LLD problems
│   ├── tests/
│   │   └── evaluator.test.js  # Jest tests
│   └── server.js              # Entry point
├── client/                    # React (Vite) frontend
│   └── src/
│       ├── pages/             # ProblemList, ProblemDetail, Feedback, History
│       ├── services/api.js    # API call layer
│       ├── App.jsx            # Routing
│       └── index.css          # Design system
├── RESEARCH.md                # Research findings
├── DESIGN.md                  # Design decisions & domain model
├── AI_USAGE.md                # AI-assisted decisions
└── README.md                  # This file
```

## 🔑 Key Design Decisions

1. **2 models, not 5** — `Problem` and `Attempt` (with evaluation/feedback embedded as sub-documents). MongoDB best practice: embed when data shares the same lifecycle.

2. **Save before evaluate** — Submission is persisted to DB before AI evaluation runs. If AI times out or fails, the learner's work is never lost.

3. **Structured rubric prompt** — AI evaluates against a fixed 6-dimension rubric with required JSON output. No open-ended "rate this design" questions.

4. **Evidence-based feedback** — AI must quote from the learner's actual submission for each criterion. Prevents hallucinated or generic feedback.

5. **Deterministic + AI evaluation** — Structure validation (empty, too short, missing design terms) runs first without AI. Only valid submissions go to AI.

6. **Dual-provider fallback** — Gemini is primary; OpenRouter free models serve as fallback. Both providers use the same structured prompt and response parser, ensuring consistent feedback format regardless of which provider responds.

## ⚠️ Limitations

- **No authentication** — Uses localStorage UUID. Cannot sync across devices.
- **Inline evaluation** — AI evaluation blocks the HTTP response (~5-10s). Acceptable for prototype.
- **No diagram support** — Text/code only. Adding diagram support would require a new renderer but minimal domain model changes.
- **Fallback quality variance** — OpenRouter free models may produce lower-quality feedback than Gemini. The strict JSON prompt and validation mitigate this, but some variance is expected.

## 🧪 Testing

Tests cover:
- **Deterministic validation** — Empty, null, whitespace, short, and missing-design-term submissions
- **Edge cases** — Boundary lengths, code-only submissions
- **Module exports** — `validateSubmission`, `evaluateWithAI`, `RUBRIC_CRITERIA` verified
- **AI response parsing** — Valid JSON, markdown-wrapped JSON, and malformed JSON handling
- **Fallback behaviour** — Gemini failure triggers OpenRouter; both failures produce correct error
- **Error handling** — Missing/placeholder API keys, empty responses
