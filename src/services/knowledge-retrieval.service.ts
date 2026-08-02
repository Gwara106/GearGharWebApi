import { MaintenanceTask, IMaintenanceTask } from '@/src/models/MaintenanceTask';
import { SymptomRule, ISymptomRule } from '@/src/models/SymptomRule';
import { PartGlossary, IPartGlossary } from '@/src/models/PartGlossary';
import { DetectedMotorcycle } from '@/src/services/motorcycle-nlu.service';

/**
 * Knowledge retrieval layer.
 *
 * Answers the `maintenance`, `repair` and learning intents from MongoDB. Before
 * this existed those intents fell through to product search and the only actual
 * advice was a handful of hardcoded English strings, which meant the LLM was the
 * de-facto source of truth for safety-relevant guidance.
 *
 * Every returned item carries a stable `ref` ("MaintenanceTask:<key>") that the
 * verification layer uses to check the generated reply only cites facts we
 * actually supplied.
 */

export interface KnowledgeItem {
  /** Stable citation handle, e.g. "SymptomRule:overheating". */
  ref: string;
  kind: 'MaintenanceTask' | 'SymptomRule' | 'PartGlossary';
  title: string;
  /** Flattened, prompt-ready content. */
  content: string;
  relatedPartCategories: string[];
  safetyCritical: boolean;
  escalate: boolean;
  source: { title: string; url?: string; kind: string };
  /** Retrieval score for ranking/telemetry. */
  score: number;
}

/**
 * Builds the applicability filter for a bike. A document applies when its type
 * list covers the bike (or is empty = all types) AND the displacement window
 * contains the bike. `motorcycleSlugs`, when present, is an exact-match override.
 */
