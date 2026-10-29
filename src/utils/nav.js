import {
  LayoutDashboard,
  CalendarDays,
  Inbox,
  ClipboardList,
  Briefcase,
  Clock,
  IdCard,
  Users,
  ShieldCheck,
  Layers,
  ChartColumn,
  MessageSquare,
  Search,
  House,
  Bell,
  Star,
} from 'lucide-react';

// One place decides what each role can navigate to; the top bar, the dashboard
// rail and the mobile menu all read from here so they can never disagree.
export const NAV_BY_ROLE = {
  guest: [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/browse', label: 'Find a service', icon: Search },
    { to: '/providers', label: 'All providers', icon: Users },
    { to: '/how-it-works', label: 'How it works', icon: IdCard },
  ],
  customer: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/bookings', label: 'My bookings', icon: CalendarDays },
    { to: '/app/reviews', label: 'My reviews', icon: Star },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/browse', label: 'Find a service', icon: Search },
    { to: '/app/profile', label: 'Profile', icon: IdCard },
  ],
  provider: [
    { to: '/partner', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/partner/requests', label: 'Requests', icon: Inbox },
    { to: '/partner/jobs', label: 'Active jobs', icon: ClipboardList },
    { to: '/partner/services', label: 'Services & prices', icon: Briefcase },
    { to: '/partner/availability', label: 'Availability', icon: Clock },
    { to: '/partner/profile', label: 'Public profile', icon: IdCard },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/verification', label: 'Verification', icon: ShieldCheck },
    { to: '/admin/categories', label: 'Categories', icon: Layers },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
    { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
    { to: '/admin/reports', label: 'Reports', icon: ChartColumn },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ],
};

export const DASHBOARD_PATH = {
  guest: '/',
  customer: '/app',
  provider: '/partner',
  admin: '/admin',
};

export function navFor(role) {
  return NAV_BY_ROLE[role] ?? NAV_BY_ROLE.guest;
}

// Routes that only exist once you are signed in.
export function isDashboardRoute(pathname) {
  return ['/app', '/partner', '/admin'].some((base) => pathname === base || pathname.startsWith(`${base}/`));
}
