import { describe, it, expect } from 'vitest';
import {
  detectIntent,
  scoreIntents,
  intentConfidence,
  detectCategories,
  extractSlots,
  isDefinitionQuery,
  extractKeywords,
} from '@/src/services/motorcycle-nlu.service';

/**
 * NLU unit tests.
 *
 * These cover the pure, database-free half of the understanding layer:
 * weighted intent scoring, confidence, category detection with the anti-leakage
 * taxonomy, negation and numeric slot extraction. Motorcycle entity matching
 * needs the catalogue and is covered by the integration harness instead.
 */

describe('intent detection', () => {
  it('classifies the core intents', () => {
    expect(detectIntent('Will this handlebar fit my MT-15?')).toBe('compatibility_check');
    expect(detectIntent('Compare these two exhausts')).toBe('comparison');
    expect(detectIntent('My bike is overheating, what should I check?')).toBe('repair');
    expect(detectIntent('When should I change the engine oil?')).toBe('maintenance');
    expect(detectIntent('What performance mods can I do?')).toBe('upgrade');
    expect(detectIntent('Recommend a good exhaust')).toBe('product_recommendation');
  });

  it('falls back to general when no keyword matches', () => {
    expect(detectIntent('hello there')).toBe('general');
    expect(scoreIntents('hello there')).toHaveLength(0);
  });

  it('prefers the more specific intent when signals compete', () => {
    // "fit" (compatibility) must outrank "best" (recommendation).
    expect(detectIntent('which is the best exhaust that will fit my bike')).toBe(
      'compatibility_check'
    );
  });

  it('returns ranked intents so multi-intent turns are visible', () => {
    const ranked = scoreIntents('is this exhaust compatible and which is best');
    expect(ranked.length).toBeGreaterThan(1);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });
});

describe('intent confidence', () => {
  it('is zero when nothing matched', () => {
    expect(intentConfidence([])).toBe(0);
  });

  it('is high for a single strong unambiguous signal', () => {
    const ranked = scoreIntents('is this compatible with my bike');
    expect(intentConfidence(ranked)).toBeGreaterThan(0.35);
  });

  it('is bounded to the unit interval', () => {
    for (const utterance of [
      'recommend the best exhaust that fits and compare it',
      'overheating',
      'service',
    ]) {
      const c = intentConfidence(scoreIntents(utterance));
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });
});

describe('category detection', () => {
  it('detects the requested part category', () => {
    expect(detectCategories('I need a new exhaust')).toContain('exhaust');
    expect(detectCategories('looking for riding gloves')).toContain('gloves');
    expect(detectCategories('what is a tail tidy')).toContain('tail_tidy');
  });

  it('does not leak between adjacent categories', () => {
    // "handlebar" must not surface grips, and vice versa.
    const bars = detectCategories('I want a new handlebar');
    expect(bars).toContain('handlebar');
    expect(bars).not.toContain('grips');

    const grips = detectCategories('I want new grips');
    expect(grips).toContain('grips');
    expect(grips).not.toContain('handlebar');
  });

  it('ranks the strongest category match first', () => {
    const cats = detectCategories('I need brake pads for my bike');
    expect(cats[0]).toBe('brakes');
  });

  it('suppresses negated categories', () => {
    const cats = detectCategories('I need a jacket, not a helmet');
    expect(cats).toContain('jacket');
    expect(cats).not.toContain('helmet');
  });

  it('returns an empty list when no part is mentioned', () => {
    expect(detectCategories('my bike is making a strange noise')).toEqual([]);
  });
});

describe('slot extraction', () => {
  it('extracts a budget from several phrasings', () => {
    expect(extractSlots('exhaust under 8000').budget).toBe(8000);
    expect(extractSlots('budget of 3k for a phone holder').budget).toBe(3000);
    expect(extractSlots('something around Rs. 2,500').budget).toBe(2500);
    expect(extractSlots('max $150').budget).toBe(150);
  });

  it('extracts an odometer reading', () => {
    expect(extractSlots('my bike has done 45000 km').odometerKm).toBe(45000);
    expect(extractSlots('18000 kms on the clock').odometerKm).toBe(18000);
  });

  it('does not confuse an odometer reading with a budget', () => {
    const slots = extractSlots('My Duke 390 has done 18000 km, what service is due?');
    expect(slots.odometerKm).toBe(18000);
    expect(slots.budget).toBeUndefined();
  });

  it('extracts a plausible model year', () => {
    expect(extractSlots('my 2019 model bike').year).toBe(2019);
  });

  it('returns an empty object when there is nothing numeric', () => {
    expect(extractSlots('recommend an exhaust')).toEqual({});
  });
});

describe('definition queries', () => {
  it('recognises learning questions', () => {
    expect(isDefinitionQuery('What is a tail tidy?')).toBe(true);
    expect(isDefinitionQuery('explain what frame sliders do')).toBe(true);
    expect(isDefinitionQuery('tell me about riding gear')).toBe(true);
  });

  it('does not treat a purchase request as a definition query', () => {
    expect(isDefinitionQuery('recommend an exhaust for my R15')).toBe(false);
  });
});

describe('keyword extraction', () => {
  it('drops stopwords and short tokens', () => {
    const kw = extractKeywords('What is the best exhaust for my bike');
    expect(kw).toContain('exhaust');
    expect(kw).not.toContain('the');
    expect(kw).not.toContain('is');
  });
});
