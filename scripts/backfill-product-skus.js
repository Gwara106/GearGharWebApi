/**
 * Backfills SKUs on products that predate the `sku` field, then builds the
 * unique index.
 *
 * Run: node -r dotenv/config scripts/backfill-product-skus.js [--dry-run]
 * Or:  npm run backfill:skus
 *
 * WHY THIS EXISTS
 * MongoDB treats a missing field as `null` when evaluating a unique index, so
 * every document without a `sku` collides with every other one. With 8 legacy
 * rows carrying no SKU, `createIndex({ sku: 1 }, { unique: true })` fails with:
 *
 *   E11000 duplicate key error  index: sku_1  dup key: { sku: null }
 *
 * The legacy rows were written under an older Product schema (imageUrl, rating,
 * isFavorite, isActive) that had no `sku` or `brand` field at all.
 *
 * IDEMPOTENCY
 * Generated SKUs are derived from each document's own `_id`, so re-running
 * produces identical values and matches nothing to update. On a healthy
 * collection the script reports "nothing to do" and exits 0.
 */
const { MongoClient } = require('mongodb');
const { ensureProductSkus, findDuplicateSkus, createUniqueSkuIndex } = require('./data/sku');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: node -r dotenv/config scripts/backfill-product-skus.js');
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? '🔍 DRY RUN — nothing will be written\n' : '⚙️  Backfilling product SKUs\n');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const products = client.db().collection('products');

    // ── Before ────────────────────────────────────────────────────────────
    const total = await products.countDocuments();
    const missingBefore = await products.countDocuments({
      $or: [{ sku: { $exists: false } }, { sku: null }, { sku: '' }],
    });
    const duplicatesBefore = await findDuplicateSkus(products);

    console.log('── Before ──');
    console.log(`Total products        : ${total}`);
    console.log(`Missing / null SKU    : ${missingBefore}`);
    console.log(`Duplicated SKU values : ${duplicatesBefore.length}`);
    const hasIndex = (await products.indexes()).some((i) => i.name === 'sku_1');
    console.log(`sku_1 unique index    : ${hasIndex ? 'present' : 'absent'}\n`);

    if (dryRun) {
      await ensureProductSkus(products, { dryRun: true });
      console.log('\nRe-run without --dry-run to apply.');
      return;
    }

    // ── Backfill + index ──────────────────────────────────────────────────
    const result = await createUniqueSkuIndex(products);

    // ── After ─────────────────────────────────────────────────────────────
    const missingAfter = await products.countDocuments({
      $or: [{ sku: { $exists: false } }, { sku: null }, { sku: '' }],
    });
    const distinctSkus = (await products.distinct('sku')).length;
    const indexes = await products.indexes();

    console.log('\n── After ──');
    console.log(`Total products        : ${await products.countDocuments()}`);
    console.log(`Missing / null SKU    : ${missingAfter}`);
    console.log(`Distinct SKU values   : ${distinctSkus}`);
    console.log(`sku_1 unique index    : ${indexes.some((i) => i.name === 'sku_1') ? 'present' : 'absent'}`);

    if (missingAfter > 0 || !result.created) {
      console.log('\n⚠️  Not fully resolved — see the messages above.');
      process.exitCode = 1;
    } else {
      console.log('\n✅ Every product has a unique SKU and the unique index is in place.');
    }
  } catch (err) {
    console.error('❌ SKU backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
