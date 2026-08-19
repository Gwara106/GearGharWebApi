# B. Full System Architecture Explanation

## 1. Overall Architecture Pattern

GearGhar follows a **three-tier retrieval-augmented architecture** with a clear separation between the retrieval layer (MongoDB-backed, deterministic) and the generation layer (Gemini LLM, verification-governed).

```
User Request
    ↓
Next.js Frontend (React + Tailwind)
    ↓
API Layer (Next.js routes + Express)
    ↓
Business Logic Layer (Service Layer)
    ↓
MongoDB Database
    ↓
Gemini API (conditional — only when configured + verified)
    ↓
Response
```

The system is designed so that **no factual claim reaches the user without being traceable to a MongoDB document**. The LLM is never the source of truth; it is only a rephrasing engine for facts already retrieved from the database.

## 2. Layer-by-Layer Description

### Frontend Layer (Next.js + React)
- **Client-facing**: Chat widget (ChatWidget.tsx), product catalog pages, shopping cart, header/footer, authentication forms
- **State management**: TanStack React Query for server data synchronization; AuthContext for user session; CartContext for localStorage-persisted shopping cart
- **UI library**: shadcn-ui components (Radix UI primitives) styled with Tailwind CSS
- **Entry points**: `/api/chat` (POST), `/api/auth/*` (POST), `/api/products/*` (GET/POST), `/api/admin/*` (GET/POST/PUT/DELETE)
- **Key frontend components**:
  - `ChatWidget.tsx`: Floating AI assistant with message history, product cards with fitment verdicts, reason chips, knowledge source citations, per-turn feedback
  - `ProductCard.tsx`: Catalog product display with pricing, rating, stock status, "Add to Cart"
  - `Header.tsx`: Navigation with auth state (login/logout, profile), cart count
  - No response yet.  

### API Layer
- **Entry point**: All requests go through Next.js route handlers (`/api/...`)
- **Authentication middleware** (`middleware.ts`): Protects `/admin/*` and `/user/*` routes via JWT verification from cookies; extracts user ID, email, role into request headers
- **Route handlers**: Auth controller (register, login, admin login), chat handler (handleChat), catalog routes (search, facets, related products), order management
- **Request flow**: JSON body ↔ service layer ↔ database; cookies for auth state

### Business Logic Layer (Service Layer)
Nine services orchestrate the retrieval→verification→generation pipeline:

1. **`motorcycle-nlu.service.ts`** - Rule-based NLU: intent classification (`ChatIntent` enum: motorcycle_profile, compatibility_check, repair, maintenance, product_recommendation, upgrade, general), motorcycle detection from text (fuzzy matching against 100+ catalogue models with alias support and typo tolerance), category detection using the canonical taxonomy, slot extraction (budget, odometer, year), definition query detection.

2. **`knowledge-retrieval.service.ts`** - MongoDB-grounded knowledge retrieval for three knowledge bases:
   - `retrieveMaintenance()`: Maintenance tasks filtered by motorcycle type, engine displacement, and odometer overdue status
   - `retrieveSymptoms()`: Ranked differential diagnosis ordered by `priorConfidence` (0..1), deterministic and reproducible
   - `retrieveGlossary()`: Beginner education entries for jargon expansion and definition queries

3. **`compatibility.service.ts`** - Fitment resolution returning four-valued verdicts:
   - `FITS` — specific product↔motorcycle link exists
   - `FITS_UNIVERSAL` — product marked universal fit
   - `NO_FIT` — catalogue knows fitment for this category on this bike, but this product is not linked
   - `UNKNOWN` — no data either way
   - Implements closed-world inference: NO_FIT only when sibling products in the same category ARE linked for that bike

4. **`product-retrieval.service.ts`** - Multi-channel product retrieval with Reciprocal Rank Fusion (RRF, k=60):
   - **Channel 1 (Relational)**: Products linked via ProductCompatibility to the detected motorcycle (specific + universal)
   - **Channel 2 (Lexical)**: MongoDB $text index search on name, tags, description
   - **Channel 3 (Rule)**: Products matching the requested partCategory from the taxonomy
   - Fusion: RRF score = sum(1/(60 + rank)) per channel; quality boosts for fitment, category match, rating, stock, repeat purchase penalty

5. **`gemini.service.ts`** - Thin Gemini REST client with:
   - Configuration check (GEMINI_API_KEY + GEMINI_MODEL env vars)
   - `generateContent()`: Free-form text generation
   - `generateStructured()`: JSON-constrained generation with schema validation
   - Error diagnostics (quota exhaustion, rate limiting, invalid API key, service disabled)
   - Structured generation with responseSchema forcing JSON output

6. **`conversation.service.ts`** - Server-authoritative dialogue state:
   - Conversation memory stored in MongoDB (ChatConversation collection), NOT client-supplied
   - Survives page reloads, device switches, cleared localStorage
   - `persistTurn()`: Appends user+assistant messages, advances dialogue state (pendingSlot, pendingIntent, lastShownProducts, lastCategories, beginnerMode, turnCount)
   - `loadContext()`: Reads session state + user's persistent garage (User.garage) + prior messages + purchased product IDs
   - `rememberMotorcycle()`: Updates User.garage with the rider's motorcycle (idempotent, promotes to primary)

