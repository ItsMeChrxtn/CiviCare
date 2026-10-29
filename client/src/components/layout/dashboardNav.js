import {
  FiHome,
  FiUser,
  FiAlertCircle,
  FiBell,
  FiCalendar,
  FiFileText,
  FiMessageSquare,
  FiUsers,
  FiMap,
  FiPhoneCall,
  FiSettings,
  FiClipboard,
  FiArchive,
  FiBarChart2,
  FiKey,
  FiDatabase,
  FiHelpCircle,
  FiVolume2,
  FiCheckSquare,
  FiSun,
  FiActivity,
  FiGift,
} from 'react-icons/fi';

/**
 * Sidebar navigation per portal. `labelKey` is translated at render time.
 * `main` mirrors the docu screens (Figures 6-19); `more` holds the extra modules.
 * Panel revision: the resident Assistant and Contact Us pages were removed (FAQs and contacts live on the landing page).
 */
export const RESIDENT_NAV = {
  main: [
    { to: '/resident', labelKey: 'nav.dashboard', icon: FiHome, end: true },
    { to: '/resident/announcements', labelKey: 'nav.announcements', icon: FiVolume2 },
    { to: '/resident/incidents', labelKey: 'nav.incidentReporting', icon: FiAlertCircle },
    { to: '/resident/documents', labelKey: 'nav.serviceRequest', icon: FiFileText },
    { to: '/resident/events', labelKey: 'nav.events', icon: FiCheckSquare },
    { to: '/resident/emergency-hub', labelKey: 'nav.emergencyHub', icon: FiSun },
    { to: '/resident/donations', labelKey: 'nav.donations', icon: FiGift },
  ],
  more: [
    { to: '/resident/feedback', labelKey: 'nav.feedback', icon: FiMessageSquare },
    { to: '/resident/notifications', labelKey: 'nav.notifications', icon: FiBell },
    { to: '/resident/profile', labelKey: 'nav.profile', icon: FiUser },
  ],
};

const STAFF_MAIN = [
  { to: '/official/residents', labelKey: 'nav.residents', icon: FiUser },
  { to: '/official/incidents', labelKey: 'nav.incidents', icon: FiAlertCircle },
  { to: '/official/documents', labelKey: 'nav.serviceRequest', icon: FiCheckSquare },
  { to: '/official/events', labelKey: 'nav.events', icon: FiFileText },
  { to: '/official/broadcast', labelKey: 'nav.emergencySms', icon: FiMessageSquare },
];

const STAFF_MORE = [
  { to: '/official/donations', labelKey: 'nav.donations', icon: FiGift },
  { to: '/official/announcements', labelKey: 'nav.announcements', icon: FiVolume2 },
  { to: '/official/hazards', labelKey: 'nav.hazardMap', icon: FiMap },
  { to: '/official/feedback', labelKey: 'nav.feedback', icon: FiMessageSquare },
  { to: '/official/reports', labelKey: 'nav.reports', icon: FiBarChart2 },
  { to: '/official/archive', labelKey: 'nav.archive', icon: FiArchive },
];

export const OFFICIAL_NAV = {
  main: [{ to: '/official', labelKey: 'nav.overview', icon: FiHome, end: true }, ...STAFF_MAIN],
  more: [
    ...STAFF_MORE,
    { to: '/official/users', labelKey: 'nav.manageUsers', icon: FiUsers },
    { to: '/official/notifications', labelKey: 'nav.notifications', icon: FiBell },
    { to: '/official/profile', labelKey: 'nav.profile', icon: FiUser },
  ],
};

export const ADMIN_NAV = {
  main: [{ to: '/admin', labelKey: 'nav.overview', icon: FiHome, end: true }, ...STAFF_MAIN],
  more: STAFF_MORE,
  system: [
    { to: '/admin/status', labelKey: 'nav.status', icon: FiBarChart2 },
    { to: '/admin/users', labelKey: 'nav.users', icon: FiUsers },
    { to: '/admin/roles', labelKey: 'nav.roles', icon: FiKey },
    { to: '/admin/faq', labelKey: 'nav.faq', icon: FiHelpCircle },
    { to: '/admin/hotlines', labelKey: 'nav.hotlines', icon: FiPhoneCall },
    { to: '/admin/settings', labelKey: 'nav.settings', icon: FiSettings },
    { to: '/admin/backup', labelKey: 'nav.backup', icon: FiDatabase },
    { to: '/admin/logs', labelKey: 'nav.logs', icon: FiClipboard },
    { to: '/admin/analytics', labelKey: 'nav.analytics', icon: FiActivity },
    { to: '/admin/notifications', labelKey: 'nav.notifications', icon: FiBell },
    { to: '/admin/profile', labelKey: 'nav.profile', icon: FiUser },
  ],
};

export const NAV_BY_ROLE = { resident: RESIDENT_NAV, official: OFFICIAL_NAV, admin: ADMIN_NAV };

/** Finds the nav entry for the current path (longest matching prefix) to title the top bar. */
export const findNavItem = (role, pathname) => {
  const nav = NAV_BY_ROLE[role];
  if (!nav) return null;
  const all = [...nav.main, ...(nav.more || []), ...(nav.system || [])];
  return all
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
};
