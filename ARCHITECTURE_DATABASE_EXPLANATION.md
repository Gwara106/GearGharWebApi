# E. Database Architecture Explanation

## Overview

The GearGhar system persists all state in **MongoDB** using **Mongoose** ODM schemas. The database contains 11 collections that support the product catalog, fitment verification, AI knowledge base, conversation memory, order management, and grounding violation tracking. The schema design reflects the project's core design principle: **all factual claims must be traceable to documented entities**.

## Collection Design

### 1. `users`

Stores rider accounts with persistent garage state.

**Key fields:**
- `email` (String, unique, lowercase, trimmed) — login identifier
- `password` (String, bcrypt-hashed) — never returned in API responses (virtual via `toJSON` transform)
- `role` ('user' | 'admin') — role-based access control
- `status` ('active' | 'inactive') — account lifecycle management
- `garage: [IGarageEntry]` — persistent motorcycle memory; powers assistant personalisation across sessions
  - `motorcycle: ObjectId` ⇄ Motorcycle catalogue entry
  - `motorcycleSlug: string` — e.g. "yamaha-r15-v4"
  - `motorcycleLabel: string` — e.g. "Yamaha R15 V4"
  - `nickname?: string` — user-assigned nickname (max 40 chars)
  - `year?: number` — motorcycle model year (1950–2100)
  - `odometerKm?: number` — current odometer reading
  - `odometerUpdatedAt?: Date` — when odometer was last updated
  - `lastServiceAt?: Date` — last service date
  - `lastServiceKm?: number` — odometer at last service
  - `isPrimary: boolean` — flag for the user's primary bike
  - `addedAt: Date` — when added to garage
- `firstName`, `lastName` — profile fields
- `username` (String, sparse, unique) — mobile app field; allows multiple null values
- `phoneNumber` (String, trimmed) — mobile app field
- `address` (String, max 300 chars) — postal address shown on profile
- `profilePicture` (String, default: 'default-profile.png')
- `recentlyViewed: [ObjectId]` ⇄ Product IDs — capped list driving "recently viewed" UI
- `lastLogin?: Date`
- `createdAt`, `updatedAt` — timestamps

**Indexes:**
- `{ role: 1 }` — role-based queries
- `{ status: 1 }` — active/inactive filtering
- `{ 'garage.motorcycle': 1 }` — garage motorcycle lookups
- `{ 'garage.motorcycleSlug': 1 }` — slug-based garage queries
- `{ email: 1 }` (unique, auto from schema) — authentication

### 2. `motorcycles`

The comprehensive motorcycle catalogue used by NLU for model detection and product compatibility lookups.

**Key fields:**
- `brand` (String, required) — e.g. "Yamaha", "Honda", "KTM"
- `model` (String, required) — e.g. "R15 V4", "MT-15", "Duke 390"
- `slug` (String, unique, lowercase, trimmed) — canonical key e.g. "yamaha-r15-v4"
- `type` ('sport' | 'naked' | 'cruiser' | 'adventure' | 'commuter' | 'scooter' | 'offroad' | 'other') — vehicle classification
- `engineCc?: number` — displacement in cc (when known)
- `yearFrom?: number`, `yearTo?: number` — production year window
- `abs: 'none' | 'cbs' | 'single-channel' | 'dual-channel' | 'switchable'` — braking system
- `fuelType: 'petrol' | 'electric' | 'hybrid'` — propulsion type
- `kerbWeightKg?: number` — weight in kg
- `aliases: [string]` — alternate spellings the NLU should recognise (e.g. ["r15v4", "r15 v4", "yzf r15"])

**Indexes:**
- `{ brand: 1 }` — brand-based filtering
- `{ aliases: 1 }` — alias lookup for fuzzy matching
- `{ type: 1, engineCc: 1 }` — segment queries
- `{ abs: 1 }` — ABS filter queries

### 3. `products`

The product catalogue with structured attributes for retrieval ranking and fitment reasoning.

