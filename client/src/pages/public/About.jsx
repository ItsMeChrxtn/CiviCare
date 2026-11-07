import { motion } from 'framer-motion';
import { FiTarget, FiEye, FiHeart, FiInfo, FiUser, FiUsers } from 'react-icons/fi';
import useSetting from '../../hooks/useSetting';

const VALUES = [
  { icon: FiTarget, title: 'Our Mission', desc: 'To empower barangay residents with accessible digital tools for civic engagement, transparent governance, and disaster resilience.' },
  { icon: FiEye, title: 'Our Vision', desc: 'A model barangay where technology bridges the gap between residents and local government, fostering a safer and more responsive community.' },
  { icon: FiHeart, title: 'Our Values', desc: 'Transparency, accessibility, responsiveness, and community-first service in everything we build.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } }),
};

const Heading = ({ eyebrow, icon: Icon, title, subtitle }) => (
  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
    <span className="section-eyebrow">
      {Icon && <Icon />} {eyebrow}
    </span>
    <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight">{title}</h2>
    {subtitle && <p className="mt-2 text-gray-500 dark:text-gray-400">{subtitle}</p>}
  </motion.div>
);

const OfficialCard = ({ official, featured = false }) => (
  <div className={`card flex flex-col items-center p-5 text-center ${featured ? 'mx-auto w-full max-w-sm' : ''}`}>
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full bg-primary-50 text-primary-400 ring-4 ring-primary-100 dark:bg-primary-500/10 dark:ring-primary-500/20 ${
        featured ? 'h-28 w-28' : 'h-20 w-20'
      }`}
    >
      {official.photo ? <img src={official.photo} alt={official.name} loading="lazy" className="h-full w-full object-cover" /> : <FiUser className="h-1/2 w-1/2" />}
    </div>
    {featured && (
      <span className="mt-3 rounded-full bg-primary-50 px-3 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
        ★ {official.position}
      </span>
    )}
    <p className="mt-2 font-display font-bold">{official.name}</p>
    {!featured && <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{official.position}</p>}
    {official.committee && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{official.committee}</p>}
  </div>
);

/** About tab (panel revision): About Magdiwang, its Mission/Vision and Barangay Officials moved here from the landing page. */
const About = () => {
  const [general] = useSetting('general');
  const [officials] = useSetting('officials');
  const [captain, ...members] = (officials || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 lg:px-8">
        {/* About Magdiwang (editable in Admin > Settings > General) */}
        <section id="magdiwang" className="scroll-mt-20">
          <Heading eyebrow="About Magdiwang" icon={FiInfo} title={general?.barangayName || 'Barangay Magdiwang'} subtitle="Noveleta, Cavite" />
          {general?.about && (
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto mt-6 max-w-3xl text-center leading-relaxed text-gray-600 dark:text-gray-300">
              {general.about}
            </motion.p>
          )}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              { icon: FiTarget, title: 'Mission', text: general?.mission },
              { icon: FiEye, title: 'Vision', text: general?.vision },
            ]
              .filter((v) => v.text)
              .map((v, i) => (
                <motion.div key={v.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="card p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-xl font-bold tracking-tight">{v.title}</h3>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">{v.text}</p>
                </motion.div>
              ))}
          </div>
        </section>

        {captain && (
          <section id="officials" className="scroll-mt-20">
            <Heading eyebrow="Your Representatives" icon={FiUsers} title="Barangay Officials" subtitle="Elected representatives serving the community" />
            <div className="mt-8 space-y-4">
              <OfficialCard official={captain} featured />
              {members.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((o) => (
                    <OfficialCard key={`${o.name}-${o.order}`} official={o} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* About CiviCare */}
        <section>
          <Heading eyebrow="About CiviCare" title="A Smarter Way to Serve Our Barangay" />
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-500 dark:text-gray-400">
            CiviCare is a Web-Based Barangay Citizen Engagement and Community Resilience System designed to modernize how residents interact with their
            local government - from reporting incidents to requesting documents and preparing for emergencies.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="card card-hover group p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/10 dark:text-primary-400">
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold tracking-tight">{v.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{v.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="glass-card mt-8 p-8">
            <h3 className="mb-3 font-display text-2xl font-bold tracking-tight">Why CiviCare?</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Traditional barangay processes rely heavily on manual, in-person transactions - long queues for document requests, delayed incident
              response, and limited visibility into local hazards. CiviCare digitizes these workflows end-to-end: residents can report, request, register,
              and stay informed from anywhere, while barangay officials gain real-time dashboards, SMS/email broadcast tools, and structured reporting to
              serve the community more effectively.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
