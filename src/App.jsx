import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, WorkspaceLayout, FocusLayout } from './components/layout/AppLayout';
import { PublicOnlyRoute } from './components/layout/ProtectedRoute';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Providers from './pages/Providers';
import ProviderProfile from './pages/ProviderProfile';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import CustomerDashboard from './pages/CustomerDashboard';
import MyBookings from './pages/MyBookings';
import MyReviews from './pages/MyReviews';
import MyComplaints from './pages/MyComplaints';
import CustomerProfile from './pages/CustomerProfile';

import BookingNew from './pages/BookingNew';
import BookingDetail from './pages/BookingDetail';
import Notifications from './pages/Notifications';

import ProviderDashboard from './pages/ProviderDashboard';
import ProviderRequests from './pages/ProviderRequests';
import ProviderJobs from './pages/ProviderJobs';
import ProviderServices from './pages/ProviderServices';
import ProviderAvailability from './pages/ProviderAvailability';
import ProviderProfileEdit from './pages/ProviderProfileEdit';

import AdminOverview from './pages/AdminOverview';
import AdminUsers from './pages/AdminUsers';
import AdminVerification from './pages/AdminVerification';
import AdminCategories from './pages/AdminCategories';
import AdminBookings from './pages/AdminBookings';
import AdminComplaints from './pages/AdminComplaints';
import AdminReports from './pages/AdminReports';

// The route table is the app's access map: each area declares the roles that may
// open it, and ProtectedRoute enforces it (not just the nav links).
export default function App() {
  return (
    <Routes>
      {/* ---------------- public ---------------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/provider/:slug" element={<ProviderProfile />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ---------------- shared signed-in screens ---------------- */}
      <Route element={<WorkspaceLayout />}>
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route element={<FocusLayout />}>
        <Route path="/booking/:id" element={<BookingDetail />} />
      </Route>

      {/* ---------------- customer ---------------- */}
      <Route element={<WorkspaceLayout roles={['customer']} />}>
        <Route path="/app" element={<CustomerDashboard />} />
        <Route path="/app/bookings" element={<MyBookings />} />
        <Route path="/app/reviews" element={<MyReviews />} />
        <Route path="/app/complaints" element={<MyComplaints />} />
        <Route path="/app/profile" element={<CustomerProfile />} />
      </Route>

      <Route element={<FocusLayout roles={['customer']} />}>
        <Route path="/book/:slug" element={<BookingNew />} />
      </Route>

      {/* ---------------- service provider ---------------- */}
      <Route element={<WorkspaceLayout roles={['provider']} />}>
        <Route path="/partner" element={<ProviderDashboard />} />
        <Route path="/partner/requests" element={<ProviderRequests />} />
        <Route path="/partner/jobs" element={<ProviderJobs />} />
        <Route path="/partner/services" element={<ProviderServices />} />
        <Route path="/partner/availability" element={<ProviderAvailability />} />
        <Route path="/partner/profile" element={<ProviderProfileEdit />} />
      </Route>

      {/* ---------------- administrator ---------------- */}
      <Route element={<WorkspaceLayout roles={['admin']} />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/verification" element={<AdminVerification />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>

      {/* Aliases so an old bookmark still lands somewhere sensible. */}
      <Route path="/customer" element={<Navigate to="/app" replace />} />
      <Route path="/provider" element={<Navigate to="/partner" replace />} />
    </Routes>
  );
}
