import { Motorcycle, IMotorcycle } from '@/src/models/Motorcycle';

/**
 * Rule-based Natural Language Understanding layer.
 *
 * Deterministic and dependency-free so intent/entity extraction works even
 * without a Gemini API key. Gemini (when configured) consumes these entities to
 * ground its reply; it does not replace them.
 */

export type ChatIntent =
  | 'motorcycle_profile'
  | 'product_recommendation'
  | 'compatibility_check'
  | 'comparison'
  | 'maintenance'
  | 'repair'
  | 'upgrade'
  | 'general';

/**
 * Product-category taxonomy. Each canonical category maps to the keywords the
 * user might type. `category` is matched against product name/tags/description
 * (the GearGhar Product model keeps the real type in tags, not the generic
 * `category` enum).
 */
/**
 * Canonical motorcycle-accessory taxonomy. Keys are the canonical category slugs
 * (also stored on Product.partCategory); values are the keywords a user might
 * type. Keywords are kept SPECIFIC (multi-word where needed) to avoid category
 * leakage — e.g. a "handlebar" query must not surface grips.
 *
 * NOTE: keep this list in sync with scripts/data/taxonomy.js (used by the
 * product-normalisation seed script).
 */
export const PRODUCT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  exhaust: ['exhaust', 'silencer', 'muffler', 'slip-on', 'slip on', 'full system', 'end can'],
  handlebar: ['handlebar', 'handle bar', 'clip-on', 'clip on', 'riser', 'ape hanger'],
  grips: ['grip', 'grips', 'hand grip'],
  mirror: ['mirror', 'mirrors', 'rear view', 'rearview', 'bar end mirror'],
  crash_guard: ['crash guard', 'crash bar', 'leg guard', 'safety guard'],
  engine_guard: ['engine guard', 'bash plate', 'skid plate', 'sump guard', 'belly pan'],
  frame_slider: ['frame slider', 'frame sliders', 'crash slider', 'spool slider'],
  seat: ['seat', 'seats', 'saddle', 'seat cover', 'cushion'],
  tank_pad: ['tank pad', 'tank grip', 'tank protector', 'tank traction'],
  windshield: ['windshield', 'windscreen', 'wind deflector', 'fly screen', 'visor'],
  phone_holder: ['mobile holder', 'phone holder', 'phone mount', 'mobile mount', 'gps mount'],
  aux_light: ['auxiliary light', 'aux light', 'fog light', 'fog lamp', 'spot light', 'driving light'],
  tail_tidy: ['tail tidy', 'fender eliminator', 'tag hugger'],
  number_plate: ['number plate', 'license plate', 'plate holder', 'numberplate'],
  brake_lever: ['brake lever', 'brake levers'],
  clutch_lever: ['clutch lever', 'clutch levers'],
  foot_peg: ['foot peg', 'footpeg', 'foot pegs', 'rearset', 'rear set'],
  luggage: ['luggage', 'pannier', 'panniers', 'side case', 'tail bag', 'tank bag'],
  top_box: ['top box', 'top case', 'tail box', 'trunk'],
  saddlebag: ['saddlebag', 'saddle bag', 'saddlebags'],
  helmet: ['helmet', 'helmets', 'full face', 'open face', 'modular helmet'],
  gloves: ['glove', 'gloves', 'riding gloves'],
  jacket: ['jacket', 'jackets', 'riding jacket', 'mesh jacket'],
  riding_gear: ['riding gear', 'protective gear', 'body armor', 'body armour', 'riding suit', 'suit'],
  tyres: ['tyre', 'tyres', 'tire', 'tires'],
  chain: ['chain', 'chains', 'chain kit', 'chain lube'],
  sprocket: ['sprocket', 'sprockets', 'chain sprocket'],
  air_filter: ['air filter', 'air filters', 'performance filter'],
  oil_filter: ['oil filter', 'oil filters'],
  spark_plug: ['spark plug', 'spark plugs', 'iridium plug'],
  brakes: ['brake pad', 'brake pads', 'brake disc', 'brake caliper', 'rotor'],
  maintenance: ['engine oil', 'lubricant', 'coolant', 'cleaner', 'degreaser'],
  accessories: ['accessory', 'accessories'],
};

