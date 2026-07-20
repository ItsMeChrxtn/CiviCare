import { motion } from 'framer-motion';
import { FiTarget, FiEye, FiHeart } from 'react-icons/fi';

const VALUES = [
  { icon: FiTarget, title: 'Our Mission', desc: 'To empower barangay residents with accessible digital tools for civic engagement, transparent governance, and disaster resilience.' },
  { icon: FiEye, title: 'Our Vision', desc: 'A model barangay where technology bridges the gap between residents and local government, fostering a safer and more responsive community.' },
  { icon: FiHeart, title: 'Our Values', desc: 'Transparency, accessibility, responsiveness, and community-first service in everything we build.' },
];

const About = () => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-radial-fade" />
    <div className="absolute inset-0 -z-10 bg-grid-slate bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="section-eyebrow">About CiviCare</span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">A Smarter Way to Serve Our Barangay</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
          CiviCare is a Web-Based Barangay Citizen Engagement and Community Resilience System designed to modernize
          how residents interact with their local government - from reporting incidents to requesting documents and
          preparing for emergencies.
        </p>
      </motion.div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {VALUES.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="card card-hover group p-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
              <v.icon className="h-7 w-7" />
            </div>
            <h3 className="mb-2 font-display text-lg font-bold tracking-tight">{v.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{v.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card mt-14 p-8"
      >
        <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">Why CiviCare?</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Traditional barangay processes rely heavily on manual, in-person transactions - long queues for document
          requests, delayed incident response, and limited visibility into local hazards. CiviCare digitizes these
          workflows end-to-end: residents can report, request, register, and stay informed from anywhere, while
          barangay officials gain real-time dashboards, SMS/email broadcast tools, and structured reporting to serve
          the community more effectively.
        </p>
      </motion.div>
    </div>
  </div>
);

export default About;
