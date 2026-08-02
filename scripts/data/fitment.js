/**
 * Fitment (ProductCompatibility) generator.
 *
 * Turns the segment tag carried by each generated product into concrete
 * product ↔ motorcycle links, so the assistant's four-valued verdict model has
 * real data to reason over:
 *
 *   FITS           — a specific link exists for this product and this bike
 *   FITS_UNIVERSAL — the product is flagged universal
 *   NO_FIT         — the bike HAS coverage in that part category, but not for
 *                    this product (closed-world inference)
 *   UNKNOWN        — no coverage at all for that bike/category
 *
 * The generator deliberately produces all four situations. A catalogue where
 * everything fits everything would make the compatibility feature untestable,
 * so a controlled share of bikes is left uncovered per category to exercise the
 * UNKNOWN path, and within a covered category only a subset of products is
 * linked so NO_FIT is genuinely inferable.
 */

const { makeRng, SEGMENT_BY_KEY } = require('./catalog');

/** Bikes matching a segment definition (type set + displacement window). */
function bikesInSegment(bikes, segment) {
  return bikes.filter((b) => {
    const cc = b.engineCc || 0;
    if (cc < segment.ccMin || cc > segment.ccMax) return false;
    if (segment.types.length > 0 && !segment.types.includes(b.type)) return false;
    return true;
  });
}

const FITMENT_NOTE_POOL = [
  'Direct bolt-on using the OEM mounting points.',
  'Requires the supplied spacer kit on this model.',
  'Retains the original centre stand and side stand.',
  'Fits models with the factory exhaust routing only.',
  'Confirm your model year before ordering — mounting changed mid-generation.',
  'May require minor trimming of the plastic belly panel.',
  'Reuses the OEM fasteners; no drilling required.',
  'Not compatible with machines already fitted with an aftermarket sump guard.',
  'Cable and hose lengths are adequate on this model — no extensions needed.',
  'Fitting is straightforward but a torque wrench is recommended.',
  'On ABS-equipped machines, take care not to disturb the wheel-speed sensor lead.',
  'Supplied brackets suit both the single-seat and split-seat variants.',
];

/**
 * Builds compatibility documents.
 *
 * @param {Array} products  generated products (must carry `_segmentKey` and `sku`)
 * @param {Array} bikes     motorcycle documents (must carry `slug`, `type`, `engineCc`)
 * @param {object} opts
 * @param {number} [opts.coverageRate=0.72]  share of in-segment bikes linked per product
 * @param {number} [opts.maxBikesPerProduct=14]
 * @returns {{links: Array, stats: object}}
 */
function buildFitment(products, bikes, opts = {}) {
  const coverageRate = opts.coverageRate ?? 0.72;
  const maxBikes = opts.maxBikesPerProduct ?? 14;

  const links = [];
  const stats = {
    universal: 0,
    specific: 0,
    withNotes: 0,
    productsLinked: 0,
    productsUnlinked: 0,
    bikesCovered: new Set(),
    categoriesCovered: new Set(),
  };

  for (const product of products) {
    // Universal products need exactly one link and no motorcycle reference.
    if (product.universalFit) {
      links.push({
        sku: product.sku,
        motorcycleSlug: null,
        universal: true,
        fitmentNotes: 'Universal fitment — suits most motorcycles regardless of make or model.',
      });
      stats.universal++;
      stats.productsLinked++;
      stats.categoriesCovered.add(product.partCategory);
      continue;
    }

    const segment = SEGMENT_BY_KEY[product._segmentKey];
    if (!segment) {
      stats.productsUnlinked++;
      continue;
    }

    const candidates = bikesInSegment(bikes, segment);
    if (candidates.length === 0) {
      stats.productsUnlinked++;
      continue;
    }

    const rng = makeRng(`fitment|${product.sku}`);

    // Link a deterministic subset. Leaving the remainder unlinked is what makes
    // NO_FIT inferable for other products in the same category.
    const wanted = Math.max(1, Math.min(maxBikes, Math.round(candidates.length * coverageRate)));
    const chosen = rng.sample(candidates, wanted);

    if (chosen.length === 0) {
      stats.productsUnlinked++;
      continue;
    }

    for (const bike of chosen) {
      // Roughly half the links carry an authored fitment note; the explanation
      // layer surfaces these verbatim as evidence.
      const note = rng.chance(0.5) ? rng.pick(FITMENT_NOTE_POOL) : undefined;
      links.push({
        sku: product.sku,
        motorcycleSlug: bike.slug,
        universal: false,
        fitmentNotes: note,
      });
      stats.specific++;
      if (note) stats.withNotes++;
      stats.bikesCovered.add(bike.slug);
    }

    stats.productsLinked++;
    stats.categoriesCovered.add(product.partCategory);
  }

  return {
    links,
    stats: {
      ...stats,
      bikesCovered: stats.bikesCovered.size,
      categoriesCovered: stats.categoriesCovered.size,
    },
  };
}

/**
 * Reports how the four fitment verdicts are distributed across a sample of
 * bike × category pairs. Run after seeding to confirm the dataset genuinely
 * exercises FITS, NO_FIT and UNKNOWN rather than trivially answering "fits".
 */
function verdictCoverage(products, links, bikes) {
  const linkedByBikeCategory = new Map();
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  for (const link of links) {
    if (link.universal || !link.motorcycleSlug) continue;
    const product = productBySku.get(link.sku);
    if (!product) continue;
    const key = `${link.motorcycleSlug}|${product.partCategory}`;
    if (!linkedByBikeCategory.has(key)) linkedByBikeCategory.set(key, new Set());
    linkedByBikeCategory.get(key).add(link.sku);
  }

  const categories = Array.from(new Set(products.filter((p) => !p.universalFit).map((p) => p.partCategory)));
  let fits = 0;
  let noFit = 0;
  let unknown = 0;

  for (const bike of bikes) {
    for (const category of categories) {
      const linked = linkedByBikeCategory.get(`${bike.slug}|${category}`);
      const inCategory = products.filter((p) => p.partCategory === category && !p.universalFit);
      if (!linked || linked.size === 0) {
        unknown += inCategory.length;
      } else {
        fits += linked.size;
        noFit += inCategory.length - linked.size;
      }
    }
  }

  const total = fits + noFit + unknown;
  return {
    fits,
    noFit,
    unknown,
    total,
    fitsPct: +((fits / total) * 100).toFixed(1),
    noFitPct: +((noFit / total) * 100).toFixed(1),
    unknownPct: +((unknown / total) * 100).toFixed(1),
  };
}

module.exports = { buildFitment, bikesInSegment, verdictCoverage, FITMENT_NOTE_POOL };
