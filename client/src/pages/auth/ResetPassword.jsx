import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired');
    }
  };

  return (
    <div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />
      <div className="absolute inset-0 -z-10 bg-grid-slate bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_30%,black,transparent)]" />

      <Link to="/" className="mb-6 flex items-center gap-2.5 font-display font-extrabold text-primary-700 dark:text-primary-400">
        <img src="/favicon.svg" alt="CiviCare" className="h-9 w-9" />
        <span className="text-xl">CiviCare</span>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8 shadow-card-hover">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Reset Password</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter your new password below.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <input
              type="password"
              {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
              className="input-field"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              {...register('confirmPassword', { validate: (v) => v === watch('password') || 'Passwords do not match' })}
              className="input-field"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
            Back to Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
