import { useEffect, useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import api from '../../utils/api';

const Contact = () => {
  const [general, setGeneral] = useState(null);

  useEffect(() => {
    api.get('/settings/general').then(({ data }) => setGeneral(data.data));
  }, []);

  return (
    <div className="mx-auto max-w-5xl animate-fadeIn px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">Contact Us</span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Get in Touch</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Reach out to the Barangay Hall for inquiries and concerns.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card card-hover group p-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
            <FiMapPin className="h-6 w-6" />
          </div>
          <h3 className="font-display font-bold tracking-tight">Office Address</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{general?.address || 'Barangay Hall'}</p>
        </div>
        <div className="card card-hover group p-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
            <FiClock className="h-6 w-6" />
          </div>
          <h3 className="font-display font-bold tracking-tight">Office Hours</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{general?.officeHours || '8:00 AM - 5:00 PM, Mon-Fri'}</p>
        </div>
        <div className="card card-hover group p-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
            <FiPhone className="h-6 w-6" />
          </div>
          <h3 className="font-display font-bold tracking-tight">Phone</h3>
          <a href={`tel:${general?.contactPhone}`} className="mt-1 block text-sm text-primary-600 hover:underline dark:text-primary-400">
            {general?.contactPhone || '(02) 8123-4567'}
          </a>
        </div>
        <div className="card card-hover group p-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
            <FiMail className="h-6 w-6" />
          </div>
          <h3 className="font-display font-bold tracking-tight">Email</h3>
          <a href={`mailto:${general?.contactEmail}`} className="mt-1 block text-sm text-primary-600 hover:underline dark:text-primary-400">
            {general?.contactEmail || 'info@civicare.gov.ph'}
          </a>
        </div>
      </div>

      <div className="glass-card mt-8 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        For urgent concerns, please use the <a href="/emergency-hub" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">Emergency Hub</a> hotline directory instead of email.
      </div>
    </div>
  );
};

export default Contact;
