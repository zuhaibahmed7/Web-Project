import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, CalendarDays, Inbox, MessageSquare, IdCard, LogOut, RotateCcw, ChevronDown, Bell } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { DASHBOARD_PATH } from '../../utils/nav';
import { unreadCount } from '../../utils/selectors';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useDismiss } from '../../hooks/useDismiss';
import { useToast } from '../ui/Toast';

const ROLE_LABEL = {
  customer: 'Customer',
  provider: 'Service provider',
  admin: 'Administrator',
};

const MENU_SECONDARY = {
  customer: { to: '/app/bookings', label: 'My bookings', icon: CalendarDays },
  provider: { to: '/partner/requests', label: 'Requests', icon: Inbox },
  admin: { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
};

const MENU_PROFILE = {
  customer: '/app/profile',
  provider: '/partner/profile',
};

export function AccountMenu({ variant = 'bar' }) {
  const { currentUser, logout, resetDemoData, state } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const navigate = useNavigate();
  const toast = useToast();

  if (!currentUser) return null;

  const unread = unreadCount(state, currentUser.id);

  const items = [
    { to: DASHBOARD_PATH[currentUser.role], label: 'Dashboard', icon: LayoutDashboard },
    MENU_SECONDARY[currentUser.role],
    { to: '/notifications', label: 'Notifications', icon: Bell, hint: unread },
    ...(currentUser.role === 'admin' ? [] : [{ to: MENU_PROFILE[currentUser.role], label: 'Profile', icon: IdCard }]),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'group flex items-center gap-2 rounded-sm border border-line bg-surface-2 py-1.5 pr-2 pl-1.5',
          'transition-[border-color,background-color,transform] duration-300 hover:border-brand-500/40 active:scale-95',
          open && 'border-brand-500/50 bg-brand-500/8'
        )}
      >
        <Avatar name={currentUser.name} size="sm" />
        {variant === 'bar' && (
          <span className="hidden text-left sm:block">
            <span className="block max-w-32 truncate text-[13px] leading-tight font-semibold">
              {currentUser.name.split(' ')[0]}
            </span>
            <span className="block text-[11px] leading-tight text-content-muted">{ROLE_LABEL[currentUser.role]}</span>
          </span>
        )}
        <ChevronDown
          className={cn('h-4 w-4 text-content-muted transition-transform duration-300', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute right-0 z-150 mt-2 w-72 origin-top-right overflow-hidden rounded-xl shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Avatar name={currentUser.name} size="md" verified={currentUser.role === 'provider'} />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold">{currentUser.name}</p>
                <p className="truncate text-xs text-content-muted">{currentUser.email}</p>
              </div>
            </div>

            <div className="px-2 py-2">
              <Badge tone={currentUser.role === 'admin' ? 'brand' : 'aqua'} className="ml-2 mb-1">
                {ROLE_LABEL[currentUser.role]}
              </Badge>
              {items.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    navigate(item.to);
                  }}
                  className="flex w-full items-center gap-3 rounded-xs px-2.5 py-2.5 text-sm font-medium text-content-soft transition-colors hover:bg-canvas-2 hover:text-content"
                >
                  <item.icon className="h-4 w-4 text-content-muted" aria-hidden="true" />
                  {item.label}
                  {item.hint > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                      {item.hint}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-line p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  resetDemoData();
                  setOpen(false);
                  toast.info('Demo data restored to the sample marketplace.');
                }}
                className="flex w-full items-center gap-3 rounded-xs px-2.5 py-2.5 text-sm font-medium text-content-muted transition-colors hover:bg-canvas-2 hover:text-content"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset demo data
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  logout();
                  setOpen(false);
                  navigate('/');
                  toast.success('Signed out. Browse as a guest.');
                }}
                className="flex w-full items-center gap-3 rounded-xs px-2.5 py-2.5 text-sm font-semibold text-rejected transition-colors hover:bg-rejected/8"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
