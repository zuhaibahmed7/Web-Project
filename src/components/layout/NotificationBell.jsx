import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, CalendarDays, Star, ShieldCheck, MessageSquare, Sparkles, CheckCheck } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { notificationsByUser, unreadCount } from '../../utils/selectors';
import { relativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { useDismiss } from '../../hooks/useDismiss';

// Every notification kind gets its own icon and tint so the list scans at a glance.
const KIND_ICON = {
  booking: CalendarDays,
  review: Star,
  verification: ShieldCheck,
  complaint: MessageSquare,
  system: Sparkles,
};

const KIND_TINT = {
  booking: 'bg-brand-500/12 text-brand-600 dark:text-brand-300',
  review: 'bg-glow-400/15 text-glow-600 dark:text-glow-300',
  verification: 'bg-aqua-400/15 text-aqua-600 dark:text-aqua-300',
  complaint: 'bg-rejected/12 text-rejected',
  system: 'bg-canvas-2 text-content-soft',
};

// One row shape, used by the bell dropdown and the full notifications page.
export function NotificationRow({ notification, onRead, compact = false }) {
  const Icon = KIND_ICON[notification.kind] ?? Sparkles;
  const unread = !notification.read;
  const body = (
    <>
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xs transition-colors',
          KIND_TINT[notification.kind] ?? KIND_TINT.system
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn('truncate text-sm', unread ? 'font-semibold text-content' : 'font-medium text-content-soft')}>
            {notification.title}
          </span>
          <span className="ml-auto shrink-0 text-[11px] whitespace-nowrap text-content-muted">
            {relativeTime(notification.createdAt)}
          </span>
        </span>
        <span className={cn('mt-1 block text-[13px] leading-snug text-content-muted', compact && 'line-clamp-2')}>
          {notification.message}
        </span>
      </span>
      {unread && <span className="mt-1 h-2 w-2 shrink-0 self-start rounded-full bg-brand-500" aria-label="Unread" />}
    </>
  );

  const tone = cn(
    'flex w-full gap-3 rounded-sm p-3 text-left transition-colors',
    unread ? 'bg-brand-500/6 hover:bg-brand-500/10' : 'hover:bg-canvas-2'
  );

  if (notification.bookingId) {
    return (
      <Link to={`/booking/${notification.bookingId}`} onClick={() => onRead?.(notification.id)} className={tone}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onRead?.(notification.id)} className={tone}>
      {body}
    </button>
  );
}

export function NotificationList({ items, onRead, emptyTitle = 'No notifications yet', emptyDescription }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={Bell}
        title={emptyTitle}
        description={emptyDescription ?? 'Booking updates, reviews and admin messages appear here.'}
      />
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((n) => (
        <NotificationRow key={n.id} notification={n} onRead={onRead} />
      ))}
    </div>
  );
}

export function NotificationBell() {
  const { state, currentUser, markNotificationRead, markAllNotificationsRead } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  if (!currentUser) return null;

  const items = notificationsByUser(state, currentUser.id).slice(0, 6);
  const unread = unreadCount(state, currentUser.id);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className={cn(
          'relative grid h-10 w-10 place-items-center rounded-sm border border-line bg-surface-2 text-content-soft',
          'transition-[background-color,color,border-color,transform] duration-300 hover:border-brand-500/40 hover:text-content active:scale-95'
        )}
      >
        {unread > 0 ? <BellRing className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rejected px-1 text-[10px] font-bold text-white ring-2 ring-canvas">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute right-0 z-150 mt-2 w-[min(92vw,22rem)] origin-top-right overflow-hidden rounded-xl shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-display text-sm font-bold">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead(currentUser.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition-colors hover:text-aqua-600 dark:text-brand-300"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
              <NotificationList
                items={items}
                onRead={markNotificationRead}
                emptyTitle="Nothing new"
                emptyDescription="When a booking, review or verification changes you will see it here."
              />
            </div>

            <div className="border-t border-line p-2">
              <Button to="/notifications" variant="quiet" size="sm" full>
                View all notifications
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
