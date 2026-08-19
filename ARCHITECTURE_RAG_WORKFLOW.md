# D. RAG (Retrieval-Augmented Generation) Workflow Explanation

## Core Design Principle

The GearGhar assistant employs **Retrieval-Augmented Generation** as its central architectural pattern. The system never relies on the LLM as a source of factual information. Instead, it:

1. **Retrieves** all relevant facts from MongoDB (product catalog, fitment data, maintenance knowledge, symptom diagnostics, part glossary)
2. **Grounds** the LLM output against those retrieved facts via a structured JSON schema and six server-side verification checks
3. **Falls back** to a deterministic, document-only reply if verification fails after one retry attempt
4. **Records** every verification failure in a GroundingViolation collection, enabling a measurable hallucination rate

This design makes the anti-hallucination claim quantifiable: `hallucination_rate = violating_turns / total_generated_turns`.

## End-to-End RAG Flow

### Step 1: Natural Language Understanding

The user's message passes through the rule-based NLU layer (`motorcycle-nlu.service.ts`) before any retrieval occurs:

- **Intent classification**: Keyword matching with weighted cues (strength 1-3), specificity prior (1.0-1.3), and corroboration bonus (0.2). The top-ranked intent determines the conversation path. Confidence is the normalized margin between top two intents.
- **Motorcycle detection**: Fuzzy matching against the motorcycle catalogue (100+ models). Supports brand+model names ("Yamaha R15 V4"), aliases ("r15v4", "r15 v4", "yzf r15"), and typo tolerance (Levenshtein distance). Session memory: if no bike named in current message, earlier messages are checked.
- **Category detection**: Taxonomy keyword matching (70+ part categories). Multi-word keywords get higher specificity weight (e.g., "bar end mirror" > "mirror").
- **Slot extraction**: Budget (e.g., "under 5000"), odometer (e.g., "45000 km"), year (4-digit model year).
- **Definition query detection**: Distinguishes "what is a tail tidy?" (definition) from "what tail tidy should I buy?" (shopping).

### Step 2: Server-Authoritative Context Loading

The conversation service (`conversation.service.ts`) loads state from MongoDB, keyed by sessionId:

- **Persistent garage**: User's stored motorcycle (User.garage) — lowest-priority fallback. If the user has a primary motorcycle in their garage, it is remembered across sessions.
- **Conversation history**: Last 12 user messages (newest-first) feed the NLU lookback; last 6 turns (3 exchanges) form the LLM context.
- **Purchased product IDs**: Demote previously bought products from recommendations.
- **Beginner mode**: Flag affecting reason presentation (beginner-friendly chips, simplified language).

### Step 3: Knowledge Retrieval

Depending on the classified intent, knowledge is retrieved from MongoDB:

| Intent | Retrieval Method | Output |
|---|---|---|
| `repair` | `retrieveSymptoms(bike, queryText)` | Ranked differential diagnosis (causes ordered by `priorConfidence`) |
| `maintenance` | `retrieveMaintenance(bike, categories, queryText, odometerKm)` | Overdue service tasks with interval calculations |
| `general`/`product_recommendation`/`upgrade` | `retrieveGlossary(categories, queryText)` if definition query; else category-based glossary lookup | Beginner education entries |
| `comparison` | Glossary for comparative education | Part-category explanations |

Each `KnowledgeItem` carries a stable `ref` (e.g., `"SymptomRule:overheating"`) used by the verification layer.

### Step 4: Product Retrieval with Fitment Resolution

Product candidates are retrieved via three-channel RRF (Reciprocal Rank Fusion):

1. **Relational channel**: Products linked via ProductCompatibility to the detected motorcycle (specific fits + universal fits)
2. **Lexical channel**: MongoDB `$text` search on name/tags/description (weighted: name=10, tags=5, description=1)
3. **Rule channel**: Products matching the requested `partCategory` from the taxonomy

After fusion and quality boosts, `resolveFitmentBatch()` assigns a four-valued verdict to each product:

- `FITS` — specific product↔motorcycle compatibility link exists; explanation surface fitmentNotes
- `FITS_UNIVERSAL` — product marked universal fit; explanation notes universal status
- `NO_FIT` — closed-world inference: the catalogue knows fitment for this part category on this bike, but this product is not linked
- `UNKNOWN` — no fitment data either way; never guess

Products with `NO_FIT` verdict are **removed** from recommendations entirely. The assistant must never recommend a part the data says will not fit.

Each `RetrievedProduct` carries: `fitment` (verdict), `fitmentExplanation`, `fitmentNotes`, `fitmentEvidenceId`, `compatibleWithBike` (boolean).

