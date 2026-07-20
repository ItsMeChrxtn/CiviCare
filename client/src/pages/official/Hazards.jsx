import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HazardMap from '../../components/map/HazardMap';
import LocationPicker from '../../components/map/LocationPicker';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

const LAYERS = ['flood', 'fire', 'danger_zone', 'road_closure', 'evacuation_center', 'safe_area'];

const Hazards = () => {
  const { rows, isLoading, refetch } = usePaginatedFetch('/hazards', { limit: 100 });
  const [isOpen, setIsOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [location, setLocation] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    if (!location) return toast.error('Please pin the location on the map');
    try {
      await api.post('/hazards', {
        ...values,
        geometry: { type: 'Point', coordinates: [location[1], location[0]] },
      });
      toast.success('Hazard map feature added');
      reset();
      setLocation(null);
      setIsOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add feature');
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/hazards/${confirming._id}/archive`);
      toast.success('Hazard feature archived');
      setConfirming(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hazard Map Management</h1>
        <button onClick={() => setIsOpen(true)} className="btn-primary"><FiPlus /> Add Point Feature</button>
      </div>

      <div className="mb-6">
        <HazardMap />
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : !rows.length ? (
        <EmptyState title="No hazard features yet" />
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((h) => (
            <div key={h._id} className="flex items-center justify-between p-4">
              <div>
                <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{h.layer.replace(/_/g, ' ')}</span>
                <p className="mt-1 font-medium">{h.name}</p>
                <p className="text-xs text-gray-400">{h.description}</p>
              </div>
              <button onClick={() => setConfirming(h)} className="text-red-600 hover:underline"><FiTrash2 /></button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Hazard Map Feature (Point)" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Layer</label>
              <select {...register('layer', { required: true })} className="input-field capitalize">
                {LAYERS.map((l) => <option key={l} value={l} className="capitalize">{l.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Severity Level</label>
              <select {...register('severityLevel')} className="input-field capitalize">
                {['low', 'moderate', 'high', 'critical'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input {...register('name', { required: true })} className="input-field" />
            {errors.name && <p className="mt-1 text-xs text-red-500">Name is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea rows={2} {...register('description')} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Person</label>
              <input {...register('contactPerson')} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Number</label>
              <input {...register('contactNumber')} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Location</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Add Feature'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleArchive}
        title="Archive Hazard Feature"
        message="This feature will be removed from the public hazard map."
        confirmLabel="Archive"
        danger
      />
    </div>
  );
};

export default Hazards;
