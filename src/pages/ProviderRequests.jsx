import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  CalendarDays,
  Clock,
  MapPin,
  Wallet,
  Phone,
  User,
  CircleCheckBig,
  CircleX,
  MessageSquareQuote,
  IdCard,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { bookingsByProvider, findUser } from '../utils/selectors';
import { ACTION_META, STATUS, allowedActions, statusLabel } from '../utils/booking';
import { formatDate, formatPKR, formatTime, relativeTime } from '../utils/format';
import { todayISO } from '../utils/date';
import { minLength, required } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { TiltCard } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Segmented, Textarea } from '../components/ui/Input';
import { Reveal } from '../components/ui/Reveal';

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'all', label: 'All requests' },
];

// Requests are the provider's inbound queue. Providers only ever respond to a
// request — creating a booking is a customer action (BRL-03).
export default function ProviderRequests() {
  const { state, currentProvider, currentUser, setBookingStatus } = useStore();
  const toast = useToast();
  const [filter, setFilter] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const all = useMemo(
    () =>
      currentProvider
        ? [...bookingsByProvider(state, currentProvider.id)].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          )
        : [],
    [state, currentProvider]
  );

  const pending = useMemo(() => all.filter((b) => b.status === STATUS.PENDING), [all]);
  const visible = filter === 'pending' ? pending : all;

  if (!currentUser) return null;

  if (!currentProvider) {
    return (
      <>
        <PageHeader eyebrow="Business hub" title="Requests" />
        <EmptyState
          icon={IdCard}
          tone="dashed"
          title="No business profile linked to this account"
          description={`${currentUser.name} is signed in as a service provider, but no provider record is attached, so there is no request queue to show. Register as a service provider or ask an administrator to link your business.`}
          action={<Button to="/login">Sign in with another account</Button>}
        />
      </>
    );
  }

  const accept = (booking) => {
    // Only offer transitions the reducer accepts for a provider (SC-09).
    if (!allowedActions(booking, 'provider').includes(STATUS.ACCEPTED)) return;
    setBookingStatus(booking.id, STATUS.ACCEPTED, 'provider');
    toast.success(`${booking.code} accepted. ${nameOf(state, booking)} has been notified.`, {
      title: 'Request accepted',
    });
  };

  const openReject = (booking) => {
    setRejectTarget(booking);
    setReason('');
    setReasonError('');
  };

  const closeReject = () => {
    setRejectTarget(null);
    setReason('');
    setReasonError('');
  };

  const confirmReject = () => {
    const message = required(reason, 'A reason') || minLength(reason, 8, 'The reason');
    if (message) {
      setReasonError(message);
      return;
    }
    setBookingStatus(rejectTarget.id, STATUS.REJECTED, 'provider', reason.trim());
    toast.info(`${rejectTarget.code} rejected with your reason attached.`, { title: 'Request rejected' });
    closeReject();
  };

  return (
    <>
      <PageHeader
        eyebrow="Decision queue"
        title="Requests"
        description={`${pending.length} request${pending.length === 1 ? '' : 's'} waiting for your answer. Accept to lock the slot, or reject with a reason the customer can read.`}
        actions={
          <Segmented
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            ariaLabel="Filter requests by status"
          />
        }
      />

      {/* A provider cannot create a booking — only respond (FR-BM rules). */}
      <p className="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-content-muted">
        <CircleCheckBig className="h-4 w-4 text-completed" aria-hidden="true" />
        Requests arrive automatically when a customer books you. You decide the outcome; nobody else can change it for
        you.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          tone="dashed"
          title={filter === 'pending' ? 'Nothing waiting for a decision' : 'No requests yet'}
          description={
            filter === 'pending'
              ? 'Every request has been answered. When a customer books one of your services it lands here instantly.'
              : `${currentProvider.name} has not received any booking requests yet. Add clear services and honest prices to make booking you easy.`
          }
          action={
            filter === 'all' ? (
              <Button to="/partner/services">Add a service</Button>
            ) : (
              <Button variant="secondary" to="/partner/jobs">
                See active jobs
              </Button>
            )
          }
          secondaryAction={
            <Link
              to="/partner/profile"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-aqua-600 dark:text-brand-300"
            >
              View public profile <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((booking, i) => (
            <RequestRow
              key={booking.id}
              booking={booking}
              index={i}
              state={state}
              onAccept={() => accept(booking)}
              onReject={() => openReject(booking)}
            />
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={closeReject}
        title={`Reject request ${rejectTarget?.code ?? ''}`}
        description="The customer sees this reason. Rejected requests are final and cannot be reopened."
        footer={
          <>
            <Button variant="outline" onClick={closeReject}>
              Keep as pending
            </Button>
            <Button variant="danger" icon={CircleX} onClick={confirmReject}>
              Reject request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {rejectTarget && (
            <div className="rounded-sm border border-line bg-canvas-2/60 px-4 py-3 text-[13px]">
              <p className="font-bold text-content">{nameOf(state, rejectTarget)}</p>
              <p className="mt-1 text-content-muted">
                {serviceOf(state, rejectTarget)} · {formatDate(rejectTarget.date, { weekday: 'short' })} at{' '}
                {formatTime(rejectTarget.time)}
              </p>
            </div>
          )}
          <Textarea
            id="reject-reason"
            label="Reason for rejecting"
            required
            rows={4}
            maxLength={280}
            showCount
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={reasonError}
            hint="Be specific — e.g. travel distance, already booked, or the job is outside your speciality."
            placeholder="Fully booked for wiring projects until next week."
          />
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ row */

function RequestRow({ booking, index, state, onAccept, onReject }) {
  const customer = findUser(state, booking.customerId);
  const service = serviceOf(state, booking);
  const decided = booking.status !== STATUS.PENDING;
  const actions = allowedActions(booking, 'provider');
  const recordedReason = booking.rejectReason || booking.cancelReason;

  return (
    <Reveal delay={Math.min(index, 6) * 0.05}>
      <TiltCard tilt={4} className="h-full" contentClassName="p-0">
        <div className="flex">
          <span className={`w-1 shrink-0 ${decided ? 'bg-cancelled' : 'bg-pending'}`} aria-hidden="true" />
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Link
                to={`/booking/${booking.id}`}
                className="font-display text-[15px] font-bold tracking-[-0.02em] hover:text-brand-600"
              >
                {booking.code}
              </Link>
              <StatusBadge status={booking.status} size="sm" />
              <span className="text-[12px] text-content-muted">
                requested {relativeTime(booking.createdAt)}
                {isPast(booking) ? ' · date already passed' : ''}
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[13.5px] font-bold tabular-nums">
                <Wallet className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                {booking.estimate ? formatPKR(booking.estimate) : 'Estimate pending'}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={customer?.name ?? 'Customer'} size="sm" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-[14px] font-bold">
                      <User className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
                      {customer?.name ?? 'Customer account removed'}
                    </p>
                    <p className="truncate text-[12.5px] text-content-muted">
                      {service} · {categoryNameFor(state, booking)}
                    </p>
                  </div>
                  {customer?.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-line px-3 text-[12.5px] font-bold text-content-soft transition-colors hover:border-brand-500/50 hover:text-brand-600 dark:hover:text-brand-300"
                      aria-label={`Call ${customer.name} on ${customer.phone}`}
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {customer.phone}
                    </a>
                  )}
                </div>

                <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
                  <Detail icon={CalendarDays} label="Preferred date">
                    {formatDate(booking.date, { weekday: 'long' })}
                  </Detail>
                  <Detail icon={Clock} label="Preferred time">
                    {formatTime(booking.time)}
                  </Detail>
                  <Detail icon={MapPin} label="Address" className="sm:col-span-2">
                    {booking.address} ({booking.city})
                  </Detail>
                </dl>

                {booking.description && (
                  <p className="rounded-sm border-l-2 border-brand-500/50 bg-brand-500/6 px-4 py-3 text-[13px] leading-relaxed text-content-soft">
                    <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">
                      <MessageSquareQuote className="h-3 w-3" aria-hidden="true" /> Customer note
                    </span>
                    {booking.description}
                  </p>
                )}

                {recordedReason && (
                  <p className="rounded-sm border border-line bg-canvas-2/70 px-4 py-3 text-[13px] leading-relaxed">
                    <span className="font-bold text-content">
                      {statusLabel(booking.status)} reason
                    </span>
                    <span className="mt-1 block text-content-muted">{recordedReason}</span>
                  </p>
                )}
              </div>

              <div className="shrink-0 lg:w-52">
                {!decided ? (
                  <div className="flex flex-col gap-2">
                    {actions.map((next) => (
                      <Button
                        key={next}
                        full
                        size="sm"
                        variant={ACTION_META[next].tone}
                        onClick={next === STATUS.ACCEPTED ? onAccept : onReject}
                      >
                        {ACTION_META[next].label}
                      </Button>
                    ))}
                    <p className="text-[11.5px] leading-snug text-content-muted">
                      Estimates are indicative. Confirm the final price on site.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-sm border border-line bg-canvas-2/60 px-4 py-3 text-[12.5px] leading-relaxed text-content-muted">
                    <span className="mb-1 block font-bold text-content">No action available</span>
                    {booking.status === STATUS.REJECTED
                      ? 'Rejected is final — the customer can send a fresh request.'
                      : booking.status === STATUS.CANCELLED
                        ? 'The customer cancelled this request.'
                        : 'This request was answered. Track the work under Active jobs.'}
                    <Link to={`/booking/${booking.id}`} className="mt-2 block font-semibold text-brand-600 dark:text-brand-300">
                      Open booking detail
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </Reveal>
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

/* ---------------------------------------------------------------- helpers */

function isPast(booking) {
  return booking.date < todayISO();
}

function nameOf(state, booking) {
  return findUser(state, booking.customerId)?.name ?? 'A customer';
}

function serviceOf(state, booking) {
  const provider = state.providers.find((p) => p.id === booking.providerId);
  return provider?.services?.find((s) => s.id === booking.serviceId)?.name ?? 'Service removed';
}

function categoryNameFor(state, booking) {
  const provider = state.providers.find((p) => p.id === booking.providerId);
  return state.categories.find((c) => c.id === provider?.categoryId)?.name ?? 'General services';
}
