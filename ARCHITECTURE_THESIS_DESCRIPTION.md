# H. Thesis-Ready Architecture Description

## Overview

This document describes the complete system architecture of GearGhar, a motorcycle parts e-commerce platform integrated with an AI-powered assistant. The architecture is designed around a **retrieval-augmented generation (RAG)** paradigm that makes MongoDB the source of truth and constrains the Gemini LLM to only rephrase facts already retrieved from the database. Every factual claim in a user-facing reply is traceable to a specific MongoDB document, and every violation of this invariant is recorded enabling a measurable hallucination rate.

## Architectural Layers

### 1. Presentation Layer (Next.js + React)

The user interface consists of a Next.js 15 application with React 18, rendered using the App Router. The frontend is primarily client-side (`'use client'`) for interactive components: the ChatWidget floating assistant, product catalog browsing, shopping cart management, and authentication forms (login, register). 

Key frontend components:
- **ChatWidget.tsx**: Fixed-bottom-right floating widget with message history, product recommendation cards with fitment verdict labels, reason chips (DB-derived explainability), knowledge source citations, per-turn feedback (thumbs up/down), and starter suggestion buttons. The widget reads conversation state from MongoDB (keyed by sessionId stored in localStorage), not from client-supplied history.
- **Header.tsx**: Site navigation with auth state (login/logout, profile). Uses Next.js middleware for route protection; user role and ID are passed as request headers.
- **ProductCard.tsx**: Catalog product display with pricing, rating stars, stock status ("In stock"/"Out of stock"), and discount badges. Image loading via Next.js Image component with S3 remote pattern.
- **CartContext**: Client-side shopping cart persisted in localStorage; items are CartItem objects (id, name, price, quantity, image).

The frontend communicates with the backend exclusively through Next.js API routes (`/api/...`). All chat messages are sent to `POST /api/chat` with `{message, sessionId}`; no client-supplied conversation history is included — the server reads history from MongoDB.

### 2. API Layer (Next.js Routes + Express)

All HTTP requests enter through Next.js route handlers at `/api/...`. The auth middleware (`middleware.ts`) protects `/admin/*` and `/user/*` routes by verifying a JWT access token from HTTP-only cookies. On successful verification, the middleware extracts `userId`, `email`, and `role` into request headers (`x-user-id`, `x-user-email`, `x-user-role`) for downstream use.

Route handlers form the single entry point for all operations:
- `POST /api/auth/register` / `POST /api/auth/login` / `POST /api/auth/profile` / `PUT /api/auth/profile`
- `POST /api/auth/login-admin` / `GET/POST/PUT/DELETE /api/admin/users`
- `POST /api/chat` (the primary orchestrator — `handleChat` function)
- `POST /api/chat/feedback` (per-turn human judgement)
- `GET/POST /api/products/*` (catalog search, filtering, facets, related products, collections)
- `GET /api/demo` (simple hello-world endpoint)

### 3. Business Logic Layer (Nine Specialised Services)

The core orchestration lives in nine TypeScript services, each with a single responsibility:

