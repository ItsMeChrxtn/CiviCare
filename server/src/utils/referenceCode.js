const Counter = require('../models/Counter');

/** Builds a human-readable reference code like "INC-2026-000123" from a running count. */
const buildReferenceCode = (prefix, sequence) => {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
};

/**
 * Generates the next reference code for a model from an atomic per-year counter.
 * The counter is first raised to the highest code already issued, so restored backups, deleted
 * records or back-dated data can never make it hand out a code that is already taken.
 */
const nextReferenceCode = async (Model, prefix) => {
  const year = new Date().getFullYear();
  const latest = await Model.findOne({ referenceCode: new RegExp(`^${prefix}-${year}-\\d+$`) })
    .sort({ referenceCode: -1 })
    .select('referenceCode')
    .lean();
  const highest = latest ? Number(latest.referenceCode.split('-').pop()) : 0;
  const name = `ref-${prefix}-${year}`;
  await Counter.updateOne({ _id: name }, { $max: { seq: highest } }, { upsert: true });
  return buildReferenceCode(prefix, await Counter.next(name));
};

module.exports = { buildReferenceCode, nextReferenceCode };
