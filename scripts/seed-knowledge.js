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
const { EDITORIAL } = require('./data/knowledge');
const { buildKnowledge } = require('./data/knowledge-extended');
const { TAXONOMY } = require('./data/taxonomy');
const { ensureIndexes } = require('./data/indexes');

// Curated base documents plus their machine-type specialisations.
const KNOWLEDGE = buildKnowledge();
const MAINTENANCE_TASKS = KNOWLEDGE.maintenance;
const SYMPTOM_RULES = KNOWLEDGE.symptoms;
const PART_GLOSSARY = KNOWLEDGE.glossary;

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

    // Every index goes through ensureIndex, which reconciles with whatever is
    // already present. Collections predating a schema change often carry the
    // same key pattern with different options — chatconversations.sessionId was
    // indexed non-uniquely by an earlier schema and is declared unique now —
    // and a bare createIndex aborts the seed with IndexKeySpecsConflict (86)
    // after the documents have already been written.
    await ensureIndexes(
      [
        { collection: maintenance, keys: { taskKey: 1 }, options: { unique: true } },
        { collection: maintenance, keys: { 'appliesTo.types': 1 } },
        { collection: maintenance, keys: { 'appliesTo.motorcycleSlugs': 1 } },
        { collection: maintenance, keys: { relatedPartCategories: 1 } },
        { collection: maintenance, keys: { safetyCritical: 1 } },
        { collection: maintenance, keys: { derivedFrom: 1 } },
        {
          collection: maintenance,
          keys: { title: 'text', summary: 'text', warningSigns: 'text' },
          options: { weights: { title: 10, summary: 4, warningSigns: 2 }, name: 'maintenance_text' },
        },

        { collection: symptoms, keys: { symptomKey: 1 }, options: { unique: true } },
        { collection: symptoms, keys: { aliases: 1 } },
        { collection: symptoms, keys: { safetyCritical: 1 } },
        { collection: symptoms, keys: { 'appliesTo.types': 1 } },
        { collection: symptoms, keys: { derivedFrom: 1 } },
        {
          collection: symptoms,
          keys: { title: 'text', aliases: 'text' },
          options: { weights: { title: 10, aliases: 6 }, name: 'symptom_text' },
        },

        { collection: glossary, keys: { partCategory: 1 }, options: { unique: true } },
        { collection: glossary, keys: { relatedCategories: 1 } },
        {
          collection: glossary,
          keys: { title: 'text', whatItIs: 'text', whyUpgrade: 'text' },
          options: { weights: { title: 10, whatItIs: 4, whyUpgrade: 2 }, name: 'glossary_text' },
        },

        {
          collection: products,
          keys: { name: 'text', tags: 'text', description: 'text' },
          options: { weights: { name: 10, tags: 5, description: 1 }, name: 'product_text' },
        },
        { collection: products, keys: { status: 1, partCategory: 1, price: 1 } },
        { collection: products, keys: { ratingAvg: -1 } },

        { collection: db.collection('chatconversations'), keys: { sessionId: 1 }, options: { unique: true } },
        { collection: db.collection('chatconversations'), keys: { 'messages.turnId': 1 } },
        { collection: db.collection('chatfeedbacks'), keys: { turnId: 1 }, options: { unique: true } },
        { collection: db.collection('groundingviolations'), keys: { violationType: 1, createdAt: -1 } },
        { collection: db.collection('chatanalyticsevents'), keys: { createdAt: -1, intent: 1 } },
        { collection: db.collection('users'), keys: { 'garage.motorcycleSlug': 1 } },
      ],
      { log: console.log }
    );

    // ── Coverage report ─────────────────────────────────────────────────────
    const covered = new Set(PART_GLOSSARY.map((g) => g.partCategory));
    const missing = Object.keys(TAXONOMY).filter((c) => !covered.has(c));

    console.log('\n── Knowledge base coverage ──');
    console.log(
      `Maintenance tasks : ${await maintenance.countDocuments()} ` +
        `(${KNOWLEDGE.counts.maintenanceBase} authored + ${KNOWLEDGE.counts.maintenanceDerived} type-specialised)`
    );
    console.log(
      `Symptom rules     : ${await symptoms.countDocuments()} ` +
        `(${KNOWLEDGE.counts.symptomsBase} authored + ${KNOWLEDGE.counts.symptomsDerived} type-specialised)`
    );
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
