import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiArchive } from 'react-icons/fi';
import { BsPinAngleFill } from 'react-icons/bs';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const CATEGORIES = ['general', 'health', 'safety', 'infrastructure', 'event', 'emergency'];

const Announcements = () => {
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/announcements');
  const [modalItem, setModalItem] = useState(null); // null = closed, {} = new, {...} = edit
  const [confirming, setConfirming] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const openCreate = () => {
    reset({ title: '', content: '', category: 'general', isPinned: false, sendSms: false });
    setModalItem({});
  };
  const openEdit = (item) => {
    reset({ title: item.title, content: item.content, category: item.category, isPinned: item.isPinned });
    setModalItem(item);
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => formData.append(key, val));
      if (coverImage) formData.append('coverImage', coverImage);

      if (modalItem?._id) {
        await api.patch(`/announcements/${modalItem._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Announcement published');
      }
      setModalItem(null);
      setCoverImage(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/announcements/${confirming._id}/archive`);
      toast.success('Announcement archived');
      setConfirming(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <button onClick={openCreate} className="btn-primary"><FiPlus /> New Announcement</button>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Title', accessor: (r) => <span className="flex items-center gap-1">{r.isPinned && <BsPinAngleFill className="text-amber-500" />}{r.title}</span> },
            { header: 'Category', accessor: (r) => <span className="capitalize">{r.category}</span> },
            { header: 'Views', accessor: (r) => r.views },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: 'Actions',
              accessor: (r) => (
                <div className="flex gap-3">
                  <button onClick={() => openEdit(r)} className="text-primary-600 hover:underline"><FiEdit2 /></button>
                  <button onClick={() => setConfirming(r)} className="text-red-600 hover:underline"><FiArchive /></button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title={modalItem?._id ? 'Edit Announcement' : 'New Announcement'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input {...register('title', { required: true })} className="input-field" />
            {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Content</label>
            <textarea rows={5} {...register('content', { required: true })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select {...register('category')} className="input-field capitalize">
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cover Image</label>
              <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} className="input-field" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isPinned')} className="accent-primary-600" /> Pin to top</label>
            {!modalItem?._id && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('sendSms')} className="accent-primary-600" /> Also send via SMS</label>
            )}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : modalItem?._id ? 'Update Announcement' : 'Publish Announcement'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleArchive}
        title="Archive Announcement"
        message="This announcement will be moved to the archive."
        confirmLabel="Archive"
        danger
      />
    </div>
  );
};

export default Announcements;
