/**
 * Safe index creation for the seed scripts.
 *
 * Two failure modes have bitten this project, both of which abort a seed part
 * way through and leave the database half-migrated:
 *
 *   E11000  duplicate key error — a unique index is requested while duplicate
 *           values exist. Note that MongoDB treats a MISSING field as `null`,
 *           so two documents lacking the field collide.
 *           (see scripts/data/sku.js for the products/sku case)
 *
 *   code 85/86  IndexOptionsConflict / IndexKeySpecsConflict — an index with
 *           the same name or key pattern already exists with different options.
 *           Typically a field indexed non-uniquely by an earlier schema that a
 *           later schema declares `unique: true`.
 *
 * `ensureIndex` handles both: it checks the data before requesting uniqueness,
 * drops and recreates a conflicting index when it is safe to do so, and reports
 * clearly instead of throwing when a human decision is needed.
 */

/** Serialises an index key pattern for comparison, e.g. `{a:1,b:-1}` → "a:1,b:-1". */
function keySignature(keys) {
  return Object.entries(keys)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
}

/**
 * Finds an existing index with the same key pattern, if any.
 *
 * Returns null when the collection does not exist yet. `indexes()` throws
 * NamespaceNotFound (code 26) in that case, which is not an error here — a
 * collection created for the first time by `createIndex` simply has nothing to
 * reconcile against.
 */
async function findExisting(collection, keys) {
  const target = keySignature(keys);
  let existing;
  try {
    existing = await collection.indexes();
  } catch (err) {
    if (err && (err.code === 26 || /NamespaceNotFound|ns does not exist/i.test(err.message || ''))) {
      return null;
    }
    throw err;
  }
  return existing.find((i) => keySignature(i.key) === target) || null;
}

/**
 * Values appearing more than once, treating a missing field as null — which is
 * exactly how a unique index sees it, and the reason two documents lacking a
 * field collide with `dup key: { <field>: null }`.
 *
 * A collection that does not exist yet has no duplicates.
 */
async function duplicateValues(collection, field) {
  try {
    return await collection
      .aggregate([
        { $group: { _id: `$${field}`, count: { $sum: 1 }, ids: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();
  } catch (err) {
    if (err && (err.code === 26 || /NamespaceNotFound/i.test(err.message || ''))) return [];
    throw err;
  }
}

/**
 * Creates an index, reconciling it with whatever is already there.
 *
 * @param {import('mongodb').Collection} collection
 * @param {object} keys     index key pattern
 * @param {object} [options] createIndex options (unique, name, weights, …)
 * @param {object} [ctx]
 * @param {Function} [ctx.log=console.log]
 * @param {boolean}  [ctx.allowDrop=true] permit dropping a conflicting index
 * @returns {Promise<{status: string, name?: string, detail?: string}>}
 */
async function ensureIndex(collection, keys, options = {}, ctx = {}) {
  const { log = console.log, allowDrop = true } = ctx;
  const label = `${collection.collectionName}.${options.name || keySignature(keys)}`;

  // A unique index over a single field cannot be built while duplicates exist,
  // so check the data before asking for it and fail with a useful message.
  if (options.unique) {
    const fields = Object.keys(keys);
    if (fields.length === 1) {
      const dupes = await duplicateValues(collection, fields[0]);
      if (dupes.length > 0) {
        log(`❌ ${label}: cannot enforce uniqueness — ${dupes.length} duplicated value(s):`);
        for (const d of dupes.slice(0, 5)) {
          const shown = d._id === null ? 'null (field missing)' : JSON.stringify(d._id);
          log(`     ${shown} × ${d.count}`);
        }
        return { status: 'blocked_duplicates', detail: `${dupes.length} duplicate values` };
      }
    }
  }

  const existing = await findExisting(collection, keys);

  // Already correct — nothing to do. This is what makes re-runs cheap.
  if (existing && !!existing.unique === !!options.unique) {
    return { status: 'exists', name: existing.name };
  }

  // Same keys, different options (typically unique added later).
  if (existing) {
    if (!allowDrop) {
      log(`⚠️  ${label}: exists with different options and dropping is disabled`);
      return { status: 'conflict', name: existing.name };
    }
    log(`↻  ${label}: recreating (was unique=${!!existing.unique}, want unique=${!!options.unique})`);
    await collection.dropIndex(existing.name);
  }

  try {
    const name = await collection.createIndex(keys, options);
    return { status: existing ? 'recreated' : 'created', name };
  } catch (err) {
    if (err && err.code === 11000) {
      log(`❌ ${label}: E11000 while building — ${err.message}`);
      return { status: 'blocked_duplicates', detail: err.message };
    }
    if (err && (err.code === 85 || err.code === 86)) {
      log(`⚠️  ${label}: index conflict (code ${err.code}) — leaving the existing index in place`);
      return { status: 'conflict', detail: err.message };
    }
    throw err;
  }
}

/**
 * Applies a batch of index specifications and returns a summary. Never throws
 * on a data problem — a seed should report what it could not do rather than
 * abort after writing documents.
 *
 * @param {Array<{collection, keys, options?}>} specs
 */
async function ensureIndexes(specs, ctx = {}) {
  const { log = console.log } = ctx;
  const summary = { created: 0, recreated: 0, exists: 0, blocked: 0, conflict: 0 };

  for (const spec of specs) {
    const result = await ensureIndex(spec.collection, spec.keys, spec.options || {}, ctx);
    if (result.status === 'created') summary.created++;
    else if (result.status === 'recreated') summary.recreated++;
    else if (result.status === 'exists') summary.exists++;
    else if (result.status === 'blocked_duplicates') summary.blocked++;
    else summary.conflict++;
  }

  log(
    `   indexes: ${summary.created} created, ${summary.recreated} recreated, ` +
      `${summary.exists} already correct` +
      (summary.blocked ? `, ${summary.blocked} BLOCKED` : '') +
      (summary.conflict ? `, ${summary.conflict} conflicted` : '')
  );
  return summary;
}

module.exports = { ensureIndex, ensureIndexes, findExisting, duplicateValues, keySignature };
