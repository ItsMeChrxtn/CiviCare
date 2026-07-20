import { Link } from 'react-router-dom';
import { FiDollarSign, FiPackage, FiHeart } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import DonationForm from '../../components/donation/DonationForm';

const Donation = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
          <FiHeart /> Donation Drive
        </span>
        <h1 className="mt-4 text-4xl font-extrabold">Help Your Barangay Thrive</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Support relief operations and community programs through cash or in-kind donations. Every contribution is
          tracked and acknowledged.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card p-6 text-center">
          <FiDollarSign className="mx-auto mb-3 h-8 w-8 text-primary-600" />
          <h3 className="font-bold">Cash Donations</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Directly fund relief and community programs.</p>
        </div>
        <div className="card p-6 text-center">
          <FiPackage className="mx-auto mb-3 h-8 w-8 text-primary-600" />
          <h3 className="font-bold">Goods Donations</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Food, medicine, and clothing for those in need.</p>
        </div>
        <div className="card p-6 text-center">
          <FiHeart className="mx-auto mb-3 h-8 w-8 text-primary-600" />
          <h3 className="font-bold">Full Transparency</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your pledge from submission to distribution.</p>
        </div>
      </div>

      <div className="card mx-auto mt-14 max-w-lg p-8">
        {user?.role === 'resident' ? (
          <>
            <h2 className="mb-4 text-xl font-bold">Make a Pledge</h2>
            <DonationForm />
          </>
        ) : (
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold">Ready to donate?</h2>
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
