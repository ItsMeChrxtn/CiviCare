import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

const Chatbot = () => {
  const [nodes, setNodes] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const load = () => api.get('/chatbot/admin/all').then(({ data }) => setNodes(data.data));
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    reset({ label: '', response: '', parent: '', order: 0 });
    setModalItem({});
  };
  const openEdit = (node) => {
    reset({ label: node.label, response: node.response, parent: node.parent?._id || '', order: node.order });
    setModalItem(node);
  };

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, parent: values.parent || null };
      if (modalItem?._id) {
        await api.patch(`/chatbot/${modalItem._id}`, payload);
        toast.success('Topic updated');
      } else {
        await api.post('/chatbot', payload);
        toast.success('Topic created');
      }
      setModalItem(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save topic');
    }
  };

  const deleteNode = async (id) => {
    try {
      await api.delete(`/chatbot/${id}`);
      toast.success('Topic deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete - remove child topics first');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title">Chatbot Manager</h1>
          <p className="page-subtitle">
            Manage the rule-based, button-navigation chatbot tree. Leave "Parent Topic" empty to create a top-level menu item.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0"><FiPlus /> New Topic</button>
      </div>

      {nodes === null ? (
        <CardSkeleton />
      ) : !nodes.length ? (
        <EmptyState title="No chatbot topics yet" message="Create a topic to start building the chatbot's conversation tree." />
      ) : (
        <div className="card animate-fadeIn divide-y divide-gray-100 dark:divide-gray-800">
          {nodes.map((n) => (
            <div key={n._id} className="flex items-center justify-between gap-3 p-4 transition-colors duration-150 hover:bg-primary-50/40 dark:hover:bg-primary-500/[0.04]">
              <div className="min-w-0">
                <p className="font-medium">{n.label} {n.parent && <span className="text-xs text-gray-400">— under "{n.parent.label}"</span>}</p>
                <p className="line-clamp-1 text-sm text-gray-400">{n.response}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button onClick={() => openEdit(n)} className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 dark:hover:bg-primary-500/10"><FiEdit2 /></button>
                <button onClick={() => deleteNode(n._id)} className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title={modalItem?._id ? 'Edit Topic' : 'New Topic'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Button Label</label>
            <input {...register('label', { required: true })} className="input-field" />
            {errors.label && <p className="mt-1 text-xs text-red-500">Label is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Response Message</label>
            <textarea rows={4} {...register('response', { required: true })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Parent Topic (optional)</label>
            <select {...register('parent')} className="input-field">
              <option value="">— Top-level menu item —</option>
              {nodes?.filter((n) => n._id !== modalItem?._id).map((n) => (
                <option key={n._id} value={n._id}>{n.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Order</label>
            <input type="number" {...register('order')} className="input-field" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Save Topic'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Chatbot;
