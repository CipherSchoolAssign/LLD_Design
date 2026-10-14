# AI Usage — Meaningful Decisions

This document describes 5 meaningful decisions where AI tools were used during development, including what was suggested, what was accepted/rejected, and why.

---

## 1. Domain Model: 5 Collections vs 2 Collections

**What AI suggested:** AI initially suggested 5 separate MongoDB collections — `Problem`, `Attempt`, `Submission`, `Evaluation`, and `Feedback` — following a normalized relational model.

**What I decided:** I rejected the normalized approach and chose 2 collections (`Problem` and `Attempt`) with Evaluation and Feedback embedded as sub-documents inside Attempt.

**Why:** In MongoDB, embedding is preferred when data has the same lifecycle and is always read together. An Evaluation is never queried independently from its Attempt. Separate collections would mean unnecessary joins (`$lookup`) and additional complexity for a 5-hour prototype. The tradeoff is reduced query flexibility — but for this MVP, we never need to query feedback independently.

---

## 2. AI Evaluation Prompt Design

**What AI suggested:** AI suggested a simple prompt like "Evaluate this LLD design and give a score out of 10 with feedback."

**What I decided:** I rejected the simple prompt and built a structured rubric-based prompt that:
- Defines 6 specific criteria with clear descriptions
- Requires exact JSON output format
- Forces evidence-based feedback (must quote from submission)
- Requires identifying concerns per criterion
- Includes confidence scores

**Why:** An unconstrained prompt produces inconsistent, often inflated feedback. The structured rubric approach ensures: (a) consistent output format that can be parsed and stored, (b) evidence grounding prevents hallucinated feedback, (c) per-criterion scoring gives actionable, granular feedback instead of a single vague score.

---

## 3. Submission Status State Machine

**What AI suggested:** AI suggested a simple boolean `isEvaluated` flag on submissions.

**What I decided:** I accepted the concept but expanded it to a proper status enum: `submitted → evaluating → completed / failed`. This was suggested during the refinement conversation with AI, and I accepted it.

**Why:** A boolean cannot represent the "currently being evaluated" state or distinguish between "not yet evaluated" and "evaluation failed." The status enum enables: (a) showing appropriate UI for each state, (b) retry logic for failed evaluations, (c) preventing duplicate evaluation requests, (d) clear state transitions that are easy to reason about.

---

## 4. Deterministic Validation Before AI

**What AI suggested:** AI suggested sending all submissions directly to Gemini for evaluation.

**What I decided:** I added a deterministic validation layer that runs before AI evaluation. It checks for: empty submissions, too-short content, and absence of design-related terms.

**Why:** AI calls are expensive, slow (~5-10s), and rate-limited. Catching obviously invalid submissions deterministically saves API costs, provides instant feedback, and keeps the AI focused on evaluating actual design quality rather than rejecting empty forms. This separation also makes the system more testable — deterministic checks can be unit tested without mocking AI.

---

## 5. Error Handling: Save Before Evaluate

**What AI suggested:** AI initially generated code that evaluated the submission and then saved both submission and evaluation together in one database write.

**What I decided:** I restructured the flow to save the submission to the database FIRST (with status `evaluating`), then run AI evaluation, then update with results. If evaluation fails, the submission is preserved with status `failed`.

**Why:** The original approach risks data loss — if the AI call takes 10 seconds and then fails (timeout, rate limit, invalid response), the learner's entire solution would be lost. The "save first" pattern ensures the learner's work is never lost regardless of evaluation outcome, and they can retry evaluation without resubmitting. This is a fundamental principle: separate the act of recording from the act of processing.

---

## 6. OpenRouter as Fallback Provider

**What AI suggested:** AI suggested relying solely on Google Gemini for all evaluations.

**What I decided:** I added OpenRouter as an automatic fallback provider. When Gemini fails (rate limit, timeout, API key misconfiguration, service outage), the evaluator automatically retries the same structured prompt via OpenRouter's free model router.

**Why:**
- **Availability** — Gemini's free tier has rate limits (15 requests/minute, 1500/day). During intensive practice sessions or demos, hitting these limits would block all evaluations. OpenRouter provides access to multiple free models as a safety net.
- **Same prompt, same parser** — Both providers receive the identical structured rubric prompt and their responses go through the same `parseAIResponse` validator. This ensures feedback format consistency regardless of which provider responds.
- **Zero-cost fallback** — OpenRouter's `openrouter/free` route automatically selects from available free models (Mistral 7B, Qwen 2.5, Gemma 2, Llama 3.2), so the fallback incurs no additional cost.
- **Graceful degradation** — The fallback is transparent to the learner. If both providers fail, the submission is saved with status `failed` and can be retried later. No data is ever lost.

**Provider failure handling flow:**
```
evaluateWithAI()
  ├── evaluateWithGemini() → success → parseAIResponse("Gemini") → return result
  │     └── failure (any error) → log warning
  ├── evaluateWithOpenRouter() → success → parseAIResponse("OpenRouter") → return result
  │     └── failure (any error) → throw combined error
  └── "Both evaluators failed" error → caller sets status = "failed"
```

**Trade-off accepted:** Free-tier OpenRouter models may produce slightly lower-quality feedback than Gemini. However, the strict JSON schema enforcement and response validation (`parseAIResponse`) ensure that any response that passes parsing meets the minimum quality bar. A lower-quality evaluation that arrives is better than no evaluation at all.
