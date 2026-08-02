import { describe, it, expect } from 'vitest';
import { GOLD_SET, ADVERSARIAL_SET, stratumCounts, GoldItem } from './gold-set';
import {
  classifyMessage,
  extractSlots,
  isDefinitionQuery,
} from '@/src/services/motorcycle-nlu.service';

/**
 * Evaluation harness — the project's automated measurement instrument.
 *
 * Reports intent accuracy, macro-F1, category precision/recall/F1, slot accuracy
 * and per-stratum breakdowns against the gold set (D1), then asserts the targets
 * from the evaluation plan. Failing thresholds fail the build, so a regression in
 * understanding quality cannot pass unnoticed.
 *
 * Motorcycle entity matching and end-to-end retrieval require a live MongoDB and
 * are measured separately by the integration harness; this suite is deliberately
 * database-free so it runs in CI.
 *
 * `motorcycle_profile` is excluded from intent scoring because it is decided by
 * the orchestrator (isMotorcycleProfileStatement) using the detected bike, not by
 * keyword scoring — the gold labels for those items describe end-to-end
 * behaviour rather than the NLU layer in isolation.
 */

const TARGETS = {
  intentAccuracy: 0.85,
  intentMacroF1: 0.75,
  categoryF1: 0.9,
  slotAccuracy: 0.9,
};

interface Prediction {
  item: GoldItem;
  predictedIntent: string;
  predictedCategories: string[];
  confidence: number;
}

/** Intents the keyword layer is responsible for (see note above). */
const NLU_SCORED = GOLD_SET.filter((g) => g.intent !== 'motorcycle_profile');

function predict(item: GoldItem): Prediction {
  const c = classifyMessage(item.utterance);
  return {
    item,
    predictedIntent: c.intent,
    predictedCategories: c.categories,
    confidence: c.confidence,
  };
}

const PREDICTIONS: Prediction[] = NLU_SCORED.map(predict);

function macroF1(predictions: Prediction[]): number {
  const labels = Array.from(new Set(predictions.map((p) => p.item.intent)));
  let sum = 0;

  for (const label of labels) {
    const tp = predictions.filter((p) => p.item.intent === label && p.predictedIntent === label).length;
    const fp = predictions.filter((p) => p.item.intent !== label && p.predictedIntent === label).length;
    const fn = predictions.filter((p) => p.item.intent === label && p.predictedIntent !== label).length;

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    sum += precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  }

  return labels.length > 0 ? sum / labels.length : 0;
}

function categoryMetrics(predictions: Prediction[]) {
  let tp = 0;
  let fp = 0;
  let fn = 0;

  for (const p of predictions) {
    const expected = new Set(p.item.categories);
    // Top-2 predictions: the retrieval layer consumes a ranked list, not a single label.
    const predicted = new Set(p.predictedCategories.slice(0, Math.max(2, expected.size)));

    Array.from(predicted).forEach((c) => (expected.has(c) ? tp++ : fp++));
    Array.from(expected).forEach((c) => {
      if (!predicted.has(c)) fn++;
    });
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1, tp, fp, fn };
}

function confusionPairs(predictions: Prediction[]): string[] {
  return predictions
    .filter((p) => p.predictedIntent !== p.item.intent)
    .map((p) => `${p.item.id} "${p.item.utterance}" — expected ${p.item.intent}, got ${p.predictedIntent}`);
}

describe('gold set integrity', () => {
  it('has unique ids', () => {
    const ids = GOLD_SET.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every intent the router handles', () => {
    const covered = new Set(GOLD_SET.map((g) => g.intent));
    for (const intent of [
      'product_recommendation',
      'compatibility_check',
      'comparison',
      'maintenance',
      'repair',
      'upgrade',
      'general',
      'motorcycle_profile',
    ]) {
      expect(covered.has(intent)).toBe(true);
    }
  });

  it('covers every stress stratum', () => {
    const counts = stratumCounts();
    for (const stratum of ['plain', 'typo', 'paraphrase', 'negation', 'slots', 'definition']) {
      expect(counts[stratum]).toBeGreaterThan(0);
    }
  });

  it('has an adversarial set for the hallucination study', () => {
    expect(ADVERSARIAL_SET.length).toBeGreaterThanOrEqual(10);
    const attacks = new Set(ADVERSARIAL_SET.map((a) => a.attack));
    expect(attacks.size).toBeGreaterThanOrEqual(4);
  });
});

