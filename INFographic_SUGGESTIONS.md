# I. Suggestions for Infographics

## 1. System Architecture Infographic

**Concept**: A three-tier vertical infographic showing the flow from user to database and back.

**Layout**:
- **Top layer**: Rider → Chat Widget (floating bottom-right) → Next.js Browser
- **Middle layer**: API Routes (POST /api/chat) → Express (auth middleware) → Business Logic (9 services boxed)
- **Bottom layer**: MongoDB (11 collections illustrated as labeled boxes with key indexes)
- **Arrows**: Solid arrows showing request flow; dashed arrows showing data retrieval return
- **Key labels**:
  - From rider: "Natural language message" (e.g. "Will this exhaust fit my R15 V4?")
  - Through frontend: "Session ID from localStorage", "JWT cookie auth"
  - Through API: "NLU classification", "Knowledge retrieval", "Product retrieval with RRF", "Fitment verdict (4-valued)", "Grounding pack"
  - To database: "users + garage", "motorcycles + aliases", "products + specs", "productcompatibilities", "chatconversations", "groundingviolations"
  - Return: "Deterministic reply OR Gemini JSON → verification → reply"

**Color coding** (consistent with Mermaid diagram):
- Frontend: #3b82f6 (sky blue)
- API/Business: #8b5cf6 (violet)
- Database: #10b981 (emerald)
- AI/LLM: #f59e0b (amber, dashed when conditional)

**Alternative format**: Horizontal "pipeline" diagram similar to processor pipeline stages, showing sequential processing steps (NLU → Context → Knowledge → Products → Grounding Pack → Gemini → Verification → Response).

## 2. Database Architecture Infographic

**Concept**: Entity-relationship diagram-style infographic showing the 11 collections and their key relationships.

**Layout**:
- Circular or radial arrangement with `users` at the center (as the anchor entity)
- Connections shown as labeled arrows between collections

**Key relationships to illustrate**:
- `users` 1→N `orders` (user order history)
- `users` 1→N `garageEntry` (persistent motorcycle memory, inside users collection shown as embedded array)
- `users` 1→N `chatConversation` (sessions per user)
- `users` 1→N `chatAnalyticsEvent` (per-turn events)
- `users` 1→N `groundingViolation` (violations attributed to model turns)
- `motorcycles` 1→N `productCompatibility` (fitment links; one motorcycle has many fitment records)
- `product` 1→N `productCompatibility` (reverse direction; one product linked to many motorcycles)
- `product` 1→N `review` (product reviews)
- `product` 1→N `chatAnalyticsEvent` (per-turn analytics, recommended products field)
- `chatConversation` 1→N `chatMessage` (conversation transcript)
- `chatMessage` 1→1 `chatFeedback` (via turnId, unique index)
- `chatMessage` 1→1 `chatAnalyticsEvent` (via turnId)
- `chatMessage` 1→N `groundingViolation` (one turn can have multiple violations, but typically one)
- `maintenanceTask` / `symptomRule` / `partGlossary` → `chatAnalyticsEvent.knowledgeRefs` (cited references)
- `productCompatibility` → `product` and `motorcycle` (foreign keys)

**Callout boxes** on key collections:
- `productCompatibility`: "Four-valued verdict engine; unique sparse index on (product,motorcycle)"
- `chatanalyticsevents`: "Primary thesis analytics index; aggregation by intent + time window"
- `groundingviolations`: "Hallucination measurement; every INV-G breach recorded here"
- `partglossaries`: "One entry per taxonomy slug; unique index on partCategory"

**Color coding**: Same as system architecture (frontend/api/database/violet/emerald/sky-blue) with additional accent colors for relationship labels (green for "1-to-many" cardinality, orange for "key fields").

## 3. RAG Workflow Infographic

**Concept**: A 9-step horizontal pipeline showing the Retrieval-Augmented Generation flow, with decision points for the verification/retry/fallback logic.

**Layout**:
- Nine rectangular boxes arranged left-to-right, connected by arrows
- Each box has a title + key function summary
- Decision diamonds for verification outcomes

**Step boxes (numbered left to right)**:
1. "NLU Classification" — intent, motorcycle, categories, slots (from motorcycle-nlu.service.ts)
2. "Context Loading" — MongoDB conversation + user garage + prior messages (from conversation.service.ts)
3. "Knowledge Retrieval" — MongoDB maintenance/symptoms/glossary (from knowledge-retrieval.service.ts)
4. "Product Retrieval" — RRF multi-channel ranking + fitment verdicts (from product-retrieval.service.ts + compatibility.service.ts)
5. "Grounding Pack" — CONTEXT construction for Gemini (from grounding.service.ts: buildGroundingPack())
6. "Gemini Generation" — structured JSON output (gemini.service.ts: generateStructured<GroundedAnswer>())
7. "Verification" — six checks (from grounding.service.ts: verifyAnswer()) [decision diamond]
   - "Pass" → arrow → "Response"
   - "Fail (attempt 1)" → "Repair Prompt" → "Gemini Retry (attempt 2)" → "Verification II" [decision diamond]
     - "Pass II" → "Response"
     - "Fail II" → "Deterministic Fallback" → "Response"
8. "Deterministic Fallback" — entirely document-driven reply (chat.service.ts: deterministicReply())
9. "Persistence + Analytics" — ChatConversation + ChatAnalyticsEvent + optional GroundingViolation (chat.service.ts)

