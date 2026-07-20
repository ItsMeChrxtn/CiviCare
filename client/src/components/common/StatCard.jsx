import { motion } from 'framer-motion';

// Tailwind can't see dynamically-built class strings at build time, so every
// color variant is spelled out in full here instead of interpolated.
const COLOR_CLASSES = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
};

const StatCard = ({ icon: Icon, label, value, color = 'primary', trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -3 }}
    className="card group flex items-center gap-4 p-5 hover:shadow-card-hover"
  >
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${COLOR_CLASSES[color] || COLOR_CLASSES.primary}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
      {trend && <p className="text-xs font-medium text-emerald-500">{trend}</p>}
    </div>
  </motion.div>
);

export default StatCard;
