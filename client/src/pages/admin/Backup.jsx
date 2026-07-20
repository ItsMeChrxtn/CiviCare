import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiUpload, FiDatabase, FiAlertTriangle } from 'react-icons/fi';
import api from '../../utils/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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
      <div className="mb-6 flex items-center gap-2">
        <FiDatabase className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold">Database Backup & Restore</h1>
      </div>

      <div className="card p-6">
        <h2 className="mb-2 font-bold">Export Backup</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Download a complete JSON snapshot of all CiviCare collections (users, incidents, documents, etc.).
        </p>
        <button onClick={handleExport} className="btn-primary"><FiDownload /> Download Backup</button>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-2 font-bold">Restore from Backup</h2>
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          Restoring will overwrite existing data for any collection present in the uploaded file. This action cannot be undone.
        </div>
        <input type="file" accept="application/json" onChange={(e) => setFile(e.target.files[0])} className="input-field mb-4" />
        <button onClick={() => setConfirming(true)} disabled={!file} className="btn-secondary !border-red-200 !text-red-600">
          <FiUpload /> Restore Backup
        </button>
      </div>

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
