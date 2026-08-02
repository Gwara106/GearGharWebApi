/**
 * Normalises every product into the canonical accessory taxonomy by setting
 * Product.partCategory. Safe to re-run.
 *
 * Run: node -r dotenv/config scripts/normalize-products.js
 */
const { MongoClient } = require('mongodb');
const { classifyProduct, TAXONOMY } = require('./data/taxonomy');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: node -r dotenv/config scripts/normalize-products.js');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const products = client.db().collection('products');
    const all = await products.find({}).toArray();

    const counts = {};
    let classified = 0;
    let unclassified = 0;

    for (const p of all) {
      const category = classifyProduct(p);
      if (category) {
        await products.updateOne({ _id: p._id }, { $set: { partCategory: category, updatedAt: new Date() } });
        counts[category] = (counts[category] || 0) + 1;
        classified++;
      } else {
        await products.updateOne({ _id: p._id }, { $unset: { partCategory: '' } });
        unclassified++;
        console.log(`  (unclassified) ${p.name}`);
      }
    }

    console.log(`\nProducts processed: ${all.length}`);
    console.log(`Classified: ${classified} | Unclassified: ${unclassified}`);
    console.log(`Taxonomy categories available: ${Object.keys(TAXONOMY).length}`);
    console.log('Category distribution:');
    for (const [c, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${c}: ${n}`);
    }
    console.log('\n✅ Product normalisation complete.');
  } catch (err) {
    console.error('Normalisation failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
