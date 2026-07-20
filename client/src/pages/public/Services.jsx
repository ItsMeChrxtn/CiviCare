import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiFileText, FiCalendar, FiGift, FiMap, FiPhoneCall, FiMessageSquare, FiArrowRight } from 'react-icons/fi';
import { DOCUMENT_TYPES } from '../../utils/constants';

const SERVICES = [
  { icon: FiAlertTriangle, title: 'Incident Reporting', desc: 'Report fires, floods, accidents, and other incidents with geo-tagged location and photo evidence. Track status from Pending to Resolved.' },
  { icon: FiFileText, title: 'Document Requests', desc: 'Request official barangay documents online and download a QR-verifiable PDF once approved.', list: DOCUMENT_TYPES.map((d) => d.label) },
  { icon: FiCalendar, title: 'Community Events', desc: 'Browse and register for barangay events, check in via QR code, and receive a digital certificate of participation.' },
  { icon: FiGift, title: 'Donation Drives', desc: 'Pledge cash or in-kind donations (goods, medicine, food, clothes) for relief operations and track their status.' },
  { icon: FiMap, title: 'Hazard Mapping', desc: 'View an interactive map of flood zones, fire hazards, danger zones, road closures, and evacuation centers.' },
  { icon: FiPhoneCall, title: 'Emergency Hub', desc: 'Access disaster guides (flood, fire, earthquake, typhoon), hotline directories, and evacuation maps in one place.' },
  { icon: FiMessageSquare, title: 'Feedback & Chatbot', desc: 'Submit feedback or complaints and get instant answers to common questions through the CiviCare Assistant.' },
];

const Services = () => (
  <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
    <div className="mx-auto max-w-2xl text-center">
      <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">Our Services</span>
      <h1 className="mt-4 text-4xl font-extrabold">Digital Services for Every Resident</h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        Everything you need from your barangay, now available online, 24/7.
      </p>
    </div>

    <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
      {SERVICES.map((s) => (
        <div key={s.title} className="card flex gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <s.icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-bold">{s.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
            {s.list && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {s.list.map((item) => (
                  <li key={item} className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>

    <div className="mt-14 text-center">
      <Link to="/register" className="btn-primary">
        Create Your Free Account <FiArrowRight />
      </Link>
    </div>
  </div>
);

export default Services;
