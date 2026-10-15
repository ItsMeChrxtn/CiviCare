import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCornerDownRight, FiEyeOff } from 'react-icons/fi';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

/**
 * FAQ Manager. One list of questions and answers feeds both the public FAQ page and the
 * resident Assistant (button-based chatbot). A question placed "under" another becomes a
 * follow-up button in the Assistant and a nested item on the FAQ page.
 */
const Faq = () => {
  const [nodes, setNodes] = useState(null);
  const [modalItem, setModalItem] = useState(null); // null closed, {} new, {...} edit
  const [deleting, setDeleting] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const load = () => api.get('/chatbot/admin/all').then(({ data }) => setNodes(data.data));
  useEffect(() => {
    load();
  }, []);

  // Flatten into display order: each top-level question followed by its follow-ups (any depth).
  const rows = useMemo(() => {
    if (!nodes) return [];
    const children = new Map();
    nodes.forEach((n) => {
      const key = n.parent?._id || 'root';
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(n);
    });
    const out = [];
    const walk = (key, depth) =>
      (children.get(key) || [])
        .sort((a, b) => a.order - b.order)
        .forEach((n) => {
          out.push({ ...n, depth });
          walk(n._id, depth + 1);
        });
    walk('root', 0);
    return out;
  }, [nodes]);

  const openCreate = (parent = null) => {
    reset({ label: '', labelTl: '', response: '', responseTl: '', parent: parent?._id || '', order: 0, isActive: true });
    setModalItem({});
  };
  const openEdit = (node) => {
    reset({
      label: node.label,
      labelTl: node.labelTl || '',
      response: node.response,
      responseTl: node.responseTl || '',
      parent: node.parent?._id || '',
      order: node.order,
      isActive: node.isActive,
    });
    setModalItem(node);
  };

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, parent: values.parent || null, order: Number(values.order) || 0 };
      if (modalItem?._id) {
        await api.patch(`/chatbot/${modalItem._id}`, payload);
        toast.success('FAQ updated');
      } else {
        await api.post('/chatbot', payload);
        toast.success('FAQ added');
      }
      setModalItem(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save FAQ');
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/chatbot/${deleting._id}`);
      toast.success('FAQ deleted');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete the follow-up questions first');
    }
  };

  // A question cannot be moved under itself or under one of its own follow-ups.
  const descendants = useMemo(() => {
    if (!modalItem?._id || !nodes) return new Set();
    const set = new Set([modalItem._id]);
    let grew = true;
    while (grew) {
      grew = false;
      nodes.forEach((n) => {
        if (n.parent && set.has(n.parent._id) && !set.has(n._id)) {
          set.add(n._id);
          grew = true;
        }
      });
    }
    return set;
  }, [modalItem, nodes]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title">FAQ Manager</h1>
          <p className="page-subtitle">
            Questions and answers shown on the FAQ page and in the resident Assistant. Add follow-up questions under a topic to build the Assistant's menu.
          </p>
        </div>
        <button onClick={() => openCreate()} className="btn-primary shrink-0">
          <FiPlus /> Add FAQ
        </button>
      </div>

      {nodes === null ? (
        <CardSkeleton />
      ) : !rows.length ? (
        <EmptyState title="No FAQs yet" message="Add a question to help residents find answers faster." />
      ) : (
        <div className="card animate-fadeIn divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((n) => (
            <div
              key={n._id}
              className="flex items-start justify-between gap-3 p-4 transition-colors duration-150 hover:bg-primary-50/40 dark:hover:bg-primary-500/[0.04]"
              style={{ paddingLeft: `${1 + n.depth * 1.75}rem` }}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  {n.depth > 0 && <FiCornerDownRight className="shrink-0 text-gray-400" />}
                  {n.label}
                  {!n.isActive && (
                    <span className="badge bg-gray-100 text-gray-500">
                      <FiEyeOff /> Hidden
                    </span>
                  )}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{n.response}</p>
                {n.labelTl ? (
                  <p className="mt-0.5 line-clamp-1 text-xs italic text-gray-400">TL: {n.labelTl}</p>
                ) : (
                  <p className="mt-0.5 text-xs text-amber-600">No Tagalog translation yet</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => openCreate(n)} title="Add follow-up question" aria-label="Add follow-up question" className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 dark:hover:bg-primary-500/10">
                  <FiPlus />
                </button>
                <button onClick={() => openEdit(n)} title="Edit" aria-label="Edit" className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 dark:hover:bg-primary-500/10">
                  <FiEdit2 />
                </button>
                <button onClick={() => setDeleting(n)} title="Delete" aria-label="Delete" className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title={modalItem?._id ? 'Edit FAQ' : 'Add FAQ'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="faq-q" className="mb-1 block text-sm font-medium">Question</label>
            <input id="faq-q" {...register('label', { required: true })} className="input-field" placeholder="e.g. What are the requirements for a Barangay Clearance?" />
            {errors.label && <p className="mt-1 text-xs text-red-500">Question is required</p>}
            <p className="mt-1 text-xs text-gray-400">Also used as the button text in the Assistant.</p>
          </div>
          <div>
            <label htmlFor="faq-a" className="mb-1 block text-sm font-medium">Answer</label>
            <textarea id="faq-a" rows={5} {...register('response', { required: true })} className="input-field" />
            {errors.response && <p className="mt-1 text-xs text-red-500">Answer is required</p>}
          </div>
          <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tagalog (shown when residents switch to TL)</p>
            <div>
              <label htmlFor="faq-q-tl" className="mb-1 block text-sm font-medium">Tanong (Question in Tagalog)</label>
              <input id="faq-q-tl" {...register('labelTl')} className="input-field" />
            </div>
            <div>
              <label htmlFor="faq-a-tl" className="mb-1 block text-sm font-medium">Sagot (Answer in Tagalog)</label>
              <textarea id="faq-a-tl" rows={4} {...register('responseTl')} className="input-field" />
            </div>
            <p className="text-xs text-gray-400">Leave blank to show the English text.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_6rem]">
            <div>
              <label htmlFor="faq-parent" className="mb-1 block text-sm font-medium">Show under (optional)</label>
              <select id="faq-parent" {...register('parent')} className="input-field">
                <option value="">— Main question (top level) —</option>
                {rows
                  .filter((n) => !descendants.has(n._id))
                  .map((n) => (
                    <option key={n._id} value={n._id}>
                      {'  '.repeat(n.depth)}
                      {n.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="faq-order" className="mb-1 block text-sm font-medium">Order</label>
              <input id="faq-order" type="number" {...register('order')} className="input-field" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isActive')} className="h-4 w-4 accent-primary-600" />
            Visible to residents
          </label>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Save FAQ'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Delete FAQ"
        message={`Delete "${deleting?.label}"? It will disappear from the FAQ page and the Assistant.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
};

export default Faq;
