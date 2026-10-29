import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Receipt,
  Search,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import {
  bookingsByCustomer,
  decorateProvider,
  hasReviewForBooking,
  notificationsByUser,
  topRated,
  unreadCount,
} from '../utils/selectors';
import { CATEGORIES } from '../data/categories';
import { STATUS, canReview, isActiveBooking } from '../utils/booking';
import { formatDayShort, formatDate, formatPKR, formatTime, relativeTime } from '../utils/format';
import { cn } from '../utils/cn';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatusRail } from '../components/ui/Stepper';
import { CategoryTile } from '../components/cards/CategoryTile';
import { ProviderCard } from '../components/cards/ProviderCard';
import { StatCard } from '../components/cards/StatCard';
import { Reveal, Stagger, StaggerItem } from '../components/ui/Reveal';

// The customer landing screen: what is happening now, what needs a decision,
// and the fastest route back into the marketplace.
export default function CustomerDashboard() {
  const { state, currentUser } = useStore();

  const bookings = useMemo(
    () => (currentUser ? bookingsByCustomer(state, currentUser.id) : []),
    [state, currentUser]
  );

  const decorated = useMemo(
    () =>
      bookings.map((booking) => {
        const raw = state.providers.find((p) => p.id === booking.providerId);
        const provider = raw ? decorateProvider(state, raw) : null;
        const service = raw?.services?.find((s) => s.id === booking.serviceId) ?? null;
        return { booking, provider, service };
      }),
    [bookings, state]
  );

  const active = decorated.filter(({ booking }) => isActiveBooking(booking));
  const upcoming = [...active].sort((a, b) => a.booking.date.localeCompare(b.booking.date))[0] ?? null;
  const awaitingReview = decorated.filter(
    ({ booking }) => canReview(booking, hasReviewForBooking(state, booking.id))
  );
  const completed = bookings.filter((b) => b.status === STATUS.COMPLETED);
  const spend = completed.reduce((sum, b) => sum + (b.estimate ?? 0), 0);
  const myReviews = state.reviews.filter((r) => r.customerId === currentUser?.id);
  const alerts = useMemo(
    () => (currentUser ? notificationsByUser(state, currentUser.id).slice(0, 6) : []),
    [state, currentUser]
  );
  const unread = currentUser ? unreadCount(state, currentUser.id) : 0;

  const providerCounts = useMemo(() => {
    const map = {};
    state.providers
      .filter((p) => p.verificationStatus === 'verified')
      .forEach((p) => {
        map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
      });
    return map;
  }, [state.providers]);

  const suggestions = useMemo(() => topRated(state, 3), [state]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (!currentUser) return null;

  const showAttention = awaitingReview.length > 0 || active.some(({ booking }) => booking.status === STATUS.PENDING);

  return (
    <>
      {/* ---------------------------------------------------- next visit band */}
      <Reveal>
        <Card padding="none" className="relative mb-6 overflow-hidden">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(108_92_231_/_0.20),transparent_65%)] blur-2xl"
          />
          <span aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.18em] text-brand-500 uppercase dark:text-brand-300">
                {greeting}, {currentUser.name.split(' ')[0]}
              </p>
              <h1 className="mt-2.5 font-display text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-[34px]">
                {upcoming ? (
                  <>
                    {upcoming.provider?.name} is coming{' '}
                    <span className="grad-text">{formatDayShort(upcoming.booking.date)}</span>
                  </>
                ) : (
                  <>
                    Nothing booked. <span className="grad-text">Your next pro is one tap away.</span>
                  </>
                )}
              </h1>
              <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-content-muted">
                {upcoming
                  ? `${upcoming.service?.name ?? 'Your job'} at ${upcoming.booking.address}. Arrival window ${formatTime(
                      upcoming.booking.time
                    )}. The provider confirmed and the status updates here as they move.`
                  : 'Search by symptom, city or budget, pick a verified provider, and send a request. No payment is taken in this prototype.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Button to={upcoming ? `/booking/${upcoming.booking.id}` : '/browse'} icon={upcoming ? CalendarClock : Search}>
                  {upcoming ? `Open ${upcoming.booking.code}` : 'Find a service'}
                </Button>
                <Button variant="outline" to="/browse" icon={Compass}>
                  Browse categories
                </Button>
                {unread > 0 && (
                  <Button variant="ghost" to="/notifications" icon={Bell}>
                    {unread} unread
                  </Button>
                )}
              </div>
            </div>

            {upcoming ? (
              <div className="w-full shrink-0 rounded-xl border border-line bg-canvas-2/70 p-5 lg:w-80">
                <div className="flex items-center gap-3">
                  <Avatar name={upcoming.provider?.name ?? '?'} size="sm" ring />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold">{upcoming.provider?.name}</p>
                    <p className="truncate text-[12px] text-content-muted">
                      {upcoming.service?.name ?? 'Service'}
                    </p>
                  </div>
                  <StatusBadge status={upcoming.booking.status} size="sm" className="ml-auto" />
                </div>
                <StatusRail status={upcoming.booking.status} className="mt-4" />
                <div className="mt-4 space-y-2 text-[12.5px]">
                  <Line icon={MapPin} value={upcoming.booking.address} />
                  <Line icon={Clock} value={`${formatDayShort(upcoming.booking.date)} · ${formatTime(upcoming.booking.time)}`} />
                  <Line
                    icon={Wallet}
                    value={upcoming.booking.estimate ? `${formatPKR(upcoming.booking.estimate)} indicative` : 'Estimate on site'}
                  />
                </div>
                <Link
                  to={`/booking/${upcoming.booking.id}`}
                  className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 dark:text-brand-300"
                >
                  Cancel or change
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              <div className="w-full shrink-0 rounded-xl border border-dashed border-line-strong bg-canvas-2/50 p-5 lg:w-80">
                <p className="flex items-center gap-2 font-display text-[14.5px] font-bold">
                  <Sparkles className="h-4 w-4 text-aqua-500" aria-hidden="true" />
                  Try a real flow
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-content-muted">
                  Book a plumbing visit from Karachi PipeCare, then sign in as the provider to accept it — the status
                  changes for both sides instantly.
                </p>
                <Button size="sm" variant="secondary" className="mt-4" to="/provider/karachi-pipecare">
                  Open demo provider
                </Button>
              </div>
            )}
          </div>
        </Card>
      </Reveal>

      {/* ----------------------------------------------------------- numbers */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active bookings"
          value={active.length}
          icon={CalendarClock}
          hint={active.length ? `${active.length} request${active.length === 1 ? '' : 's'} in flight` : 'Nothing pending right now'}
        />
        <StatCard
          label="Completed jobs"
          value={completed.length}
          icon={CheckCircle2}
          tone="success"
          hint="Each one unlocks a review you can leave"
        />
        <StatCard
          label="Awaiting your review"
          value={awaitingReview.length}
          icon={Star}
          tone="amber"
          hint={awaitingReview.length ? 'Rate them to help the next customer' : 'All caught up'}
        />
        <StatCard
          label="Indicative spend"
          value={spend}
          icon={Receipt}
          tone="aqua"
          format={(n) => formatPKR(n)}
          hint="Sum of completed-job estimates, never charged"
        />
      </div>

      {/* ------------------------------------------------------- needs action */}
      {showAttention && (
        <Reveal className="mb-8">
          <Card padding="lg">
            <h2 className="mb-1 font-display text-[17px] font-bold tracking-[-0.02em]">Needs your attention</h2>
            <p className="mb-5 text-[13px] text-content-muted">
              Anything you must decide, in the order it will affect your week.
            </p>
            <ul className="divide-y divide-line">
              {decorated
                .filter(({ booking }) => booking.status === STATUS.PENDING)
                .map(({ booking, provider }) => (
                  <li key={booking.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-pending/15 text-[#8a6500] dark:text-glow-300">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold">
                        {provider?.name ?? 'A provider'} has not answered {booking.code} yet
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-content-muted">
                        Sent {relativeTime(booking.createdAt)} · you can still cancel free of charge
                      </p>
                    </div>
                    <Button size="sm" variant="quiet" to={`/booking/${booking.id}`}>
                      View
                    </Button>
                  </li>
                ))}
              {awaitingReview.map(({ booking, provider, service }) => (
                <li key={booking.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-glow-400/18 text-glow-700 dark:text-glow-300">
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold">
                      Rate {provider?.name ?? 'your recent provider'} for {service?.name ?? 'the job'}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-content-muted">
                      Completed {relativeTime(booking.updatedAt)} · one review per booking
                    </p>
                  </div>
                  <Button size="sm" variant="amber" to={`/booking/${booking.id}#review`}>
                    Write review
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      )}

      {/* --------------------------------------------------------- categories */}
      <Reveal className="mb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[19px] font-bold tracking-[-0.02em]">What broke today?</h2>
            <p className="mt-1 text-[13.5px] text-content-muted">
              Seven verified categories, priced in PKR, filtered by your city.
            </p>
          </div>
          <SectionLink to="/browse">Full directory</SectionLink>
        </div>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" as="ul">
          {CATEGORIES.map((category) => (
            <StaggerItem key={category.id} as="li" className="h-full">
              <CategoryTile category={category} count={providerCounts[category.id] ?? 0} dense />
            </StaggerItem>
          ))}
          <StaggerItem as="li" className="h-full">
            <Link
              to="/browse"
              className="group flex h-full flex-col justify-between rounded-xl border border-dashed border-line-strong bg-canvas-2/40 p-5 transition-[border-color,background-color] duration-300 hover:border-brand-500/60 hover:bg-brand-500/6"
            >
              <Search className="h-5 w-5 text-brand-500" aria-hidden="true" />
              <span className="mt-4">
                <span className="block font-display text-[16px] font-bold tracking-[-0.02em]">Describe the problem</span>
                <span className="mt-1 block text-[13px] leading-snug text-content-muted">
                  Type “water heater not heating” and search every listing at once.
                </span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 dark:text-brand-300">
                Free-text search
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </StaggerItem>
        </Stagger>
      </Reveal>

      {/* -------------------------------------------------------- two columns */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[19px] font-bold tracking-[-0.02em]">Highest rated near you</h2>
              <p className="mt-1 text-[13.5px] text-content-muted">
                Scores are recalculated from live reviews — including yours.
              </p>
            </div>
            <SectionLink to="/providers">See all providers</SectionLink>
          </div>
          <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" as="ul">
            {suggestions.map((provider) => (
              <StaggerItem key={provider.id} as="li" className="h-full">
                <ProviderCard provider={provider} compact />
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <aside className="space-y-5">
          <Card padding="lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Latest updates</h2>
              <Link
                to="/notifications"
                className="text-[12.5px] font-bold text-brand-600 dark:text-brand-300"
              >
                All
              </Link>
            </div>
            {alerts.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-content-muted">
                Status changes, provider replies and review confirmations will appear here.
              </p>
            ) : (
              <ol className="space-y-4">
                {alerts.map((n) => (
                  <li key={n.id} className="flex gap-3">
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.read ? 'bg-line-strong' : 'bg-brand-500 animate-pulse-ring'
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-content-muted">{n.message}</p>
                      <p className="mt-1 text-[11.5px] text-content-muted">{relativeTime(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card padding="lg" className="bg-canvas-2/60">
            <h2 className="mb-3 font-display text-[15.5px] font-bold tracking-[-0.02em]">Your activity</h2>
            <dl className="space-y-2.5 text-[13px]">
              <Stat label="Bookings sent" value={bookings.length} />
              <Stat label="Reviews written" value={myReviews.length} />
              <Stat label="Average rating given" value={avgRatingGiven(myReviews)} />
              <Stat
                label="Member since"
                value={currentUser.joinedAt ? formatDate(currentUser.joinedAt, { day: undefined, month: 'short', year: 'numeric' }) : '—'}
              />
            </dl>
            <Button variant="secondary" size="sm" className="mt-4" full icon={CalendarPlus} to="/browse">
              Book something else
            </Button>
          </Card>

          {bookings.length > 0 && (
            <Card padding="lg">
              <h2 className="mb-1 font-display text-[15.5px] font-bold tracking-[-0.02em]">Booking history</h2>
              <p className="mb-4 text-[12.5px] text-content-muted">Last five requests, newest first.</p>
              <ul className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <li key={booking.id}>
                    <Link
                      to={`/booking/${booking.id}`}
                      className="group flex items-center gap-3 rounded-sm border border-line px-3 py-2.5 transition-colors duration-300 hover:border-brand-500/50 hover:bg-brand-500/6"
                    >
                      <span className="font-display text-[12.5px] font-bold tabular-nums">{booking.code}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-content-muted">
                        {formatDayShort(booking.date)}
                      </span>
                      <StatusBadge status={booking.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function Line({ icon: Icon, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
      <p className="min-w-0 text-content-soft">{value}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-content-muted">{label}</dt>
      <dd className="font-display font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function SectionLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 dark:text-brand-300"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

function avgRatingGiven(reviews) {
  if (!reviews.length) return 'No reviews yet';
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return `${avg.toFixed(1)} / 5`;
}
