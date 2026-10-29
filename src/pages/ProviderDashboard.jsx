import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  ClipboardList,
  Briefcase,
  Clock,
  IdCard,
  Bell,
  ArrowUpRight,
  CalendarClock,
  CircleCheckBig,
  HandCoins,
  ShieldCheck,
  Star,
  TriangleAlert,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { bookingsByProvider, decorateProvider, findUser, reviewsFor } from '../utils/selectors';
import { ACTION_META, STATUS, allowedActions } from '../utils/booking';
import { formatDate, formatDayShort, formatPKR, formatTime, relativeTime } from '../utils/format';
import { isoFromToday, todayISO } from '../utils/date';
import { minLength, required } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge, StatusBadge, VerificationBadge } from '../components/ui/Badge';
import { Button, LinkButton } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { Rating } from '../components/ui/Rating';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import { ReviewCard } from '../components/cards/ReviewCard';
import { StatCard } from '../components/cards/StatCard';
import { Reveal } from '../components/ui/Reveal';

const SHORTCUTS = [
  { to: '/partner/requests', label: 'Requests', hint: 'Decide on new bookings', icon: Inbox },
  { to: '/partner/jobs', label: 'Active jobs', hint: 'Start and finish work', icon: ClipboardList },
  { to: '/partner/services', label: 'Services & prices', hint: 'What customers can book', icon: Briefcase },
  { to: '/partner/availability', label: 'Availability', hint: 'Working days and slots', icon: Clock },
  { to: '/partner/profile', label: 'Public profile', hint: 'How customers see you', icon: IdCard },
  { to: '/notifications', label: 'Notifications', hint: 'Every update on your jobs', icon: Bell },
];