/**
 * Weighted intent cues. Weight encodes how much evidence a phrase carries:
 *   3 — unambiguous domain signal ("overheating", "compatible")
 *   2 — solid signal that occasionally appears elsewhere ("service", "replace")
 *   1 — weak/generic cue that must never outrank a specific one ("best", "need")
 *
 * Explicit weights replaced an earlier scheme that inferred strength from token
 * count, which let generic multi-word phrases ("what should") outrank precise
 * single-word evidence ("overheating").
 *
 * Keys are matched against the NORMALISED message (lowercase, punctuation
 * stripped), so cues are written without apostrophes: "wont start", not
 * "won't start".
 */
type WeightedCue = [phrase: string, weight: number];

const INTENT_KEYWORDS: Record<ChatIntent, WeightedCue[]> = {
  // Derived contextually (see isMotorcycleProfileStatement), never keyword-matched.
  motorcycle_profile: [],

  compatibility_check: [
    ['compatible', 3], ['compatibility', 3], ['will it fit', 3], ['will this fit', 3],
    ['does it fit', 3], ['does this fit', 3], ['fitment', 3],
    ['fit', 2], ['fits', 2], ['work on', 2], ['will these', 2], ['will this work', 2],
    ['suitable for', 2], ['work with', 2], ['same size', 2],
  ],

  comparison: [
    ['difference between', 3], ['compare', 3], ['comparison', 3], ['versus', 3],
    ['vs', 2], ['which is better', 3], ['better than', 2], ['pros and cons', 3],
    ['better', 1],
  ],

  maintenance: [
    ['service interval', 3], ['servicing', 3], ['maintenance', 3], ['engine oil', 3],
    ['oil change', 3], ['change oil', 3], ['service schedule', 3], ['due for', 3],
    ['how often', 3], ['service is due', 3],
    ['service', 2], ['replace', 2], ['when do i', 2], ['when should i', 2],
    ['top up', 2], ['lube', 2], ['lubricate', 2], ['inspect', 2], ['adjust', 2],
    ['clean', 1], ['km', 1], ['kilometers', 1], ['kilometres', 1],
  ],

  repair: [
    // Symptom words are the strongest possible evidence of a repair intent.
    ['overheating', 3], ['overheat', 3], ['not starting', 3], ['wont start', 3],
    ['doesnt start', 3], ['does not start', 3], ['whats wrong', 3], ['what is wrong', 3],
    ['slapping', 3], ['grinding', 3], ['squealing', 3], ['squeaking', 3], ['rattling', 3],
    ['knocking', 3], ['vibrating', 3], ['vibration', 3], ['wobble', 3], ['wobbling', 3],
    ['stalling', 3], ['stalls', 3], ['misfire', 3], ['jerking', 3], ['surging', 3],
    ['smoke', 3], ['smoking', 3], ['leaking', 3], ['slipping', 3], ['flat battery', 3],
    ['not working', 3], ['mileage dropped', 3], ['troubleshoot', 3], ['diagnose', 3],
    ['repair', 2], ['problem', 2], ['issue', 2], ['fault', 2], ['noise', 2], ['sound', 2],
    ['leak', 2], ['fix', 2], ['broken', 2], ['strange', 2], ['weird', 2],
    ['hard to', 2], ['struggling', 2], ['poor mileage', 3], ['bad mileage', 3],
  ],

  upgrade: [
    ['upgrade', 3], ['upgrades', 3], ['modification', 3], ['modifications', 3],
    ['performance', 2], ['mod', 2], ['mods', 2], ['improve', 2], ['tune', 2],
    ['customise', 2], ['customize', 2], ['make it faster', 3], ['more power', 3],
  ],

  product_recommendation: [
    ['recommend', 3], ['suggest', 3], ['looking for', 3], ['shopping for', 3],
    ['what should i buy', 3], ['show me', 2], ['buy', 2], ['purchase', 2],
    ['budget', 2], ['under', 1], ['price', 1],
    // "get" is deliberately not a bare cue — it is a substring of budget,
    // forget and target. Only the explicit request forms count.
    ['should i get', 2], ['can i get', 2], ['where do i get', 2],
    ['need', 1], ['want', 1], ['best', 1], ['which', 1], ['what should', 1],
  ],

  general: [],
};

