export const ROLES = { RESIDENT: 'resident', OFFICIAL: 'official', ADMIN: 'admin' };

// Ticket Status Tracker: Pending -> Ongoing -> Resolved ("assigned" is a legacy value shown as Ongoing).
export const INCIDENT_STATUS = { PENDING: 'pending', ONGOING: 'ongoing', RESOLVED: 'resolved' };
export const INCIDENT_STATUS_FLOW = ['pending', 'ongoing', 'resolved'];
export const INCIDENT_SEVERITY = { LOW: 'low', MODERATE: 'moderate', HIGH: 'high', CRITICAL: 'critical' };

// Priority buttons on the report screen map onto the stored severity values.
export const PRIORITY_OPTIONS = [
  { value: 'low', labelKey: 'priority.low', color: 'text-lime-400' },
  { value: 'moderate', labelKey: 'priority.medium', color: 'text-orange-400' },
  { value: 'high', labelKey: 'priority.high', color: 'text-red-500' },
];

export const INCIDENT_CATEGORY = [
  'fire',
  'electrical',
  'road_accident',
  'rescue',
  'flood',
  'medical',
  'crime',
  'dispute',
  'earthquake',
  'typhoon',
  'accident',
  'infrastructure',
  'other',
];

export const INCIDENT_CATEGORY_LABELS = {
  fire: 'Fire Hazard',
  electrical: 'Electrical Hazard',
  road_accident: 'Road Accident',
  rescue: 'Rescue',
  flood: 'Flooding',
  medical: 'Medical Emergency',
  crime: 'Criminal Incident',
  dispute: 'Interpersonal Dispute',
  earthquake: 'Earthquake',
  typhoon: 'Typhoon',
  accident: 'Accident',
  infrastructure: 'Infrastructure Damage',
  other: 'Others',
};

export const categoryLabel = (c) => INCIDENT_CATEGORY_LABELS[c] || c?.replace(/_/g, ' ');

// Documents offered on the Service Request screen (panel revision: Barangay Clearance and
// Certificate of Indigency only, both issued free of charge).
export const SERVICE_DOCUMENTS = [
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'certificate_of_indigency', label: 'Certificate of Indigency' },
];

// Labels for every type ever issued, so older requests still display correctly.
export const DOCUMENT_TYPES = [
  ...SERVICE_DOCUMENTS,
  { value: 'barangay_certificate', label: 'Barangay Certificate' },
  { value: 'certificate_of_residency', label: 'Certificate of Residency' },
  { value: 'business_clearance', label: 'Business Clearance' },
  { value: 'cedula', label: 'Cedula (Community Tax Certificate)' },
];

export const documentLabel = (type) => DOCUMENT_TYPES.find((d) => d.value === type)?.label || type?.replace(/_/g, ' ');

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  READY: 'ready_for_pickup',
  CLAIMED: 'claimed',
};

// Donation pledges: types offered on the pledge form and their tracking states.
export const DONATION_TYPES = ['cash', 'goods', 'food', 'medicine', 'clothes'];
export const DONATION_STATUS = { PLEDGED: 'pledged', RECEIVED: 'received', DISTRIBUTED: 'distributed' };
export const DONATION_TYPE_LABELS = { cash: 'Cash', goods: 'Goods', food: 'Food', medicine: 'Medicine', clothes: 'Clothes' };

/** What was donated, e.g. "Medicine — 10 boxes paracetamol" or "Cash — ₱500". */
export const donationDetails = (d) => {
  const what = d.type === 'cash' ? `₱${Number(d.amount || 0).toLocaleString()}` : d.quantity || '';
  return [DONATION_TYPE_LABELS[d.type] || d.type, what].filter(Boolean).join(' — ');
};

export const CIVIL_STATUS = ['single', 'married', 'widowed', 'separated', 'divorced'];
export const PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6'];


export const EVENT_STATUS = { UPCOMING: 'upcoming', ONGOING: 'ongoing', COMPLETED: 'completed', CANCELLED: 'cancelled' };

// Barangay Magdiwang, Noveleta, Cavite (overridable via Admin > Settings > general.mapCenter).
export const DEFAULT_MAP_CENTER = [14.4318, 120.8852];

// Leaflet pin colors on the officials' map: red Pending, yellow Ongoing, green Resolved.
export const INCIDENT_PIN_COLORS = { pending: '#dc2626', assigned: '#eab308', ongoing: '#eab308', resolved: '#16a34a' };

export const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  processing: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  assigned: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  ongoing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400',
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
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
  suspended: 'bg-red-600 text-white dark:bg-red-500/80',
  normal: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300',
  urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
};

export const SEVERITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  critical: 'bg-red-600 text-white dark:bg-red-500/80',
};

// Display labels that differ from the stored value.
export const STATUS_LABELS = {
  assigned: 'Ongoing',
  moderate: 'Medium',
  ready_for_pickup: 'Ready for pick-up',
};
