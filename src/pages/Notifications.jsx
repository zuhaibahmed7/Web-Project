import { useMemo, useState } from 'react';
import { BellOff, CheckCheck, Inbox } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { notificationsByUser, unreadCount } from '../utils/selectors';
import { toISODate } from '../utils/date';
import { formatDate } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { NotificationRow } from '../components/layout/NotificationBell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Segmented } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/ui/Reveal';
import { useToast } from '../components/ui/Toast';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

// Shared by customer, provider and admin accounts: nothing here assumes a role,
// it only reads currentUser.id (FR-N-03).
export default function Notifications() {
  const { state, currentUser, markNotificationRead, markAllNotificationsRead } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('all');

  const mine = useMemo(() => notificationsByUser(state, currentUser.id), [state, currentUser.id]);
  const unread = unreadCount(state, currentUser.id);
  const shown = tab === 'unread' ? mine.filter((n) => !n.read) : mine;
  const groups = groupByDay(shown);

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description={
          mine.length
            ? `${mine.length} message${mine.length === 1 ? '' : 's'} on this account · ${unread} unread. Booking status changes, reviews and admin decisions land here as they happen.`
            : 'Booking status changes, reviews and admin decisions will appear here as they happen.'
        }
        actions={
          <>
            <Segmented options={TABS} value={tab} onChange={setTab} ariaLabel="Filter notifications by read state" />
            <Button
              variant="secondary"
              icon={CheckCheck}
              disabled={unread === 0}
              onClick={() => {
                markAllNotificationsRead(currentUser.id);
                toast.success(`${unread} notification${unread === 1 ? '' : 's'} marked as read.`, {
                  title: 'Inbox cleared',
                });
              }}
            >
              Mark all as read{unread > 0 ? ` (${unread})` : ''}
            </Button>
          </>
        }
      />

      {shown.length === 0 ? (
        // SC-16: no blank pages — each empty case explains itself and offers an exit.
        <EmptyState
          icon={tab === 'unread' ? BellOff : Inbox}
          title={tab === 'unread' ? 'Nothing left unread' : 'No notifications yet'}
          description={
            tab === 'unread'
              ? 'You are caught up. New messages will show up as soon as you switch back to All.'
              : 'This account has not been involved in a booking, review or verification decision yet. Send a request and the trail starts here.'
          }
          action={
            tab === 'unread' ? (
              <Button variant="secondary" onClick={() => setTab('all')}>
                Show all notifications
              </Button>
            ) : (
              <Button to="/browse">Find a service</Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group, gi) => (
            <Reveal key={group.key} delay={gi * 0.05}>
              <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-line px-4 py-3 sm:px-5">
                  <h2 className="font-display text-[11px] font-bold tracking-[0.16em] text-content-muted uppercase">
                    {group.label}
                    <span className="ml-2 tabular-nums text-content-soft">{group.items.length}</span>
                  </h2>
                  <p className="text-[11.5px] text-content-muted">{group.subline}</p>
                </div>
                <ul className="flex flex-col gap-1 p-2 sm:p-3">
                  {group.items.map((n) => (
                    <li key={n.id}>
                      <NotificationRow notification={n} onRead={markNotificationRead} />
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      <p className="mt-6 text-[12.5px] leading-relaxed text-content-muted">
        Opening a message marks it read; booking messages also link straight to that booking. Everything is stored in
        this browser only and disappears when the demo data is reset (DR-09).
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ grouping */

// Buckets by calendar day in the viewer's timezone, newest bucket first.
function groupByDay(items) {
  const today = toISODate();
  const yesterday = toISODate(new Date(Date.now() - 86_400_000));
  const buckets = new Map();

  items.forEach((n) => {
    const stamp = new Date(n.createdAt);
    if (Number.isNaN(stamp.getTime())) return;
    const day = toISODate(stamp);
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day).push(n);
  });

  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, list]) => ({
      key: day,
      items: list,
      label: day === today ? 'Today' : day === yesterday ? 'Yesterday' : formatDate(day, { weekday: 'long' }),
      subline:
        day === today
          ? `${list.length} today`
          : day === yesterday
            ? 'The day before'
            : formatDate(day, { day: 'numeric', month: 'short', year: 'numeric' }),
    }));
}
