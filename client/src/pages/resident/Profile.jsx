import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiCamera, FiUser } from 'react-icons/fi';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import QRCodeDisplay from '../../components/qr/QRCodeDisplay';

const Profile = () => {
  const { user, refreshMe } = useAuth();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      firstName: user?.firstName,
      middleName: user?.middleName,
      lastName: user?.lastName,
      phone: user?.phone,
      occupation: user?.occupation,
      civilStatus: user?.civilStatus,
      purok: user?.address?.purok,
      street: user?.address?.street,
      city: user?.address?.city,
      province: user?.address?.province,
    },
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

  const onSubmit = async (values) => {
    try {
      const { purok, street, city, province, ...rest } = values;
      await api.patch('/users/me', { ...rest, address: { purok, street, city, province } });
      await refreshMe();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.patch('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshMe();
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information and account details.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card card-hover animate-fadeIn flex flex-col items-center p-6 lg:col-span-1">
          <div className="relative">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="Avatar" className="h-28 w-28 rounded-full object-cover ring-4 ring-primary-50 dark:ring-primary-500/10" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-100 text-primary-700 ring-4 ring-primary-50 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-500/10">
                <FiUser className="h-12 w-12" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-soft ring-2 ring-white transition hover:shadow-glow dark:ring-gray-900">
              <FiCamera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-gray-50">{user?.fullName}</h2>
          <p className="text-sm capitalize text-gray-400">{user?.position || user?.role}</p>
          <p className="mt-1 text-sm text-gray-400">{user?.email}</p>

          {user?.role === 'resident' && (
            <div className="mt-6 w-full border-t border-gray-100 pt-6 dark:border-gray-800">
              <QRCodeDisplay />
            </div>
          )}
        </div>

        <div className="card animate-fadeIn p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-gray-900 dark:text-gray-50">Edit Profile</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">First Name</label>
                <input {...register('firstName')} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Last Name</label>
                <input {...register('lastName')} className="input-field" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Middle Name</label>
              <input {...register('middleName')} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Mobile Number</label>
                <input {...register('phone')} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Occupation</label>
                <input {...register('occupation')} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Purok / Street</label>
                <input {...register('purok')} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">City</label>
                <input {...register('city')} className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
