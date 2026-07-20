import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiArchive, FiUsers } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const CATEGORIES = ['health', 'sports', 'education', 'livelihood', 'disaster_drill', 'community', 'other'];

const toInputDate = (iso) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : '');

const Events = () => {
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/events');
  const [modalItem, setModalItem] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const openCreate = () => {
    reset({ title: '', description: '', category: 'community', location: '', startDate: '', endDate: '', capacity: 0 });
    setModalItem({});
  };
  const openEdit = (item) => {
    reset({
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      startDate: toInputDate(item.startDate),
      endDate: toInputDate(item.endDate),
      capacity: item.capacity,
    });
    setModalItem(item);
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => formData.append(key, val));
      if (coverImage) formData.append('coverImage', coverImage);

      if (modalItem?._id) {
        await api.patch(`/events/${modalItem._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event updated');
      } else {
        await api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event created');
      }
      setModalItem(null);
      setCoverImage(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/events/${confirming._id}/archive`);
      toast.success('Event archived');
      setConfirming(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <button onClick={openCreate} className="btn-primary"><FiPlus /> New Event</button>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Title', accessor: (r) => r.title },
            { header: 'Location', accessor: (r) => r.location },
            { header: 'Start Date', accessor: (r) => format(new Date(r.startDate), 'MMM d, yyyy h:mm a') },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            {
              header: 'Actions',
              accessor: (r) => (
                <div className="flex gap-3">
                  <Link to={`/official/events/${r._id}/participants`} className="text-primary-600 hover:underline"><FiUsers /></Link>
                  <button onClick={() => openEdit(r)} className="text-primary-600 hover:underline"><FiEdit2 /></button>
                  <button onClick={() => setConfirming(r)} className="text-red-600 hover:underline"><FiArchive /></button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title={modalItem?._id ? 'Edit Event' : 'New Event'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input {...register('title', { required: true })} className="input-field" />
            {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea rows={4} {...register('description', { required: true })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select {...register('category')} className="input-field capitalize">
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <input {...register('location', { required: true })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input type="datetime-local" {...register('startDate', { required: true })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input type="datetime-local" {...register('endDate', { required: true })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Capacity (0 = unlimited)</label>
              <input type="number" min="0" {...register('capacity')} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cover Image</label>
              <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} className="input-field" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : modalItem?._id ? 'Update Event' : 'Create Event'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleArchive}
        title="Archive Event"
        message="This event will be moved to the archive."
        confirmLabel="Archive"
        danger
      />
    </div>
  );
};

export default Events;