export interface DetectedMotorcycle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  label: string;
  type: string;
  engineCc?: number;
}

/** Slots extracted from free text; feed personalisation and clarification. */
export interface NluSlots {
  budget?: number;
  odometerKm?: number;
  year?: number;
}

export interface NluResult {
  intent: ChatIntent;
  /** All intents above zero, highest first. Enables multi-intent handling. */
  rankedIntents: Array<{ intent: ChatIntent; score: number }>;
  /** 0..1 margin between the top two intents. Drives the clarification policy. */
  confidence: number;
  categories: string[];
  motorcycle: DetectedMotorcycle | null;
  /** True when the motorcycle was recalled from an earlier message, not this one. */
  motorcycleFromMemory: boolean;
  keywords: string[];
  slots: NluSlots;
  /** True when the user asked to learn what a part IS, rather than to buy one. */
  isDefinitionQuery: boolean;
  /** Original message, preserved for knowledge retrieval (which matches phrases). */
  rawText: string;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    // Elide apostrophes rather than replacing them with a space, so contractions
    // collapse to a single token ("won't" -> "wont", "doesn't" -> "doesnt").
    // Replacing them with a space produced "won t", which no cue could match.
    .replace(/['’ʼ`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Phrases that invert the meaning of a following keyword ("not looking for a helmet"). */
const NEGATION_CUES = ['not ', "don't ", 'dont ', 'no ', 'without ', 'except ', 'other than '];

/**
 * True when `keyword` occurs inside a negated span of `text`. A span is negated
 * when a negation cue appears within the 3 words preceding the keyword.
 */
function isNegated(text: string, keyword: string): boolean {
  const idx = text.indexOf(keyword);
  if (idx < 0) return false;
  const before = text.slice(Math.max(0, idx - 30), idx);
  return NEGATION_CUES.some((cue) => before.includes(cue));
}

/**
 * Match strength for one cue, scaled by how precisely it appears:
 *   ×1.5 — the whole message is the cue
 *   ×1.0 — word-boundary match
 *   ×0.5 — bare substring (e.g. inside a longer word)
 * Returns 0 when the cue is absent or negated.
 */
function keywordScore(text: string, keyword: string, weight: number): number {
  const kw = normalise(keyword);
  if (!kw || !text.includes(kw)) return 0;
  if (isNegated(text, kw)) return 0;

  if (text === kw) return weight * 1.5;
  if (new RegExp(`(^|\\s)${kw.replace(/\s+/g, '\\s+')}(\\s|$)`).test(text)) return weight;
  return weight * 0.5;
}

/**
 * Scores every intent and returns them ranked. Replaces the previous
 * first-match-wins `includes()` scan, which could not express uncertainty and
 * let a single generic keyword ("after", "km") outrank stronger evidence.
 *
 * Score = strongest single cue × specificity prior + a small corroboration bonus
 * for the remaining cues. Taking the MAX rather than the SUM is what stops three
 * weak generic words out-voting one decisive domain term.
 */
export function scoreIntents(message: string): Array<{ intent: ChatIntent; score: number }> {
  const text = normalise(message);
  // Specificity prior — mirrors the previous hard priority order, but as a
  // tie-breaking weight rather than an absolute override.
  const prior: Record<ChatIntent, number> = {
    motorcycle_profile: 0,
    compatibility_check: 1.3,
    comparison: 1.25,
    repair: 1.2,
    maintenance: 1.1,
    upgrade: 1.05,
    product_recommendation: 1.0,
    general: 0,
  };

  const CORROBORATION = 0.2;

  const scored = (Object.keys(INTENT_KEYWORDS) as ChatIntent[])
    .map((intent) => {
      const hits = INTENT_KEYWORDS[intent]
        .map(([phrase, weight]) => keywordScore(text, phrase, weight))
        .filter((s) => s > 0)
        .sort((a, b) => b - a);

      if (hits.length === 0) return { intent, score: 0 };

      const strongest = hits[0];
      const corroboration = hits.slice(1).reduce((sum, s) => sum + s, 0) * CORROBORATION;
      return {
        intent,
        score: +((strongest + corroboration) * (prior[intent] || 0)).toFixed(3),
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Full message classification — the single code path used by both the runtime
 * orchestrator and the evaluation harness, so measured accuracy is the accuracy
 * the assistant actually delivers.
 *
 * Applies the routing rule the keyword layer alone cannot express: a message
 * that names a part category but carries no other intent signal is a purchase
 * request ("exhaust under 8000 for my r15"), not an unclassified `general` turn.
 */
export function classifyMessage(message: string): {
  intent: ChatIntent;
  rankedIntents: Array<{ intent: ChatIntent; score: number }>;
  confidence: number;
  categories: string[];
  isDefinitionQuery: boolean;
} {
  const rankedIntents = scoreIntents(message);
  const categories = detectCategories(message);
  const definition = isDefinitionQuery(message);

  let intent: ChatIntent = rankedIntents.length > 0 ? rankedIntents[0].intent : 'general';
  if (rankedIntents.length === 0 && categories.length > 0 && !definition) {
    intent = 'product_recommendation';
  }

  return {
    intent,
    rankedIntents,
    confidence: intentConfidence(rankedIntents),
    categories,
    isDefinitionQuery: definition,
  };
}

export function detectIntent(message: string): ChatIntent {
  return classifyMessage(message).intent;
}

/**
 * Confidence as the normalised margin between the top two intents. A lone
 * strong signal → high confidence; two competing signals → low, which the
 * orchestrator turns into a clarifying question instead of a guess.
 */
export function intentConfidence(ranked: Array<{ intent: ChatIntent; score: number }>): number {
  if (ranked.length === 0) return 0;
  if (ranked.length === 1) return Math.min(1, ranked[0].score / 3);
  const [top, second] = ranked;
  const margin = (top.score - second.score) / top.score;
  const strength = Math.min(1, top.score / 3);
  return +(0.5 * margin + 0.5 * strength).toFixed(3);
}

export function detectCategories(message: string): string[] {
  const text = normalise(message);
  const scored: Array<{ category: string; score: number }> = [];

  for (const [category, keywords] of Object.entries(PRODUCT_CATEGORY_KEYWORDS)) {
    // Category cues carry no hand-authored weight, so specificity is inferred
    // from phrase length: "bar end mirror" is stronger evidence than "mirror".
    const hits = keywords
      .map((kw) => keywordScore(text, kw, kw.trim().split(/\s+/).length))
      .filter((s) => s > 0);

    if (hits.length > 0) {
      scored.push({ category, score: Math.max(...hits) });
    }
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.category);
}

/** Phrases signalling the user wants an explanation, not a purchase. */
const DEFINITION_CUES = [
  'what is', 'what are', 'what does', 'whats a', 'whats an', 'explain',
  'meaning of', 'tell me about', 'how does', 'what do you mean', 'define',
  'difference between', 'why do i need', 'what is the point of',
];

/**
 * Purchase signals that override a definition cue. "What is the best crash
 * guard I can buy?" opens with "what is" but is a shopping request, and routing
 * it to the glossary would answer the wrong question.
 */
const PURCHASE_OVERRIDES = [
  'buy', 'purchase', 'recommend', 'suggest', 'looking for', 'shopping',
  'best', 'cheapest', 'price', 'cost', 'under', 'budget', 'should i get',
  'order', 'in stock', 'available',
];

export function isDefinitionQuery(message: string): boolean {
  const text = normalise(message);
  if (!DEFINITION_CUES.some((cue) => text.includes(cue))) return false;
  // "difference between" is a comparison request that still needs explanation,
  // so it survives the purchase override; everything else defers to shopping.
  if (text.includes('difference between')) return true;
  return !PURCHASE_OVERRIDES.some((cue) => text.includes(cue));
}

/**
 * Extracts numeric slots. Budget accepts "under 5000", "rs 3000", "₹2,500",
 * "5k budget"; odometer accepts "45000 km", "45k km"; year accepts a bare
 * 4-digit year in a plausible motorcycle range.
 */
export function extractSlots(message: string): NluSlots {
  const raw = message.toLowerCase().replace(/,/g, '');
  const slots: NluSlots = {};

  const toNumber = (value: string, kSuffix?: string): number =>
    kSuffix ? Math.round(parseFloat(value) * 1000) : Math.round(parseFloat(value));

  // Odometer first — "45000 km" must not be mistaken for a budget.
  const odo = raw.match(/(\d+(?:\.\d+)?)\s*(k)?\s*(?:km|kms|kilometers|kilometres)\b/);
  if (odo) {
    const km = toNumber(odo[1], odo[2]);
    if (km > 0 && km < 1_000_000) slots.odometerKm = km;
  }

  const budget = raw.match(
    /(?:under|below|less than|upto|up to|max|budget(?:\s+of)?|around|about|rs\.?|₹|inr|\$)\s*(\d+(?:\.\d+)?)\s*(k)?\b/
  );
  if (budget) {
    const amount = toNumber(budget[1], budget[2]);
    // Guard against swallowing the odometer reading.
    if (amount > 0 && amount < 10_000_000 && amount !== slots.odometerKm) slots.budget = amount;
  }

  const year = raw.match(/\b(19[5-9]\d|20[0-4]\d)\b/);
  if (year) {
    const y = parseInt(year[1], 10);
    // Only treat as a model year when it is not part of an odometer/budget figure.
    if (y !== slots.odometerKm && y !== slots.budget) slots.year = y;
  }

  return slots;
}

function toDetected(bike: IMotorcycle): DetectedMotorcycle {
  return {
    id: String(bike._id),
    slug: bike.slug,
    brand: bike.brand,
    model: bike.model,
    label: `${bike.brand} ${bike.model}`,
    type: bike.type,
    engineCc: bike.engineCc,
  };
}

function despace(s: string): string {
  return s.replace(/\s+/g, '');
}

/** Bounded Levenshtein edit distance (returns >max early once exceeded). */
function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1; // whole row exceeds budget → give up
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

interface BikeForm {
  spaced: string; // normalised, e.g. "duke 390"
  despaced: string; // spaces removed, e.g. "duke390"
}

/** Precomputes the normalised match forms (brand+model, model, aliases) for a bike. */
function bikeForms(bike: IMotorcycle): BikeForm[] {
  const raw = [`${bike.brand} ${bike.model}`, bike.model, ...(bike.aliases || [])];
  const seen = new Set<string>();
  const forms: BikeForm[] = [];
  for (const r of raw) {
    const spaced = normalise(r);
    if (!spaced || seen.has(spaced)) continue;
    seen.add(spaced);
    forms.push({ spaced, despaced: despace(spaced) });
  }
  return forms;
}

function matchesWordBoundary(spaced: string, text: string): boolean {
  return new RegExp(`(^|\\s)${spaced.replace(/\s+/g, '\\s+')}(\\s|$)`).test(text);
}

/**
 * Matches a message against the catalogue with three layers:
 *  1. Normalisation — case/punctuation/spacing folded ("mt-15" = "mt 15" = "mt15").
 *  2. Exact — short codes (≤3 chars) need a word boundary; longer forms match on
 *     the despaced string so spacing variants all resolve.
 *  3. Fuzzy — if nothing matched, allow small edit distance on forms ≥5 chars
 *     (typo tolerance: "clasic 350" → "classic 350", "hayabuza" → "hayabusa").
 * Longest match wins so "r15 v4" beats the bare "r15" alias.
 */
function matchBike(
  message: string,
  bikes: IMotorcycle[],
  formsCache: Map<IMotorcycle, BikeForm[]>
): IMotorcycle | null {
  const text = normalise(message);
  const dtext = despace(text);
  if (!dtext) return null;

  // Layer 2: exact (normalised) match.
  let best: { bike: IMotorcycle; score: number } | null = null;
  for (const bike of bikes) {
    for (const f of formsCache.get(bike)!) {
      let matched = false;
      if (f.despaced.length <= 3) {
        matched = matchesWordBoundary(f.spaced, text);
      } else {
        matched = dtext.includes(f.despaced);
      }
      if (matched && (!best || f.despaced.length > best.score)) {
        best = { bike, score: f.despaced.length };
      }
    }
  }
  if (best) return best.bike;

  // Layer 3: fuzzy (typo tolerant) fallback.
  let fuzzy: { bike: IMotorcycle; score: number } | null = null;
  for (const bike of bikes) {
    for (const f of formsCache.get(bike)!) {
      const d = f.despaced;
      if (d.length < 5) continue;
      const threshold = d.length >= 8 ? 2 : 1;
      for (let w = d.length - threshold; w <= d.length + threshold; w++) {
        if (w < 4 || w > dtext.length) continue;
        for (let i = 0; i + w <= dtext.length; i++) {
          if (levenshtein(dtext.substr(i, w), d, threshold) <= threshold) {
            if (!fuzzy || d.length > fuzzy.score) fuzzy = { bike, score: d.length };
            break;
          }
        }
      }
    }
  }
  return fuzzy ? fuzzy.bike : null;
}

/**
 * Detects a motorcycle across an ordered list of texts (highest priority first).
 * Used for session memory: the current message is tried first, then earlier
 * user messages. Returns which position matched so callers can flag "remembered".
 */
/**
 * Module-scoped catalogue cache. The matcher needs every bike and its derived
 * match forms; reloading them per request was an unnecessary full-collection
 * read on the hot path. TTL keeps admin edits visible without a restart.
 */
const CATALOGUE_TTL_MS = 5 * 60 * 1000;
let catalogueCache: {
  bikes: IMotorcycle[];
  forms: Map<IMotorcycle, BikeForm[]>;
  loadedAt: number;
} | null = null;

/** Invalidates the cache — call after admin motorcycle create/update/delete. */
export function invalidateMotorcycleCache(): void {
  catalogueCache = null;
}

async function loadCatalogue(): Promise<{ bikes: IMotorcycle[]; forms: Map<IMotorcycle, BikeForm[]> }> {
  if (catalogueCache && Date.now() - catalogueCache.loadedAt < CATALOGUE_TTL_MS) {
    return catalogueCache;
  }
  const bikes: IMotorcycle[] = await Motorcycle.find({}).lean();
  const forms = new Map<IMotorcycle, BikeForm[]>();
  for (const bike of bikes) forms.set(bike, bikeForms(bike));
  catalogueCache = { bikes, forms, loadedAt: Date.now() };
  return catalogueCache;
}

export async function detectMotorcycleInTexts(
  texts: string[]
): Promise<{ motorcycle: DetectedMotorcycle; sourceIndex: number } | null> {
  const { bikes, forms } = await loadCatalogue();

  for (let i = 0; i < texts.length; i++) {
    const bike = matchBike(texts[i] || '', bikes, forms);
    if (bike) return { motorcycle: toDetected(bike), sourceIndex: i };
  }
  return null;
}

/** Resolves a stored garage/session slug to a full detected-motorcycle object. */
export async function detectMotorcycleBySlug(slug: string): Promise<DetectedMotorcycle | null> {
  if (!slug) return null;
  const { bikes } = await loadCatalogue();
  const bike = bikes.find((b) => b.slug === slug);
  return bike ? toDetected(bike) : null;
}

/**
 * Detects a motorcycle in a single message (brand+model and aliases), with
 * normalisation + fuzzy typo tolerance.
 */
export async function detectMotorcycle(message: string): Promise<DetectedMotorcycle | null> {
  const match = await detectMotorcycleInTexts([message]);
  return match ? match.motorcycle : null;
}

export function extractKeywords(message: string): string[] {
  const stop = new Set([
    'the', 'a', 'an', 'for', 'my', 'is', 'are', 'to', 'of', 'and', 'or', 'what', 'which',
    'should', 'i', 'on', 'in', 'do', 'you', 'me', 'can', 'will', 'this', 'that', 'best',
    'with', 'have', 'how', 'it', 'be',
  ]);
  return normalise(message)
    .split(' ')
    .filter((w) => w.length > 2 && !stop.has(w))
    .slice(0, 12);
}

/**
 * Analyses the current message. `priorUserMessages` (newest-first) enable
 * session motorcycle memory: if the current message names no bike but an earlier
 * one did, that bike is recalled and flagged with `motorcycleFromMemory`.
 */
export async function analyseMessage(
  message: string,
  priorUserMessages: string[] = [],
  /** Bike from the persisted garage/session state — lowest-priority fallback. */
  rememberedSlug?: string
): Promise<NluResult> {
  // Try current message first, then earlier messages (session memory).
  const match = await detectMotorcycleInTexts([message, ...priorUserMessages]);
  let motorcycle = match ? match.motorcycle : null;
  let motorcycleFromMemory = !!match && match.sourceIndex > 0;

  // Nothing in the transcript — fall back to persisted state (User.garage or
  // ChatConversation.sessionState). This is what makes memory survive reloads.
  if (!motorcycle && rememberedSlug) {
    motorcycle = await detectMotorcycleBySlug(rememberedSlug);
    motorcycleFromMemory = !!motorcycle;
  }

  // Single classification path shared with the evaluation harness, so measured
  // accuracy reflects what the assistant actually does at runtime.
  const classified = classifyMessage(message);

  return {
    intent: classified.intent,
    rankedIntents: classified.rankedIntents,
    confidence: classified.confidence,
    categories: classified.categories,
    motorcycle,
    motorcycleFromMemory,
    keywords: extractKeywords(message),
    slots: extractSlots(message),
    isDefinitionQuery: classified.isDefinitionQuery,
    rawText: message,
  };
}

// Ownership phrases that signal a message is primarily about identifying a bike.
const OWNERSHIP_PHRASES = [
  'i ride', 'i own', 'my bike is', 'my bike', 'my motorcycle', 'my ride',
  'i have a', 'i have an', 'i got a', 'i just got', 'riding a', 'i drive a',
  'i bought a', 'i own a', 'my new',
];

/**
 * True when the message's primary purpose is telling us which motorcycle the user
 * rides — e.g. "I ride a Suzuki GN125", "My bike is a Yamaha R15 V4", or just the
 * bare model name. In that case the assistant should acknowledge and remember the
 * bike rather than immediately recommending products.
 *
 * A message is a profile statement when a bike is named in THIS message, no product
 * category is requested, and there is no actionable request intent (upgrade,
 * maintenance, repair, comparison, compatibility, recommendation).
 */
export function isMotorcycleProfileStatement(nlu: NluResult, message: string): boolean {
  if (!nlu.motorcycle || nlu.motorcycleFromMemory) return false;
  if (nlu.categories.length > 0) return false;
  if (nlu.intent !== 'general') return false;

  const text = normalise(message);
  const hasOwnershipPhrase = OWNERSHIP_PHRASES.some((p) => text.includes(p));

  // Bare model name (short message that is essentially just the bike) also counts.
  const isBareName = text.split(' ').length <= 5;

  return hasOwnershipPhrase || isBareName;
}
