/**
 * Database seeder - populates a fresh MongoDB Atlas cluster with baseline
 * reference data (permissions, roles, hotlines, chatbot menu, settings) and
 * a handful of sample accounts/records so the app is demoable out of the box.
 *
 * Usage:
 *   npm run seed            seed the database
 *   npm run seed:destroy    wipe all seeded collections
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Hotline = require('../models/Hotline');
const Chatbot = require('../models/Chatbot');
const Setting = require('../models/Setting');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const Hazard = require('../models/Hazard');
const Incident = require('../models/Incident');

const { PERMISSIONS, ROLES } = require('../config/constants');
const { generateCode } = require('../services/qrcode.service');
const { buildReferenceCode } = require('../utils/referenceCode');

const PERMISSION_SEED = Object.entries(PERMISSIONS).map(([, key]) => ({
  key,
  label: key
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' '),
  group: key.split('_')[0],
}));

const HOTLINE_SEED = [
  { name: 'MDRRMO', category: 'mdrrmo', number: '(02) 8123-4567', availability: '24/7', order: 1 },
  { name: 'Barangay Emergency Hotline', category: 'barangay', number: '0917-000-0001', availability: '24/7', order: 2 },
  { name: 'PNP - Local Police Station', category: 'police', number: '117', alternateNumber: '(02) 8722-0650', order: 3 },
  { name: 'Bureau of Fire Protection', category: 'fire', number: '(02) 8426-0219', availability: '24/7', order: 4 },
  { name: 'Barangay Health Center', category: 'medical', number: '0917-000-0002', availability: '8AM - 5PM', order: 5 },
  { name: 'City General Hospital', category: 'hospital', number: '(02) 8711-9491', availability: '24/7', order: 6 },
  { name: 'Red Cross', category: 'medical', number: '143', availability: '24/7', order: 7 },
  { name: 'National Water District', category: 'utility', number: '(02) 8922-3120', order: 8 },
];

const CHATBOT_SEED = [
  {
    label: 'Barangay Clearance',
    response:
      'A Barangay Clearance can be requested through the Document Request section of your dashboard. Requirements: valid ID and proof of residency. Processing time is 1-2 business days.',
  },
  {
    label: 'Business Permit',
    response:
      'To apply for a Business Clearance, submit your request under Document Requests with your business name, address, and a valid ID. A physical inspection may be scheduled before approval.',
  },
  {
    label: 'Emergency Procedures',
    response:
      'In case of emergency, use the Emergency Hub to view hazard-specific guides (flood, fire, earthquake, typhoon), the nearest evacuation center, and one-tap hotline numbers.',
  },
  { label: 'Hotlines', response: 'You can find all emergency hotline numbers in the Emergency Hub > Hotline Directory.' },
  {
    label: 'Office Hours',
    response: 'The Barangay Hall is open Monday to Friday, 8:00 AM - 5:00 PM, except on public holidays.',
  },
  {
    label: 'Requirements',
    response:
      'Most document requests require: 1 valid government ID, proof of residency, and a stated purpose. Some documents (e.g. Business Clearance) require additional supporting documents.',
  },
  {
    label: 'Events',
    response: 'Browse and register for upcoming community events under the Events page. You can also view your join history and download certificates after attending.',
  },
  {
    label: 'Donation',
    response: 'You may pledge cash or in-kind donations (goods, medicine, food, clothes) through the Donation page. Track the status of your pledge anytime from your dashboard.',
  },
];

const seedPermissionsAndRoles = async () => {
  const permissions = await Permission.insertMany(PERMISSION_SEED, { ordered: false }).catch(() => Permission.find());
  const permissionDocs = permissions.length ? permissions : await Permission.find();

  await Role.findOneAndUpdate(
    { name: 'resident' },
    { name: 'resident', description: 'Default resident account', isSystemRole: true, permissions: [] },
    { upsert: true }
  );
  await Role.findOneAndUpdate(
    { name: 'official' },
    {
      name: 'official',
      description: 'Barangay official / staff account',
      isSystemRole: true,
      permissions: permissionDocs.filter((p) => p.key !== PERMISSIONS.MANAGE_SETTINGS).map((p) => p._id),
    },
    { upsert: true }
  );
  await Role.findOneAndUpdate(
    { name: 'admin' },
    {
      name: 'admin',
      description: 'System administrator - full access',
      isSystemRole: true,
      permissions: permissionDocs.map((p) => p._id),
    },
    { upsert: true }
  );

  console.log(`[Seed] ${permissionDocs.length} permissions, 3 system roles ready`);
};

const seedUsers = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@civicare.gov.ph';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  // findOneAndUpdate(..., { upsert: true }) does NOT run the User model's
  // pre('save') hook, so passwords must be hashed here manually (same cost
  // factor as the model) or seeded accounts end up with plaintext passwords.
  const hash = (plain) => bcrypt.hash(plain, 12);

  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      firstName: 'System',
      lastName: 'Administrator',
      email: adminEmail,
      password: await hash(adminPassword),
      role: ROLES.ADMIN,
      isVerified: true,
      qrCode: generateCode(),
      address: { barangay: 'Barangay San Isidro', city: 'Quezon City', province: 'Metro Manila' },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const official = await User.findOneAndUpdate(
    { email: 'captain@civicare.gov.ph' },
    {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'captain@civicare.gov.ph',
      password: await hash('Official@12345'),
      role: ROLES.OFFICIAL,
      position: 'Barangay Captain',
      isVerified: true,
      qrCode: generateCode(),
      address: { barangay: 'Barangay San Isidro', city: 'Quezon City', province: 'Metro Manila' },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const resident = await User.findOneAndUpdate(
    { email: 'resident@civicare.gov.ph' },
    {
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'resident@civicare.gov.ph',
      password: await hash('Resident@12345'),
      phone: '09171234567',
      role: ROLES.RESIDENT,
      isVerified: true,
      qrCode: generateCode(),
      address: { purok: 'Purok 3', barangay: 'Barangay San Isidro', city: 'Quezon City', province: 'Metro Manila' },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('[Seed] Sample accounts ready:');
  console.log(`  Admin:    ${adminEmail} / ${adminPassword}`);
  console.log('  Official: captain@civicare.gov.ph / Official@12345');
  console.log('  Resident: resident@civicare.gov.ph / Resident@12345');

  return { admin, official, resident };
};

const seedHotlines = async () => {
  await Hotline.deleteMany({});
  await Hotline.insertMany(HOTLINE_SEED);
  console.log(`[Seed] ${HOTLINE_SEED.length} hotlines ready`);
};

const seedChatbot = async () => {
  await Chatbot.deleteMany({});
  await Chatbot.insertMany(CHATBOT_SEED.map((item, i) => ({ ...item, order: i })));
  console.log(`[Seed] ${CHATBOT_SEED.length} chatbot topics ready`);
};

const seedSettings = async (adminId) => {
  await Setting.findOneAndUpdate(
    { key: 'general' },
    {
      key: 'general',
      value: {
        barangayName: 'Barangay San Isidro',
        address: '123 Rizal St., Quezon City, Metro Manila',
        officeHours: '8:00 AM - 5:00 PM, Monday to Friday',
        logoUrl: '',
        contactEmail: 'info@civicare.gov.ph',
        contactPhone: '(02) 8123-4567',
      },
      updatedBy: adminId,
    },
    { upsert: true }
  );

  await Setting.findOneAndUpdate(
    { key: 'categories' },
    {
      key: 'categories',
      value: {
        documentFees: {
          barangay_clearance: 50,
          certificate_of_residency: 30,
          certificate_of_indigency: 0,
          business_clearance: 100,
          cedula: 30,
        },
      },
      updatedBy: adminId,
    },
    { upsert: true }
  );

  console.log('[Seed] Default settings ready');
};

const seedAnnouncementsAndEvents = async (officialId) => {
  await Announcement.findOneAndUpdate(
    { title: 'Welcome to CiviCare!' },
    {
      title: 'Welcome to CiviCare!',
      content:
        'CiviCare is now live. Residents can report incidents, request documents, join community events, and stay updated on barangay news - all in one place.',
      category: 'general',
      isPinned: true,
      postedBy: officialId,
    },
    { upsert: true }
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 14);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 4);

  await Event.findOneAndUpdate(
    { title: 'Community Disaster Preparedness Drill' },
    {
      title: 'Community Disaster Preparedness Drill',
      description: 'A barangay-wide earthquake and fire drill in partnership with the MDRRMO. Free attendance certificates for all participants.',
      category: 'disaster_drill',
      location: 'Barangay Covered Court',
      startDate,
      endDate,
      capacity: 200,
      organizedBy: officialId,
    },
    { upsert: true }
  );

  console.log('[Seed] Sample announcement and event ready');
};

const seedHazardsAndIncident = async (officialId, residentId) => {
  await Hazard.deleteMany({});
  await Hazard.insertMany([
    {
      layer: 'evacuation_center',
      name: 'Barangay Covered Court (Evacuation Center)',
      description: 'Primary evacuation center with capacity for 500 individuals.',
      geometry: { type: 'Point', coordinates: [121.0437, 14.676] },
      capacity: 500,
      contactPerson: 'Juan Dela Cruz',
      contactNumber: '0917-000-0001',
      createdBy: officialId,
    },
    {
      layer: 'flood',
      name: 'Purok 3 Flood-Prone Area',
      description: 'Low-lying area prone to flooding during heavy rains.',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.041, 14.674],
            [121.043, 14.674],
            [121.043, 14.676],
            [121.041, 14.676],
            [121.041, 14.674],
          ],
        ],
      },
      severityLevel: 'high',
      createdBy: officialId,
    },
  ]);

  await Incident.findOneAndUpdate(
    { referenceCode: buildReferenceCode('INC', 1) },
    {
      referenceCode: buildReferenceCode('INC', 1),
      reportedBy: residentId,
      title: 'Clogged drainage causing flooding',
      description: 'The drainage canal along Purok 3 is clogged with debris, causing minor flooding after rain.',
      category: 'flood',
      severity: 'moderate',
      status: 'pending',
      location: { type: 'Point', coordinates: [121.042, 14.675], address: 'Purok 3, Barangay San Isidro' },
      statusHistory: [{ status: 'pending', updatedBy: residentId }],
    },
    { upsert: true }
  );

  console.log('[Seed] Sample hazards and incident ready');
};

const seed = async () => {
  await connectDB();

  await seedPermissionsAndRoles();
  const { admin, official, resident } = await seedUsers();
  await seedHotlines();
  await seedChatbot();
  await seedSettings(admin._id);
  await seedAnnouncementsAndEvents(official._id);
  await seedHazardsAndIncident(official._id, resident._id);

  console.log('[Seed] Database seeded successfully.');
  await mongoose.disconnect();
  process.exit(0);
};

const destroy = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Permission.deleteMany({}),
    Role.deleteMany({}),
    Hotline.deleteMany({}),
    Chatbot.deleteMany({}),
    Setting.deleteMany({}),
    Announcement.deleteMany({}),
    Event.deleteMany({}),
    Hazard.deleteMany({}),
    Incident.deleteMany({}),
  ]);
  console.log('[Seed] All seeded collections cleared.');
  await mongoose.disconnect();
  process.exit(0);
};

if (process.argv.includes('--destroy')) {
  destroy();
} else {
  seed();
}
