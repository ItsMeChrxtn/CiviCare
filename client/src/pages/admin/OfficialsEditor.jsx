import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiArrowDown, FiArrowUp, FiImage, FiPlus, FiTrash2, FiUser } from 'react-icons/fi';
import api from '../../utils/api';

export const uploadImage = async (file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/settings/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.data.url;
};

const blank = () => ({ name: '', position: 'Barangay Kagawad', committee: '', photo: '' });

/** Barangay Officials shown on the landing page under "About Magdiwang". The first entry is featured (Punong Barangay). */
const OfficialsEditor = ({ initial, onSaved }) => {
  const [list, setList] = useState(() => (initial.length ? initial : [{ ...blank(), position: 'Punong Barangay' }]));
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const update = (i, patch) => setList((l) => l.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const move = (i, dir) =>
    setList((l) => {
      const next = [...l];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });

  const pickPhoto = async (i, file) => {
    if (!file) return;
    setUploadingIdx(i);
    try {
      update(i, { photo: await uploadImage(file) });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingIdx(null);
    }
  };

  const save = async () => {
    const officials = list.filter((o) => o.name.trim()).map((o, order) => ({ ...o, name: o.name.trim(), order }));
    setSaving(true);
    try {
      await api.put('/settings/officials', officials);
      toast.success('Barangay officials saved');
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save officials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card animate-fadeIn max-w-3xl space-y-4 p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Shown on the landing page under &quot;About Magdiwang&quot;. The first official is featured at the top (e.g. the Punong Barangay).
      </p>

      {list.map((o, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800 sm:flex-row sm:items-start">
          <label className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800" title="Upload photo">
            {o.photo ? <img src={o.photo} alt={o.name} className="h-full w-full object-cover" /> : <FiUser className="h-8 w-8" />}
            <span className="absolute inset-x-0 bottom-0 flex justify-center bg-black/50 py-0.5 text-white">
              {uploadingIdx === i ? <span className="text-[10px]">...</span> : <FiImage className="h-3.5 w-3.5" />}
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(i, e.target.files[0])} />
          </label>
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            <input value={o.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Full name (e.g. Hon. Juan D. Cruz)" className="input-field sm:col-span-2" aria-label="Name" />
            <input value={o.position} onChange={(e) => update(i, { position: e.target.value })} placeholder="Position" className="input-field" aria-label="Position" />
            <input value={o.committee} onChange={(e) => update(i, { committee: e.target.value })} placeholder="Committee (optional)" className="input-field" aria-label="Committee" />
          </div>
          <div className="flex gap-1 sm:flex-col">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800" aria-label="Move up">
              <FiArrowUp />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800" aria-label="Move down">
              <FiArrowDown />
            </button>
            <button type="button" onClick={() => setList((l) => l.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" aria-label="Remove">
              <FiTrash2 />
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setList((l) => [...l, blank()])} className="btn-secondary">
          <FiPlus /> Add Official
        </button>
        <button type="button" onClick={save} disabled={saving || uploadingIdx !== null} className="btn-primary">
          {saving ? 'Saving...' : 'Save Officials'}
        </button>
      </div>
    </div>
  );
};

export default OfficialsEditor;