| Service | Core Responsibility |
|---|---|
| `motorcycle-nlu.service.ts` | Rule-based NLU: intent classification (keyword-weighted, prior specificity, corroboration), motorcycle detection from text (fuzzy matching, alias resolution, typo tolerance with Levenshtein distance), category detection using the canonical taxonomy (70+ part categories), slot extraction (budget, odometer, year), definition query detection |
| `knowledge-retrieval.service.ts` | MongoDB-grounded knowledge retrieval for three knowledge bases: maintenance tasks (filtered by motorcycle type, engine displacement, odometer overdue status), symptom diagnosis (ranked differential ordered by `priorConfidence`), part glossary (beginner education for definition queries) |
| `product-retrieval.service.ts` | Multi-channel product retrieval with Reciprocal Rank Fusion (RRF, k=60): Channel 1 (relational — ProductCompatibility links), Channel 2 (lexical — MongoDB `$text` index), Channel 3 (rule — partCategory taxonomy match). Quality boosts: fitment (FITS=+0.06, FITS_UNIVERSAL=+0.02), category match, Bayesian-damped rating, stock status, repeat purchase penalty. Four-valued fitment verdicts assigned via `resolveFitmentBatch()`. |
| `compatibility.service.ts` | Four-valued fitment verdict engine: `FITS` (specific link exists), `FITS_UNIVERSAL` (universal flag), `NO_FIT` (closed-world inference: category coverage exists but this product not linked), `UNKNOWN` (no data). Implements conservative closed-world inference — `NO_FIT` only when sibling products in the same category ARE linked for that bike. |
| `grounding.service.ts` | Verification and enforcement of INV-G invariant: `GROUNDED_ANSWER_SCHEMA` forces Gemini JSON output `{answer, citedProductIds, citedKnowledgeRefs, confidence, needsClarification}`; `verifyAnswer()` performs six checks (non-empty answer, product citation validity, knowledge citation validity, price fidelity, invented-entity detection, safety escalation); `recordViolations()` persists every failure to `GroundingViolation` collection; `buildRepairPrompt()` generates single retry prompt; deterministic fallback when verification fails after 2 attempts. |
| `gemini.service.ts` | Thin Gemini REST client: configuration check (GEMINI_API_KEY + GEMINI_MODEL), `generateContent()` (free-form), `generateStructured()` (JSON-constrained with schema), error diagnostics (quota exhaustion, rate limiting, invalid API key, service disabled), diagnostics that never leak the API key. |
| `conversation.service.ts` | Server-authoritative dialogue state: conversation memory in MongoDB (ChatConversation, survives reloads/device switches), `persistTurn()` (appends user+assistant messages, advances state), `loadContext()` (reads session state + user garage + prior messages + purchased IDs + beginner mode), `rememberMotorcycle()` (updates User.garage, idempotent, promotes to primary). |
| `explanation.service.ts` | Deterministic reason generation: `buildReasons()` produces ordered Reason chips from MongoDB fields only (code, label, text, evidence, tone); supports spec comparison (`compareProducts()`) for the `comparison` intent; `summariseReasons()` produces 2-chip summary for deterministic replies. |
| `auth.service.ts` | User management: register (with email availability check, username check, password hashing via bcrypt, name field handling), login (password verification via bcrypt, JWT generation via jsonwebtoken with 7d expiry), admin login (role check), token generation/verification. |

### 4. Data Layer (MongoDB)

Eleven collections persist the complete system state. The schema design enforces that all factual claims are document-traceable:

| Collection | Purpose | Key Indexes |
|---|---|---|
| `users` | Accounts + garage (persistent motorcycle memory) | `{role:1}`, `{status:1}`, `{ 'garage.motorcycle':1 }`, `{ 'garage.motorcycleSlug':1 }`, `{email:1 unique}` |
| `motorcycles` | Catalogue of motorcycle models for NLU matching | `{brand:1}`, `{aliases:1}`, `{type:1, engineCc:1}`, `{abs:1}` |
| `products` | Product catalogue with structured attributes for retrieval | `{category:1}`, `{partCategory:1}`, `{brand:1}`, `{status:1}`, `{price:1}`, `{ratingAvg:-1}`, `{universalFit:1}`, `{beginnerFriendly:1}`, text index `{name:'text',tags:'text',description:'text'}` (weights: 10/5/1) |
| `productcompatibilities` | Product↔ motorcycle fitment links (specific + universal) | `{motorcycle:1}`, `{product:1}`, `{universal:1}`, `{product:1,motorcycle:1}` (unique, sparse) |
| `orders` | Order lifecycle with status history | `{user:1, createdAt:-1}`, `{status:1}`, `{paymentStatus:1}` |
| `chatconversations` | Server-side conversation memory | `{sessionId:1 unique}`, `{'messages.turnId':1}` |
| `chatfeedbacks` | Per-turn human judgement (thesis evaluation) | `{turnId:1 unique}`, `{rating:1, createdAt:-1}`, `{intent:1, rating:1}` |
| `chatanalyticsevents` | Per-turn analytics (thesis metrics) | `{createdAt:-1, intent:1}` (primary analytics index) |
| `groundingviolations` | Hallucination measurement (INV-G invariant breaches) | `{violationType:1, createdAt:-1}`, `{createdAt:-1}` |
| `maintenancetasks` | Maintenance knowledge base (100+ documents) | `{taskKey:1 unique}`, `{ 'appliesTo.types':1 }`, `{ 'appliesTo.motorcycleSlugs':1 }`, `{ relatedPartCategories:1 }`, `{ safetyCritical:1 }`, text index |
| `symptomrules` | Diagnostic rule base for repair intent (100+ rules) | `{symptomKey:1 unique}`, `{aliases:1}`, `{ safetyCritical:1 }`, text index `{title:'text', aliases:'text'}` (weights: 10/6) |
| `partglossaries` | Beginner education (one per taxonomy slug) | `{partCategory:1 unique}`, `{ relatedCategories:1 }`, text index |