7. **`explanation.service.ts`** - Deterministic reason generation:
   - `buildReasons()`: Produces ordered Reason chips from MongoDB fields only
   - Each reason carries: code, label, text (user-facing), evidence (document field/id), tone
   - Supports spec comparison (`compareProducts()`) for the `comparison` intent

8. **`grounding.service.ts`** - Verification and enforcement of INV-G invariant:
   - `GroundingPack`: Structured context passed to Gemini (resolved NLU, products, knowledge, constraints)
   - `GROUNDED_ANSWER_SCHEMA`: Forces Gemini to output `{answer, citedProductIds, citedKnowledgeRefs, confidence, needsClarification}`
   - `verifyAnswer()`: Six verification checks:
     (a) Non-empty answer
     (b) Every cited product ID exists in the retrieved candidate set
     (c) Every cited knowledge ref exists in the supplied knowledge set
     (d) Price fidelity: every price-mentioned number must match a supplied product price
     (e) Invented-entity detection: capitalised multi-word phrases must be supported by retrieved documents
     (f) Safety escalation: when requiresEscalation=true, the clause "please have it checked by a qualified mechanic" must appear (auto-repaired if missing)
   - `recordViolations()`: Persists every failure to the GroundingViolation MongoDB collection
   - `buildRepairPrompt()`: Appended on the single retry attempt before falling back to deterministic reply

9. **`auth.service.ts`** - User management: register, login, admin login, password reset; JWT token generation (7d expiry); bcrypt password hashing

### MongoDB Database Layer
Nine collections with rich schemas and indexes:

| Collection | Key Fields | Purpose |
|---|---|---|
| `users` | `email` (unique), `role`, `status`, `garage` (IGarageEntry[]) | Account management; garage persists motorcycle across sessions |
| `motorcycles` | `slug` (unique), `brand`, `model`, `type`, `engineCc`, `abs`, `fuelType`, `aliases` | Motorcycle catalogue for NLU matching and fitment lookups |
| `products` | `sku` (unique), `name`, `description`, `price`, `currency`, `category`, `partCategory`, `brand`, `tags`, `specs`, `fitmentDifficulty`, `beginnerFriendly`, `universalFit`, `safetyImpact`, `warrantyMonths` | Product catalogue with structured attributes for retrieval ranking |
| `productcompatibilities` | `product` ⇄ `motorcycle`, `universal` (bool), `fitmentNotes` | Fitment linkage: specific or universal; enables four-valued verdicts |
| `orders` | `orderNumber` (unique), `user`, `items` (⇄ Product), `statusHistory`, `paymentStatus` | Order lifecycle with full status tracing |
| `chatconversations` | `sessionId` (unique), `user`, `messages` (IChatMessage[]), `sessionState` (IChatSessionState) | Server-side conversation memory; survives reloads |
| `chatfeedbacks` | `turnId` (unique), `rating` (1 | -1), `reason` (enum), `answerTier` | Human evaluation data for thesis analysis |
| `chatanalyticsevents` | `sessionId`, `turnId`, `intent`, `motorcycleSlug`, `categories`, `recommendedProducts`, `knowledgeRefs`, `aiGenerated`, `answerTier`, `verificationFailures`, `latencyMs` | Per-turn analytics for thesis metrics (engagement, hallucination rate, etc.) |
| `groundingviolations` | `sessionId`, `turnId`, `violationType`, `offendingSpan`, `detail`, `model`, `attempt`, `resolvedBy` | Hallucination measurement; every INV-G breach is recorded here |
| `maintenancetasks` | `taskKey` (unique), `title`, `summary`, `appliesTo` (types, engineCcMin/Max, motorcycleSlugs), `steps`, `toolsNeeded`, `warningSigns`, `relatedPartCategories`, `safetyCritical`, `source` | Maintenance knowledge base (100+ documents) |
| `symptomrules` | `symptomKey` (unique), `title`, `aliases`, `appliesTo`, `likelyCauses` (ranked by priorConfidence), `escalateToMechanic`, `safetyCritical`, `source` | Diagnostic rule base for repair intent (100+ rules) |
| `partglossaries` | `partCategory` (unique), `title`, `whatItIs`, `whyUpgrade`, `beginnerTips`, `buyingChecklist`, `commonMistakes`, `fitmentDifficulty`, `relatedCategories`, `safetyCritical` | Beginner education glossary (one per taxonomy slug) |

