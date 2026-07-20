import { motion } from 'framer-motion';
import { FiTarget, FiEye, FiHeart } from 'react-icons/fi';

const VALUES = [
  { icon: FiTarget, title: 'Our Mission', desc: 'To empower barangay residents with accessible digital tools for civic engagement, transparent governance, and disaster resilience.' },
  { icon: FiEye, title: 'Our Vision', desc: 'A model barangay where technology bridges the gap between residents and local government, fostering a safer and more responsive community.' },
  { icon: FiHeart, title: 'Our Values', desc: 'Transparency, accessibility, responsiveness, and community-first service in everything we build.' },
];

const About = () => (
  <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">About CiviCare</span>
      <h1 className="mt-4 text-4xl font-extrabold">A Smarter Way to Serve Our Barangay</h1>
      <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
        CiviCare is a Web-Based Barangay Citizen Engagement and Community Resilience System designed to modernize
        how residents interact with their local government - from reporting incidents to requesting documents and
        preparing for emergencies.
      </p>
    </motion.div>

    <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {VALUES.map((v) => (
        <div key={v.title} className="card p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <v.icon className="h-7 w-7" />
          </div>
          <h3 className="mb-2 text-lg font-bold">{v.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{v.desc}</p>
        </div>
      ))}
    </div>

    <div className="card mt-14 p-8">
      <h2 className="mb-3 text-2xl font-bold">Why CiviCare?</h2>
      <p className="text-gray-500 dark:text-gray-400">
        Traditional barangay processes rely heavily on manual, in-person transactions - long queues for document
        requests, delayed incident response, and limited visibility into local hazards. CiviCare digitizes these
        workflows end-to-end: residents can report, request, register, and stay informed from anywhere, while
        barangay officials gain real-time dashboards, SMS/email broadcast tools, and structured reporting to serve
        the community more effectively.
      </p>
    </div>
  </div>
);

export default About;