**Key visual elements**:
- **Color coding**: Each step a different shade of blue, with the verification decision diamonds in amber/orange
- **Arrow styles**: Solid arrows for normal flow; dashed arrows for the retry/fallback paths
- **Callout text** inside steps: "RRF fusion + quality boosts", "4-valued fitment verdicts", "Schema‑forced JSON", "6‑check verification"
- **Hallucination metric callout** at the bottom: "Hallucination rate = |GroundingViolations| / |ChatAnalyticsEvents|"

**Alternative format**: Circular diagram showing the RAG loop (user query → retrieval → grounding → generation → verification → persistence → response → back to user), emphasizing the closed loop and the persistence/analytics step that feeds thesis metrics.

## 4. Fitment Verdict Infographic

**Concept**: A compact 4-panel infographic illustrating the four-valued fitment verdict system.

**Layout**: Four square panels arranged in a 2×2 grid, each labeled with one verdict.

**Panel content** (each panel):
- **FITS** (green background with white text):
  - Label: "Confirmed fit"
  - Icon: Checkmark inside green shield
  - Text: "A confirmed fitment record links this part to your motorcycle"
  - Example: "Product X → Yamaha R15 V4"
- **FITS_UNIVERSAL** (light emerald background with dark green text):
  - Label: "Universal fit"
  - Icon: Universal symbol (⊛ or ∞) inside light green shield
  - Text: "This part is listed as universal fitment across all motorcycles"
- **NO_FIT** (light red background with dark white text):
  - Label: "Does not fit"
  - Icon: × (multiplication sign) inside light red shield
  - Text: "We hold fitment data for this part category on your motorcycle, and this product is not listed as compatible"
  - Visual emphasis: Shows partially filled compatibility chart with this product missing
- **UNKNOWN** (light amber/yellow background with dark black text):
  - Label: "Fitment unverified"
  - Icon: Question mark inside amber shield
  - Text: "We have no fitment record for this product on your motorcycle yet"
  - Visual emphasis: Blank compatibility slot or "?" icon

**Additional callout** at bottom:
- "Closed‑world inference: NO_FIT is only asserted when the catalogue demonstrably knows about fitment for that part category on that bike. Otherwise UNKNOWN is returned — never guess."
- Color key: Green = confident positive, Red = confident negative, Amber = unknown, Light green = universal

## 5. Thesis Metrics Infographic

**Concept**: A simple but informative infographic displaying the project's evaluation framework.

**Layout**: Three or four panels showing key metrics.

**Panel content**:
- **Hallucination Rate**: Large central number (e.g., "0.08 = 8%") with formula "violating turns / total turns" below
- **Conversation Sessions**: Total sessions analyzed, average turns per session, completion rate
- **Intent Distribution**: Pie chart or bar chart showing proportion of intents (general vs product_recommendation vs repair vs maintenance vs compatibility_check vs upgrade vs motorcycle_profile vs comparison)
- **Answer Tiers**: Distribution of answerTier (0 = deterministic fallback, 1 = Gemini available but failed verification, 2 = verified LLM answer)
- **Fitment Verdict Distribution**: Percentage of FITS / FITS_UNIVERSAL / NO_FIT / UNKNOWN across all compatibility checks
- **Knowledge Coverage**: Number of maintenance tasks, symptom rules, glossary entries; taxonomy coverage percentage

**Color scheme**: Consistent with the project's visual identity (sky blue, violet, emerald accents). Key metrics in large bold type. Supporting text in secondary weight.

**Optional**: If the project has actual evaluation data, placeholder values can be shown with note "actual values from thesis evaluation"; if not, the infographic can show the *design* of the metrics with example/placeholder values.

## 6. Component Interaction Infographic

**Concept**: Showing how the major frontend and backend components interact during a typical chat session.

**Layout**: Radial diagram with ChatWidget at center, surrounded by service circles, surrounded by database circles.

**Central element**: ChatWidget.tsx — floating assistant with message input, send button, message history area, product cards area, knowledge citations area, feedback area.

**Inner ring** (services, clockwise from top):
- `handleChat()` orchestrator (the main entry point)
- `analyseMessage()` (NLU classification)
- `retrieveKnowledge()` (maintenance/symptoms/glossary)
- `retrieveProducts()` (RRF product retrieval + fitment)
- `buildGroundingPack()` (CONTEXT for Gemini)
- `generateStructured()` (Gemini JSON generation)
- `verifyAnswer()` (6‑check verification)
- `deterministicReply()` (fallback)
- `persistTurn()` (MongoDB persistence)
- `ChatAnalyticsEvent.create()` (thesis metrics)

**Outer ring** (database collections, clockwise from top):
- `chatConversations` (conversation memory)
- `users` (garage, auth)
- `productCompatibilities` (fitment links)
- `products` (catalog + specs)
- `maintenancetasks` / `symptomRules` / `partGlossaries` (knowledge base)
- `groundingViolations` (hallucination measurement)
- `chatAnalyticsEvents` (aggregation metrics)
- `chatFeedbacks` (human evaluation)

**Arrows** showing data flow direction (left = into service, right = out of service).

**Color coding**: ChatWidget in #f97316 (orange‑red, the primary accent color used in the UI); services in varying shades of blue; databases in shades of green/emerald.

**Callout** at bottom: "All conversation state lives in MongoDB — the chat widget sends only message + sessionId; the server reads prior history, garage state, and purchased product IDs from the database on every turn."