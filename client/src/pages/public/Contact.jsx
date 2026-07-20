import { useEffect, useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import api from '../../utils/api';

const Contact = () => {
  const [general, setGeneral] = useState(null);

  useEffect(() => {
    api.get('/settings/general').then(({ data }) => setGeneral(data.data));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">Contact Us</span>
        <h1 className="mt-4 text-4xl font-extrabold">Get in Touch</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Reach out to the Barangay Hall for inquiries and concerns.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <FiMapPin className="mb-3 h-6 w-6 text-primary-600" />
          <h3 className="font-bold">Office Address</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{general?.address || 'Barangay Hall'}</p>
        </div>
        <div className="card p-6">
          <FiClock className="mb-3 h-6 w-6 text-primary-600" />
          <h3 className="font-bold">Office Hours</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{general?.officeHours || '8:00 AM - 5:00 PM, Mon-Fri'}</p>
        </div>
        <div className="card p-6">
          <FiPhone className="mb-3 h-6 w-6 text-primary-600" />
          <h3 className="font-bold">Phone</h3>
          <a href={`tel:${general?.contactPhone}`} className="mt-1 block text-sm text-primary-600 hover:underline">
            {general?.contactPhone || '(02) 8123-4567'}
          </a>
        </div>
        <div className="card p-6">
          <FiMail className="mb-3 h-6 w-6 text-primary-600" />
          <h3 className="font-bold">Email</h3>
          <a href={`mailto:${general?.contactEmail}`} className="mt-1 block text-sm text-primary-600 hover:underline">
            {general?.contactEmail || 'info@civicare.gov.ph'}
          </a>
        </div>
      </div>

      <div className="card mt-8 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        For urgent concerns, please use the <a href="/emergency-hub" className="text-primary-600 hover:underline">Emergency Hub</a> hotline directory instead of email.
      </div>
    </div>
  );
};

export default Contact;
