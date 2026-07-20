import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiKey } from 'react-icons/fi';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';

const Roles = () => {
  const [roles, setRoles] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const load = () => {
    api.get('/roles').then(({ data }) => setRoles(data.data));
    api.get('/roles/permissions?limit=100').then(({ data }) => setPermissions(data.data));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (values) => {
    try {
      const permissionIds = permissions.filter((p) => values[`perm_${p._id}`]).map((p) => p._id);
      await api.post('/roles', { name: values.name, description: values.description, permissions: permissionIds });
      toast.success('Role created successfully');
      reset();
      setIsOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    }
  };

  const deleteRole = async (id) => {
    try {
      await api.delete(`/roles/${id}`);
      toast.success('Role deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <button onClick={() => setIsOpen(true)} className="btn-primary"><FiPlus /> New Custom Role</button>
      </div>

      {roles === null ? (
        <CardSkeleton />
      ) : !roles.length ? (
        <EmptyState title="No roles found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 font-bold capitalize"><FiKey className="text-primary-600" /> {r.name}</div>
                {!r.isSystemRole && (
                  <button onClick={() => deleteRole(r._id)} className="text-red-500"><FiTrash2 /></button>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{r.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.permissions?.slice(0, 5).map((p) => (
                  <span key={p._id} className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{p.label}</span>
                ))}
                {r.permissions?.length > 5 && <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">+{r.permissions.length - 5} more</span>}
                {!r.permissions?.length && <span className="text-xs text-gray-400">No specific permissions</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Custom Role" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Role Name</label>
            <input {...register('name', { required: true })} className="input-field" />
            {errors.name && <p className="mt-1 text-xs text-red-500">Name is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input {...register('description')} className="input-field" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Permissions</label>
            <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              {permissions.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register(`perm_${p._id}`)} className="accent-primary-600" />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating...' : 'Create Role'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Roles;
