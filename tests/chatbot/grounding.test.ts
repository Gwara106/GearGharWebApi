import { describe, it, expect } from 'vitest';
import { verifyAnswer, GroundingPack, GroundedAnswer } from '@/src/services/grounding.service';

/**
 * Verification-layer tests — the hallucination-prevention mechanism.
 *
 * These are the tests that substantiate the project's central claim. Each case
 * is a hallucination the model could plausibly produce; the assertion is that
 * the verifier catches it BEFORE the reply reaches the rider.
 */

function pack(overrides: Partial<GroundingPack> = {}): GroundingPack {
  return {
    userMessage: 'What exhaust fits my Yamaha R15 V4?',
    resolved: {
      intent: 'compatibility_check',
      confidence: 0.8,
      motorcycle: { label: 'Yamaha R15 V4', type: 'sport', engineCc: 155 },
      motorcycleRemembered: false,
      categories: ['exhaust'],
    },
    products: [
      {
        id: '650f1a2b3c4d5e6f70819200',
        name: 'RaceTech Slip-On Exhaust',
        brand: 'RaceTech',
        price: 8499,
        currency: 'INR',
        inStock: true,
        fitment: 'FITS',
        reasons: ['Confirmed to fit the Yamaha R15 V4 by a fitment record.'],
      },
    ],
    knowledge: [
      {
        ref: 'PartGlossary:exhaust',
        kind: 'PartGlossary',
        title: 'Exhaust system (slip-on and full system)',
        content: 'The exhaust routes burnt gases away from the engine.',
        source: 'GearGhar rider guide (curated)',
      },
    ],
    constraints: {
      citeEveryClaim: true,
      noNewEntities: true,
      requiresEscalation: false,
      maxWords: 150,
    },
    ...overrides,
  };
}

function answer(overrides: Partial<GroundedAnswer> = {}): GroundedAnswer {
  return {
    answer: 'The RaceTech Slip-On Exhaust fits your Yamaha R15 V4 and costs Rs.8499.',
    citedProductIds: ['650f1a2b3c4d5e6f70819200'],
    citedKnowledgeRefs: ['PartGlossary:exhaust'],
    ...overrides,
  };
}

describe('verifyAnswer — happy path', () => {
  it('accepts an answer grounded entirely in the pack', () => {
    const result = verifyAnswer(answer(), pack());
    expect(result.ok).toBe(true);
    expect(result.failures).toHaveLength(0);
  });
});

describe('verifyAnswer — hallucination detection', () => {
  it('rejects an empty answer', () => {
    const result = verifyAnswer(answer({ answer: '   ' }), pack());
    expect(result.ok).toBe(false);
    expect(result.failures[0].type).toBe('empty_answer');
  });

  it('rejects a citation to a product that was never retrieved', () => {
    const result = verifyAnswer(
      answer({ citedProductIds: ['650f1a2b3c4d5e6f70819200', 'deadbeefdeadbeefdeadbeef'] }),
      pack()
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.type === 'unknown_product_id')).toBe(true);
  });

  it('rejects a citation to knowledge that was never supplied', () => {
    const result = verifyAnswer(
      answer({ citedKnowledgeRefs: ['SymptomRule:invented-symptom'] }),
      pack()
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.type === 'unknown_knowledge_id')).toBe(true);
  });

  it('rejects an invented price', () => {
    const result = verifyAnswer(
      answer({ answer: 'The RaceTech Slip-On Exhaust fits your Yamaha R15 V4 and costs Rs.4999.' }),
      pack()
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.type === 'price_mismatch')).toBe(true);
  });

  it('accepts a correctly formatted price with thousands separators', () => {
    const result = verifyAnswer(
      answer({ answer: 'The RaceTech Slip-On Exhaust is Rs.8,499.' }),
      pack()
    );
    expect(result.failures.filter((f) => f.type === 'price_mismatch')).toHaveLength(0);
  });

  it('rejects an invented product name', () => {
    const result = verifyAnswer(
      answer({
        answer: 'I recommend the Akrapovic Evolution Titanium for your Yamaha R15 V4.',
        citedProductIds: [],
      }),
      pack()
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.type === 'unlisted_entity')).toBe(true);
  });

  it('does not flag entities that appear in the retrieved documents', () => {
    const result = verifyAnswer(
      answer({ answer: 'The RaceTech Slip-On Exhaust suits the Yamaha R15 V4 well.' }),
      pack()
    );
    expect(result.failures.filter((f) => f.type === 'unlisted_entity')).toHaveLength(0);
  });

  it('does not flag ordinary capitalised sentence starts', () => {
    const result = verifyAnswer(
      answer({ answer: 'Here Is Something. The RaceTech Slip-On Exhaust fits.' }),
      pack()
    );
    // "Here Is Something" is built from stopwords/common words, not a product claim.
    expect(result.ok).toBe(true);
  });

  it('reports every distinct violation on a badly hallucinated answer', () => {
    const result = verifyAnswer(
      {
        answer: 'The Brembo Monobloc Caliper costs Rs.12345 and fits perfectly.',
        citedProductIds: ['not-a-real-id'],
        citedKnowledgeRefs: ['MaintenanceTask:not-real'],
      },
      pack()
    );
    const types = new Set(result.failures.map((f) => f.type));
    expect(types.has('unknown_product_id')).toBe(true);
    expect(types.has('unknown_knowledge_id')).toBe(true);
    expect(types.has('price_mismatch')).toBe(true);
    expect(types.has('unlisted_entity')).toBe(true);
  });
});

describe('verifyAnswer — safety escalation', () => {
  it('injects the escalation clause when the knowledge base requires it', () => {
    const p = pack({
      constraints: {
        citeEveryClaim: true,
        noNewEntities: true,
        requiresEscalation: true,
        maxWords: 150,
      },
    });
    const result = verifyAnswer(
      answer({ answer: 'Check your brake pad thickness.', citedProductIds: [], citedKnowledgeRefs: [] }),
      p
    );
    expect(result.answer.toLowerCase()).toContain('mechanic');
    // Repairing the answer must not itself count as a hallucination.
    expect(result.ok).toBe(true);
  });

  it('does not duplicate an escalation the model already wrote', () => {
    const p = pack({
      constraints: {
        citeEveryClaim: true,
        noNewEntities: true,
        requiresEscalation: true,
        maxWords: 150,
      },
    });
    const text = 'Please see a qualified mechanic before riding.';
    const result = verifyAnswer(
      answer({ answer: text, citedProductIds: [], citedKnowledgeRefs: [] }),
      p
    );
    expect(result.answer).toBe(text);
  });
});

describe('verifyAnswer — empty candidate set', () => {
  it('flags any product name when nothing was retrieved', () => {
    const p = pack({ products: [] });
    const result = verifyAnswer(
      answer({
        answer: 'I suggest the RaceTech Slip-On Exhaust.',
        citedProductIds: [],
        citedKnowledgeRefs: [],
      }),
      p
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.type === 'unlisted_entity')).toBe(true);
  });

  it('accepts generic advice when nothing was retrieved', () => {
    const p = pack({ products: [] });
    const result = verifyAnswer(
      answer({
        answer:
          'I could not find a matching part in our catalogue. Look for a slip-on exhaust listed for your model.',
        citedProductIds: [],
        citedKnowledgeRefs: [],
      }),
      p
    );
    expect(result.ok).toBe(true);
  });
});
