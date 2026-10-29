import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { DASHBOARD_PATH } from '../../utils/nav';

// Route-level guard. In this prototype the store is the only authority on who is
// signed in, so a guarded screen is unreachable even if the URL is typed by hand
// (the SRS notes that hiding buttons in JS is not authorization).
export function ProtectedRoute({ roles, children }) {
  const { currentUser } = useStore();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    // Signed in, but as a different role: send them to their own dashboard
    // rather than an error page they cannot act on.
    return <Navigate to={DASHBOARD_PATH[currentUser.role]} replace />;
  }

  return children ?? <Outlet />;
}

// Guest-only screens: an already signed-in visitor is taken to their dashboard.
export function PublicOnlyRoute({ children }) {
  const { currentUser } = useStore();
  if (currentUser) return <Navigate to={DASHBOARD_PATH[currentUser.role]} replace />;
  return children;
}
