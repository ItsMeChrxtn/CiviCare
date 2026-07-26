import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      toast.success('Registration received! Please check your email for the verification code.');
      navigate('/verify-email', { state: { email: values.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-lg p-8 shadow-card-hover">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Create Your Account</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Join CiviCare as a resident.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">First Name</label>
              <input {...register('firstName', { required: 'Required' })} className="input-field" />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name</label>
              <input {...register('lastName', { required: 'Required' })} className="input-field" />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email Address</label>
            <input type="email" {...register('email', { required: 'Email is required' })} className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mobile Number</label>
            <input
              placeholder="09171234567"
              {...register('phone', { pattern: { value: /^09\d{9}$/, message: 'Invalid PH mobile number' } })}
              className="input-field"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
                className="input-field"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Required',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
                className="input-field"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <input type="checkbox" required className="mt-0.5 accent-primary-600" />
            I agree to the accurate use of this system and confirm the information provided is true and correct.
          </label>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
