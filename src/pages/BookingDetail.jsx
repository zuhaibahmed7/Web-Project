import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  CircleX,
  Clock,
  FileWarning,
  Flag,
  Hash,
  MapPin,
  MessageSquareQuote,
  Phone,
  SearchX,
  ShieldAlert,
  Star,
  User,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { decorateProvider, findBooking, findUser, hasReviewForBooking } from '../utils/selectors';
import {
  ACTION_META,
  STATUS,
  STATUS_META,
  allowedActions,
  canReview,
  reviewBlockedReason,
  statusLabel,
} from '../utils/booking';
import { formatDate, formatDateTime, formatPKR, formatTime, relativeTime } from '../utils/format';
import { minLength, required } from '../utils/validation';
import { cn } from '../utils/cn';
import { Avatar } from '../components/ui/Avatar';
import { Badge, StatusBadge, VerificationBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Textarea, Segmented } from '../components/ui/Input';
import { BookingStepper } from '../components/ui/Stepper';
import { Rating, RatingInput } from '../components/ui/Rating';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { Reveal } from '../components/ui/Reveal';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// One detail screen for all three roles. What a viewer may *see* is decided by
// ownership, and what they may *do* comes from the transition table in
// utils/booking.js — never from the nav links (SC-09, SC-11).
export default function BookingDetail() {
  const { id } = useParams();
  const {
    state,
    currentUser,
    currentProvider,
    setBookingStatus,
    addReview,
    addComplaint,
  } = useStore();
  const toast = useToast();

  const booking = useMemo(() => findBooking(state, id), [state, id]);
  const [reasonFor, setReasonFor] = useState(null); // status awaiting a reason
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState({ subject: '', details: '', priority: 'medium' });
  const [issueErrors, setIssueErrors] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(false);

  const provider = useMemo(() => {
    const raw = booking ? state.providers.find((p) => p.id === booking.providerId) ?? null : null;
    return raw ? decorateProvider(state, raw) : null;
  }, [state, booking]);
  const customer = booking ? findUser(state, booking.customerId) : null;
  const service = provider?.services?.find((s) => s.id === booking?.serviceId) ?? null;
  const category = provider ? state.categories.find((c) => c.id === provider.categoryId) : null;
  const review = useMemo(
    () => (booking ? state.reviews.find((r) => r.bookingId === booking.id) ?? null : null),
    [state.reviews, booking]
  );
  const complaint = useMemo(
    () => (booking ? state.complaints.find((c) => c.bookingId === booking.id) ?? null : null),
    [state.complaints, booking]
  );

  if (!currentUser) return null;

  const role = currentUser.role;
  const isOwner =
    role === 'admin' ||
    (role === 'customer' && booking?.customerId === currentUser.id) ||
    (role === 'provider' && provider && provider.id === currentProvider?.id);

  if (!booking) {
    return (
      <div className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8">
        <EmptyState
          icon={SearchX}
          title="Booking not found"
          description={`No booking matches “${id}”. It may have been deleted, or the demo data was reset.`}
          action={<Button to={HOME_FOR[role] ?? '/browse'}>Back to my area</Button>}
          secondaryAction={<Button variant="outline" to="/browse">Find another provider</Button>}
        />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShieldAlert}
          title="This booking belongs to someone else"
          description={`${booking.code} is not linked to your ${role} account, so its details are hidden. Administrators can see every booking from the Bookings desk.`}
          action={<Button to={HOME_FOR[role]}>Go to my dashboard</Button>}
        />
      </div>
    );
  }

  const actions = allowedActions(booking, role);
  const meta = STATUS_META[booking.status];
  const mayReview = canReview(booking, hasReviewForBooking(state, booking.id)) && role === 'customer';
  const reviewNote = reviewBlockedReason(booking, hasReviewForBooking(state, booking.id));

  /* ------------------------------------------------------------- handlers */

  function run(status) {
    if (status === STATUS.CANCELLED) {
      setConfirmCancel(true);
      return;
    }
    if (status === STATUS.REJECTED) {
      openReason(status);
      return;
    }
    setBookingStatus(booking.id, status, role);
    toast.success(
      role === 'provider'
        ? `${booking.code} is now “${statusLabel(status)}”. ${customer?.name ?? 'The customer'} has been notified.`
        : `${booking.code} moved to “${statusLabel(status)}”.`,
      { title: statusLabel(status) }
    );
  }

  function openReason(status) {
    setReasonFor(status);
    setReason('');
    setReasonError('');
  }

  function submitReason() {
    const message = required(reason, 'A reason') || minLength(reason, 8, 'The reason');
    if (message) {
      setReasonError(message);
      return;
    }
    setBookingStatus(booking.id, reasonFor, role, reason.trim());
    toast.info(
      reasonFor === STATUS.REJECTED
        ? `${booking.code} rejected. The customer sees your reason.`
        : `${booking.code} cancelled. ${provider?.name ?? 'The provider'} has been notified.`,
      { title: 'Done' }
    );
    setReasonFor(null);
  }

  function submitReview() {
    const message =
      (stars < 1 ? 'Select a star rating first.' : '') || minLength(comment, 20, 'Your review');
    if (message) {
      setReviewError(message);
      return;
    }
    addReview({
      bookingId: booking.id,
      providerId: booking.providerId,
      customerId: currentUser.id,
      customerName: currentUser.name,
      rating: stars,
      comment: comment.trim(),
    });
    setReviewOpen(false);
    setStars(0);
    setComment('');
    setReviewError('');
    toast.success('Thanks — your review is published on the provider profile.', { title: 'Review posted' });
  }

  function submitIssue() {
    const found = {};
    found.subject = required(issue.subject, 'A subject') || minLength(issue.subject, 8, 'The subject');
    found.details = required(issue.details, 'Details') || minLength(issue.details, 20, 'The details');
    const clean = Object.fromEntries(Object.entries(found).filter(([, m]) => m));
    if (Object.keys(clean).length) {
      setIssueErrors(clean);
      return;
    }
    addComplaint({
      complainantId: currentUser.id,
      providerId: booking.providerId,
      bookingId: booking.id,
      subject: issue.subject.trim(),
      details: issue.details.trim(),
      priority: issue.priority,
    });
    setIssueOpen(false);
    setIssue({ subject: '', details: '', priority: 'medium' });
    setIssueErrors({});
    toast.success('Reported to the FixNow support desk. Every admin has been notified.', {
      title: 'Issue reported',
    });
  }

  /* ---------------------------------------------------------------- render */

  const counterparty = role === 'customer' ? provider : customer;
  const counterpartyName = role === 'customer' ? provider?.name : customer?.name ?? 'Customer';

  return (
    <div className="pb-20">
      <div className="relative overflow-hidden border-b border-line bg-canvas-2/60">
        <span
          aria-hidden="true"
          className="dot-grid pointer-events-none absolute inset-0 opacity-40"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${meta?.color}33, transparent 70%)` }}
        />
        <div className="relative mx-auto max-w-[84rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <Link
            to={HOME_FOR[role]}
            className="group mb-5 inline-flex items-center gap-2 text-[13px] font-semibold text-content-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            {BACK_LABEL[role]}
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2.5">
                <span className="font-display text-[13px] font-bold tracking-[0.14em] text-content-muted uppercase">
                  Booking
                </span>
                <span className="inline-flex items-center gap-1.5 font-display text-[15px] font-extrabold">
                  <Hash className="h-4 w-4 text-brand-500" aria-hidden="true" />
                  {booking.code}
                </span>
                <StatusBadge status={booking.status} />
              </p>
              <h1 className="mt-3 font-display text-[25px] leading-[1.06] font-extrabold sm:text-[32px]">
                {service?.name ?? 'Service no longer listed'}
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-content-muted">
                {meta?.blurb}
                {provider && (
                  <>
                    {' '}
                    With{' '}
                    <Link to={`/provider/${provider.slug}`} className="font-semibold text-content hover:text-brand-600">
                      {provider.name}
                    </Link>
                    {category ? ` · ${category.name}` : ''}
                  </>
                )}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-content-soft">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-content-muted" aria-hidden="true" />
                  {formatDate(booking.date, { weekday: 'short' })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-content-muted" aria-hidden="true" />
                  {formatTime(booking.time)} arrival
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <Wallet className="h-4 w-4 text-content-muted" aria-hidden="true" />
                  {booking.estimate ? formatPKR(booking.estimate) : 'Estimate pending'}
                </span>
                <span className="text-content-muted">Requested {relativeTime(booking.createdAt)}</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions.map((status) => (
                <Button
                  key={status}
                  variant={ACTION_META[status]?.tone ?? 'secondary'}
                  size={status === STATUS.ACCEPTED || status === STATUS.COMPLETED ? 'lg' : 'md'}
                  icon={status === STATUS.REJECTED ? CircleX : undefined}
                  onClick={() => run(status)}
                >
                  {ACTION_META[status]?.label ?? statusLabel(status)}
                </Button>
              ))}
              {mayReview && (
                <Button
                  variant="amber"
                  size="lg"
                  icon={Star}
                  onClick={() => {
                    setReviewOpen(true);
                    setReviewError('');
                  }}
                >
                  Rate this job
                </Button>
              )}
              {actions.length === 0 && !mayReview && (
                <p className="rounded-sm border border-line bg-canvas px-4 py-2.5 text-[12.5px] text-content-muted">
                  No action for your role at this stage.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[84rem] gap-6 px-4 pt-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:px-8">
        <div className="space-y-6">
          <Reveal>
            <Card padding="lg">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Progress</h2>
                <p className="text-[12.5px] text-content-muted">
                  {booking.status === STATUS.COMPLETED
                    ? 'All four stages cleared.'
                    : 'Stages update as each side acts — this view is shared by customer, provider and admin.'}
                </p>
              </div>
              <BookingStepper booking={booking} />
            </Card>
          </Reveal>

          <Reveal>
            <Card padding="lg">
              <h2 className="mb-5 font-display text-[16px] font-bold tracking-[-0.02em]">Job details</h2>
              <dl className="grid gap-5 sm:grid-cols-2">
                <Detail icon={MapPin} label="Service address" wide>
                  {booking.address}
                  {booking.city ? `, ${booking.city}` : ''}
                </Detail>
                <Detail icon={CalendarDays} label="Preferred date">
                  {formatDate(booking.date, { weekday: 'long' })}
                </Detail>
                <Detail icon={Clock} label="Arrival window">
                  {formatTime(booking.time)}
                </Detail>
                <Detail icon={Wallet} label="Indicative estimate">
                  {booking.estimate ? formatPKR(booking.estimate) : 'Agreed on site'}
                  <span className="mt-1 block text-[11.5px] text-content-muted">
                    Final price is confirmed by the provider after inspection (BRL-09).
                  </span>
                </Detail>
                {booking.phone && (
                  <Detail icon={Phone} label="Contact number">
                    {booking.phone}
                  </Detail>
                )}
              </dl>

              {booking.description && (
                <div className="mt-5 rounded-sm border-l-2 border-brand-500/50 bg-brand-500/6 px-4 py-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">
                    <MessageSquareQuote className="h-3 w-3" aria-hidden="true" />
                    {role === 'customer' ? 'Your note to the provider' : 'Customer note'}
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-content-soft">{booking.description}</p>
                </div>
              )}

              {(booking.rejectReason || booking.cancelReason) && (
                <div
                  className={cn(
                    'mt-5 rounded-sm border px-4 py-3 text-[13.5px] leading-relaxed',
                    booking.status === STATUS.REJECTED
                      ? 'border-rejected/35 bg-rejected/8'
                      : 'border-cancelled/40 bg-cancelled/10'
                  )}
                >
                  <p className="font-bold">
                    {booking.status === STATUS.REJECTED ? 'Provider rejection reason' : 'Cancellation reason'}
                  </p>
                  <p className="mt-1 text-content-soft">
                    {booking.rejectReason || booking.cancelReason}
                  </p>
                </div>
              )}
            </Card>
          </Reveal>

          <Reveal>
            <Card padding="lg">
              <h2 className="mb-1 font-display text-[16px] font-bold tracking-[-0.02em]">History</h2>
              <p className="mb-5 text-[13px] text-content-muted">
                Every status change is recorded with who made it and when.
              </p>
              <ol className="relative space-y-5 border-l border-line pl-6">
                {booking.timeline.map((entry, i) => {
                  const stepMeta = STATUS_META[entry.status];
                  const isLast = i === booking.timeline.length - 1;
                  return (
                    <li key={`${entry.status}-${entry.at}`} className="relative">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-1 -left-[30px] grid h-3.5 w-3.5 place-items-center rounded-full ring-4',
                          'ring-canvas',
                          isLast ? 'animate-pulse-ring' : ''
                        )}
                        style={{ backgroundColor: stepMeta?.color }}
                      />
                      <p className="text-[14px] font-bold">
                        {statusLabel(entry.status)}
                        {isLast && (
                          <Badge tone="brand" size="sm" className="ml-2">
                            Current
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-content-muted">
                        {formatDateTime(entry.at)} · by {entry.by === 'customer' ? 'the customer' : entry.by === 'provider' ? 'the provider' : 'FixNow admin'}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </Reveal>

          {review && (
            <Reveal>
              <Card padding="lg" id="review" className="border-glow-400/35">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Review</h2>
                  <Rating value={review.rating} />
                  <Badge tone="success" size="sm" icon={CalendarCheck}>
                    Published
                  </Badge>
                </div>
                <p className="text-[14px] leading-relaxed text-content-soft">{review.comment}</p>
                <p className="mt-3 text-[12px] text-content-muted">
                  {role === 'customer' ? 'You wrote' : `${review.customerName} wrote`} this on{' '}
                  {formatDate(review.createdAt.slice(0, 10))}. It is visible on the public provider profile.
                </p>
              </Card>
            </Reveal>
          )}

          {!review && role === 'customer' && (
            <Reveal>
              <Card padding="lg" id="review" className="bg-canvas-2/60">
                <h2 className="mb-2 font-display text-[15.5px] font-bold tracking-[-0.02em]">
                  {booking.status === STATUS.COMPLETED ? 'Rate this job' : 'Reviews open after completion'}
                </h2>
                <p className="text-[13.5px] leading-relaxed text-content-muted">
                  {booking.status === STATUS.COMPLETED
                    ? 'Your rating is published on the provider profile immediately and is part of their public score.'
                    : reviewNote ||
                      'Reviews are one per booking and only allowed once the provider marks the work Completed (BRL-07).'}
                </p>
                {mayReview && (
                  <Button className="mt-4" variant="amber" icon={Star} onClick={() => setReviewOpen(true)}>
                    Write a review
                  </Button>
                )}
              </Card>
            </Reveal>
          )}
        </div>

        {/* ---------------------------------------------------------- aside */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-line bg-canvas-2/60 px-5 py-3">
              <p className="text-[11px] font-bold tracking-[0.16em] text-content-muted uppercase">
                {role === 'customer' ? 'Your provider' : 'Customer'}
              </p>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <Avatar name={counterpartyName ?? '?'} size="lg" ring />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-display text-[15px] font-bold tracking-[-0.01em]">
                    {role === 'customer' ? (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-completed" aria-hidden="true" />
                    ) : (
                      <User className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                    )}
                    <span className="truncate">{counterpartyName}</span>
                  </p>
                  {role === 'customer' && counterparty && (
                    <>
                      <VerificationBadge status={counterparty.verificationStatus} className="mt-2" />
                      <Rating className="mt-2" value={counterparty.rating} count={counterparty.reviewCount} />
                    </>
                  )}
                  {role !== 'customer' && customer && (
                    <p className="mt-1.5 text-[12.5px] text-content-muted">
                      {customer.email} · joined {formatDate(customer.joinedAt, { month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {counterparty?.phone && (
                <a
                  href={`tel:${counterparty.phone}`}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-sm bg-ink-800 text-[13.5px] font-bold text-white transition-colors hover:bg-ink-700 dark:bg-white dark:text-ink-800 dark:hover:bg-cloud-200"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call {(counterpartyName ?? '').split(' ')[0] || 'them'}
                </a>
              )}

              {role === 'customer' && provider && (
                <Button variant="outline" size="md" full className="mt-2.5" to={`/provider/${provider.slug}`}>
                  View profile
                </Button>
              )}
              {role === 'provider' && service && (
                <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-content-muted">
                  <CategoryIcon
                    icon={category?.icon}
                    categoryId={provider?.categoryId}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  Booked as “{service.name}” ({formatPKR(service.price)} / {service.unit ?? 'job'}). You can adjust
                  the final price on site.
                </p>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <p className="mb-3 flex items-center gap-2 font-display text-[14.5px] font-bold tracking-[-0.01em]">
              <ShieldAlert className="h-4 w-4 text-brand-500" aria-hidden="true" />
              What happens next
            </p>
            <ul className="space-y-2.5 text-[12.5px] leading-relaxed text-content-muted">
              {NEXT_STEPS[booking.status]?.[role === 'provider' ? 'provider' : role === 'admin' ? 'admin' : 'customer']?.map(
                (line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    {line}
                  </li>
                )
              )}
            </ul>
          </Card>

          {role === 'customer' && (
            <Card padding="lg" className="bg-canvas-2/60">
              <p className="mb-2 flex items-center gap-2 font-display text-[14.5px] font-bold tracking-[-0.01em]">
                <Flag className="h-4 w-4 text-rejected" aria-hidden="true" />
                Something went wrong?
              </p>
              <p className="text-[12.5px] leading-relaxed text-content-muted">
                Report the provider or this booking and the FixNow support desk will review it with the full history.
              </p>
              {complaint ? (
                <div className="mt-3 rounded-sm border border-line bg-canvas px-4 py-3 text-[12.5px]">
                  <p className="font-bold">
                    {complaint.code} · {complaint.subject}
                  </p>
                  <p className="mt-1 text-content-muted">
                    Status: {complaint.status.replace('_', ' ')}
                    {complaint.resolution ? ` — ${complaint.resolution}` : ''}
                  </p>
                  <Link
                    to="/app/complaints"
                    className="mt-2 inline-block font-semibold text-brand-600 dark:text-brand-300"
                  >
                    Track in my complaints
                  </Link>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  icon={FileWarning}
                  onClick={() => {
                    setIssueOpen(true);
                    setIssueErrors({});
                  }}
                >
                  Report an issue
                </Button>
              )}
            </Card>
          )}

          <Card padding="lg">
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-content-muted uppercase">Reference</p>
            <dl className="space-y-2 text-[12.5px]">
              <RefRow label="Booking ID" value={booking.id} />
              <RefRow label="Created" value={formatDateTime(booking.createdAt)} />
              <RefRow label="Updated" value={formatDateTime(booking.updatedAt)} />
              <RefRow label="Status" value={statusLabel(booking.status)} />
              <RefRow label="Reviewed" value={review ? 'Yes' : 'No'} />
            </dl>
          </Card>
        </aside>
      </div>

      {/* --------------------------------------------------------- dialogs */}
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setBookingStatus(booking.id, STATUS.CANCELLED, role, 'Cancelled by customer from the booking page.');
          toast.info(`${booking.code} cancelled. ${provider?.name ?? 'The provider'} has been notified.`, {
            title: 'Booking cancelled',
          });
        }}
        title={`Cancel ${booking.code}?`}
        message={`Cancellation is free while the request is Pending. ${provider?.name ?? 'The provider'} will be told immediately, and this booking cannot be reopened afterwards.`}
        confirmLabel="Cancel booking"
      />

      <Modal
        open={Boolean(reasonFor)}
        onClose={() => setReasonFor(null)}
        title={reasonFor === STATUS.REJECTED ? 'Give the customer a reason' : 'Why are you cancelling?'}
        description={
          reasonFor === STATUS.REJECTED
            ? 'Rejected requests are final. The reason appears on the customer’s booking page.'
            : 'The provider sees this note on their booking.'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setReasonFor(null)}>
              Go back
            </Button>
            <Button variant={reasonFor === STATUS.REJECTED ? 'danger' : 'neutral'} icon={CircleX} onClick={submitReason}>
              {reasonFor === STATUS.REJECTED ? 'Reject request' : 'Cancel booking'}
            </Button>
          </>
        }
      >
        <Textarea
          id="booking-reason"
          label="Reason"
          required
          rows={4}
          maxLength={280}
          showCount
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError('');
          }}
          error={reasonError}
          hint="Minimum 8 characters. Be specific — it helps the other side plan."
          placeholder={
            reasonFor === STATUS.REJECTED
              ? 'Fully booked for the next two weeks.'
              : 'Plumber from a neighbour fixed it before the visit.'
          }
        />
      </Modal>

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`Review ${provider?.name ?? 'this provider'}`}
        description="Your rating is averaged into the provider's public score the moment you post it."
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Not now
            </Button>
            <Button variant="amber" icon={Star} onClick={submitReview}>
              Publish review
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-content-soft">
              How was {service?.name ?? 'the service'}?
            </p>
            <RatingInput value={stars} onChange={setStars} label="Star rating" error={reviewError} />
          </div>
          <Textarea
            id="review-comment"
            label="What went well, or badly?"
            required
            rows={5}
            maxLength={400}
            showCount
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setReviewError('');
            }}
            hint="At least 20 characters. Future customers rely on specifics."
            placeholder="Arrived within the slot, replaced the MCB, and cleaned up afterwards."
          />
        </div>
      </Modal>

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title={`Report a problem with ${booking.code}`}
        description="The support desk sees this booking, its history and your message together."
        footer={
          <>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Close
            </Button>
            <Button variant="danger" icon={Flag} onClick={submitIssue}>
              Send report
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            id="issue-subject"
            label="Subject"
            required
            rows={2}
            maxLength={110}
            value={issue.subject}
            onChange={(e) => {
              setIssue((f) => ({ ...f, subject: e.target.value }));
              setIssueErrors((x) => ({ ...x, subject: '' }));
            }}
            error={issueErrors.subject}
            placeholder="Provider arrived two hours late without notice"
          />
          <Textarea
            id="issue-details"
            label="Details"
            required
            rows={5}
            maxLength={500}
            showCount
            value={issue.details}
            onChange={(e) => {
              setIssue((f) => ({ ...f, details: e.target.value }));
              setIssueErrors((x) => ({ ...x, details: '' }));
            }}
            error={issueErrors.details}
            placeholder="Say what happened, when, and what you would like FixNow to do."
          />
          <div>
            <p className="mb-2 text-[13px] font-semibold text-content-soft">How urgent is it?</p>
            <Segmented
              options={PRIORITY_OPTIONS}
              value={issue.priority}
              onChange={(v) => setIssue((f) => ({ ...f, priority: v }))}
              ariaLabel="Complaint priority"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

const HOME_FOR = { customer: '/app/bookings', provider: '/partner/jobs', admin: '/admin/bookings' };
const BACK_LABEL = {
  customer: 'Back to my bookings',
  provider: 'Back to my jobs',
  admin: 'Back to all bookings',
};

// Plain-language guidance per status, so each role knows what they are waiting on.
const NEXT_STEPS = {
  pending: {
    customer: [
      'The provider has your request and can accept or reject it.',
      'You can cancel free of charge while this stays Pending.',
      'Nothing is charged — payment is agreed on site.',
    ],
    provider: [
      'Accept to lock the slot, or reject with a reason.',
      'Once accepted the job appears under Active jobs.',
      'Rejecting is final and cannot be reopened.',
    ],
    admin: [
      'Both parties have been notified of the request.',
      'You may accept, reject or cancel on their behalf from here.',
    ],
  },
  accepted: {
    customer: ['The provider committed to this slot.', 'Cancellation is no longer available — call them if plans change.', 'Payment is made on site after the work.'],
    provider: ['Start the work when you arrive; the customer sees the change instantly.', 'Complete the job from Active jobs when finished.'],
    admin: ['Provider has committed. Work has not started yet.', 'You may mark the job in progress if the provider cannot reach the app.'],
  },
  in_progress: {
    customer: ['Work is underway at your address.', 'You will be notified when the provider marks it Completed.', 'Keep the estimate in mind — final price is confirmed on site.'],
    provider: ['Mark the job Completed once the customer has signed off.', 'A completed job unlocks the customer review.'],
    admin: ['If the job stalls, contact both parties and update the status here.', 'Complaints can be raised by the customer at any stage.'],
  },
  completed: {
    customer: ['Rate the job — it publishes on the provider profile immediately.', 'One review per booking, so make it count.', 'Something wrong? Report it from this page.'],
    provider: ['The job is closed and counts towards your completed total.', 'The customer rating updates live on your public profile.'],
    admin: ['This booking contributes to completion rate and revenue estimates.', 'Reviews from closed jobs drive the verification record.'],
  },
  rejected: {
    customer: ['This request is closed.', 'Book another provider — the reason is shown above.', 'You can raise a complaint if the rejection felt unfair.'],
    provider: ['Rejected is final. The customer can send a fresh request.', 'Consider adding clearer availability to avoid rejections.'],
    admin: ['Rejected bookings are excluded from active counts.', 'Repeated rejections affect the provider’s verification record.'],
  },
  cancelled: {
    customer: ['This request is closed and nothing was charged.', 'Book again any time — nothing on your account changed.', 'You can report an issue if the cancellation caused a problem.'],
    provider: ['The customer cancelled this request.', 'No action is required from you.'],
    admin: ['Cancelled bookings are not counted as active jobs.', 'Useful when reviewing provider reliability statistics.'],
  },
};

function Detail({ icon: Icon, label, children, wide = false }) {
  return (
    <div className={cn(wide && 'sm:col-span-2')}>
      <dt className="text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">{label}</dt>
      <dd className="mt-1.5 flex items-start gap-2 text-[14px] leading-relaxed text-content-soft">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
        <span>{children}</span>
      </dd>
    </div>
  );
}

function RefRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-content-muted">{label}</dt>
      <dd className="text-right font-semibold break-all">{value}</dd>
    </div>
  );
}
