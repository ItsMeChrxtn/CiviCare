import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FiDownload, FiUpload, FiDatabase, FiAlertTriangle, FiClock } from 'react-icons/fi';
import api from '../../utils/api';
import { downloadFile } from '../../utils/download';
import ConfirmDialog from '../../components/common/ConfirmDialog';

/** Automated daily snapshots kept on the server (latest 7), plus an on-demand run. */
const AutoBackups = () => {
  const [backups, setBackups] = useState(null);
  const [running, setRunning] = useState(false);

  const load = () => api.get('/settings/backup/auto').then(({ data }) => setBackups(data.data)).catch(() => setBackups([]));
  useEffect(() => {
    load();
  }, []);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data } = await api.post('/settings/backup/auto');
      setBackups(data.data);
      toast.success('Server backup created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Backup failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="card animate-fadeIn mt-6 p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
          <FiClock className="h-4 w-4 text-primary-500" /> Automated Backups
        </h2>
        <button onClick={runNow} disabled={running} className="btn-secondary !py-1.5 text-sm">
          <FiDatabase /> {running ? 'Backing up...' : 'Run backup now'}
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        The server saves a full snapshot every 24 hours and keeps the latest 7. Download one to restore it above.
      </p>
      {backups === null ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : backups.length === 0 ? (
        <p className="text-sm text-gray-400">No automated backups yet. The first one runs about a minute after the server starts.</p>
      ) : (
        <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
          {backups.map((b) => (
            <li key={b.name} className="flex items-center justify-between py-2">
              <span>
                {format(new Date(b.createdAt), 'MMM d, yyyy h:mm a')}
                <span className="ml-2 text-xs text-gray-400">{(b.size / 1024).toFixed(0)} KB</span>
              </span>
              <button
                onClick={() => downloadFile(`/settings/backup/auto/${b.name}`, {}, b.name).catch(() => toast.error('Download failed'))}
                className="flex items-center gap-1 font-semibold text-primary-600 hover:underline"
              >
                <FiDownload /> Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Backup = () => {
  const [file, setFile] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    try {
      const { data } = await api.get('/settings/backup/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `civicare-backup-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup downloaded successfully');
    } catch {
      toast.error('Failed to export backup');
    }
  };

  const handleRestore = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.post('/settings/backup/restore', parsed);
      toast.success('Database restored successfully');
      setConfirming(false);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore backup - invalid file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header flex-row items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
          <FiDatabase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="page-title">Database Backup & Restore</h1>
          <p className="page-subtitle">Export a full snapshot or restore the system from a previous backup file.</p>
        </div>
      </div>

      <div className="card animate-fadeIn p-6">
        <h2 className="mb-2 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
          <FiDownload className="h-4 w-4 text-primary-500" /> Export Backup
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Download a complete JSON snapshot of all CiviCare collections (users, incidents, documents, etc.).
        </p>
        <button onClick={handleExport} className="btn-primary"><FiDownload /> Download Backup</button>
      </div>

      <div className="card animate-fadeIn mt-6 p-6">
        <h2 className="mb-2 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
          <FiUpload className="h-4 w-4 text-red-500" /> Restore from Backup
        </h2>
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Restoring will overwrite existing data for any collection present in the uploaded file. This action cannot be undone.
        </div>
        <input type="file" accept="application/json" onChange={(e) => setFile(e.target.files[0])} className="input-field mb-4" />
        <button onClick={() => setConfirming(true)} disabled={!file} className="btn-danger">
          <FiUpload /> Restore Backup
        </button>
      </div>

      <AutoBackups />

      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleRestore}
        title="Restore Database"
        message="This will overwrite existing data. Are you absolutely sure you want to proceed?"
        confirmLabel="Yes, Restore"
        danger
        loading={busy}
      />
    </div>
  );
};

export default Backup;
