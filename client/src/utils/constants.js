export const ROLES = { RESIDENT: 'resident', OFFICIAL: 'official', ADMIN: 'admin' };

export const INCIDENT_STATUS = { PENDING: 'pending', ASSIGNED: 'assigned', ONGOING: 'ongoing', RESOLVED: 'resolved' };
export const INCIDENT_SEVERITY = { LOW: 'low', MODERATE: 'moderate', HIGH: 'high', CRITICAL: 'critical' };
export const INCIDENT_CATEGORY = [
  'fire',
  'flood',
  'earthquake',
  'typhoon',
  'medical',
  'crime',
  'accident',
  'infrastructure',
  'other',
];

export const DOCUMENT_TYPES = [
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'certificate_of_residency', label: 'Certificate of Residency' },
  { value: 'certificate_of_indigency', label: 'Certificate of Indigency' },
  { value: 'business_clearance', label: 'Business Clearance' },
  { value: 'cedula', label: 'Cedula (Community Tax Certificate)' },
];

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  READY: 'ready_for_pickup',
  CLAIMED: 'claimed',
};

export const DONATION_TYPES = ['cash', 'goods', 'medicine', 'food', 'clothes'];
export const DONATION_STATUS = { PLEDGED: 'pledged', RECEIVED: 'received', DISTRIBUTED: 'distributed' };

export const EVENT_STATUS = { UPCOMING: 'upcoming', ONGOING: 'ongoing', COMPLETED: 'completed', CANCELLED: 'cancelled' };

export const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  ongoing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  ready_for_pickup: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  claimed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  pledged: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  distributed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  new: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  reviewed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
};

export const SEVERITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};
