import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiMail,
  FiClock,
  FiPhone,
  FiHelpCircle,
  FiAlertTriangle,
  FiFileText,
  FiCalendar,
  FiMap,
  FiPhoneCall,
  FiArrowRight,
  FiShield,
  FiUsers,
  FiCheckCircle,
  FiUserPlus,
  FiGrid,
  FiBell,
  FiVolume2,
  FiGift,
} from 'react-icons/fi';
import api from '../../utils/api';
import useSetting from '../../hooks/useSetting';
import useWeather from '../../hooks/useWeather';
import useSocketEvent from '../../hooks/useSocketEvent';
import FAQList from '../../components/faq/FAQList';
import HotlineIcon from '../../components/common/HotlineIcon';
import AlertList from '../../components/emergency/AlertList';
import AnnouncementCarousel from '../../components/announcements/AnnouncementCarousel';
import { DEFAULT_MAP_CENTER } from '../../utils/constants';
import { currentAlerts } from '../../utils/emergency';

// Panel revision: features laid out as a compact waterfall (masonry) instead of equal-height rows.
const FEATURES = [
  { icon: FiAlertTriangle, title: 'Incident Reporting', desc: 'Pin the exact spot in Magdiwang, attach a photo, and track your ticket from Pending to Resolved.' },
  { icon: FiFileText, title: 'Document Requests', desc: 'Request a Barangay Certificate or Certificate of Indigency online, free of charge.' },
  { icon: FiPhoneCall, title: 'Emergency Hub', desc: 'Current disaster alerts, the evacuation map and one-tap hotlines — open to everyone, no login needed.' },
  { icon: FiCalendar, title: 'Community Events', desc: 'Join events, check in via QR code, and download certificates of participation.' },
  { icon: FiGift, title: 'Donations', desc: 'Pledge cash or relief goods for affected families and follow your pledge until it is distributed.' },
  { icon: FiMap, title: 'Evacuation Map', desc: "Evacuation centers, routes and emergency facilities around Medina's Compound." },
];

const STATS = [
  { icon: FiUsers, label: 'Registered Residents', value: '2,500+' },
  { icon: FiCheckCircle, label: 'Requests Processed', value: '8,000+' },
  { icon: FiShield, label: 'Incidents Resolved', value: '95%' },
];

