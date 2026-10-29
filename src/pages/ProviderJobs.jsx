import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CirclePlay,
  CircleCheckBig,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Wallet,
  User,
  ChevronDown,
  Star,
  IdCard,
  Briefcase,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { bookingsByProvider, findUser } from '../utils/selectors';
import { ACTION_META, STATUS, allowedActions } from '../utils/booking';
import { formatDate, formatPKR, formatTime } from '../utils/format';
import { todayISO } from '../utils/date';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { BookingStepper } from '../components/ui/Stepper';
import { Reveal } from '../components/ui/Reveal';

const byWhen = (a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);

// The work board. Every action here comes from allowedActions(booking,'provider')
// so the UI can never offer a transition the reducer would drop (SC-09).
export default function ProviderJobs() {
  const { state, currentProvider, currentUser, setBookingStatus } = useStore();
  const toast = useToast();
  const [completedOpen, setCompletedOpen] = useState(false);

  const mine = useMemo(
    () => (currentProvider ? bookingsByProvider(state, currentProvider.id) : []),
    [state, currentProvider]
  );

  const scheduled = useMemo(() => mine.filter((b) => b.status === STATUS.ACCEPTED).sort(byWhen), [mine]);
  const running = useMemo(() => mine.filter((b) => b.status === STATUS.IN_PROGRESS).sort(byWhen), [mine]);
  const completed = useMemo(
    () => mine.filter((b) => b.status === STATUS.COMPLETED).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [mine]
  );
  const completedValue = useMemo(
    () => completed.reduce((sum, b) => sum + (b.estimate ?? 0), 0),
    [completed]
  );

  if (!currentUser) return null;

  if (!currentProvider) {
    return (
      <>
        <PageHeader eyebrow="Business hub" title="Active jobs" />
        <EmptyState
          icon={IdCard}
          tone="dashed"
          title="No business profile linked to this account"
          description={`${currentUser.name} is signed in as a service provider, but no provider record is attached, so there are no jobs to run. Register as a service provider or ask an administrator to link your business.`}
          action={<Button to="/login">Sign in with another account</Button>}
        />
      </>
    );
  }

  const move = (booking, next) => {
    if (!allowedActions(booking, 'provider').includes(next)) return;
    setBookingStatus(booking.id, next, 'provider');
    if (next === STATUS.IN_PROGRESS) {
      toast.success(`${booking.code} is now In Progress. The customer can see work has started.`);
    } else {
      toast.success(`${booking.code} marked Completed. The customer can now leave a review.`);
    }
  };

  const nothingYet = scheduled.length === 0 && running.length === 0 && completed.length === 0;

  if (nothingYet) {
    return (
      <>
        <PageHeader
          eyebrow="Work board"
          title="Active jobs"
          description="Accepted and in-progress bookings live here. Move each job through the lifecycle as you work."
        />
        <EmptyState
          icon={ClipboardList}
          tone="dashed"
          title="No jobs on the board"
          description="Once you accept a request it moves here, and you can start and finish the work from this screen."
          action={<Button to="/partner/requests">Open the request queue</Button>}
          secondaryAction={
            <Button variant="outline" to="/partner/services">
              Add a service
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Work board"
        title="Active jobs"
        description="Start work when you arrive on site and mark the job completed when the customer signs off. Providers cannot cancel or reopen a booking — that stays with the customer and the FixNow team."
        actions={
          <Button variant="secondary" size="sm" to="/partner/requests">
            Request queue
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile label="Waiting to start" value={scheduled.length} icon={CalendarDays} tone="brand" />
        <SummaryTile label="Work in progress" value={running.length} icon={Clock} tone="amber" />
        <SummaryTile label="Completed value" value={formatPKR(completedValue)} icon={Wallet} tone="success" />
      </div>

      <div className="mt-8 space-y-8">
        <JobGroup
          title="Confirmed, waiting to start"
          hint="Accepted by you, visit not begun yet."
          bookings={scheduled}
          state={state}
          emptyIcon={CalendarDays}
          emptyTitle="No confirmed visits waiting"
          emptyDescription="Requests you accept move into this group with their address and time slot."
          onAction={move}
        />

        <JobGroup
          title="Work in progress"
          hint="On site right now — mark completed when the job is done."
          bookings={running}
          state={state}
          emptyIcon={CirclePlay}
          emptyTitle="Nothing currently on site"
          emptyDescription="Press Start work on a confirmed visit to begin its job."
          onAction={move}
          tone="amber"
        />

        {/* Completed jobs are read-only for providers: only the customer reviews (BRL-07). */}
        <section aria-labelledby="completed-jobs">
          <button
            type="button"
            onClick={() => setCompletedOpen((v) => !v)}
            aria-expanded={completedOpen}
            aria-controls="completed-jobs-panel"
            className="glass flex w-full items-center gap-3 rounded-lg px-5 py-4 text-left transition-colors hover:border-brand-500/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-completed/12 text-completed">
              <CircleCheckBig className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span id="completed-jobs" className="block font-display text-[15.5px] font-bold tracking-[-0.02em]">
                Recently completed
                <span className="ml-2 inline-flex items-center rounded-full bg-canvas-2 px-2 py-0.5 align-middle text-[12px] font-bold text-content-soft">
                  {completed.length}
                </span>
              </span>
              <span className="mt-0.5 block text-[12.5px] text-content-muted">
                Closed out by you. Only the customer can rate these jobs.
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-content-muted transition-transform duration-300 ${
                completedOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {completedOpen && (
            <div id="completed-jobs-panel" className="mt-3 space-y-4">
              {completed.length === 0 ? (
                <EmptyState
                  icon={Star}
                  tone="dashed"
                  title="No completed jobs yet"
                  description="Finish a job and it appears here, along with the total value delivered."
                />
              ) : (
                completed.map((booking) => (
                  <Reveal key={booking.id}>
                    <JobRow booking={booking} state={state} onAction={move} collapsible />
                  </Reveal>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ groups */

function JobGroup({ title, hint, bookings, state, emptyIcon, emptyTitle, emptyDescription, onAction, tone = 'brand' }) {
  return (
    <section aria-label={title}>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">{title}</h2>
          <p className="mt-1 text-[13px] text-content-muted">{hint}</p>
        </div>
        <span className="text-[12.5px] font-semibold text-content-muted">{bookings.length} job{bookings.length === 1 ? '' : 's'}</span>
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={emptyIcon} tone="dashed" title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking, i) => (
            <li key={booking.id}>
              <Reveal delay={Math.min(i, 5) * 0.05}>
                <JobRow booking={booking} state={state} onAction={onAction} tone={tone} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function JobRow({ booking, state, onAction, tone = 'brand', collapsible = false }) {
  const customer = findUser(state, booking.customerId);
  const provider = state.providers.find((p) => p.id === booking.providerId);
  const service = provider?.services?.find((s) => s.id === booking.serviceId);
  const actions = allowedActions(booking, 'provider');
  const overdue = booking.status === STATUS.ACCEPTED && booking.date < todayISO();
  const today = booking.date === todayISO();

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              to={`/booking/${booking.id}`}
              className="font-display text-[15px] font-bold tracking-[-0.02em] hover:text-brand-600"
            >
              {booking.code}
            </Link>
            <StatusBadge status={booking.status} size="sm" />
            {collapsible && (
              <span className="text-[12px] text-content-muted">closed {formatDate(booking.updatedAt.slice(0, 10))}</span>
            )}
            {!collapsible && (today || overdue) && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
                  overdue
                    ? 'bg-rejected/12 text-rejected ring-rejected/30'
                    : 'bg-brand-500/12 text-brand-600 ring-brand-500/28 dark:text-brand-300'
                }`}
              >
                {overdue ? 'Visit date passed' : 'Today'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Avatar name={customer?.name ?? 'Customer'} size="sm" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-[14px] font-bold">
                <User className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
                {customer?.name ?? 'Customer account removed'}
              </p>
              <p className="truncate text-[12.5px] text-content-muted">
                {service?.name ?? 'Service removed'}
                {service?.unit ? ` · ${formatPKR(service.price)} per ${service.unit}` : ''}
              </p>
            </div>
            {customer?.phone && (
              <a
                href={`tel:${customer.phone}`}
                aria-label={`Call ${customer.name} on ${customer.phone}`}
                className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-line px-3 text-[12.5px] font-bold text-content-soft transition-colors hover:border-brand-500/50 hover:text-brand-600 dark:hover:text-brand-300"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                Call
              </a>
            )}
          </div>

          <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
            <Detail icon={CalendarDays} label="Scheduled">
              {formatDate(booking.date, { weekday: 'long' })}
            </Detail>
            <Detail icon={Clock} label="Slot">
              {formatTime(booking.time)}
            </Detail>
            <Detail icon={MapPin} label="Address" className="sm:col-span-2">
              {booking.address} ({booking.city})
            </Detail>
            <Detail icon={Wallet} label="Indicative estimate">
              {booking.estimate ? formatPKR(booking.estimate) : 'Estimate pending'}
            </Detail>
          </dl>

          {booking.description && (
            <p className="line-clamp-3 rounded-sm border-l-2 border-brand-500/50 bg-brand-500/6 px-4 py-3 text-[13px] leading-relaxed text-content-soft">
              {booking.description}
            </p>
          )}
        </div>

        <div className="shrink-0 space-y-4 lg:w-64">
          <BookingStepper booking={booking} compact />

          {actions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {actions.map((next) => (
                <Button
                  key={next}
                  full
                  size="sm"
                  variant={ACTION_META[next].tone}
                  icon={next === STATUS.IN_PROGRESS ? CirclePlay : CircleCheckBig}
                  onClick={() => onAction(booking, next)}
                >
                  {ACTION_META[next].label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-line bg-canvas-2/60 px-4 py-3 text-[12.5px] leading-relaxed text-content-muted">
              {collapsible ? (
                <>
                  <span className="mb-1 block font-bold text-content">Awaiting customer review</span>
                  Reviews open automatically for the customer — providers cannot rate a job.{' '}
                  <Link to="/partner/services" className="font-semibold text-brand-600 dark:text-brand-300">
                    Adjust your prices
                  </Link>{' '}
                  if this one ran long.
                </>
              ) : (
                <>
                  <span className="mb-1 block font-bold text-content">Nothing to do here</span>
                  This stage is handled by the customer or the FixNow team.
                </>
              )}
            </div>
          )}

          {tone === 'amber' && !collapsible && (
            <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-content-muted">
              <Briefcase className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              Marking a job completed is final — double-check the work before you tap it.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function Detail({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">{label}</dt>
      <dd className="mt-1 flex items-start gap-1.5 text-content-soft">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
        <span>{children}</span>
      </dd>
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon, tone }) {
  const tones = {
    brand: 'bg-brand-500/12 text-brand-600 dark:text-brand-300',
    amber: 'bg-glow-400/16 text-glow-700 dark:text-glow-300',
    success: 'bg-completed/12 text-completed',
  };
  return (
    <Card padding="sm" className="flex items-center gap-3.5">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-sm ${tones[tone]}`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">{label}</span>
        <span className="mt-1 block font-display text-[18px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
          {value}
        </span>
      </span>
    </Card>
  );
}
