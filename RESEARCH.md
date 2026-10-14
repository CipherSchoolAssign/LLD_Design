# Research Note — LLD Practice Platform

## 1. The Learner Problem

Low-Level Design (LLD) practice is easy to start but extremely hard to evaluate. A learner can design a Parking Lot or Elevator system and still remain unsure whether their abstractions, responsibilities, relationships, and trade-offs are actually good. The core challenges are:

- **No single correct answer** — unlike DSA problems with test cases, LLD problems have multiple valid designs. A learner cannot simply "run their solution" and get pass/fail.
- **Self-evaluation is unreliable** — without mentorship or expert review, learners cannot identify whether their class boundaries are too broad (god classes), too narrow (over-engineering), or poorly coupled.
- **Feedback is scarce** — most resources provide reference solutions but not diagnostic feedback explaining *why* a particular design decision is weak or strong.
- **No improvement loop** — learners solve a problem once and move on. There's no mechanism to track recurring weaknesses (e.g., consistently violating SRP, or always missing concurrency concerns).

## 2. Existing Approaches Researched

### 2.1 LLDCoding (lldcoding.com)
- **What it offers:** Dedicated platform for machine coding / LLD interviews with an integrated IDE, test cases, and automated evaluation.
- **Submission format:** Code (working implementation).
- **Feedback:** Automated test-case-based — pass/fail on functional correctness.
- **Gap:** Evaluates *functional correctness* but not *design quality*. A solution can pass all tests with terrible class structure, tight coupling, and no extensibility. No rubric-based design feedback.

### 2.2 awesome-low-level-design (GitHub — ashishps1)
- **What it offers:** Curated collection of LLD problems with UML diagrams, code solutions, and explanations across multiple languages.
- **Submission format:** N/A — it's a reference repository, not a practice platform.
- **Feedback:** None. Learner self-compares against reference solutions.
- **Gap:** No interactive practice loop. No way to submit and get feedback. Reference solutions create a "match the answer" mentality instead of understanding trade-offs.

### 2.3 DesignGurus / Educative.io
- **What it offers:** Structured text-and-diagram courses for LLD. Grokking the OOD interview is a popular course.
- **Submission format:** N/A — passive learning (read + understand).
- **Feedback:** Quiz-style questions, not design evaluation.
- **Gap:** Teaches concepts but doesn't provide a practice-and-feedback loop. Learner reads a reference design but never practices designing from scratch and getting critiqued.

### 2.4 Mock Interview Platforms (Intervue.io, Pramp)
- **What it offers:** Live mock interviews with human reviewers or peers.
- **Submission format:** Verbal explanation + whiteboard/code.
- **Feedback:** Human feedback (high quality but expensive and not scalable).
- **Gap:** Not repeatable. Expensive. Feedback is verbal, not structured/recorded for later review. Cannot practice at 2 AM on a Sunday.

## 3. Key Gaps Identified

| Gap | Impact |
|-----|--------|
| No design-quality feedback | Learner cannot improve class structure, coupling, or extensibility |
| No structured rubric | Feedback is either absent or unstructured ("looks good") |
| No attempt history | Learner cannot track improvement across attempts |
| Reference-solution bias | Multiple valid designs exist, but platforms show only one |
| No AI-powered analysis | LLMs can now provide rubric-grounded design feedback, but no platform uses this well |

## 4. Our Product Direction

Build a focused **LLD Practice Platform** that:

1. **Provides curated LLD problems** with clear requirements and context.
2. **Accepts text + code submissions** where learners describe their design (classes, responsibilities, relationships, reasoning).
3. **Evaluates using a fixed rubric + AI** — deterministic checks for structure, AI-powered analysis for design quality.
4. **Delivers structured, evidence-based feedback** — per-criterion scores with specific evidence from the submission, identified concerns, and actionable improvement suggestions.
5. **Maintains attempt history** — so learners can compare Attempt 1 vs Attempt 3 and see concrete improvement.

The key insight: **feedback should point to evidence in the learner's own solution**, not just compare against a reference answer. This makes feedback useful even when the learner's design is valid but different from a reference.
