import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiFileText,
  FiCalendar,
  FiGift,
  FiMap,
  FiPhoneCall,
  FiArrowRight,
  FiShield,
  FiUsers,
  FiCheckCircle,
} from 'react-icons/fi';

const FEATURES = [
  { icon: FiAlertTriangle, title: 'Incident Reporting', desc: 'Report incidents with geo-tagged location, photos, and real-time status tracking.' },
  { icon: FiFileText, title: 'Document Requests', desc: 'Request Barangay Clearance, Residency, Indigency, Business Clearance, and Cedula online.' },
  { icon: FiCalendar, title: 'Community Events', desc: 'Join events, check in via QR code, and download certificates of participation.' },
  { icon: FiGift, title: 'Donation Drives', desc: 'Pledge and track cash or in-kind donations for community relief efforts.' },
  { icon: FiMap, title: 'Hazard Mapping', desc: 'Interactive map of flood zones, danger areas, and evacuation centers.' },
  { icon: FiPhoneCall, title: 'Emergency Hub', desc: 'One-tap access to hotlines, safety guides, and evacuation routes.' },
];

const STATS = [
  { icon: FiUsers, label: 'Registered Residents', value: '2,500+' },
  { icon: FiCheckCircle, label: 'Requests Processed', value: '8,000+' },
  { icon: FiShield, label: 'Incidents Resolved', value: '95%' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const Home = () => (
  <div>
    {/* Hero */}
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-teal-600 text-white">
      <div className="absolute inset-0 bg-grid-slate bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
      <div className="absolute -left-24 top-1/3 h-72 w-72 animate-float rounded-full bg-accent-400/20 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 animate-float rounded-full bg-primary-300/20 blur-3xl [animation-delay:-3s]" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl">
          <span className="badge border border-white/20 bg-white/10 text-white backdrop-blur-sm ring-white/10">
            Barangay Citizen Engagement System
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Building a Safer, <span className="text-accent-300">More Connected</span> Barangay
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            CiviCare brings residents and local government together — report incidents, request documents, join
            events, and stay prepared for emergencies, all from one platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary !bg-none bg-white !text-primary-700 shadow-lg shadow-black/10 hover:!bg-gray-100">
              Get Started <FiArrowRight />
            </Link>
            <Link to="/emergency-hub" className="btn-secondary !border-white/25 !bg-white/10 !text-white backdrop-blur-sm hover:!bg-white/20">
              Emergency Hub
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Stats */}
    <section className="mx-auto -mt-10 max-w-5xl px-4 lg:px-8">
      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-card-hover ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10 sm:grid-cols-3">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex items-center gap-3 px-2 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:border-gray-100 [&:not(:first-child)]:sm:dark:border-gray-800"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">What You Can Do</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Everything Your Barangay Needs</h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          A single, unified platform for civic services, disaster preparedness, and community engagement.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="card card-hover group relative overflow-hidden p-6"
          >
            <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary-500 to-accent-400 transition-transform duration-300 group-hover:scale-x-100" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-1 font-display text-lg font-bold tracking-tight">{f.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
      <div className="glass-card relative flex flex-col items-center justify-between gap-6 overflow-hidden bg-gradient-to-r from-primary-700 to-teal-600 p-10 text-center text-white sm:flex-row sm:text-left">
        <div className="absolute inset-0 bg-grid-slate bg-[length:28px_28px] opacity-30 [mask-image:radial-gradient(ellipse_80%_100%_at_50%_50%,black,transparent)]" />
        <div className="relative">
          <h3 className="font-display text-2xl font-bold tracking-tight">Ready to get involved?</h3>
          <p className="mt-1 text-white/80">Create your free CiviCare account today.</p>
        </div>
        <Link to="/register" className="btn-primary relative !bg-none bg-white !text-primary-700 shadow-lg shadow-black/10 shrink-0 hover:!bg-gray-100">
          Register Now <FiArrowRight />
        </Link>
      </div>
    </section>
  </div>
);

export default Home;
