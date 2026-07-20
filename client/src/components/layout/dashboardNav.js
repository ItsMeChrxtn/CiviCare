import {
  FiHome,
  FiUser,
  FiAlertTriangle,
  FiBell,
  FiCalendar,
  FiGift,
  FiFileText,
  FiMessageSquare,
  FiShield,
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
  FiRadio,
} from 'react-icons/fi';

export const RESIDENT_NAV = [
  { to: '/resident', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/resident/profile', label: 'My Profile', icon: FiUser },
  { to: '/resident/incidents', label: 'Report Incident', icon: FiAlertTriangle },
  { to: '/resident/documents', label: 'Document Requests', icon: FiFileText },
  { to: '/resident/events', label: 'Events', icon: FiCalendar },
  { to: '/resident/donations', label: 'Donations', icon: FiGift },
  { to: '/resident/emergency-hub', label: 'Emergency Hub', icon: FiPhoneCall },
  { to: '/resident/feedback', label: 'Feedback', icon: FiMessageSquare },
  { to: '/resident/notifications', label: 'Notifications', icon: FiBell },
];

export const OFFICIAL_NAV = [
  { to: '/official', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/official/residents', label: 'Residents', icon: FiUsers },
  { to: '/official/incidents', label: 'Incidents', icon: FiAlertTriangle },
  { to: '/official/announcements', label: 'Announcements', icon: FiRadio },
  { to: '/official/events', label: 'Events', icon: FiCalendar },
  { to: '/official/donations', label: 'Donations', icon: FiGift },
  { to: '/official/documents', label: 'Documents', icon: FiFileText },
  { to: '/official/hazards', label: 'Hazard Map', icon: FiMap },
  { to: '/official/feedback', label: 'Feedback', icon: FiMessageSquare },
  { to: '/official/broadcast', label: 'Broadcast', icon: FiRadio },
  { to: '/official/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/official/archive', label: 'Archive', icon: FiArchive },
  { to: '/official/notifications', label: 'Notifications', icon: FiBell },
];

export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/admin/users', label: 'Manage Users', icon: FiUsers },
  { to: '/admin/roles', label: 'Roles & Permissions', icon: FiKey },
  { to: '/admin/chatbot', label: 'Chatbot Manager', icon: FiMessageSquare },
  { to: '/admin/hotlines', label: 'Hotlines', icon: FiPhoneCall },
  { to: '/admin/settings', label: 'System Settings', icon: FiSettings },
  { to: '/admin/backup', label: 'Backup & Restore', icon: FiDatabase },
  { to: '/admin/logs', label: 'Audit / System Logs', icon: FiClipboard },
  { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/admin/faq', label: 'FAQ Manager', icon: FiHelpCircle },
  { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
];

export const NAV_BY_ROLE = { resident: RESIDENT_NAV, official: OFFICIAL_NAV, admin: ADMIN_NAV };
export const ROLE_LABEL = { resident: 'Resident Portal', official: 'Official Portal', admin: 'Admin Console' };
export const ROLE_ICON = { resident: FiUser, official: FiShield, admin: FiShield };
