/**
 * Seeds the comprehensive motorcycle catalogue and bootstraps product compatibility.
 *
 * Run: node -r dotenv/config scripts/seed-motorcycles.js
 * (reads MONGODB_URI from .env)
 *
 * Idempotent: motorcycles are upserted by slug; universal compatibility is
 * upserted per active product; a few illustrative specific fitments are created
 * so "confirmed fitment" recommendations can be demonstrated.
 */
const { MongoClient } = require('mongodb');
const { buildMotorcycles } = require('./data/motorcycles');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: node -r dotenv/config scripts/seed-motorcycles.js');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const motorcycles = db.collection('motorcycles');
    const products = db.collection('products');
    const compatibility = db.collection('productcompatibilities');

    // 1. Upsert every motorcycle from the catalogue.
    const catalogue = buildMotorcycles();
    let bikes = 0;
    let aliasTotal = 0;
    for (const bike of catalogue) {
      aliasTotal += (bike.aliases || []).length;
      await motorcycles.updateOne(
        { slug: bike.slug },
        { $set: { ...bike, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      bikes++;
    }
    const brands = new Set(catalogue.map((b) => b.brand)).size;
    console.log(`Motorcycles upserted: ${bikes} across ${brands} brands`);
    console.log(`Aliases inserted: ${aliasTotal} (avg ${(aliasTotal / bikes).toFixed(1)} per bike)`);

    // 2. Universal compatibility for every active product.
    const activeProducts = await products.find({ status: 'active' }).toArray();
    let universal = 0;
    for (const p of activeProducts) {
      const res = await compatibility.updateOne(
        { product: p._id, universal: true },
        { $setOnInsert: { product: p._id, universal: true, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
      if (res.upsertedCount) universal++;
    }
    console.log(`Universal compatibility created: ${universal} (active products: ${activeProducts.length})`);

    // 3. Illustrative specific fitments: map exhaust-like products to popular bikes.
    const targetSlugs = ['yamaha-r15-v4', 'yamaha-mt-15', 'ktm-duke-390', 'bajaj-pulsar-ns200'];
    const targetBikes = await motorcycles.find({ slug: { $in: targetSlugs } }).toArray();
    const exhausts = activeProducts.filter((p) => {
      const hay = `${p.name} ${(p.tags || []).join(' ')}`.toLowerCase();
      return /exhaust|silencer|muffler|slip[- ]?on/.test(hay);
    });
    let specific = 0;
    for (const p of exhausts) {
      for (const bike of targetBikes) {
        const res = await compatibility.updateOne(
          { product: p._id, motorcycle: bike._id },
          {
            $setOnInsert: {
              product: p._id,
              motorcycle: bike._id,
              universal: false,
              fitmentNotes: 'Seeded demo fitment',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        if (res.upsertedCount) specific++;
      }
    }
    console.log(`Specific fitments created: ${specific} (exhaust products: ${exhausts.length})`);

    const totalBikes = await motorcycles.countDocuments();
    console.log(`\n✅ Motorcycle seeding complete. Catalogue now holds ${totalBikes} motorcycles.`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