describe('NLU accuracy against the gold set', () => {
  it('meets the intent accuracy target', () => {
    const correct = PREDICTIONS.filter((p) => p.predictedIntent === p.item.intent).length;
    const accuracy = correct / PREDICTIONS.length;

    console.log(`\n  Intent accuracy : ${(accuracy * 100).toFixed(1)}% (${correct}/${PREDICTIONS.length})`);
    for (const line of confusionPairs(PREDICTIONS)) console.log(`    ✗ ${line}`);

    expect(accuracy).toBeGreaterThanOrEqual(TARGETS.intentAccuracy);
  });

  it('meets the intent macro-F1 target', () => {
    const f1 = macroF1(PREDICTIONS);
    console.log(`  Intent macro-F1 : ${f1.toFixed(3)}`);
    expect(f1).toBeGreaterThanOrEqual(TARGETS.intentMacroF1);
  });

  it('meets the category extraction F1 target', () => {
    const m = categoryMetrics(PREDICTIONS);
    console.log(
      `  Category P/R/F1 : ${m.precision.toFixed(3)} / ${m.recall.toFixed(3)} / ${m.f1.toFixed(3)}` +
        ` (tp=${m.tp} fp=${m.fp} fn=${m.fn})`
    );
    expect(m.f1).toBeGreaterThanOrEqual(TARGETS.categoryF1);
  });

  it('reports accuracy per stress stratum', () => {
    const strata = Array.from(new Set(PREDICTIONS.map((p) => p.item.stratum)));
    console.log('\n  Per-stratum intent accuracy:');
    for (const s of strata) {
      const subset = PREDICTIONS.filter((p) => p.item.stratum === s);
      const correct = subset.filter((p) => p.predictedIntent === p.item.intent).length;
      console.log(`    ${s.padEnd(12)} ${((correct / subset.length) * 100).toFixed(0)}% (${correct}/${subset.length})`);
    }
    expect(strata.length).toBeGreaterThan(3);
  });
});

describe('slot extraction accuracy', () => {
  const SLOT_CASES: Array<{ utterance: string; budget?: number; odometerKm?: number }> = [
    { utterance: 'I want to buy a top box under 5000', budget: 5000 },
    { utterance: 'exhaust under 8000 for my r15', budget: 8000 },
    { utterance: 'budget of 3k for a phone holder', budget: 3000 },
    { utterance: 'my bike has done 45000 km', odometerKm: 45000 },
    { utterance: 'My Duke 390 has done 18000 km, what service is due?', odometerKm: 18000 },
  ];

  it('meets the slot accuracy target', () => {
    let correct = 0;
    for (const c of SLOT_CASES) {
      const slots = extractSlots(c.utterance);
      const budgetOk = c.budget === undefined || slots.budget === c.budget;
      const odoOk = c.odometerKm === undefined || slots.odometerKm === c.odometerKm;
      if (budgetOk && odoOk) correct++;
      else console.log(`    ✗ "${c.utterance}" → ${JSON.stringify(slots)}`);
    }

    const accuracy = correct / SLOT_CASES.length;
    console.log(`\n  Slot accuracy   : ${(accuracy * 100).toFixed(1)}% (${correct}/${SLOT_CASES.length})`);
    expect(accuracy).toBeGreaterThanOrEqual(TARGETS.slotAccuracy);
  });
});

describe('clarification policy calibration', () => {
  const THRESHOLD = 0.35;

  it('does not ask for clarification when the request is already specific', () => {
    const specific = PREDICTIONS.filter(
      (p) => p.item.categories.length > 0 && p.item.motorcycleSlug !== null
    );
    for (const p of specific) {
      const wouldClarify =
        p.confidence < THRESHOLD && p.predictedCategories.length === 0;
      expect(wouldClarify, `${p.item.id} should not trigger clarification`).toBe(false);
    }
  });

  it('reports the confidence distribution for threshold tuning', () => {
    const values = PREDICTIONS.map((p) => p.confidence).sort((a, b) => a - b);
    const pct = (q: number) => values[Math.floor(q * (values.length - 1))];
    console.log(
      `\n  Confidence p10/p50/p90 : ${pct(0.1).toFixed(2)} / ${pct(0.5).toFixed(2)} / ${pct(0.9).toFixed(2)}`
    );
    console.log(`  Below threshold (${THRESHOLD}) : ${values.filter((v) => v < THRESHOLD).length}/${values.length}`);
    expect(values.length).toBe(PREDICTIONS.length);
  });
});

describe('definition-query routing', () => {
  it('routes learning questions to the glossary plan', () => {
    const definitionItems = GOLD_SET.filter((g) => g.stratum === 'definition');
    const detected = definitionItems.filter((g) => isDefinitionQuery(g.utterance));
    const rate = detected.length / definitionItems.length;

    console.log(`\n  Definition detection : ${(rate * 100).toFixed(0)}% (${detected.length}/${definitionItems.length})`);
    for (const missed of definitionItems.filter((g) => !isDefinitionQuery(g.utterance))) {
      console.log(`    ✗ ${missed.id} "${missed.utterance}"`);
    }

    expect(rate).toBeGreaterThanOrEqual(0.8);
  });

  it('does not misroute purchase requests to the glossary', () => {
    const purchases = GOLD_SET.filter(
      (g) => g.intent === 'product_recommendation' && g.stratum !== 'definition'
    );
    const misrouted = purchases.filter((g) => isDefinitionQuery(g.utterance));
    expect(misrouted.map((m) => m.id)).toEqual([]);
  });
});
