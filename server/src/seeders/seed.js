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

// Barangay Magdiwang, Noveleta, Cavite - approximate center used for the map seed data.
const CENTER = { lat: 14.4318, lng: 120.8852 };
const at = (dLat, dLng) => [CENTER.lng + dLng, CENTER.lat + dLat]; // GeoJSON [lng, lat]

// 911 and Red Cross 143 are national numbers. The local numbers are placeholders:
// the barangay must replace them with the verified numbers in Admin > Hotlines before go-live.
const HOTLINE_SEED = [
  { name: 'National Emergency Hotline', category: 'other', number: '911', availability: '24/7', order: 1 },
  { name: 'Barangay Magdiwang Emergency', category: 'barangay', number: '09XX-XXX-XXXX', availability: '24/7', order: 2 },
  { name: 'BFP Noveleta Fire Station', category: 'fire', number: '(046) XXX-XXXX', availability: '24/7', order: 3 },
  { name: 'PNP Noveleta', category: 'police', number: '(046) XXX-XXXX', availability: '24/7', order: 4 },
  { name: 'Noveleta Health Center', category: 'medical', number: '(046) XXX-XXXX', availability: '8AM - 5PM', order: 5 },
  { name: 'Noveleta MDRRMO Hotline', category: 'mdrrmo', number: '09XX-XXX-XXXX', availability: '24/7', order: 6 },
  { name: 'Red Cross Cavite', category: 'medical', number: '143', availability: '24/7', order: 7 },
];

// Decision tree for the menu-driven virtual assistant (English + Tagalog), shared with the startup migration.
const { CHATBOT_TREE: CHATBOT_SEED } = require('./chatbotTree');

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
      address: { barangay: 'Magdiwang', city: 'Noveleta', province: 'Cavite' },
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
      address: { barangay: 'Magdiwang', city: 'Noveleta', province: 'Cavite' },
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
      address: { purok: 'Purok 3', barangay: 'Magdiwang', city: 'Noveleta', province: 'Cavite' },
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
  let count = 0;
  const insertNodes = async (nodes, parent = null) => {
    for (const [i, { children, ...node }] of nodes.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const created = await Chatbot.create({ ...node, parent, order: i });
      count += 1;
      // eslint-disable-next-line no-await-in-loop
      if (children?.length) await insertNodes(children, created._id);
    }
  };
  await insertNodes(CHATBOT_SEED);
  console.log(`[Seed] ${count} chatbot nodes ready`);
};

const seedSettings = async (adminId) => {
  await Setting.findOneAndUpdate(
    { key: 'general' },
    {
      key: 'general',
      value: {
        barangayName: 'Barangay Magdiwang',
        address: 'Barangay Magdiwang, Noveleta, Cavite',
        phone: '09XX-XXX-XXXX',
        email: 'barangaymagdiwang@gmail.com',
        officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
        logoUrl: '',
        mapCenter: [CENTER.lat, CENTER.lng],
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
        documentTypes: ['barangay_clearance', 'certificate_of_indigency'],
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
        'CiviCare is now live for Barangay Magdiwang. Residents can report incidents, request barangay documents, join community events, and receive emergency alerts by SMS - all in one place. #CiviCare #BarangayMagdiwang',
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
      description: 'A barangay-wide earthquake and fire drill in partnership with the Noveleta MDRRMO. Free attendance certificates for all participants.',
      category: 'disaster_drill',
      location: 'Barangay Magdiwang Covered Court',
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
      name: "Medina's Compound Evacuation Center",
      description: "Evacuation center at Medina's Compound, Magdiwang Highway, Noveleta, Cavite.",
      geometry: { type: 'Point', coordinates: at(0, 0) },
      capacity: 500,
      contactPerson: 'Barangay Captain',
      createdBy: officialId,
    },
    {
      layer: 'health_center',
      name: 'Barangay Health Center',
      description: 'First aid, check-ups and medical missions.',
      geometry: { type: 'Point', coordinates: at(0.0012, 0.0015) },
      createdBy: officialId,
    },
    {
      layer: 'fire_station',
      name: 'BFP Noveleta Fire Station',
      geometry: { type: 'Point', coordinates: at(-0.002, 0.003) },
      createdBy: officialId,
    },
    {
      layer: 'police_station',
      name: 'PNP Noveleta',
      geometry: { type: 'Point', coordinates: at(-0.0025, 0.0005) },
      createdBy: officialId,
    },
    {
      layer: 'evacuation_route',
      name: "Evacuation route to Medina's Compound",
      geometry: { type: 'LineString', coordinates: [at(-0.003, -0.003), at(-0.0015, -0.0015), at(0, 0)] },
      createdBy: officialId,
    },
  ]);

  await Incident.findOneAndUpdate(
    { referenceCode: buildReferenceCode('INC', 1) },
    {
      referenceCode: buildReferenceCode('INC', 1),
      reportedBy: residentId,
      title: 'Flooding',
      description: 'The drainage canal along Purok 3 is clogged with debris, causing minor flooding after rain.',
      category: 'flood',
      severity: 'high',
      status: 'pending',
      location: { type: 'Point', coordinates: at(-0.003, -0.003), address: 'Purok 3, Barangay Magdiwang' },
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

  // Upserted accounts skip the pre-save hook, so give them Resident IDs the same way the server does on boot.
  await require('../services/bootstrap.service').backfillResidentIds();

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
