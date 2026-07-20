// Centralized enums so models, controllers, and validators never redefine the same lists.

const ROLES = Object.freeze({
  RESIDENT: 'resident',
  OFFICIAL: 'official',
  ADMIN: 'admin',
});

const INCIDENT_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  ONGOING: 'ongoing',
  RESOLVED: 'resolved',
});

const INCIDENT_SEVERITY = Object.freeze({
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
});

const INCIDENT_CATEGORY = Object.freeze({
  FIRE: 'fire',
  FLOOD: 'flood',
  EARTHQUAKE: 'earthquake',
  TYPHOON: 'typhoon',
  MEDICAL: 'medical',
  CRIME: 'crime',
  ACCIDENT: 'accident',
  INFRASTRUCTURE: 'infrastructure',
  OTHER: 'other',
});

const DOCUMENT_TYPE = Object.freeze({
  BARANGAY_CLEARANCE: 'barangay_clearance',
  RESIDENCY: 'certificate_of_residency',
  INDIGENCY: 'certificate_of_indigency',
  BUSINESS_CLEARANCE: 'business_clearance',
  CEDULA: 'cedula',
});

const DOCUMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  READY: 'ready_for_pickup',
  CLAIMED: 'claimed',
});

const DONATION_TYPE = Object.freeze({
  CASH: 'cash',
  GOODS: 'goods',
  MEDICINE: 'medicine',
  FOOD: 'food',
  CLOTHES: 'clothes',
});

const DONATION_STATUS = Object.freeze({
  PLEDGED: 'pledged',
  RECEIVED: 'received',
  DISTRIBUTED: 'distributed',
});

const EVENT_STATUS = Object.freeze({
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const HAZARD_LAYER = Object.freeze({
  FLOOD: 'flood',
  FIRE: 'fire',
  DANGER_ZONE: 'danger_zone',
  ROAD_CLOSURE: 'road_closure',
  EVACUATION_CENTER: 'evacuation_center',
  SAFE_AREA: 'safe_area',
});

const NOTIFICATION_TYPE = Object.freeze({
  INCIDENT: 'incident',
  ANNOUNCEMENT: 'announcement',
  EVENT: 'event',
  DOCUMENT: 'document',
  DONATION: 'donation',
  SYSTEM: 'system',
  EMERGENCY: 'emergency',
});

const PERMISSIONS = Object.freeze({
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_INCIDENTS: 'manage_incidents',
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  MANAGE_EVENTS: 'manage_events',
  MANAGE_DONATIONS: 'manage_donations',
  MANAGE_DOCUMENTS: 'manage_documents',
  MANAGE_HAZARDS: 'manage_hazards',
  MANAGE_FEEDBACK: 'manage_feedback',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_CHATBOT: 'manage_chatbot',
  VIEW_REPORTS: 'view_reports',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  BROADCAST_SMS: 'broadcast_sms',
});

module.exports = {
  ROLES,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_CATEGORY,
  DOCUMENT_TYPE,
  DOCUMENT_STATUS,
  DONATION_TYPE,
  DONATION_STATUS,
  EVENT_STATUS,
  HAZARD_LAYER,
  NOTIFICATION_TYPE,
  PERMISSIONS,
};
