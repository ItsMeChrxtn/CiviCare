import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';

const CATEGORIES = ['police', 'fire', 'medical', 'mdrrmo', 'barangay', 'hospital', 'utility', 'other'];

const Hotlines = () => {
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/hotlines', { limit: 20 });
  const [modalItem, setModalItem] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const openCreate = () => {
    reset({ name: '', category: 'other', number: '', alternateNumber: '', address: '', availability: '24/7' });
    setModalItem({});
  };
  const openEdit = (item) => {
    reset(item);
    setModalItem(item);
  };

  const onSubmit = async (values) => {
    try {
      if (modalItem?._id) {
        await api.patch(`/hotlines/${modalItem._id}`, values);
        toast.success('Hotline updated');
      } else {
        await api.post('/hotlines', values);
        toast.success('Hotline added');
      }
      setModalItem(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hotline');
    }
  };

  const deleteHotline = async (id) => {
    try {
      await api.delete(`/hotlines/${id}`);
      toast.success('Hotline deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hotline Directory</h1>
        <button onClick={openCreate} className="btn-primary"><FiPlus /> Add Hotline</button>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          columns={[
            { header: 'Name', accessor: (r) => r.name },
            { header: 'Category', accessor: (r) => <span className="capitalize">{r.category}</span> },
            { header: 'Number', accessor: (r) => r.number },
            { header: 'Availability', accessor: (r) => r.availability },
            {
              header: 'Actions',
              accessor: (r) => (
                <div className="flex gap-3">
                  <button onClick={() => openEdit(r)} className="text-primary-600"><FiEdit2 /></button>
                  <button onClick={() => deleteHotline(r._id)} className="text-red-600"><FiTrash2 /></button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={!!modalItem} onClose={() => setModalItem(null)} title={modalItem?._id ? 'Edit Hotline' : 'Add Hotline'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input {...register('name', { required: true })} className="input-field" />
            {errors.name && <p className="mt-1 text-xs text-red-500">Name is required</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select {...register('category')} className="input-field capitalize">
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Number</label>
              <input {...register('number', { required: true })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Alternate Number</label>
            <input {...register('alternateNumber')} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Availability</label>
            <input {...register('availability')} className="input-field" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Save Hotline'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Hotlines;
