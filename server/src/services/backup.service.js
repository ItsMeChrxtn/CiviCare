const fs = require('fs/promises');
const path = require('path');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
const KEEP_LATEST = Number(process.env.BACKUP_KEEP || 7);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Full snapshot of every collection. Reads through the raw driver so fields marked
 * `select: false` (password hashes, document verification hashes) are included -
 * otherwise a restore would recreate users without passwords.
 */
const createSnapshot = async () => {
  const models = require('../models');
  const data = {};
  for (const [name, Model] of Object.entries(models)) {
    // eslint-disable-next-line no-await-in-loop
    data[name] = await Model.collection.find({}).toArray();
  }
  return { generatedAt: new Date(), data };
};

const listAutoBackups = async () => {
  try {
    const files = (await fs.readdir(BACKUP_DIR)).filter((f) => /^civicare-auto-\d+\.json$/.test(f));
    const stats = await Promise.all(
      files.map(async (name) => {
        const stat = await fs.stat(path.join(BACKUP_DIR, name));
        return { name, size: stat.size, createdAt: stat.mtime };
      })
    );
    return stats.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

const resolveAutoBackup = (name) => {
  if (!/^civicare-auto-\d+\.json$/.test(name)) return null; // blocks path traversal
  return path.join(BACKUP_DIR, name);
};

const runAutoBackup = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const snapshot = await createSnapshot();
    await fs.writeFile(path.join(BACKUP_DIR, `civicare-auto-${Date.now()}.json`), JSON.stringify(snapshot));

    const existing = await listAutoBackups();
    await Promise.all(existing.slice(KEEP_LATEST).map((b) => fs.unlink(path.join(BACKUP_DIR, b.name)).catch(() => {})));
    console.log(`[Backup] Automated backup written (${existing.length > KEEP_LATEST ? KEEP_LATEST : existing.length} kept).`);
  } catch (err) {
    console.error('[Backup] Automated backup failed:', err.message);
  }
};

/** Runs one backup shortly after boot when none exists from the last 24h, then every 24h. */
const scheduleAutoBackups = async () => {
  if (process.env.AUTO_BACKUP === 'false') return;
  const latest = (await listAutoBackups())[0];
  if (!latest || Date.now() - new Date(latest.createdAt).getTime() > DAY_MS) {
    setTimeout(runAutoBackup, 60 * 1000).unref();
  }
  setInterval(runAutoBackup, DAY_MS).unref();
};

module.exports = { createSnapshot, listAutoBackups, resolveAutoBackup, runAutoBackup, scheduleAutoBackups };