const STEPS = [
  { icon: FiUserPlus, title: 'Register', desc: 'Sign up and upload your proof of residency.' },
  { icon: FiCheckCircle, title: 'Get Verified', desc: 'Officials review your account; we email you once approved.' },
  { icon: FiGrid, title: 'Access Services', desc: 'Report, request, join events and track everything in one dashboard.' },
  { icon: FiBell, title: 'Stay Protected', desc: 'Receive alerts and updates from your barangay.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const SectionHeading = ({ eyebrow, icon: Icon, title, subtitle, align = 'center' }) => (
  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className={align === 'left' ? '' : 'mx-auto max-w-2xl text-center'}>
    <span className="section-eyebrow">
      {Icon && <Icon />} {eyebrow}
    </span>
    <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
    {subtitle && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
  </motion.div>
);

const telHref = (number) => `tel:${number.replace(/[^\d+]/g, '')}`;

const Home = () => {
  const [general] = useSetting('general');
  const [emergency, setEmergency] = useSetting('emergency');
  const [hotlines, setHotlines] = useState([]);
  const { hash } = useLocation();
  const weather = useWeather(general?.mapCenter || DEFAULT_MAP_CENTER);
  useSocketEvent('emergency:updated', setEmergency);

  useEffect(() => {
    api.get('/hotlines').then(({ data }) => setHotlines(data.data)).catch(() => {});
  }, []);

  // Links like /#faq or /#contact land on the matching section once the page has rendered.
  useEffect(() => {
    if (!hash) return undefined;
    const timer = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150);
    return () => clearTimeout(timer);
  }, [hash]);

  const heroImage = general?.heroImage;
  const alerts = currentAlerts(emergency, weather);

  return (
    <div>
      {/* Hero: Barangay Hall photo set by the admin (Settings > General), solid green until one is uploaded */}
      <section className="relative overflow-hidden bg-primary-800 text-white">
        {heroImage && (
          <>
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-primary-950/75" />
          </>
        )}

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl">
            <span className="badge border border-white/20 bg-white/10 text-white ring-white/10 backdrop-blur-sm">Barangay Magdiwang, Noveleta, Cavite</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Building a Safer, <span className="text-accent-300">More Connected</span> Barangay
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              CiviCare brings residents and local government together — report incidents, request documents, join events, and stay prepared for
              emergencies, all from one platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary !bg-none bg-white !text-primary-700 shadow-lg shadow-black/10 hover:!bg-gray-100">
                Get Started <FiArrowRight />
              </Link>
              <Link to="/emergency-hub" className="btn-secondary !border-red-300/40 !bg-red-600 !text-white hover:!bg-red-700">
                <FiPhoneCall /> Emergency Hub
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Emergency Hub on the landing page, no login required (panel revision). Phones: Alerts -> Map -> Hotline. */}
      <section id="emergency" className="relative z-10 mx-auto -mt-12 max-w-7xl scroll-mt-20 px-4 lg:px-8">
        <div className={`grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-card-hover ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10 sm:p-5 ${alerts.length > 0 ? 'lg:grid-cols-[1fr_auto_1.3fr]' : 'lg:grid-cols-[auto_1fr]'}`}>
          {alerts.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-display font-bold">
                <FiBell className="text-red-500" /> Emergency Alerts
              </h2>
              <AlertList alerts={alerts} />
            </div>
          )}

          <Link
            to="/emergency-hub"
            className="flex items-center justify-center gap-3 rounded-xl bg-primary-700 p-4 text-white transition hover:brightness-110 lg:w-48 lg:flex-col lg:text-center"
          >
            <FiMap className="h-8 w-8 shrink-0" />
            <span>
              <span className="block font-display font-bold">Emergency Map</span>
              <span className="block text-xs text-white/80">Evacuation centers & routes</span>
            </span>
          </Link>

          <div>
            <h2 className="flex items-center gap-2 font-display font-bold text-red-600">
              <FiPhoneCall /> Emergency Hotline
            </h2>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Tap a number to call.</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {hotlines.map((h) => (
                <li key={h._id}>
                  <a href={telHref(h.number)} className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-2 transition hover:bg-red-50 active:bg-red-100 dark:border-gray-800 dark:hover:bg-red-500/10">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                      <HotlineIcon category={h.category} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">{h.name}</span>
                      <span className="block text-sm font-bold text-red-600">{h.number}</span>
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a href="tel:911" className="flex items-center gap-2.5 rounded-xl bg-red-600 p-2 text-white transition hover:bg-red-700">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <FiPhone className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">911 — National Emergency</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Announcements carousel (panel revision) */}
      <section id="announcements" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-14 lg:px-8">
        <SectionHeading eyebrow="Announcements" icon={FiVolume2} title="Latest from the Barangay" />
        <div className="mt-6">
          <AnnouncementCarousel />
        </div>
      </section>

      {/* Services: waterfall/masonry columns + stats tile */}
      <section className="mx-auto max-w-7xl px-4 pt-14 lg:px-8">
        <SectionHeading eyebrow="What You Can Do" title="Everything Your Barangay Needs" />
        <div className="mt-8 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="card card-hover group mb-4 break-inside-avoid p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold tracking-tight">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
          <div className="card mb-4 break-inside-avoid space-y-3 bg-primary-700 p-5 text-white">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon className="h-5 w-5 shrink-0 text-white/80" />
                <span className="font-display text-xl font-bold">{s.value}</span>
                <span className="text-sm text-white/80">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works: one compact row */}
      <section className="mx-auto max-w-7xl px-4 pt-10 lg:px-8">
        <SectionHeading eyebrow="Getting Started" title="How to Join CiviCare" />
        <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="card flex items-start gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                <step.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Step {i + 1}</span>
                <span className="block font-display font-bold">{step.title}</span>
                <span className="block text-sm text-gray-500 dark:text-gray-400">{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ and Contact side by side */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-14 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <div id="faq" className="scroll-mt-20">
          <SectionHeading eyebrow="FAQ" icon={FiHelpCircle} title="Frequently Asked Questions" align="left" />
          <div className="mt-6">
            <FAQList />
          </div>
        </div>

        <div id="contact" className="scroll-mt-20">
          <SectionHeading eyebrow="Contact Us" icon={FiPhoneCall} title="Barangay Hall" align="left" />
          <div className="card mt-6 space-y-4 p-5">
            <h3 className="font-display text-lg font-bold">{general?.barangayName || 'Barangay Magdiwang'}</h3>
            {[
              { icon: FiMapPin, label: 'Address', value: general?.address },
              { icon: FiClock, label: 'Office Hours', value: general?.officeHours },
              { icon: FiPhone, label: 'Phone', value: general?.phone, href: general?.phone && telHref(general.phone) },
              { icon: FiMail, label: 'Email', value: general?.email, href: general?.email && `mailto:${general.email}` },
            ]
              .filter((c) => c.value)
              .map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                    <c.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">{c.label}</span>
                    {c.href ? (
                      <a href={c.href} className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400">
                        {c.value}
                      </a>
                    ) : (
                      <span className="text-sm">{c.value}</span>
                    )}
                  </span>
                </div>
              ))}
            <Link to="/about" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400">
              About Magdiwang & Barangay Officials <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
        <div className="glass-card relative flex flex-col items-center justify-between gap-4 overflow-hidden bg-primary-700 p-8 text-center text-white sm:flex-row sm:text-left">
          <div className="relative">
            <h3 className="font-display text-2xl font-bold tracking-tight">Ready to get involved?</h3>
            <p className="mt-1 text-white/80">Create your free CiviCare account today.</p>
          </div>
          <Link to="/register" className="btn-primary relative shrink-0 !bg-none bg-white !text-primary-700 shadow-lg shadow-black/10 hover:!bg-gray-100">
            Register Now <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