// Revenue counts completed bookings whose job date falls in the current month.
function inCurrentMonth(iso) {
  if (!iso) return false;
  const now = new Date();
  const d = new Date(`${iso}T00:00:00`);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/* ---------------------------------------------------------------- requestDecision */

// Pending -> Accepted / Rejected only (BRL-04). Rejection needs a reason so the
// customer is told why. Shared shape for the dashboard and the request queue.
function useRequestDecision() {
  const { setBookingStatus } = useStore();
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const accept = (booking) => {
    // Never send a transition the reducer would silently drop (SC-09).
    if (!allowedActions(booking, 'provider').includes(STATUS.ACCEPTED)) return;
    setBookingStatus(booking.id, STATUS.ACCEPTED, 'provider');
    toast.success(`${booking.code} accepted — the customer has been notified.`, { title: 'Request accepted' });
  };

  const openReject = (booking) => {
    setTarget(booking);
    setReason('');
    setError('');
  };

  const closeReject = () => {
    setTarget(null);
    setReason('');
    setError('');
  };

  const confirmReject = () => {
    const message = required(reason, 'A reason') || minLength(reason, 8, 'The reason');
    if (message) {
      setError(message);
      return;
    }
    setBookingStatus(target.id, STATUS.REJECTED, 'provider', reason.trim());
    toast.info(`${target.code} rejected with your reason attached.`, { title: 'Request rejected' });
    closeReject();
  };

  return { target, reason, error, accept, openReject, closeReject, setReason, confirmReject };
}

function RejectDialog({ decision }) {
  return (
    <Modal
      open={Boolean(decision.target)}
      onClose={decision.closeReject}
      title={`Reject request ${decision.target?.code ?? ''}`}
      description="The customer sees this reason, and the request cannot be reopened."
      footer={
        <>
          <Button variant="outline" onClick={decision.closeReject}>
            Keep as pending
          </Button>
          <Button variant="danger" onClick={decision.confirmReject}>
            Reject request
          </Button>
        </>
      }
    >
      <Textarea
        id="reject-reason"
        label="Reason for rejecting"
        required
        rows={4}
        maxLength={280}
        showCount
        value={decision.reason}
        onChange={(e) => decision.setReason(e.target.value)}
        error={decision.error}
        placeholder="e.g. Fully booked for wiring projects until next week."
      />
    </Modal>
  );
}

/* ------------------------------------------------------------------ page */

export default function ProviderDashboard() {
  const { state, currentProvider, currentUser } = useStore();

  // Hooks first; the "business profile missing" case is handled during render so
  // the screen never crashes (SC-14).
  const provider = useMemo(
    () => (currentProvider ? decorateProvider(state, currentProvider) : null),
    [state, currentProvider]
  );

  const mine = useMemo(() => (provider ? bookingsByProvider(state, provider.id) : []), [state, provider]);

  const requests = useMemo(
    () => mine.filter((b) => b.status === STATUS.PENDING).sort((a, b) => a.date.localeCompare(b.date)),
    [mine]
  );
  const active = useMemo(
    () =>
      mine
        .filter((b) => b.status === STATUS.ACCEPTED || b.status === STATUS.IN_PROGRESS)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [mine]
  );
  const upcoming = useMemo(
    () =>
      [...requests, ...active]
        .filter((b) => b.date >= todayISO() && b.date <= isoFromToday(7))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 5),
    [requests, active]
  );

  const revenue = useMemo(
    () =>
      mine
        .filter((b) => b.status === STATUS.COMPLETED && inCurrentMonth(b.date))
        .reduce((sum, b) => sum + (b.estimate ?? 0), 0),
    [mine]
  );

  const reviews = useMemo(() => (provider ? reviewsFor(state, provider.id).slice(0, 3) : []), [state, provider]);

  const decision = useRequestDecision();

  if (!currentUser) return null;

  if (!provider) {
    return (
      <>
        <PageHeader eyebrow="Business hub" title="Provider dashboard" />
        <EmptyState
          icon={IdCard}
          tone="dashed"
          title="No business profile linked to this account"
          description={`${currentUser.name} is signed in as a service provider, but no provider record is attached to the account yet. Register again choosing "Service provider", or ask an administrator to link your business profile.`}
          action={<Button to="/login">Sign in with another account</Button>}
          secondaryAction={<Button variant="outline" to="/how-it-works">See how FixNow works</Button>}
        />
      </>
    );
  }

  const firstName = (currentUser.name ?? '').split(' ')[0] || 'there';
  const verified = provider.verificationStatus === 'verified';

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${firstName}`}
        title={provider.name}
        description={`${provider.tagline} · ${provider.city} · ${provider.category?.name ?? 'General services'}`}
        actions={
          <>
            <span className="rounded-full border border-line px-3 py-1.5">
              <VerificationBadge status={provider.verificationStatus} />
            </span>
            <Button variant="secondary" size="sm" to="/partner/profile">
              Edit profile
            </Button>
          </>
        }
      />

      {/* Unverified businesses are filtered out of public listings (publicProviders). */}
      {!verified && (
        <Reveal>
          <Card padding="sm" className="mb-6 border-glow-400/45 bg-glow-400/8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-glow-400/18 text-glow-700 dark:text-glow-300">
                <TriangleAlert className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-bold tracking-[-0.02em] text-content">
                  {provider.verificationStatus === 'pending'
                    ? 'Awaiting verification — your business is hidden from search'
                    : `Verification was declined — your business is hidden from search`}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-content-soft">
                  Only verified providers appear in the marketplace, so customers cannot find {provider.name} through
                  search yet. Requests made from a direct link still arrive normally. Keep your services, contact
                  details and availability complete while the FixNow team reviews your documents
                  {provider.verificationStatus === 'rejected' ? ', then ask them to reconsider.' : '.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="amber" to="/partner/profile">
                    Review my details
                  </Button>
                  <Button size="sm" variant="outline" to="/partner/services">
                    Add services
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      )}

      {/* ------------------------------------------------ headline numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Open requests"
          value={requests.length}
          icon={Inbox}
          tone="amber"
          hint={requests.length ? 'Waiting for your decision' : 'Nothing to decide right now'}
        />
        <StatCard label="Active jobs" value={active.length} icon={ClipboardList} tone="brand" hint="Accepted or in progress" />
        <StatCard
          label="Jobs completed"
          value={provider.completedBookings}
          icon={CircleCheckBig}
          tone="success"
          hint={`${provider.jobsCompleted.toLocaleString('en-PK')} lifetime jobs`}
        />
        <StatCard
          label="Average rating"
          value={provider.rating}
          icon={Star}
          tone="aqua"
          suffix={provider.reviewCount ? ' / 5' : ''}
          hint={provider.reviewCount ? `${provider.reviewCount} customer reviews` : 'No reviews yet'}
        />
        <StatCard
          label="Revenue this month"
          value={revenue}
          icon={HandCoins}
          tone="brand"
          format={formatPKR}
          hint="Estimates on bookings completed this month"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-8">
          {/* ------------------------------------------------ decisions needed */}
          <section aria-labelledby="dash-requests">
            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="dash-requests" className="font-display text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">
                  Requests needing a decision
                </h2>
                <p className="mt-1 text-[13px] text-content-muted">
                  Accept to confirm the slot, or reject with a short reason the customer will see.
                </p>
              </div>
              <LinkButton to="/partner/requests">Full request queue</LinkButton>
            </div>

            {requests.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                tone="dashed"
                title="Your request queue is clear"
                description="No pending bookings right now. New customer requests land here and in your notifications the moment they arrive."
                action={<Button to="/partner/services">Improve your service listing</Button>}
              />
            ) : (
              <ul className="space-y-3">
                {requests.slice(0, 4).map((booking) => (
                  <li key={booking.id}>
                    <Card padding="sm" className="transition-shadow duration-500 hover:shadow-lift">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Avatar name={findUser(state, booking.customerId)?.name ?? 'Customer'} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
                            <span className="truncate">
                              {findUser(state, booking.customerId)?.name ?? 'A customer'}
                            </span>
                            <StatusBadge status={booking.status} size="sm" showDot={false} />
                          </p>
                          <p className="mt-1 truncate text-[12.5px] text-content-muted">
                            {serviceNameFor(state, booking)} ·{' '}
                            {formatDate(booking.date, { weekday: 'short' })} at {formatTime(booking.time)} ·{' '}
                            {booking.estimate ? formatPKR(booking.estimate) : 'Estimate pending'} · asked{' '}
                            {relativeTime(booking.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {allowedActions(booking, 'provider').map((next) => (
                            <Button
                              key={next}
                              size="sm"
                              variant={ACTION_META[next].tone}
                              onClick={() =>
                                next === STATUS.ACCEPTED ? decision.accept(booking) : decision.openReject(booking)
                              }
                            >
                              {ACTION_META[next].label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ------------------------------------------------ scheduled work */}
          <section aria-labelledby="dash-upcoming">
            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="dash-upcoming" className="font-display text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">
                  Today and next jobs
                  {upcoming.length > 0 && <CountPill value={upcoming.length} />}
                </h2>
                <p className="mt-1 text-[13px] text-content-muted">Scheduled work in the next seven days, soonest first.</p>
              </div>
              <LinkButton to="/partner/jobs">Job board</LinkButton>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                tone="dashed"
                title="Nothing scheduled in the next 7 days"
                description="Open jobs appear here once you accept a request. Widen your availability if bookings are not coming through."
                action={
                  <Button variant="secondary" to="/partner/availability">
                    Edit availability
                  </Button>
                }
              />
            ) : (
              <Card padding="none" className="divide-y divide-line overflow-hidden">
                {upcoming.map((booking) => {
                  const customer = findUser(state, booking.customerId);
                  const isToday = booking.date === todayISO();
                  return (
                    <Link
                      key={booking.id}
                      to={`/booking/${booking.id}`}
                      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-canvas-2/70 sm:px-5"
                    >
                      <span className="w-16 shrink-0 text-center">
                        <span
                          className={`block font-display text-[13px] font-bold tracking-[-0.01em] ${
                            isToday ? 'text-brand-600 dark:text-brand-300' : 'text-content'
                          }`}
                        >
                          {isToday ? 'Today' : formatDayShort(booking.date).split(',')[0]}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] tabular-nums text-content-muted">
                          {formatTime(booking.time)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[14px] font-bold">{serviceNameFor(state, booking)}</span>
                          <StatusBadge status={booking.status} size="sm" showDot={false} />
                        </span>
                        <span className="mt-1 block truncate text-[12.5px] text-content-muted">
                          {customer?.name ?? 'Customer'} · {booking.address}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-right text-[13px] font-bold tabular-nums sm:block">
                        {booking.estimate ? formatPKR(booking.estimate) : '—'}
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-content-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-500" />
                    </Link>
                  );
                })}
              </Card>
            )}
          </section>

          {/* ------------------------------------------------ shortcuts */}
          <section aria-labelledby="dash-shortcuts">
            <h2 id="dash-shortcuts" className="mb-3.5 font-display text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">
              Manage your business
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SHORTCUTS.map(({ to, label, hint, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group glass grad-frame relative flex h-full items-start gap-3.5 overflow-hidden rounded-lg p-4 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-brand-500/12 text-brand-600 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105 dark:text-brand-300">
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold tracking-[-0.01em]">{label}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-content-muted">{hint}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ------------------------------------------------ side column */}
        <div className="min-w-0 space-y-6">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <Avatar name={provider.name} size="lg" ring verified={verified} />
              <div className="min-w-0">
                <p className="truncate font-display text-[16px] font-bold tracking-[-0.02em]">{provider.name}</p>
                <Rating value={provider.rating} count={provider.reviewCount} className="mt-1" />
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px]">
              <MiniStat label="Response time" value={`${provider.responseMins} min`} />
              <MiniStat label="Experience" value={`${provider.yearsExperience} yrs`} />
              <MiniStat label="Services live" value={`${provider.services?.length ?? 0}`} />
              <MiniStat label="Areas covered" value={`${provider.areas?.length ?? 0}`} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {(provider.badges ?? []).map((b) => (
                <Badge key={b} tone="brand" size="sm">
                  {b}
                </Badge>
              ))}
              {!provider.badges?.length && (
                <p className="text-[12.5px] text-content-muted">No badges yet — add them on your public profile.</p>
              )}
            </div>
            <LinkButton to="/partner/profile" className="mt-4">
              Open public profile editor
            </LinkButton>
          </Card>

          <Card padding="md">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[15.5px] font-bold tracking-[-0.02em]">Your availability</h2>
              <LinkButton to="/partner/availability" icon={ArrowUpRight}>
                Edit
              </LinkButton>
            </div>
            <p className="mt-1 text-[12.5px] text-content-muted">
              {provider.nextAvailable ? (
                <>
                  Next bookable day:{' '}
                  <span className="font-bold text-aqua-700 dark:text-aqua-300">
                    {formatDate(provider.nextAvailable, { weekday: 'short' })}
                  </span>
                </>
              ) : (
                'No working day selected — customers cannot pick a date.'
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(provider.availability?.days ?? []).map((d) => (
                <DayChip key={d} dow={d} />
              ))}
              {!provider.availability?.days?.length && (
                <Badge tone="danger" size="sm">
                  Closed all days
                </Badge>
              )}
            </div>
            <ul className="mt-3.5 space-y-1.5 text-[12.5px]">
              {(provider.availability?.slots ?? []).map((slot) => (
                <li key={`${slot.start}-${slot.end}`} className="flex items-center gap-2 text-content-soft">
                  <Clock className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                  {formatTime(slot.start)} – {formatTime(slot.end)}
                </li>
              ))}
              {!provider.availability?.slots?.length && <li className="text-content-muted">No time slots added.</li>}
            </ul>
          </Card>

          <div>
            <div className="mb-3.5 flex items-end justify-between gap-3">
              <h2 className="font-display text-[17px] font-bold tracking-[-0.02em]">Latest reviews</h2>
              <span className="text-[12.5px] text-content-muted">{provider.reviewCount} total</span>
            </div>
            {reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                tone="dashed"
                title="No reviews yet"
                description="Customers can review a job after you mark it Completed. Finish a booking to get your first rating."
              />
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RejectDialog decision={decision} />
    </>
  );
}

/* ---------------------------------------------------------------- helpers */

// Bookings store ids only, so the service name is resolved from the provider record.
function serviceNameFor(state, booking) {
  const provider = state.providers.find((p) => p.id === booking.providerId);
  return provider?.services?.find((s) => s.id === booking.serviceId)?.name ?? 'Service removed';
}

function CountPill({ value }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-brand-500/12 px-2 py-0.5 align-middle text-[12px] font-bold text-brand-600 ring-1 ring-brand-500/25 ring-inset dark:text-brand-300">
      {value}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <dt className="text-content-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-[14px] font-bold tracking-[-0.01em]">{value}</dd>
    </div>
  );
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DayChip({ dow }) {
  return (
    <span className="inline-flex h-7 min-w-9 items-center justify-center rounded-full border border-line bg-canvas-2 px-2 text-[11.5px] font-bold text-content-soft">
      {DOW_LABELS[dow]}
    </span>
  );
}
