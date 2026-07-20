import { Link } from 'react-router-dom';
import { FiFacebook, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => (
  <footer className="border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <div>
        <div className="mb-3 flex items-center gap-2 font-extrabold text-primary-700 dark:text-primary-400">
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
          <li><Link to="/faq" className="hover:text-primary-600">FAQ</Link></li>
          <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 font-semibold">Resources</h4>
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li><Link to="/emergency-hub" className="hover:text-primary-600">Emergency Hub</Link></li>
          <li><Link to="/hazard-map" className="hover:text-primary-600">Hazard Map</Link></li>
          <li><Link to="/donation" className="hover:text-primary-600">Donation</Link></li>
          <li><Link to="/events" className="hover:text-primary-600">Events</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 font-semibold">Contact Us</h4>
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li className="flex items-center gap-2"><FiMapPin /> 123 Rizal St., Quezon City</li>
          <li className="flex items-center gap-2"><FiPhone /> (02) 8123-4567</li>
          <li className="flex items-center gap-2"><FiMail /> info@civicare.gov.ph</li>
          <li className="flex items-center gap-2"><FiFacebook /> /BarangaySanIsidro</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400 dark:border-gray-800">
      &copy; {new Date().getFullYear()} CiviCare Barangay System. All rights reserved.
    </div>
  </footer>
);

export default Footer;
