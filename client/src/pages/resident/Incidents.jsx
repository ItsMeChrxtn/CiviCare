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
import LocationPicker from '../../components/map/LocationPicker';
import { INCIDENT_CATEGORY } from '../../utils/constants';

const Incidents = () => {
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/incidents');
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]);

  const onSubmit = async (values) => {
    if (!location) return toast.error('Please pin the incident location on the map');
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => formData.append(key, val));
      formData.append('lat', location[0]);
      formData.append('lng', location[1]);
      images.forEach((file) => formData.append('images', file));

      await api.post('/incidents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Incident reported successfully');
      reset();
      setLocation(null);
      setImages([]);
      setIsOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report incident');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header !mb-0">
          <h1 className="page-title">My Incident Reports</h1>
          <p className="page-subtitle">Report and track incidents in your barangay.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <FiPlus /> Report Incident
        </button>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage="You haven't reported any incidents yet."
          columns={[
            { header: 'Reference', accessor: (r) => <Link to={`/resident/incidents/${r._id}`} className="font-medium text-primary-600 hover:underline">{r.referenceCode}</Link> },
            { header: 'Title', accessor: (r) => r.title },
            { header: 'Category', accessor: (r) => <span className="capitalize">{r.category}</span> },
            { header: 'Severity', accessor: (r) => <Badge status={r.severity} /> },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Report an Incident" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input {...register('title', { required: true })} className="input-field" />
            {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea rows={3} {...register('description', { required: true })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select {...register('category', { required: true })} className="input-field capitalize">
                <option value="">Select</option>
                {INCIDENT_CATEGORY.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Severity</label>
              <select {...register('severity', { required: true })} className="input-field capitalize">
                <option value="">Select</option>
                {['low', 'moderate', 'high', 'critical'].map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Location</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Photos (optional, up to 5)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))} className="input-field" />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Incidents;
