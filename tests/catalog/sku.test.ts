import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isMissingSku, legacySkuFor, assignMissingSkus, token } = require('../../scripts/data/sku');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildProducts } = require('../../scripts/data/catalog');

/**
 * SKU integrity tests.
 *
 * These guard the precondition the unique index depends on: no product may
 * reach MongoDB without a SKU, because a unique index reads a missing field as
 * `null` and two nulls collide with
 * `E11000 duplicate key error ... dup key: { sku: null }`.
 */

const LEGACY_FIXTURES = [
  { _id: '69a1aefb32f778bcdb30e323', name: 'Full-Face Safety Helmet Pro', category: 'Helmets', partCategory: 'helmet' },
  { _id: '69a1aefb32f778bcdb30e321', name: 'Sport Performance Gloves', category: 'Gloves', partCategory: 'gloves' },
  { _id: '69a1aefb32f778bcdb30e31e', name: 'Carbon Fiber Exhaust System', category: 'Exhaust', partCategory: 'exhaust' },
];

describe('isMissingSku', () => {
  it('detects every way a SKU can be absent', () => {
    expect(isMissingSku({})).toBe(true);
    expect(isMissingSku({ sku: null })).toBe(true);
    expect(isMissingSku({ sku: '' })).toBe(true);
    expect(isMissingSku({ sku: '   ' })).toBe(true);
    expect(isMissingSku(null)).toBe(true);
  });

  it('accepts a real SKU', () => {
    expect(isMissingSku({ sku: 'GG-HELM-VEGA-BOLT-S' })).toBe(false);
    expect(isMissingSku({ sku: 'LEG-HELMET-FULLFACE-30E323' })).toBe(false);
  });
});

describe('legacySkuFor', () => {
  it('is deterministic — the same document always yields the same SKU', () => {
    const first = legacySkuFor(LEGACY_FIXTURES[0]);
    const second = legacySkuFor(LEGACY_FIXTURES[0]);
    expect(first).toBe(second);
  });

  it('embeds the ObjectId suffix so identical names stay distinct', () => {
    const a = legacySkuFor({ _id: 'aaaaaaaaaaaaaaaaaaaa1111', name: 'Helmet', partCategory: 'helmet' });
    const b = legacySkuFor({ _id: 'aaaaaaaaaaaaaaaaaaaa2222', name: 'Helmet', partCategory: 'helmet' });
    expect(a).not.toBe(b);
    expect(a.endsWith('A1111')).toBe(true);
    expect(b.endsWith('A2222')).toBe(true);
  });

  it('marks backfilled rows with the LEG prefix', () => {
    for (const fixture of LEGACY_FIXTURES) {
      expect(legacySkuFor(fixture).startsWith('LEG-')).toBe(true);
    }
  });

  it('produces an index-safe token with no whitespace or punctuation', () => {
    const sku = legacySkuFor({ _id: '69a1aefb32f778bcdb30e323', name: 'Tyres (Front) 110/70-17!', partCategory: 'tyres' });
    expect(sku).toMatch(/^[A-Z0-9-]+$/);
    expect(sku).not.toMatch(/--/);
    expect(sku.endsWith('-')).toBe(false);
  });

  it('still produces a value when name and category are missing', () => {
    const sku = legacySkuFor({ _id: '69a1aefb32f778bcdb30e323' });
    expect(sku).toBeTruthy();
    expect(sku).toMatch(/^[A-Z0-9-]+$/);
  });
});

describe('token', () => {
  it('never leaves a trailing hyphen after truncation', () => {
    expect(token('Full Face Helmet', 10).endsWith('-')).toBe(false);
    expect(token('A B C D E F', 4).endsWith('-')).toBe(false);
  });
});

describe('assignMissingSkus', () => {
  it('assigns a SKU to every product that lacks one', () => {
    const assignments = assignMissingSkus(LEGACY_FIXTURES);
    expect(assignments).toHaveLength(LEGACY_FIXTURES.length);
    for (const a of assignments) expect(a.sku).toBeTruthy();
  });

  it('skips products that already have a SKU', () => {
    const input = [...LEGACY_FIXTURES, { _id: 'x', name: 'Has One', sku: 'GG-EXISTING' }];
    const assignments = assignMissingSkus(input);
    expect(assignments).toHaveLength(LEGACY_FIXTURES.length);
    expect(assignments.map((a: any) => a.sku)).not.toContain('GG-EXISTING');
  });

  it('never collides with SKUs already in use', () => {
    const predetermined = legacySkuFor(LEGACY_FIXTURES[0]);
    const taken = new Set([predetermined]);
    const assignments = assignMissingSkus([LEGACY_FIXTURES[0]], taken);
    expect(assignments[0].sku).not.toBe(predetermined);
    expect(assignments[0].sku.startsWith(predetermined)).toBe(true);
  });

  it('produces globally unique values across a batch', () => {
    const assignments = assignMissingSkus(LEGACY_FIXTURES);
    const skus = assignments.map((a: any) => a.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('is idempotent — a second pass over repaired rows assigns nothing', () => {
    const rows = LEGACY_FIXTURES.map((f) => ({ ...f }));
    const first = assignMissingSkus(rows);
    // Apply the assignments, as the migration would.
    for (const a of first) {
      const row: any = rows.find((r) => r._id === a._id);
      row.sku = a.sku;
    }
    const second = assignMissingSkus(rows);
    expect(second).toHaveLength(0);
  });

  it('records the previous value so the change is auditable', () => {
    const assignments = assignMissingSkus([{ _id: 'a1b2c3d4e5f6a7b8c9d0e1f2', name: 'Thing', sku: null }]);
    expect(assignments[0].previous).toBeNull();
  });
});

describe('generated catalogue SKUs', () => {
  const products = buildProducts();

  it('gives every generated product a non-empty SKU', () => {
    const missing = products.filter((p: any) => isMissingSku(p));
    expect(missing.map((p: any) => p.name)).toEqual([]);
  });

  it('generates globally unique SKUs', () => {
    const skus = products.map((p: any) => p.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('prefixes generated SKUs with GG- so they are distinguishable from backfilled ones', () => {
    const wrong = products.filter((p: any) => !p.sku.startsWith('GG-'));
    expect(wrong.map((p: any) => p.sku)).toEqual([]);
  });

  it('never collides with the LEG- backfill namespace', () => {
    const collision = products.filter((p: any) => p.sku.startsWith('LEG-'));
    expect(collision).toHaveLength(0);
  });

  it('keeps SKUs index-safe', () => {
    for (const p of products) {
      expect(p.sku, p.name).toMatch(/^[A-Z0-9-]+$/);
      expect(p.sku.length).toBeLessThanOrEqual(48);
    }
  });
});
