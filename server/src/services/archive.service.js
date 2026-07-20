const Archive = require('../models/Archive');
const ApiError = require('../utils/ApiError');

/**
 * Soft-archives a document: flips isArchived on the source model and
 * writes a snapshot + audit trail entry to the Archive collection.
 */
const archiveDocument = async ({ Model, moduleName, id, performedBy, reason }) => {
  const doc = await Model.findById(id);
  if (!doc) throw ApiError.notFound(`${moduleName} not found`);

  doc.isArchived = true;
  if ('archivedAt' in doc) doc.archivedAt = new Date();
  await doc.save();

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
  const doc = await Model.findById(id);
  if (!doc) throw ApiError.notFound(`${moduleName} not found`);

  doc.isArchived = false;
  await doc.save();

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