**Key fields:**
- `name` (String, required, max 100) — product name
- `description` (String, required, max 1000) — product description
- `price` (Number, required, min 0) — selling price
- `currency` ('INR' | 'USD', default: 'INR')
- `originalPriceUSD?: number` — MSRP for discount calculation
- `category` (enum: ['electronics','clothing','accessories','sports','home','other']) — e-commerce category
- `partCategory: string` — **canonical taxonomy slug** (also stored in NLU's PRODUCT_CATEGORY_KEYWORDS); used for precise, leak-free retrieval
- `brand` (String, required, trimmed) — e.g. "Brembo", "NGK", "Mad Max"
- `sku` (String, required, unique, uppercase) — stock keeping unit; auto-generated from partCategory+name+_id if not provided
- `stock` (Number, required, min 0, default 0) — inventory quantity
- `images: [string]` — product image URLs; first image displayed in catalog
- `status` ('active' | 'inactive' | 'out_of_stock') — availability status
- `tags: [string]` — free-form search keywords
- `specs: Map<string, string>` — structured attributes for deterministic spec comparison (used in `compareProducts()`)
- `features: [string]` — bullet-point selling points
- `usageRecommendation?: string` — max 300 chars; "Who and what this part is for, in one plain-language sentence"
- `installationDifficulty` (1-5 Number) — "1 = plug and play, 5 = specialist workshop equipment"
- `beginnerFriendly` (Boolean, default false) — "True when a first-time rider can choose and fit this without guidance"
- `safetyImpact` ('none' | 'low' | 'medium' | 'high' | 'critical') — safety relevance driver
- `universalFit` (Boolean, default false) — "True when the part fits essentially any motorcycle"
- `warrantyMonths?: number` — warranty duration
- `weightGrams?: number` — weight in grams
- `viewCount?: number`, `salesCount?: number` — popularity signals
- `fitmentDifficulty` ('diy_easy' | 'diy_moderate' | 'workshop') — fitted difficulty rating
- `ratingAvg` (0-5 Number, default 0), `ratingCount` (Number, default 0) — denormalised review aggregates

**Indexes:**
- `{ category: 1 }` — e-commerce category filtering
- `{ partCategory: 1 }` — taxonomy-based retrieval (precise, leak-free)
- `{ brand: 1 }` — brand-based filtering
- `{ status: 1 }` — availability filtering
- `{ price: 1 }` — price-range queries
- `{ ratingAvg: -1 }` — rating-based sorting
- `{ status: 1, partCategory: 1, price: 1 }` — category-gate covering index (assistant queries)
- `{ status: 1, brand: 1, partCategory: 1 }` — storefront facet filtering
- `{ status: 1, ratingAvg: -1, ratingCount: -1 }` — quality sorting
- `{ status: 1, salesCount: -1 }` — popularity sorting
- `{ status: 1, createdAt: -1 }` — newest-first sorting
- `{ universalFit: 1 }` — universal fitment queries
- `{ beginnerFriendly: 1 }` — beginner mode filtering
- Text index: `{ name: 'text', tags: 'text', description: 'text' }` with weights {name:10, tags:5, description:1} — replaces old unindexed $regex scans

### 4. `productcompatibilities`

The fitment linkage mapping products to motorcycles. This is the **core enabler** of the four-valued verdict system.

**Key fields:**
- `product: ObjectId` ⇄ Product reference (required)
- `motorcycle?: ObjectId` ⇄ Motorcycle reference (optional when `universal=true`)
- `universal: boolean` (default: false) — when true, product fits all motorcycles; no motorcycle reference needed
- `fitmentNotes?: string` (max 500) — free-form fitment explanation (authored, surfaced verbatim in UI)
- `createdAt`, `updatedAt` — timestamps

**Indexes:**
- `{ motorcycle: 1 }` — fitment lookups by motorcycle
- `{ product: 1 }` — fitment lookups by product
- `{ universal: 1 }` — universal fitment queries
- `{ product: 1, motorcycle: 1 }` (unique, sparse) — **prevents duplicate links**; sparse because universal links have no motorcycle value

### 5. `orders`

Order lifecycle management with full status tracking.

**Key fields:**
- `orderNumber` (String, unique, trimmed) — e.g. "ORD-20260115-001"
- `user: ObjectId` ⇄ User reference (required)
- `items: [IOrderItem]` — order lines
  - `item: ObjectId` ⇄ Product reference (required)
  - `quantity: Number` (min 1)
  - `price: Number` (per-unit price, min 0)
  - `totalPrice: Number` (quantity × unit price)
  - `itemName?: string`, `itemImages?: [string]`
- `subtotal`, `tax`, `shipping`, `discount`, `total` (Numbers, required)
- `currency` (String, default: 'USD', uppercase)
- `status` (enum: pending→confirmed→processing→packed→shipped→delivered→received→cancelled→refunded)
- `statusHistory: [IOrderStatus]` — timestamped status transition log
- `shippingAddress`, `billingAddress` (flexible Object type)
- `paymentMethod: string` — e.g. "credit card", "cash on delivery"
- `paymentStatus` ('pending'|'processing'|'completed'|'failed'|'refunded'|'partially_refunded')
- `paymentId?: string` — gateway transaction ID
- `trackingNumber?: carrier?: estimatedDelivery?: actualDelivery?: notes?: customerNotes?: promoCode?: isGift?: giftMessage?: giftWrap: boolean`

**Indexes:**
- `{ user: 1, createdAt: -1 }` — user's order history (newest first)
- `{ status: 1 }` — status-based filtering
- `{ paymentStatus: 1 }` — payment tracking

### 6. `chatconversations`

**Server-authoritative conversation memory**. Stored in MongoDB, NOT client-supposed. This ensures memory survives page reloads, device switches, and cleared localStorage.

**Key fields:**
- `sessionId` (String, unique) — conversation identifier; stored in client localStorage as `gg_chat_session`
- `user: ObjectId` ⇄ User reference (optional; guest sessions have no user binding)
- `messages: [IChatMessage]` — per-turn transcript
  - `role: 'user' | 'assistant'`
  - `content: string` — message text
  - `turnId: string` — stable ID joining this turn to Feedback and GroundingViolation
  - `intent?: string` — classified intent
  - `motorcycleSlug?: string` — detected motorcycle
  - `categories?: [string]` — detected part categories
  - `recommendedProducts: [ObjectId]` — product IDs shown in this turn
  - `aiGenerated: boolean` — was the reply LLM-generated?
  - `answerTier: number` (0|1|2) — 0=deterministic, 1=Gemini available but failed verification, 2=verified LLM
  - `knowledgeRefs?: [string]` — cited knowledge refs (e.g. "MaintenanceTask:engine-oil-change")
  - `nluConfidence: number` (0-1)
  - `latencyMs: number`
  - `createdAt: Date`
- `sessionState: IChatSessionState` — server dialogue state
  - `activeMotorcycle?: ObjectId` — currently active motorcycle from session state
  - `activeMotorcycleSlug?: string`
  - `pendingSlot: 'motorcycle'|'category'|'budget'|'symptom'| null` — slot waiting to be filled
  - `pendingIntent?: string` — intent the assistant is waiting to resolve
  - `lastShownProducts: [ObjectId]` — product IDs shown in last response
  - `lastCategories: [string]` — categories shown in last response
  - `resolvedBudget?: number` — user's budget from slots
  - `beginnerMode: boolean`
  - `turnCount: number` — total turns in conversation

**Indexes:**
- `{ user: 1, updatedAt: 1 }` — user's conversation history
- `{'messages.turnId': 1 }` — turn ID lookups

### 7. `chatfeedbacks`

Per-turn human judgement for thesis evaluation.

**Key fields:**
- `sessionId: string` — conversation identifier
- `turnId: string` — stable turn identifier (unique index)
- `user?: ObjectId` — optionally the user who gave feedback
- `rating: 1 | -1` — thumbs up/down
- `reason: 'wrong_fit'|'not_helpful'|'confusing'|'too_generic'|'inaccurate'|'great'` — optional reason comment
- `comment?: string` (max 500) — free-form feedback
- `answerTier: number` (0-2) — which answer tier was delivered
- `intent?: string` — the classified intent for this turn
- `aiGenerated: boolean` — was the reply LLM-generated?
- `createdAt: Date`

**Indexes:**
- `{ turnId: 1 }` (unique) — one feedback record per turn (upsert on re-voting)
- `{ rating: 1, createdAt: -1 }` — feedback sorting
- `{ intent: 1, rating: 1 }` — satisfaction slicing

### 8. `chatanalyticsevents`

**Purpose-built for thesis analytics dashboard**. One denormalised event per user turn; aggregations (most searched models, top categories, most recommended products, engagement) stay cheap and index-friendly.

**Key fields:**
- `sessionId: string` (indexed)
- `turnId?: string` — joins to transcript turn and feedback
- `user?: ObjectId` — optional user join
- `intent: string` (default: 'general', indexed)
- `motorcycleSlug?: string` (indexed)
- `motorcycleLabel?: string`
- `categories: [string]` (indexed)
- `recommendedProducts: [ObjectId]` ⇄ Product references (indexed)
- `knowledgeRefs: [string]` — cited knowledge document refs (indexed)
- `aiGenerated: boolean` (default: false, indexed)
- `answerTier: number` (0-2, indexed) — 0/1/2 (deterministic/verified LLM/failed verification)
- `nluConfidence: number` (default: 0)
- `verificationFailures: number` (default: 0) — hallucination count on this turn
- `latencyMs: number` (default: 0)

**Indexes:**
- `{ createdAt: -1, intent: 1 }` — time-window intent aggregation (the primary thesis analytics index)

### 9. `groundingviolations`

**The measurement instrument** for the project's central claim: hallucination rate = violating turns / total generated turns.

**Key fields:**
- `sessionId: string` (indexed, required)
- `turnId: string` (indexed, required)
- `user?: ObjectId` ⇄ User reference
- `violationType: enum` ('schema_invalid' | 'unknown_product_id' | 'unknown_knowledge_id' | 'price_mismatch' | 'unlisted_entity' | 'uncited_claim' | 'missing_escalation' | 'empty_answer')
- `offendingSpan: string` (max 500) — the exact text span that failed verification
- `detail?: string` (max 500) — human-readable failure detail
- `candidateProductIds: [ObjectId]` — Product IDs retrieved for this turn
- `candidateKnowledgeIds: [string]` — Knowledge item refs retrieved for this turn
- `model: string` — Gemini model name (or '' if deterministic fallback)
- `attempt: number` (1 or 2) — which generation attempt triggered the violation
- `resolvedBy: 'retry' | 'fallback' | 'unresolved'` — how the turn was resolved
- `createdAt: Date` (timestamps: createdAt only)

**Indexes:**
- `{ violationType: 1, createdAt: -1 }` — violation type timeline
- `{ createdAt: -1 }` — chronological violation listing

### 10. `maintenancetasks`

Curated maintenance knowledge base (100+ documents).

**Key fields:**
- `taskKey` (String, unique, lowercase, trimmed) — e.g. "engine-oil-change"
- `title` (String, required, max 120)
- `summary` (String, required, max 600)
- `appliesTo: { types: [string], engineCcMin?: number, engineCcMax?: number, motorcycleSlugs: [string] }`
  - `types: []` = all motorcycle types
  - `motorcycleSlugs: []` = all bikes; non-empty = ONLY these model slugs match
- `intervalKm?: number`, `intervalMonths?: number`
- `difficulty: 'diy_easy' | 'diy_moderate' | 'workshop'`
- `steps: [string]` — numbered procedural steps
- `toolsNeeded: [string]`
- `warningSigns: [string]`
- `relatedPartCategories: [string]` — taxonomy slug keys
- `safetyCritical: boolean` — triggers server-enforced escalation clause
- `source: { title, url?, kind: 'oem_manual'|'service_guide'|'editorial' }`
- `derivedFrom?: string` — links derived specialisations to base documents
- `createdAt`, `updatedAt`

**Indexes:**
- `{ taskKey: 1 }` (unique) — upsert key
- `{ 'appliesTo.types': 1 }` — type-based filtering
- `{ 'appliesTo.motorcycleSlugs': 1 }` — model-specific filtering
- `{ relatedPartCategories: 1 }` — category-based filtering
- `{ safetyCritical: 1 }` — safety-aware queries
- `{ derivedFrom: 1 }` — derivation chain queries
- Text index: `{ title: 'text', summary: 'text', warningSigns: 'text' }` with weights {title:10, summary:4, warningSigns:2}

### 11. `symptomrules`

Diagnostic rule base for the `repair` intent (100+ rules).

**Key fields:**
- `symptomKey` (String, unique, lowercase, trimmed) — e.g. "overheating", "wont-start"
- `title` (String, required, max 120)
- `aliases: [string]` — alternate phrases (e.g. ["overheating","overheat","running hot"])
- `appliesTo: { types: [string], engineCcMin?, engineCcMax?, motorcycleSlugs? }`
- `likelyCauses: [ILikelyCause]` — ranked by `priorConfidence` (0..1)
  - `cause: string` (required, max 200)
  - `priorConfidence: Number` (0..1, required)
  - `diagnosticChecks: [string]`
  - `fixPartCategories: [string]`
  - `severity: 'low'|'medium'|'critical'` (default: 'medium')
- `escalateToMechanic: boolean` — when true, reply MUST include mechanic advisory clause
- `safetyCritical: boolean`
- `derivedFrom?: string`
- `source: { title, url?, kind: 'oem_manual'|'service_guide'|'editorial' }`
- `createdAt`, `updatedAt`

**Indexes:**
- `{ symptomKey: 1 }` (unique) — upsert key
- `{ aliases: 1 }` — alias lookup
- `{ safetyCritical: 1 }` — safety flags
- `{ derivedFrom: 1 }` — derivation chains
- Text index: `{ title: 'text', aliases: 'text' }` with weights {title:10, aliases:6}

### 12. `partglossaries`

Beginner education knowledge base (one entry per taxonomy slug).

**Key fields:**
- `partCategory` (String, unique, lowercase, trimmed) — taxonomy slug key
- `title` (String, required, max 120)
- `whatItIs: string` (required, max 800) — plain-language definition
- `whyUpgrade?: string` (max 800) — benefits of upgrading
- `beginnerTips: [string]`
- `buyingChecklist: [string]`
- `commonMistakes: [string]`
- `fitmentDifficulty: 'diy_easy'|'diy_moderate'|'workshop'`
- `relatedCategories: [string]`
- `safetyCritical: boolean`
- `source: { title, url?, kind: 'oem_manual'|'service_guide'|'editorial' }`
- `createdAt`, `updatedAt`

**Indexes:**
- `{ partCategory: 1 }` (unique) — glossary lookup key
- `{ relatedCategories: 1 }` — category adjacency
- Text index: `{ title: 'text', whatItIs: 'text', whyUpgrade: 'text' }` with weights {title:10, whatItIs:4, whyUpgrade:2}

### 13. `groundingviolations` (duplicate entry — see #9)

## Relationship Summary

**Core data flow:**
- `User` 1→N `ChatConversation` (sessions per user; guest sessions optional)
- `User` 1→N `Order` (order history)
- `User` 1→N `GarageEntry` (motorcycle entries in garage)
- `Motorcycle` 1→N `ProductCompatibility` (fitment links)
- `Product` 1→N `ProductCompatibility` (fitment links, reverse direction)
- `Product` 1→N `Review` (product reviews)
- `Product` 1→N `ChatAnalyticsEvent` (per-turn analytics)
- `Knowledge document` (MaintenanceTask/SymptomRule/PartGlossary) → `ChatAnalyticsEvent.knowledgeRefs` (cited references)
- `ChatConversation.messages.turnId` → `ChatFeedback.turnId` (feedback linkage)
- `ChatAnalyticsEvent.turnId` → `GroundingViolation.turnId` (violation linkage)

## Index Strategy Summary

The index strategy prioritises **query patterns from the hot path** (chat orchestration, catalog browsing):

1. **Fitment resolution**: `ProductCompatibility.find({product, $or:[{motorcycle}, {universal:true}]})` — supported by `{motorcycle:1}`, `{product:1}`, `{universal:1}`, `{product+motorcycle:1 unique sparse}`
2. **Product retrieval by category**: `Product.find({status, partCategory, price})` — supported by compound index `{status:1, partCategory:1, price:1}`
3. **Text search**: `Product.find({status, $text:$search})` — supported by weighted text index
4. **Conversation lookups**: `ChatConversation.findOne({sessionId})` + `{'messages.turnId':1}` — supported by unique sessionId index + turnId index
5. **User garage queries**: `User.find({ 'garage.motorcycle': id })` — supported by garage motorcycle index
6. **Intent classification hot path**: SymptomRule/Roles looked up by `symptomKey` or `taskKey` — supported by unique key indexes
7. **Analytics aggregation**: `ChatAnalyticsEvent` grouped by intent and time window — supported by `{createdAt:-1, intent:1}` compound index

## Denormalisation Strategy

- **Review aggregates** (`ratingAvg`, `ratingCount`) are denormalised on Product to avoid per-query aggregation, with a backfill script (`backfill-product-ratings.js`) that populates them from the `Review` collection
- **Popularity signals** (`viewCount`, `salesCount`) are incremented atomically (`recordProductView()`) rather than computed on-read
- **Conversation state** is denormalised into `ChatConversation.sessionState` so the orchestrator reads a single document rather than querying multiple collections
- **Fitment verdicts** are computed at read time from `ProductCompatibility` + `Product` + `Motorcycle`; no pre-computed verdict store