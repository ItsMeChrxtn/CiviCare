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
  FiUserPlus,
  FiGrid,
  FiBell,
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

const STEPS = [
  { icon: FiUserPlus, title: 'Create Your Account', desc: 'Sign up with your basic details and verify your email — takes less than 2 minutes.' },
  { icon: FiGrid, title: 'Access Services', desc: 'Report incidents, request documents, join events, and track everything from one dashboard.' },
  { icon: FiBell, title: 'Stay Protected', desc: 'Get real-time alerts, request updates, and support from your barangay whenever you need it.' },
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

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
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

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative hidden h-80 lg:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-2 top-2 w-64 rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-glass backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-400/20 text-accent-200">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Incident Reported</p>
                <p className="text-xs text-white/70">Flooding — Purok 3</p>
              </div>
            </div>
            <span className="badge mt-3 bg-accent-400/20 text-accent-200 ring-1 ring-inset ring-accent-300/30">In Progress</span>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute right-0 top-36 w-56 rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-glass backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Clearance Approved</p>
                <p className="text-xs text-white/70">Ready for pickup</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-2 left-16 w-52 rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-glass backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                <FiPhoneCall className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">24/7 Emergency Line</p>
                <p className="text-xs text-white/70">Always available</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>

    {/* Stats */}
    <section className="relative z-10 mx-auto -mt-10 max-w-5xl px-4 lg:px-8">
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

    {/* How It Works */}
    <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">Getting Started</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Three Steps to Get Involved</h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Joining your barangay's digital community takes just a few minutes.
        </p>
      </motion.div>

      <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
        <div className="absolute inset-x-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-800 sm:block" />
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative flex flex-col items-center text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-glow ring-4 ring-gray-50 dark:ring-gray-950">
              <step.icon className="h-5 w-5" />
            </div>
            <span className="mt-4 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Step {i + 1}
            </span>
            <h3 className="mt-1 font-display text-lg font-bold tracking-tight">{step.title}</h3>
            <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
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
