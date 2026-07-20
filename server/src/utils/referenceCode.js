/** Builds a human-readable reference code like "INC-2026-000123" from a running count. */
const buildReferenceCode = (prefix, sequence) => {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
};

/** Generates the next reference code for a model by counting existing documents for the year. */
const nextReferenceCode = async (Model, prefix) => {
  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const count = await Model.countDocuments({ createdAt: { $gte: start } });
  return buildReferenceCode(prefix, count + 1);
};

module.exports = { buildReferenceCode, nextReferenceCode };
