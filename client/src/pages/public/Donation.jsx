import { Link } from 'react-router-dom';
import { FiDollarSign, FiPackage, FiHeart } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import DonationForm from '../../components/donation/DonationForm';

const Donation = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl animate-fadeIn px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">
          <FiHeart /> Donation Drive
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Help Your Barangay Thrive</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Support relief operations and community programs through cash or in-kind donations. Every contribution is
          tracked and acknowledged.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card card-hover group p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
            <FiDollarSign className="h-7 w-7" />
          </div>
          <h3 className="font-display font-bold tracking-tight">Cash Donations</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Directly fund relief and community programs.</p>
        </div>
        <div className="card card-hover group p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
            <FiPackage className="h-7 w-7" />
          </div>
          <h3 className="font-display font-bold tracking-tight">Goods Donations</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Food, medicine, and clothing for those in need.</p>
        </div>
        <div className="card card-hover group p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
            <FiHeart className="h-7 w-7" />
          </div>
          <h3 className="font-display font-bold tracking-tight">Full Transparency</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your pledge from submission to distribution.</p>
        </div>
      </div>

      <div className="card mx-auto mt-14 max-w-lg p-8 shadow-card-hover">
        {user?.role === 'resident' ? (
          <>
            <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Make a Pledge</h2>
            <DonationForm />
          </>
        ) : (
          <div className="text-center">
            <h2 className="mb-2 font-display text-xl font-bold tracking-tight">Ready to donate?</h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Log in or create a free resident account to submit your donation pledge.</p>
            <div className="flex justify-center gap-3">
              <Link to="/login" className="btn-secondary">Log In</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Donation;