**Denormalisation strategy**:
- Review aggregates (`ratingAvg`, `ratingCount`) are denormalised on Product; backfill script populates from Review collection
- Popularity signals (`viewCount`, `salesCount`) incremented atomically via `recordProductView()`
- Conversation state denormalised into `ChatConversation.sessionState` (single-document read)
- No pre-computed fitment verdict store; verdicts computed at read time from ProductCompatibility + Product + Motorcycle

### 5. AI Architecture (Retrieval-Augmented Generation)

The central technical contribution. The pipeline guarantee: **no factual claim about products, prices, fitment, or maintenance reaches the user without being traceable to a MongoDB document retrieved for that turn.**

#### The RAG Pipeline (9 Steps)

**Step 1 — NLU Classification** (`motorcycle-nlu.service.ts`):
- Keyword-weighted intent scoring (cues strength 1-3, prior specificity 1.0-1.3, corroboration bonus 0.2)
- Motorcycle detection: fuzzy matching against 100+ catalogue models with alias support and Levenshtein typo tolerance
- Category detection: taxonomy keyword matching with specificity weighting (multi-word keywords get higher weight)
- Slot extraction: budget, odometer, year
- Definition query detection: "what is X?" vs "what X should I buy?"

**Step 2 — Context Loading** (`conversation.service.ts`):
- MongoDB conversation read (sessionId key)
- User's persistent garage (User.garage, lowest-priority fallback)
- Prior messages (last 12 user messages for NLU lookback)
- Purchased product IDs (for repeat demotion)
- Beginner mode flag

**Step 3 — Knowledge Retrieval** (`knowledge-retrieval.service.ts`):
- Route by intent: repair → retrieveSymptoms(); maintenance → retrieveMaintenance(); general/product_recommendation/upgrade → retrieveGlossary() if definition query, else category-based lookup
- Output: KnowledgeItem[] with stable refs (e.g., "SymptomRule:overheating")

**Step 4 — Product Retrieval** (`product-retrieval.service.ts`):
- Three-channel RRF ranking (relational, lexical, rule)
- Hard filters: status=active, category gate, budget bound
- Fitment resolution via resolveFitmentBatch() → four-valued verdicts (FITS/FITS_UNIVERSAL/NO_FIT/UNKNOWN)
- NO_FIT products removed from recommendations
- Quality boosts and ranking → RetrievedProduct[] with retrievalScore, channels

**Step 5 — Grounding Pack** (`grounding.service.ts`):
- `buildGroundingPack()` assembles CONTEXT object:
  - userMessage, resolved NLU intent/confidence/motorcycle/categories/budget/odometer
  - products: name, brand, price, inStock, fitment, reasons (from explanation.service)
  - knowledge: ref, kind, title, content, source
  - constraints: citeEveryClaim=true, noNewEntities=true, requiresEscalation, maxWords=150

**Step 6 — Gemini Generation** (`gemini.service.ts`):
- `generateStructured<GroundedAnswer>()` with GROUNDED_ANSWER_SCHEMA (forced JSON)
- Temperature 0.2 (deterministic)
- GROUNDED_SYSTEM_INSTRUCTION (11 hard rules: cite every fact, never invent, recommend only products in context, write for beginner rider, under 150 words, MUST include mechanic escalation when requiresEscalation=true)

**Step 7 — Verification** (`grounding.service.ts`):
- `verifyAnswer(candidate, pack)` six checks:
  1. Non-empty answer
  2. Every cited product ID in retrieved candidate set
  3. Every cited knowledge ref from supplied knowledge set
  4. Price fidelity: every price-mentioned number matches a supplied product price
  5. Invented-entity detection: capitalised multi-word phrases must be supported by retrieved documents (2+ unknown tokens → `unlisted_entity`)
  6. Safety escalation: when requiresEscalation=true, mechanic clause must appear (auto-repaired if missing)

**Step 8 — Repair or Fallback**:
- Single retry allowed (attempt 1 → repair prompt → attempt 2)
- If still fails after 2 attempts → deterministic fallback (`deterministicReply()`)
- answerTier: 2 (verified LLM), 1 (Gemini available but failed verification), 0 (deterministic / Gemini unavailable)

