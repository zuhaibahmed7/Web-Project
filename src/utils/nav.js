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
// `key` maps onto the public i18n dictionaries — entries without one stay
// English, because the signed-in workspace is out of the translation scope.
export const NAV_BY_ROLE = {
  guest: [
    { to: '/', label: 'Home', key: 'nav.home', icon: House, end: true },
    { to: '/browse', label: 'Find a service', key: 'nav.browse', icon: Search },
    { to: '/providers', label: 'All providers', key: 'nav.providers', icon: Users },
    { to: '/how-it-works', label: 'How it works', key: 'nav.how', icon: IdCard },
  ],
  customer: [
    { to: '/app', label: 'Dashboard', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/bookings', label: 'My bookings', key: 'nav.myBookings', icon: CalendarDays },
    { to: '/app/reviews', label: 'My reviews', key: 'nav.myReviews', icon: Star },
    { to: '/notifications', label: 'Notifications', key: 'nav.notifications', icon: Bell },
    { to: '/browse', label: 'Find a service', key: 'nav.browse', icon: Search },
    { to: '/app/profile', label: 'Profile', key: 'nav.profile', icon: IdCard },
  ],
  provider: [
    { to: '/partner', label: 'Dashboard', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/partner/requests', label: 'Requests', icon: Inbox },
    { to: '/partner/jobs', label: 'Active jobs', icon: ClipboardList },
    { to: '/partner/services', label: 'Services & prices', icon: Briefcase },
    { to: '/partner/availability', label: 'Availability', icon: Clock },
    { to: '/partner/profile', label: 'Public profile', icon: IdCard },
    { to: '/notifications', label: 'Notifications', key: 'nav.notifications', icon: Bell },
  ],
  admin: [
    { to: '/admin', label: 'Overview', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/verification', label: 'Verification', icon: ShieldCheck },
    { to: '/admin/categories', label: 'Categories', icon: Layers },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
    { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
    { to: '/admin/reports', label: 'Reports', icon: ChartColumn },
    { to: '/notifications', label: 'Notifications', key: 'nav.notifications', icon: Bell },
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
