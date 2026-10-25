import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import useSetting from '../../hooks/useSetting';

const Footer = () => {
  const [general] = useSetting('general');
  return (
  <footer className="relative border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <div>
        <div className="mb-3 flex items-center gap-2 font-display font-extrabold text-primary-700 dark:text-primary-400">
          <img src="/favicon.svg" alt="CiviCare" className="h-8 w-8" />
          <span className="text-lg">CiviCare</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          A Web-Based Barangay Citizen Engagement and Community Resilience System, connecting residents and local
          government for a safer, more responsive community.
        </p>
      </div>

      <div>
        <h4 className="mb-3 font-semibold">Quick Links</h4>
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li><Link to="/about" className="hover:text-primary-600">About</Link></li>
          <li><Link to="/services" className="hover:text-primary-600">Services</Link></li>
          <li><Link to="/#faq" className="hover:text-primary-600">FAQ</Link></li>
          <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 font-semibold">Resources</h4>
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li><Link to="/emergency-hub" className="hover:text-primary-600">Emergency Hub</Link></li>
          <li><Link to="/hazard-map" className="hover:text-primary-600">Evacuation Map</Link></li>
          <li><Link to="/events" className="hover:text-primary-600">Events</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 font-semibold">Contact Us</h4>
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          {general?.address && <li className="flex items-start gap-2"><FiMapPin className="mt-0.5 shrink-0" /> {general.address}</li>}
          {general?.officeHours && <li className="flex items-start gap-2"><FiClock className="mt-0.5 shrink-0" /> {general.officeHours}</li>}
          {general?.phone && <li className="flex items-center gap-2"><FiPhone /> {general.phone}</li>}
          {general?.email && <li className="flex items-center gap-2"><FiMail /> {general.email}</li>}
        </ul>
      </div>
    </div>
    <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400 dark:border-gray-800">
      &copy; {new Date().getFullYear()} CiviCare Barangay System. All rights reserved.
    </div>
  </footer>
  );
};

export default Footer;
