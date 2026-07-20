import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import PageLoader from './components/common/PageLoader';

// Public
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Services = lazy(() => import('./pages/public/Services'));
const AnnouncementsList = lazy(() => import('./pages/public/AnnouncementsList'));
const AnnouncementDetail = lazy(() => import('./pages/public/AnnouncementDetail'));
const EventsList = lazy(() => import('./pages/public/EventsList'));
const EventDetail = lazy(() => import('./pages/public/EventDetail'));
const EmergencyHub = lazy(() => import('./pages/public/EmergencyHub'));
const HazardMapPage = lazy(() => import('./pages/public/HazardMapPage'));
const Donation = lazy(() => import('./pages/public/Donation'));
const Contact = lazy(() => import('./pages/public/Contact'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const VerifyDocumentPage = lazy(() => import('./pages/public/VerifyDocumentPage'));
const NotFound = lazy(() => import('./pages/public/NotFound'));
const Unauthorized = lazy(() => import('./pages/public/Unauthorized'));

// Auth
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

// Resident
const ResidentDashboard = lazy(() => import('./pages/resident/Dashboard'));
const ResidentProfile = lazy(() => import('./pages/resident/Profile'));
const ResidentIncidents = lazy(() => import('./pages/resident/Incidents'));
const ResidentIncidentDetail = lazy(() => import('./pages/resident/IncidentDetail'));
const ResidentDocuments = lazy(() => import('./pages/resident/Documents'));
const ResidentDocumentDetail = lazy(() => import('./pages/resident/DocumentDetail'));
const ResidentEvents = lazy(() => import('./pages/resident/Events'));
const ResidentDonations = lazy(() => import('./pages/resident/Donations'));
const ResidentFeedback = lazy(() => import('./pages/resident/Feedback'));

// Official
const OfficialDashboard = lazy(() => import('./pages/official/Dashboard'));
const OfficialResidents = lazy(() => import('./pages/official/Residents'));
const OfficialIncidents = lazy(() => import('./pages/official/Incidents'));
const OfficialIncidentDetail = lazy(() => import('./pages/official/IncidentDetail'));
const OfficialAnnouncements = lazy(() => import('./pages/official/Announcements'));
const OfficialEvents = lazy(() => import('./pages/official/Events'));
const OfficialEventParticipants = lazy(() => import('./pages/official/EventParticipants'));
const OfficialDonations = lazy(() => import('./pages/official/Donations'));
const OfficialDocuments = lazy(() => import('./pages/official/Documents'));
const OfficialHazards = lazy(() => import('./pages/official/Hazards'));
const OfficialFeedback = lazy(() => import('./pages/official/Feedback'));
const OfficialBroadcast = lazy(() => import('./pages/official/Broadcast'));
const OfficialReports = lazy(() => import('./pages/official/Reports'));
const OfficialArchive = lazy(() => import('./pages/official/Archive'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminRoles = lazy(() => import('./pages/admin/Roles'));
const AdminChatbot = lazy(() => import('./pages/admin/Chatbot'));
const AdminHotlines = lazy(() => import('./pages/admin/Hotlines'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminBackup = lazy(() => import('./pages/admin/Backup'));
const AdminLogs = lazy(() => import('./pages/admin/Logs'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminFaq = lazy(() => import('./pages/admin/Faq'));

// Shared
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white' }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/announcements" element={<AnnouncementsList />} />
            <Route path="/announcements/:id" element={<AnnouncementDetail />} />
            <Route path="/events" element={<EventsList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/emergency-hub" element={<EmergencyHub />} />
            <Route path="/hazard-map" element={<HazardMapPage />} />
            <Route path="/donation" element={<Donation />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/verify-document/:referenceCode" element={<VerifyDocumentPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Resident dashboard */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute roles={['resident']} />}>
              <Route path="/resident" element={<DashboardLayout />}>
                <Route index element={<ResidentDashboard />} />
                <Route path="profile" element={<ResidentProfile />} />
                <Route path="incidents" element={<ResidentIncidents />} />
                <Route path="incidents/:id" element={<ResidentIncidentDetail />} />
                <Route path="documents" element={<ResidentDocuments />} />
                <Route path="documents/:id" element={<ResidentDocumentDetail />} />
                <Route path="events" element={<ResidentEvents />} />
                <Route path="donations" element={<ResidentDonations />} />
                <Route path="emergency-hub" element={<EmergencyHub />} />
                <Route path="feedback" element={<ResidentFeedback />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Official dashboard */}
            <Route element={<RoleRoute roles={['official', 'admin']} />}>
              <Route path="/official" element={<DashboardLayout />}>
                <Route index element={<OfficialDashboard />} />
                <Route path="residents" element={<OfficialResidents />} />
                <Route path="incidents" element={<OfficialIncidents />} />
                <Route path="incidents/:id" element={<OfficialIncidentDetail />} />
                <Route path="announcements" element={<OfficialAnnouncements />} />
                <Route path="events" element={<OfficialEvents />} />
                <Route path="events/:id/participants" element={<OfficialEventParticipants />} />
                <Route path="donations" element={<OfficialDonations />} />
                <Route path="documents" element={<OfficialDocuments />} />
                <Route path="hazards" element={<OfficialHazards />} />
                <Route path="feedback" element={<OfficialFeedback />} />
                <Route path="broadcast" element={<OfficialBroadcast />} />
                <Route path="reports" element={<OfficialReports />} />
                <Route path="archive" element={<OfficialArchive />} />
                <Route path="profile" element={<ResidentProfile />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Admin console */}
            <Route element={<RoleRoute roles={['admin']} />}>
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="chatbot" element={<AdminChatbot />} />
                <Route path="hotlines" element={<AdminHotlines />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="backup" element={<AdminBackup />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="faq" element={<AdminFaq />} />
                <Route path="profile" element={<ResidentProfile />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