function applicabilityFilter(bike: DetectedMotorcycle | null): Record<string, any> {
  if (!bike) return {};
  const cc = bike.engineCc ?? 0;
  return {
    $and: [
      {
        $or: [
          { 'appliesTo.motorcycleSlugs': bike.slug },
          {
            $and: [
              {
                $or: [
                  { 'appliesTo.motorcycleSlugs': { $size: 0 } },
                  { 'appliesTo.motorcycleSlugs': { $exists: false } },
                ],
              },
              {
                $or: [
                  { 'appliesTo.types': { $size: 0 } },
                  { 'appliesTo.types': bike.type },
                ],
              },
              {
                $or: [
                  { 'appliesTo.engineCcMin': { $exists: false } },
                  { 'appliesTo.engineCcMin': { $lte: cc || 100000 } },
                ],
              },
              {
                $or: [
                  { 'appliesTo.engineCcMax': { $exists: false } },
                  { 'appliesTo.engineCcMax': { $gte: cc } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function maintenanceToItem(t: IMaintenanceTask, score: number, dueNote?: string): KnowledgeItem {
  const parts = [
    t.summary,
    t.intervalKm ? `Interval: every ${t.intervalKm.toLocaleString()} km` : '',
    t.intervalMonths ? `or every ${t.intervalMonths} months` : '',
    dueNote || '',
    t.warningSigns.length ? `Warning signs: ${t.warningSigns.join('; ')}` : '',
    t.steps.length ? `Steps: ${t.steps.map((s, i) => `${i + 1}) ${s}`).join(' ')}` : '',
    t.toolsNeeded.length ? `Tools: ${t.toolsNeeded.join(', ')}` : '',
    `Difficulty: ${t.difficulty.replace('_', ' ')}`,
  ].filter(Boolean);

  return {
    ref: `MaintenanceTask:${t.taskKey}`,
    kind: 'MaintenanceTask',
    title: t.title,
    content: parts.join('. '),
    relatedPartCategories: t.relatedPartCategories || [],
    safetyCritical: !!t.safetyCritical,
    escalate: !!t.safetyCritical,
    source: t.source,
    score,
  };
}

/**
 * Maintenance retrieval. When an odometer reading is known, tasks are additionally
 * ranked by how overdue they are — computed here in TypeScript, never by the LLM.
 */
export async function retrieveMaintenance(
  bike: DetectedMotorcycle | null,
  categories: string[],
  queryText: string,
  odometerKm?: number,
  limit = 4
): Promise<KnowledgeItem[]> {
  const filter: Record<string, any> = { ...applicabilityFilter(bike) };
  if (categories.length > 0) {
    filter.relatedPartCategories = { $in: categories };
  }

  let tasks: IMaintenanceTask[] = await MaintenanceTask.find(filter).limit(limit * 5).lean();

  // Broaden if a category filter over-restricted the result set.
  if (tasks.length === 0 && categories.length > 0) {
    delete filter.relatedPartCategories;
    tasks = await MaintenanceTask.find(filter).limit(limit * 5).lean();
  }

  const q = queryText.toLowerCase();
  const items = tasks.map((t) => {
    let score = 1;
    if (categories.some((c) => (t.relatedPartCategories || []).includes(c))) score += 3;
    if (t.title && q.includes(t.title.toLowerCase().split(' ')[0])) score += 2;
    if ((t.appliesTo?.motorcycleSlugs || []).length > 0) score += 2; // model-specific wins

    let dueNote: string | undefined;
    if (odometerKm && t.intervalKm) {
      const sinceLast = odometerKm % t.intervalKm;
      const untilDue = t.intervalKm - sinceLast;
      if (untilDue <= t.intervalKm * 0.15) {
        score += 4; // due now
        dueNote = `At ${odometerKm.toLocaleString()} km this is due now (within ${untilDue.toLocaleString()} km)`;
      } else {
        dueNote = `At ${odometerKm.toLocaleString()} km the next one is in about ${untilDue.toLocaleString()} km`;
      }
    }

    return maintenanceToItem(t, score, dueNote);
  });

  return items.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Symptom → ranked differential diagnosis. Causes are ordered by the curated
 * `priorConfidence` so the output is deterministic and reproducible.
 */
export async function retrieveSymptoms(
  bike: DetectedMotorcycle | null,
  queryText: string,
  limit = 3
): Promise<KnowledgeItem[]> {
  const text = queryText.toLowerCase();
  const base = applicabilityFilter(bike);

  const rules: ISymptomRule[] = await SymptomRule.find(base).lean();

  const scored = rules
    .map((r) => {
      let score = 0;
      const needles = [r.title.toLowerCase(), ...(r.aliases || []).map((a) => a.toLowerCase())];
      for (const n of needles) {
        if (!n) continue;
        if (text.includes(n)) score += n.split(/\s+/).length * 2;
      }
      if ((r.appliesTo?.motorcycleSlugs || []).length > 0 && score > 0) score += 2;
      return { rule: r, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ rule, score }) => {
    const causes = [...(rule.likelyCauses || [])]
      .sort((a, b) => b.priorConfidence - a.priorConfidence)
      .map(
        (c, i) =>
          `${i + 1}) ${c.cause} (likelihood ${(c.priorConfidence * 100).toFixed(0)}%, severity ${c.severity}). ` +
          `Checks: ${c.diagnosticChecks.join('; ') || 'n/a'}.` +
          (c.fixPartCategories.length ? ` Typical fix parts: ${c.fixPartCategories.join(', ')}.` : '')
      );

    return {
      ref: `SymptomRule:${rule.symptomKey}`,
      kind: 'SymptomRule' as const,
      title: rule.title,
      content: `Ranked likely causes — ${causes.join(' ')}`,
      relatedPartCategories: Array.from(
        new Set((rule.likelyCauses || []).flatMap((c) => c.fixPartCategories))
      ),
      safetyCritical: !!rule.safetyCritical,
      escalate: !!rule.escalateToMechanic || !!rule.safetyCritical,
      source: rule.source,
      score,
    };
  });
}

/** Glossary lookup for "what is X?" style questions and Beginner Mode. */
export async function retrieveGlossary(
  categories: string[],
  queryText: string,
  limit = 3
): Promise<KnowledgeItem[]> {
  let entries: IPartGlossary[] = [];

  if (categories.length > 0) {
    entries = await PartGlossary.find({ partCategory: { $in: categories } }).lean();
  }

  if (entries.length === 0 && queryText.trim()) {
    entries = await PartGlossary.find(
      { $text: { $search: queryText } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean()
      .catch(() => [] as IPartGlossary[]);
  }

  return entries.slice(0, limit).map((g, i) => ({
    ref: `PartGlossary:${g.partCategory}`,
    kind: 'PartGlossary' as const,
    title: g.title,
    content: [
      g.whatItIs,
      g.whyUpgrade ? `Why upgrade: ${g.whyUpgrade}` : '',
      g.beginnerTips?.length ? `Beginner tips: ${g.beginnerTips.join('; ')}` : '',
      g.buyingChecklist?.length ? `Before buying, check: ${g.buyingChecklist.join('; ')}` : '',
      g.commonMistakes?.length ? `Common mistakes: ${g.commonMistakes.join('; ')}` : '',
      `Fitting difficulty: ${g.fitmentDifficulty.replace('_', ' ')}`,
    ]
      .filter(Boolean)
      .join('. '),
    relatedPartCategories: [g.partCategory, ...(g.relatedCategories || [])],
    safetyCritical: !!g.safetyCritical,
    escalate: false,
    source: g.source,
    score: categories.includes(g.partCategory) ? 5 : 3 - i * 0.1,
  }));
}

/**
 * Part categories implied by retrieved knowledge — lets a diagnosis drive product
 * retrieval ("chain noise" → chain, sprocket) without the LLM choosing parts.
 */
export function categoriesFromKnowledge(items: KnowledgeItem[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    for (const c of item.relatedPartCategories) seen.add(c);
  }
  return Array.from(seen);
}

/** True when any retrieved knowledge demands a mechanic-escalation clause. */
export function requiresEscalation(items: KnowledgeItem[]): boolean {
  return items.some((i) => i.escalate);
}
