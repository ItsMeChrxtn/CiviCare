import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import { DOCUMENT_TYPES } from '../../utils/constants';

const Documents = () => {
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/documents');
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      await api.post('/documents', values);
      toast.success('Document request submitted successfully');
      reset();
      setIsOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Document Requests</h1>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <FiPlus /> Request Document
        </button>
      </div>

      <div className="card p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage="You haven't requested any documents yet."
          columns={[
            { header: 'Reference', accessor: (r) => <Link to={`/resident/documents/${r._id}`} className="font-medium text-primary-600 hover:underline">{r.referenceCode}</Link> },
            { header: 'Type', accessor: (r) => <span className="capitalize">{r.type.replace(/_/g, ' ')}</span> },
            { header: 'Purpose', accessor: (r) => r.purpose },
            { header: 'Fee', accessor: (r) => (r.fee ? `₱${r.fee}` : 'Free') },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Request a Document">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Document Type</label>
            <select {...register('type', { required: true })} className="input-field">
              <option value="">Select document</option>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-xs text-red-500">Please select a document type</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Purpose</label>
            <input placeholder="e.g. Employment requirement" {...register('purpose', { required: true })} className="input-field" />
            {errors.purpose && <p className="mt-1 text-xs text-red-500">Purpose is required</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Documents;
