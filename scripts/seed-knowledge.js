/**
 * Seeds the assistant's MongoDB knowledge base:
 *   maintenancetasks · symptomrules · partglossaries
 *
 * Run: node -r dotenv/config scripts/seed-knowledge.js
 * (reads MONGODB_URI from .env)
 *
 * Idempotent: every document is upserted by its natural key (taskKey /
 * symptomKey / partCategory), so re-running updates content rather than
 * duplicating it. Also creates the indexes the retrieval layer depends on,
 * including the Product text index that replaces the old unindexed $regex scan.
 *
 * Verify afterwards with: node -r dotenv/config scripts/verify-knowledge.js
 */
const { MongoClient } = require('mongodb');
const { MAINTENANCE_TASKS, SYMPTOM_RULES, PART_GLOSSARY, EDITORIAL } = require('./data/knowledge');
const { TAXONOMY } = require('./data/taxonomy');

async function upsertAll(collection, docs, key) {
  let inserted = 0;
  let updated = 0;
  for (const doc of docs) {
    const res = await collection.updateOne(
      { [key]: doc[key] },
      { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    if (res.upsertedCount > 0) inserted++;
    else if (res.matchedCount > 0) updated++;
  }
  return { inserted, updated };
}

/** Fails loudly if seed data references a category that is not in the taxonomy. */
function validateCategories() {
  const valid = new Set(Object.keys(TAXONOMY));
  const problems = [];

  for (const t of MAINTENANCE_TASKS) {
    for (const c of t.relatedPartCategories || []) {
      if (!valid.has(c)) problems.push(`MaintenanceTask:${t.taskKey} -> unknown category "${c}"`);
    }
  }
  for (const r of SYMPTOM_RULES) {
    for (const cause of r.likelyCauses || []) {
      for (const c of cause.fixPartCategories || []) {
        if (!valid.has(c)) problems.push(`SymptomRule:${r.symptomKey} -> unknown category "${c}"`);
      }
    }
  }
  for (const g of PART_GLOSSARY) {
    if (!valid.has(g.partCategory)) {
      problems.push(`PartGlossary:${g.partCategory} -> not a taxonomy slug`);
    }
  }

  return problems;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: node -r dotenv/config scripts/seed-knowledge.js');
    process.exit(1);
  }

  const problems = validateCategories();
  if (problems.length > 0) {
    console.error('❌ Seed data references categories outside the taxonomy:');
    for (const p of problems) console.error(`   - ${p}`);
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    const maintenance = db.collection('maintenancetasks');
    const symptoms = db.collection('symptomrules');
    const glossary = db.collection('partglossaries');
    const products = db.collection('products');

    // Glossary entries share a single editorial source unless one is specified.
    const glossaryDocs = PART_GLOSSARY.map((g) => ({ source: EDITORIAL, ...g }));

    const m = await upsertAll(maintenance, MAINTENANCE_TASKS, 'taskKey');
    console.log(`✅ MaintenanceTask   — ${m.inserted} inserted, ${m.updated} updated`);

    const s = await upsertAll(symptoms, SYMPTOM_RULES, 'symptomKey');
    console.log(`✅ SymptomRule       — ${s.inserted} inserted, ${s.updated} updated`);

    const g = await upsertAll(glossary, glossaryDocs, 'partCategory');
    console.log(`✅ PartGlossary      — ${g.inserted} inserted, ${g.updated} updated`);

    // ── Indexes required by the retrieval + evaluation layers ───────────────
    console.log('\nCreating indexes...');

    await maintenance.createIndex({ taskKey: 1 }, { unique: true });
    await maintenance.createIndex({ 'appliesTo.types': 1 });
    await maintenance.createIndex({ 'appliesTo.motorcycleSlugs': 1 });
    await maintenance.createIndex({ relatedPartCategories: 1 });
    await maintenance.createIndex({ safetyCritical: 1 });
    await maintenance.createIndex(
      { title: 'text', summary: 'text', warningSigns: 'text' },
      { weights: { title: 10, summary: 4, warningSigns: 2 }, name: 'maintenance_text' }
    );

    await symptoms.createIndex({ symptomKey: 1 }, { unique: true });
    await symptoms.createIndex({ aliases: 1 });
    await symptoms.createIndex({ safetyCritical: 1 });
    await symptoms.createIndex({ 'appliesTo.types': 1 });
    await symptoms.createIndex(
      { title: 'text', aliases: 'text' },
      { weights: { title: 10, aliases: 6 }, name: 'symptom_text' }
    );

    await glossary.createIndex({ partCategory: 1 }, { unique: true });
    await glossary.createIndex({ relatedCategories: 1 });
    await glossary.createIndex(
      { title: 'text', whatItIs: 'text', whyUpgrade: 'text' },
      { weights: { title: 10, whatItIs: 4, whyUpgrade: 2 }, name: 'glossary_text' }
    );

    // Product text index — replaces the unindexed $regex scan in retrieval.
    try {
      await products.createIndex(
        { name: 'text', tags: 'text', description: 'text' },
        { weights: { name: 10, tags: 5, description: 1 }, name: 'product_text' }
      );
      console.log('✅ products.product_text index ready');
    } catch (err) {
      // A collection may only have one text index; report clearly rather than fail.
      console.warn(`⚠️  Product text index: ${err.message}`);
      console.warn('    If an older text index exists, drop it and re-run:');
      console.warn('    db.products.dropIndex("<old_index_name>")');
    }

    await products.createIndex({ status: 1, partCategory: 1, price: 1 });
    await products.createIndex({ ratingAvg: -1 });

    await db.collection('chatconversations').createIndex({ sessionId: 1 }, { unique: true });
    await db.collection('chatconversations').createIndex({ 'messages.turnId': 1 });
    await db.collection('chatfeedbacks').createIndex({ turnId: 1 }, { unique: true });
    await db.collection('groundingviolations').createIndex({ violationType: 1, createdAt: -1 });
    await db.collection('chatanalyticsevents').createIndex({ createdAt: -1, intent: 1 });
    await db.collection('users').createIndex({ 'garage.motorcycleSlug': 1 });

    console.log('✅ Indexes created');

    // ── Coverage report ─────────────────────────────────────────────────────
    const covered = new Set(PART_GLOSSARY.map((g) => g.partCategory));
    const missing = Object.keys(TAXONOMY).filter((c) => !covered.has(c));

    console.log('\n── Knowledge base coverage ──');
    console.log(`Maintenance tasks : ${await maintenance.countDocuments()}`);
    console.log(`Symptom rules     : ${await symptoms.countDocuments()}`);
    console.log(`Glossary entries  : ${await glossary.countDocuments()} / ${Object.keys(TAXONOMY).length} taxonomy slugs`);
    if (missing.length > 0) {
      console.log(`Glossary gaps     : ${missing.join(', ')}`);
    } else {
      console.log('Glossary gaps     : none — full taxonomy coverage');
    }

    console.log('\n✅ Knowledge base seeded.');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
