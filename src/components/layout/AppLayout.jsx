import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { DashboardShell } from './DashboardShell';
import { ProtectedRoute } from './ProtectedRoute';
import { PageTransition } from './PageTransition';

// Marketing / guest screens: top bar, content, full footer.
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}

// Signed-in screens share one shell so role areas feel like one product.
export function WorkspaceLayout({ roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <PageTransition>
            <DashboardShell>
              <Outlet />
            </DashboardShell>
          </PageTransition>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Screens that are signed-in but full-bleed (no dashboard rail).
export function FocusLayout({ roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </ProtectedRoute>
  );
}
