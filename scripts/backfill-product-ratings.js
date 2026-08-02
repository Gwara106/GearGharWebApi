/**
 * Denormalises Review aggregates onto Product.ratingAvg / Product.ratingCount.
 *
 * The assistant ranks candidates partly on review quality. Aggregating Review on
 * every chat turn would be an unnecessary join on the hot path, so the values are
 * denormalised here and refreshed by this script (or on review write).
 *
 * Run: node -r dotenv/config scripts/backfill-product-ratings.js
 * Idempotent — safe to re-run at any time.
 */
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: node -r dotenv/config scripts/backfill-product-ratings.js');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const products = db.collection('products');
    const reviews = db.collection('reviews');

    const rows = await reviews
      .aggregate([
        { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .toArray();

    console.log(`Found review aggregates for ${rows.length} product(s).`);

    let updated = 0;
    for (const row of rows) {
      const res = await products.updateOne(
        { _id: row._id },
        {
          $set: {
            ratingAvg: Math.round(row.avg * 100) / 100,
            ratingCount: row.count,
            updatedAt: new Date(),
          },
        }
      );
      if (res.matchedCount > 0) updated++;
    }

    // Products with no reviews get explicit zeroes so ranking never sees undefined.
    const reviewedIds = rows.map((r) => r._id);
    const zeroed = await products.updateMany(
      { _id: { $nin: reviewedIds }, $or: [{ ratingCount: { $exists: false } }, { ratingCount: { $ne: 0 } }] },
      { $set: { ratingAvg: 0, ratingCount: 0 } }
    );

    console.log(`✅ Updated ${updated} product(s) with review aggregates.`);
    console.log(`✅ Zeroed ${zeroed.modifiedCount} product(s) with no reviews.`);
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