### Step 5: Grounding Pack Construction

The `buildGroundingPack()` function in `grounding.service.ts` assembles the CONTEXT object that is passed to Gemini. This is the critical gateway between retrieval and generation:

```typescript
interface GroundingPack {
  userMessage: string;
  resolved: { intent, confidence, motorcycle, motorcycleRemembered, categories, budget, odometerKm };
  products: Array<{ id, name, brand, price, currency, inStock, fitment, reasons: string[] }>;
  knowledge: Array<{ ref, kind, title, content, source }>;
  constraints: { citeEveryClaim: true, noNewEntities: true, requiresEscalation: boolean, maxWords: number };
}
```

Key constraints enforced:
- `citeEveryClaim: true` — every factual statement must be traceable
- `noNewEntities: true` — no product/brand/entity may appear that is not in the supplied context
- `requiresEscalation: boolean` — auto-derived from knowledge (safety-critical symptoms always require mechanic advisory)
- `maxWords: 150` — concurrency constraint for beginner-friendly output

### Step 6: Structured Gemini Generation

The CONTEXT object is passed to Gemini via `generateStructured<GroundedAnswer>()` with:

- **Schema**: `GROUNDED_ANSWER_SCHEMA` = `{answer, citedProductIds, citedKnowledgeRefs, confidence, needsClarification}` (required: answer, citedProductIds, citedKnowledgeRefs)
- **System instruction** (`GROUNDED_SYSTEM_INSTRUCTION`): 11 hard rules for the LLM, including:
  - Recommend ONLY products present in context.products
  - NEVER state a price, stock level, brand or fitment claim not in context
  - NEVER invent product names, part numbers, service intervals or specifications
  - Use context.knowledge for maintenance, diagnosis and part explanations
  - If context.products is empty, do not name any product
  - When requiresEscalation is true, MUST advise consulting a qualified mechanic
  - Be concise, friendly, practical; under 150 words
  - Write for a beginner rider
- **Temperature**: 0.2 (low = deterministic)
- **Max output tokens**: 800
- **Forced JSON output**: `responseMimeType: 'application/json'`

### Step 7: Verification

The `verifyAnswer()` function performs six checks on the generated JSON:

1. **Non-empty answer**: The model must produce answer text
2. **Product citation validity**: Every ID in `citedProductIds` must exist in the retrieved candidate set
3. **Knowledge citation validity**: Every ref in `citedKnowledgeRefs` must be from the supplied knowledge set
4. **Price fidelity**: Every price-mentioned number in the prose must match a supplied product price (supports Rs.8499, $84.99, INR 8499 formats)
5. **Invented-entity detection**: Capitalised multi-word phrases in the answer are checked against allowed terms (product names, brands, knowledge titles, motorcycle labels, categories). Two+ unknown tokens in one phrase → `unlisted_entity` violation
6. **Safety escalation**: When `requiresEscalation=true`, the mechanic-advice clause must appear (auto-repaired if missing, never rejected)

### Step 8: Repair or Fallback

- **Single retry allowed**: If verification fails on attempt 1, a repair prompt is generated listing each failure, and Gemini is called once more (attempt 2) with the repair prompt appended.
- **Deterministic fallback**: If verification fails after 2 attempts, or if Gemini is not configured, the system produces `deterministicReply()` — a completely document-driven reply with no LLM involvement.
- **Tier tracking**: `answerTier` = 2 (verified LLM), 1 (Gemini available but failed verification), 0 (deterministic fallback / Gemini unavailable).

### Step 9: Persistence and Analytics

Every turn is persisted to MongoDB (`finaliseTurn()`):

- Chat conversation message history (user + assistant turns)
- Dialogue state (pendingSlot, pendingIntent, lastShownProducts, lastCategories, beginnerMode, turnCount)
- Analytics event (`ChatAnalyticsEvent`): intent, motorcycle, categories, recommendedProducts, knowledgeRefs, aiGenerated, answerTier, verificationFailures, nluConfidence, latencyMs
- Feedback capture (optional per-turn thumbs up/down with reason)

Every verification failure is recorded in `GroundingViolation` with: violationType, offendingSpan, detail, candidateProductIds, candidateKnowledgeIds, model, attempt, resolvedBy.

This enables the thesis metric: `hallucination_rate = |GroundingViolations| / |ChatAnalyticsEvents|`.

### Summary: The RAG Guarantee

> **No factual claim about products, prices, fitment, or maintenance reaches the user without being traceable to a MongoDB document retrieved for that turn.** The LLM is a rephrasing engine only, and its output is subject to server-side verification that either validates or suppresses every claim.