**Step 9 — Persistence & Analytics** (`chat.service.ts`):
- `persistTurn()`: appends messages to ChatConversation, advances dialogue state, writes ChatAnalyticsEvent
- `ChatAnalyticsEvent`: intent, motorcycle, categories, recommendedProducts, knowledgeRefs, aiGenerated, answerTier, verificationFailures, nluConfidence, latencyMs
- `recordViolations()`: every INV-G breach → GroundingViolation collection (violationType, offendingSpan, detail, candidateProductIds, candidateKnowledgeIds, model, attempt, resolvedBy)
- Enables thesis metric: `hallucination_rate = |GroundingViolations| / |ChatAnalyticsEvents|`

## Core Design Principles

### Retrieval-First Principle
The system always retrieves facts from MongoDB first. The LLM is never the source of truth; it is only a rephrasing engine for facts already retrieved. This is enforced by:
- The grounding pack constraints (`citeEveryClaim`, `noNewEntities`)
- The six-check verification pipeline
- The deterministic fallback that is entirely document-driven

### Four-Valued Fitment Verdicts
The compatibility module returns an explicit four-valued verdict rather than a boolean "fits/no fits":
- `FITS` — specific product↔motorcycle link exists; explanation surfaces fitmentNotes
- `FITS_UNIVERSAL` — product marked universal fit; fits all motorcycles
- `NO_FIT` — conservative closed-world inference: the catalogue knows fitment for this category on this bike, but this specific product is not linked; assistant says "does not fit"
- `UNKNOWN` — no data either way; never guess

This design makes the assistant capable of saying "no" and "I don't know" as first-class answers, which is essential for safety-critical domains.

### Document-Traceable Explainability
Every product reason chip in the UI traces to a specific MongoDB document field or `ProductCompatibility._id`. Every knowledge source citation carries a stable `ref` (e.g., "MaintenanceTask:engine-oil-change") linking to the exact document. The verification pipeline records every unsupported claim. This makes the system suitable for thesis evaluation where every claim must be auditable.

### Session Memory in MongoDB
Conversation memory is stored server-side in MongoDB (ChatConversation collection), not client-supplied. This threefold improvement:
- Memory survives page reloads, cleared localStorage, and device switches
- A logged-in rider's motorcycle is remembered permanently via User.garage
- The browser cannot forge prior turns into the model's context, closing a prompt-injection path

### Anti-Hallucination Measurement
Every verification failure is written to the `GroundingViolation` collection, enabling the quantitative thesis claim:
```
hallucination_rate = total_grounding_violations / total_chat_analytics_events
```
This turns the anti-hallucination claim from an assertion into a measurable rate.

## Data Flow: Complete User Journey

```
User Message
    ↓
Next.js Frontend (ChatWidget)
    ↓
POST /api/chat {message, sessionId}
    ↓
API Layer (middleware: JWT verification → headers)
    ↓
NLU Classification (intent, motorcycle, categories, slots)
    ↓
Context Loading (MongoDB conversation + user garage + prior messages)
    ↓
Knowledge Retrieval (MongoDB: maintenance/symptoms/glossary based on intent)
    ↓
Product Retrieval (MongoDB: RRF multi-channel + fitment verdicts)
    ↓
Grounding Pack Construction (CONTEXT object for Gemini)
    ↓
Gemini Structured Generation (JSON forced by schema + system instruction)
    ↓
Verification (6 checks → pass/retry/fallback)
    ↓
Persistence (ChatConversation + ChatAnalyticsEvent + optional GroundingViolation)
    ↓
Response to User (reply text + product cards + reason chips + knowledge citations + feedback buttons)
```

## Thesis Relevance

GearGhar provides a complete, running implementation of grounded AI for a specialised domain with:
- **Measurable hallucination rates** via the GroundingViolation collection
- **Deterministic fallback behaviour** entirely document-driven
- **Four-valued fitment verdicts** with closed-world inference logic
- **Full conversation analytics pipeline** (per-turn events with intent, motorcycle, categories, answerTier, verificationFailures)
- **Document-traceable explainability** (every reason chip, knowledge ref, and product citation carries a stable document ID)
- **Retrieval-augmented generation** as a fully implemented architecture pattern, not just a concept
- **Rule-based NLU** with deterministic intent classification, motorcycle detection, and slot extraction
- **Multi-channel RRF product retrieval** with quality-boosted ranking
- **Beginner-mode reasoning** with jargon expansion from the part glossary

The system architecture is entirely implemented in TypeScript/React/Node.js/MongoDB, with Google Gemini as the conditional LLM layer. All code is open to inspection and the database schemas are fully documented with Mongoose definitions and indexes.