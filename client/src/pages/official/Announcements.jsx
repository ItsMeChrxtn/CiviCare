import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiArchive, FiUpload } from 'react-icons/fi';
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Publish and manage barangay-wide announcements.</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><FiPlus /> New Announcement</button>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No announcements have been published yet."
          columns={[
            { header: 'Title', accessor: (r) => <span className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-100">{r.isPinned && <BsPinAngleFill className="text-amber-500" />}{r.title}</span> },
            { header: 'Category', accessor: (r) => <span className="capitalize text-gray-500 dark:text-gray-400">{r.category}</span> },
            { header: 'Views', accessor: (r) => r.views },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: 'Actions',
              accessor: (r) => (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
                    title="Edit"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirming(r)}
                    className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    title="Archive"
                  >
                    <FiArchive className="h-4 w-4" />
                  </button>
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
              <label className="input-field flex cursor-pointer items-center gap-2 text-gray-500 dark:text-gray-400">
                <FiUpload className="h-4 w-4 shrink-0" />
                <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} className="w-full text-xs file:hidden" />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/50">
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
