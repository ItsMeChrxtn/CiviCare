const Archive = require('../models/Archive');
const ApiError = require('../utils/ApiError');

/**
 * Flips only the archive flag. Records created before later revisions can hold values the current
 * schema no longer accepts (an old category, a removed field); re-validating the whole record made
 * archiving and restoring them fail with "Validation failed", so the flag is set directly instead.
 */
const setArchived = (Model, id, archived) => {
  const set = { isArchived: archived };
  if (archived && Model.schema.path('archivedAt')) set.archivedAt = new Date();
  return Model.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: false });
};

/**
 * Soft-archives a document: flips isArchived on the source model and
 * writes a snapshot + audit trail entry to the Archive collection.
 */
const archiveDocument = async ({ Model, moduleName, id, performedBy, reason }) => {
  const doc = await setArchived(Model, id, true);
  if (!doc) throw ApiError.notFound(`${moduleName} not found`);

  await Archive.create({
    module: moduleName,
    documentId: doc._id,
    snapshot: doc.toObject(),
    reason,
    action: 'archived',
    performedBy,
  });

  return doc;
};

/** Restores a previously archived document by flipping isArchived back to false. */
const restoreDocument = async ({ Model, moduleName, id, performedBy }) => {
  const doc = await setArchived(Model, id, false);
  if (!doc) throw ApiError.notFound(`${moduleName} not found`);

  await Archive.create({
    module: moduleName,
    documentId: doc._id,
    snapshot: doc.toObject(),
    action: 'restored',
    performedBy,
  });

  return doc;
};

module.exports = { archiveDocument, restoreDocument };
