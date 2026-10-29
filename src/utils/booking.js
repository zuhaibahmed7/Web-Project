// Booking lifecycle rules — these encode SRS business rules BRL-03 … BRL-07
// and the status-transition table in section 9.1.

export const STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const STATUS_META = {
  pending: {
    label: 'Pending',
    color: '#F5B301',
    tone: 'bg-pending/12 text-[#8a6500] ring-pending/30 dark:text-glow-300',
    dot: 'bg-pending',
    blurb: 'Waiting for the provider to respond.',
    step: 0,
  },
  accepted: {
    label: 'Accepted',
    color: '#3B82F6',
    tone: 'bg-accepted/12 text-accepted ring-accepted/30 dark:text-[#7fb0ff]',
    dot: 'bg-accepted',
    blurb: 'The provider confirmed your slot.',
    step: 1,
  },
  in_progress: {
    label: 'In Progress',
    color: '#FF7A1A',
    tone: 'bg-progress/12 text-progress ring-progress/30 dark:text-[#ffa863]',
    dot: 'bg-progress',
    blurb: 'Work has started at your address.',
    step: 2,
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    tone: 'bg-completed/12 text-completed ring-completed/30 dark:text-[#4ade9f]',
    dot: 'bg-completed',
    blurb: 'The job is done. Leave a review.',
    step: 3,
  },
  rejected: {
    label: 'Rejected',
    color: '#EF4444',
    tone: 'bg-rejected/12 text-rejected ring-rejected/30 dark:text-[#ff8a8a]',
    dot: 'bg-rejected',
    blurb: 'The provider could not take this request.',
    step: -1,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#94A3B8',
    tone: 'bg-cancelled/20 text-slate-600 ring-cancelled/40 dark:text-slate-300',
    dot: 'bg-cancelled',
    blurb: 'This request was cancelled.',
    step: -1,
  },
};

export const STATUS_ORDER = [
  STATUS.PENDING,
  STATUS.ACCEPTED,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED,
];

// The "happy path" shown by the animated stepper. Rejected/Cancelled are terminal
// and rendered as an off-path state instead of a step.
export const PROGRESS_STEPS = [
  { key: STATUS.PENDING, label: 'Requested', hint: 'You sent the request' },
  { key: STATUS.ACCEPTED, label: 'Accepted', hint: 'Provider confirmed' },
  { key: STATUS.IN_PROGRESS, label: 'In Progress', hint: 'Work started' },
  { key: STATUS.COMPLETED, label: 'Completed', hint: 'Job finished' },
];

// Allowed transitions and who may perform them.
const TRANSITIONS = {
  pending: {
    provider: [STATUS.ACCEPTED, STATUS.REJECTED],
    customer: [STATUS.CANCELLED],
    admin: [STATUS.ACCEPTED, STATUS.REJECTED, STATUS.CANCELLED],
  },
  accepted: {
    provider: [STATUS.IN_PROGRESS],
    customer: [],
    admin: [STATUS.IN_PROGRESS, STATUS.CANCELLED],
  },
  in_progress: {
    provider: [STATUS.COMPLETED],
    customer: [],
    admin: [STATUS.COMPLETED],
  },
  completed: { provider: [], customer: [], admin: [] },
  rejected: { provider: [], customer: [], admin: [] },
  cancelled: { provider: [], customer: [], admin: [] },
};

export const ACTION_META = {
  accepted: { label: 'Accept', verb: 'accepted', tone: 'primary' },
  rejected: { label: 'Reject', verb: 'rejected', tone: 'danger' },
  in_progress: { label: 'Start work', verb: 'marked in progress', tone: 'accent' },
  completed: { label: 'Mark completed', verb: 'completed', tone: 'success' },
  cancelled: { label: 'Cancel booking', verb: 'cancelled', tone: 'neutral' },
};

// BRL-06: rejected and cancelled bookings are not active.
export function isActiveBooking(booking) {
  return [STATUS.PENDING, STATUS.ACCEPTED, STATUS.IN_PROGRESS].includes(booking.status);
}

export function isTerminal(booking) {
  return [STATUS.REJECTED, STATUS.CANCELLED, STATUS.COMPLETED].includes(booking.status);
}

// Customer cancellation is only allowed while the request is still Pending.
export function canCancel(booking, role) {
  if (!booking) return false;
  const allowed = TRANSITIONS[booking.status]?.[role] ?? [];
  return allowed.includes(STATUS.CANCELLED);
}

export function allowedActions(booking, role) {
  if (!booking) return [];
  return TRANSITIONS[booking.status]?.[role] ?? [];
}

// BRL-07: reviews are only for completed services, one per booking.
export function canReview(booking, hasReview) {
  return !!booking && booking.status === STATUS.COMPLETED && !hasReview;
}

export function reviewBlockedReason(booking, hasReview) {
  if (!booking) return 'Booking not found.';
  if (hasReview) return 'You have already reviewed this service.';
  if (booking.status !== STATUS.COMPLETED) {
    return 'Reviews open once the provider marks this booking Completed.';
  }
  return '';
}

export function statusLabel(status) {
  return STATUS_META[status]?.label ?? 'Unknown';
}

export function statusColor(status) {
  return STATUS_META[status]?.color ?? '#94A3B8';
}