**Indexes** (selected, from schema definitions and seed scripts):
- Users: `{role: 1}`, `{status: 1}`, `{'garage.motorcycle': 1}`, `{'garage.motorcycleSlug': 1}`
- Products: `{category: 1}`, `{partCategory: 1}`, `{brand: 1}`, `{status: 1}`, `{price: 1}`, `{ratingAvg: -1}`, `{status: 1, partCategory: 1, price: 1}`, `{status: 1, brand: 1, partCategory: 1}`, `{universalFit: 1}`, `{beginnerFriendly: 1}`, text index on `{name: 'text', tags: 'text', description: 'text'}` (weights: name=10, tags=5, description=1)
- Motorcycles: `{brand: 1}`, `{aliases: 1}`, `{type: 1, engineCc: 1}`, `{abs: 1}`
- ProductCompatibility: `{motorcycle: 1}`, `{product: 1}`, `{universal: 1}`, `{product: 1, motorcycle: 1}` (unique, sparse)
- Maintenance tasks: `{derivedFrom: 1}`, `{'appliesTo.types': 1}`, `{'appliesTo.motorcycleSlugs': 1}`, `{relatedPartCategories: 1}`, `{safetyCritical: 1}`, text index
- Symptom rules: `{aliases: 1}`, `{safetyCritical: 1}`, `{derivedFrom: 1}`, `{'appliesTo.types': 1}`, text index
- Part glossary: `{partCategory: 1}` (unique), text index on `{title, whatItIs, whyUpgrade}`
- Chat conversations: `{user: 1, updatedAt: 1}`, `{'messages.turnId': 1}`
- Chat feedbacks: `{turnId: 1}` (unique), `{rating: 1, createdAt: 1}`, `{intent: 1, rating: 1}`
- Chat analytics events: `{createdAt: -1, intent: 1}`
- Grounding violations: `{violationType: 1, createdAt: 1}`, `{createdAt: 1}`

### AI Architecture (Retrieval-Augmented Generation)

The AI pipeline is the thesis's central technical contribution. It guarantees that the LLM never invents products, prices, or fitment claims.

#### Flow: User Query → Grounded Response

```
User Message
    ↓
NLU (motorcycle-nlu.service.ts):
  - Intent classification (keyword-weighted, prior specificity, corroboration)
  - Motorcycle detection from text (fuzzy matching, alias resolution, session memory)
  - Category detection (taxonomy keyword matching with specificity weighting)
  - Slot extraction (budget, odometer, year)
  - Definition query detection (what-is vs shopping intent)

    ↓
Context Loading (conversation.service.ts):
  - Load session from MongoDB (ChatConversation by sessionId)
  - Load user's persistent garage (User.garage) as lowest-priority bike memory
  - Load prior messages (last 12 user messages for NLU lookback)
  - Load purchased product IDs (for repeat demotion)
  - Load beginnerMode flag

    ↓
Knowledge Retrieval (knowledge-retrieval.service.ts):
  - Route by intent:
    * `repair` → retrieveSymptoms() → ranked differential diagnosis
    * `maintenance` → retrieveMaintenance() → overdue service intervals
    * `general`/`product_recommendation`/`upgrade` → retrieveGlossary() if definition query,
      else category-based glossary lookup
    * `comparison` → glossary for comparative education
  - Output: KnowledgeItem[] with stable refs (e.g., "SymptomRule:overheating")

    ↓
Product Retrieval (product-retrieval.service.ts):
  - Multi-channel RRF ranking
  - Hard filters: status=active, category gate, budget bound
  - Fitment resolution via resolveFitmentBatch() → four-valued verdicts
  - Quality boosts: fitment (FITS=+0.06, FITS_UNIVERSAL=+0.02), category, rating (Bayesian-damped), stock, repeat penalty
  - Output: RetrievedProduct[] with fitment verdict, retrievalScore, channel provenance

    ↓
Grounding Pack Construction (grounding.service.ts):
  - buildGroundingPack(): Assembles the CONTEXT object for Gemini:
    * userMessage, resolved NLU intent/confidence/motorcycle/categories/budget/odometer
    * products: name, brand, price, inStock, fitment, reasons (from explanation.service)
    * knowledge: ref, kind, title, content, source
    * constraints: citeEveryClaim=true, noNewEntities=true, requiresEscalation, maxWords=150

    ↓
Structured Gemini Generation (gemini.service.ts):
  - generateStructured<GroundedAnswer>() with GROUNDED_ANSWER_SCHEMA:
    * Forces JSON: {answer, citedProductIds, citedKnowledgeRefs, confidence, needsClarification}
    * temperature=0.2 (deterministic), maxOutputTokens=800
    * System instruction (GROUNDED_SYSTEM_INSTRUCTION) mandates: write for beginner rider, cite every fact, recommend ONLY products in context, never invent

    ↓
Verification (grounding.service.ts):
  - verifyAnswer(candidate, pack): Six checks (see above)
  - If ok → return {ok: true, answer: verdict.answer}
  - If not ok → record violations, append repair prompt, allow ONE retry
  - If still fail after 2 attempts → return deterministic fallback

    ↓
Fallback Reply (chat.service.ts):
  - deterministicReply(): Built entirely from retrieved knowledge and product reasons
  - No LLM involvement; every sentence traces to a MongoDB document
  - Surfaces: knowledge primary item, product recommendation lines with reason summaries, safety escalation when needed