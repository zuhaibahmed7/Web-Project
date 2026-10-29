import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CircleAlert, CircleCheck, ExternalLink, Funnel, Play, Search, Trash, X } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { findCategory, findProvider, findUser } from '../utils/selectors';
import { ACTION_META, STATUS, STATUS_META, allowedActions, isActiveBooking } from '../utils/booking';
import { formatDate, formatDateTime, formatPKR, formatTime, relativeTime } from '../utils/format';
import { required, hasErrors, runValidation } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils/cn';

const BUTTON_TONE = {
  accepted: 'success',
  rejected: 'outline',
  in_progress: 'accent',
  completed: 'primary',
  cancelled: 'outline',
};

const ACTION_ICON = {
  [STATUS.ACCEPTED]: CircleCheck,
  [STATUS.REJECTED]: CircleAlert,
  [STATUS.IN_PROGRESS]: Play,
  [STATUS.COMPLETED]: CircleCheck,
  [STATUS.CANCELLED]: X,
};

// Only these two transitions need a written reason (the reducer stores it on the
// booking as rejectReason / cancelReason).
const REASON_REQUIRED = [STATUS.REJECTED, STATUS.CANCELLED];

const STATUS_OPTIONS = Object.values(STATUS).map((value) => ({ value, label: STATUS_META[value].label }));

export default function AdminBookings() {
  const { state, setBookingStatus, removeBooking } = useStore();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [providerId, setProviderId] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // `transition` = { booking, action } while a reason is being collected.
  const [transition, setTransition] = useState(null);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const providerOptions = useMemo(
    () => [
      { value: 'all', label: 'All providers' },
      ...state.providers.map((p) => ({ value: p.id, label: `${p.name} — ${p.city}` })),
    ],
    [state.providers]
  );

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...state.categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [state.categories]
  );

  // Bookings store ids only, so every displayed name is resolved here (DR-04).
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.bookings
      .map((booking) => {
        const provider = findProvider(state, booking.providerId);
        const customer = findUser(state, booking.customerId);
        const service = provider?.services?.find((s) => s.id === booking.serviceId) ?? null;
        return {
          booking,
          provider,
          customer,
          service,
        };
      })
      .filter(({ booking, provider }) => {
        if (status !== 'all' && booking.status !== status) return false;
        if (providerId !== 'all' && booking.providerId !== providerId) return false;
        if (categoryId !== 'all' && provider?.categoryId !== categoryId) return false;
        if (fromDate && booking.date < fromDate) return false;
        if (toDate && booking.date > toDate) return false;
        if (q) {
          const haystack = [
            booking.code,
            booking.description,
            booking.address,
            booking.city,
            provider?.name,
            customer?.name,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.booking.updatedAt) - new Date(a.booking.updatedAt));
  }, [state, query, status, providerId, categoryId, fromDate, toDate]);

  const filtersActive =
    query.trim() !== '' ||
    status !== 'all' ||
    providerId !== 'all' ||
    categoryId !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setProviderId('all');
    setCategoryId('all');
    setFromDate('');
    setToDate('');
  };

  const totals = useMemo(() => {
    const value = rows.reduce((sum, { booking }) => sum + (booking.estimate ?? 0), 0);
    return {
      count: rows.length,
      value,
      active: rows.filter(({ booking }) => isActiveBooking(booking)).length,
    };
  }, [rows]);

  const applyTransition = (booking, action) => {
    setBookingStatus(booking.id, action, 'admin');
    toast.success(`${booking.code} → ${STATUS_META[action].label}.`, { title: ACTION_META[action].label });
  };

  const onAction = (booking, action) => {
    if (REASON_REQUIRED.includes(action)) {
      setTransition({ booking, action });
      setReason('');
      setErrors({});
      return;
    }
    applyTransition(booking, action);
  };

  const submitTransition = () => {
    const validation = runValidation(
      { reason },
      { reason: (v) => required(v, transition.action === STATUS.REJECTED ? 'Rejection reason' : 'Cancellation reason') }
    );
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    const { booking, action } = transition;
    setBookingStatus(booking.id, action, 'admin', reason.trim());
    closeTransition();
    toast[action === STATUS.REJECTED ? 'error' : 'warning'](
      `${booking.code} ${ACTION_META[action].verb} by admin — reason recorded.`,
      { title: STATUS_META[action].label }
    );
  };

  const closeTransition = () => {
    setTransition(null);
    setReason('');
    setErrors({});
  };

  const confirmDelete = () => {
    const booking = deleteTarget;
    if (!booking) return;
    removeBooking(booking.id);
    setDeleteTarget(null);
    toast.warning(`${booking.code} deleted from the ledger. This cannot be undone in the prototype.`, {
      title: 'Booking removed',
    });
  };

  const categoryName = (provider) => findCategory(state, provider?.categoryId ?? '')?.name ?? '—';

  // Row actions are exactly what the reducer would accept — offering anything
  // else would silently no-op (SC-09/SC-10).
  const actionsFor = (booking) => allowedActions(booking, 'admin');

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Bookings ledger"
        description="Every request on the marketplace with its lifecycle position. Admin may drive a booking through any transition the rules allow."
        actions={
          <>
            <Badge tone="brand" icon={CalendarDays}>
              {state.bookings.length} total
            </Badge>
            <Button variant="secondary" to="/admin/reports" icon={CircleCheck}>
              Reports
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------------- filters */}
      <Card padding="sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code, description, address…"
            icon={Search}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]}
          />
          <Select
            label="Provider"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            options={providerOptions}
          />
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoryOptions}
          />
          <Input
            label="Service date from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="sm:col-span-2 lg:col-span-1"
            hint="Filter on the booked service date — past jobs and upcoming slots are both valid."
          />
          <Input
            label="Service date to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            error={
              fromDate && toDate && toDate < fromDate
                ? 'End date is before the start date — no bookings can match.'
                : undefined
            }
          />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
            {filtersActive && (
              <Button variant="ghost" icon={X} onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12.5px] text-content-muted">
          <span className="inline-flex items-center gap-1.5 font-semibold text-content">
            <Funnel className="h-3.5 w-3.5" aria-hidden="true" />
            {totals.count} result{totals.count === 1 ? '' : 's'}
          </span>
          <span>· {totals.active} still active</span>
          <span>· estimate shown {formatPKR(totals.value)}</span>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Reveal className="mt-6 block">
          <EmptyState
            icon={CalendarDays}
            tone="dashed"
            title="No bookings match this search"
            description="Widen the date window or reset the filters. New requests appear here the moment a customer submits one."
            action={<Button icon={Funnel} onClick={clearFilters}>Reset all filters</Button>}
            secondaryAction={<Button variant="ghost" to="/admin/verification">Check verification queue</Button>}
          />
        </Reveal>
      ) : (
        <>
          {/* Desktop ledger */}
          <Reveal className="mt-6 hidden xl:block">
            <Card padding="none" className="overflow-hidden">
              <table className="w-full text-left text-[13px]" aria-label="Bookings ledger">
                <caption className="sr-only">
                  All bookings ordered by most recently updated. Estimates are indicative PKR values. Admin actions
                  follow the booking state machine; completed, rejected and cancelled bookings are terminal.
                </caption>
                <thead>
                  <tr className="border-b border-line bg-canvas-2/60 text-[11px] font-bold tracking-[0.1em] text-content-muted uppercase">
                    <th scope="col" className="px-4 py-3">Code</th>
                    <th scope="col" className="px-3 py-3">Customer</th>
                    <th scope="col" className="px-3 py-3">Provider</th>
                    <th scope="col" className="px-3 py-3">Service</th>
                    <th scope="col" className="px-3 py-3">When</th>
                    <th scope="col" className="px-3 py-3">Estimate</th>
                    <th scope="col" className="px-3 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(({ booking, provider, customer, service }) => {
                    const available = actionsFor(booking);
                    return (
                      <tr key={booking.id} className="align-top transition-colors hover:bg-canvas-2/50">
                        <th scope="row" className="px-4 py-3.5 text-left font-normal">
                          <Link
                            to={`/booking/${booking.id}`}
                            className="font-display text-[13px] font-bold tracking-[-0.01em] text-content hover:text-brand-600 dark:hover:text-brand-300"
                          >
                            {booking.code}
                          </Link>
                          <span className="mt-0.5 block text-[11.5px] text-content-muted">
                            updated {relativeTime(booking.updatedAt)}
                          </span>
                        </th>
                        <td className="px-3 py-3.5">
                          <span className="block truncate font-semibold text-content">{customer?.name ?? 'Removed'}</span>
                          <span className="block truncate text-[11.5px] text-content-muted">{booking.city}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          {provider ? (
                            <Link
                              to={`/provider/${provider.slug}`}
                              className="truncate font-semibold text-brand-600 hover:underline dark:text-brand-300"
                            >
                              {provider.name}
                            </Link>
                          ) : (
                            <span className="text-content-muted">Provider removed</span>
                          )}
                          <span className="mt-0.5 block text-[11.5px] text-content-muted">{categoryName(provider)}</span>
                        </td>
                        <td className="max-w-[14rem] px-3 py-3.5">
                          <span className="block truncate text-content-soft">{service?.name ?? 'Service deleted'}</span>
                          <span className="mt-0.5 block line-clamp-1 text-[11.5px] text-content-muted">
                            {booking.description}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className="block font-semibold text-content">{formatDate(booking.date)}</span>
                          <span className="block text-[11.5px] text-content-muted">{formatTime(booking.time)}</span>
                        </td>
                        <td className="px-3 py-3.5 font-bold tabular-nums whitespace-nowrap text-content">
                          {formatPKR(booking.estimate)}
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={booking.status} size="sm" />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex flex-wrap items-center justify-end gap-1.5">
                            {available.map((action) => (
                              <button
                                key={action}
                                type="button"
                                onClick={() => onAction(booking, action)}
                                className={cn(
                                  'inline-flex h-7 items-center rounded-xs border px-2 text-[11.5px] font-bold transition-colors',
                                  action === STATUS.REJECTED || action === STATUS.CANCELLED
                                    ? 'border-rejected/35 text-rejected hover:bg-rejected/10'
                                    : action === STATUS.COMPLETED
                                      ? 'border-completed/40 text-completed hover:bg-completed/12'
                                      : 'border-brand-500/40 text-brand-600 hover:bg-brand-500/10 dark:text-brand-300'
                                )}
                              >
                                {ACTION_META[action].label}
                              </button>
                            ))}
                            <Link
                              to={`/booking/${booking.id}`}
                              className="inline-flex h-7 items-center gap-1 rounded-xs border border-line px-2 text-[11.5px] font-semibold text-content-muted transition-colors hover:border-line-strong hover:text-content"
                            >
                              Open
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(booking)}
                              aria-label={`Delete booking ${booking.code}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-xs border border-rejected/30 text-rejected transition-colors hover:bg-rejected/10"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </Reveal>

          {/* Mobile / tablet card rows */}
          <div className="mt-6 flex flex-col gap-3 xl:hidden">
            <p className="sr-only" aria-live="polite">
              {rows.length} bookings shown as cards.
            </p>
            {rows.map(({ booking, provider, customer, service }) => {
              const available = actionsFor(booking);
              return (
                <Card key={booking.id} padding="sm" className="overflow-hidden">
                  <div className="flex items-start gap-3">
                    <span className={cn('mt-1 h-full w-1 shrink-0 self-stretch rounded-full', STATUS_META[booking.status].dot)} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/booking/${booking.id}`}
                          className="font-display text-[15px] font-bold tracking-[-0.02em] hover:text-brand-600 dark:hover:text-brand-300"
                        >
                          {booking.code}
                        </Link>
                        <StatusBadge status={booking.status} size="sm" />
                      </div>
                      <p className="mt-1 text-[13px] font-semibold text-content">{service?.name ?? 'Service deleted'}</p>
                      <p className="text-[12.5px] text-content-muted">
                        {customer?.name ?? 'Removed'} → {provider?.name ?? 'Provider removed'} ·{' '}
                        {categoryName(provider)}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
                    <div>
                      <dt className="text-content-muted">Service date</dt>
                      <dd className="font-semibold text-content">{formatDate(booking.date)}</dd>
                    </div>
                    <div>
                      <dt className="text-content-muted">Time</dt>
                      <dd className="font-semibold text-content">{formatTime(booking.time)}</dd>
                    </div>
                    <div>
                      <dt className="text-content-muted">Estimate</dt>
                      <dd className="font-semibold tabular-nums text-content">{formatPKR(booking.estimate)}</dd>
                    </div>
                    <div>
                      <dt className="text-content-muted">Last update</dt>
                      <dd className="font-semibold text-content">{formatDateTime(booking.updatedAt)}</dd>
                    </div>
                  </dl>

                  {booking.description && (
                    <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-content-muted">
                      {booking.description}
                    </p>
                  )}

                  {(booking.cancelReason || booking.rejectReason) && (
                    <p className="mt-2.5 rounded-sm border-l-2 border-rejected/60 bg-rejected/8 px-3 py-2 text-[12px] leading-relaxed text-content-soft">
                      <span className="font-bold text-content">
                        {booking.status === STATUS.REJECTED ? 'Rejection reason' : 'Cancellation reason'}
                      </span>
                      <span className="mt-0.5 block">{booking.rejectReason || booking.cancelReason}</span>
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {available.map((action) => (
                      <Button
                        key={action}
                        size="sm"
                        variant={BUTTON_TONE[action]}
                        icon={ACTION_ICON[action]}
                        onClick={() => onAction(booking, action)}
                        className={
                          action === STATUS.REJECTED || action === STATUS.CANCELLED
                            ? 'border-rejected/40 text-rejected'
                            : undefined
                        }
                      >
                        {ACTION_META[action].label}
                      </Button>
                    ))}
                    <Button size="sm" variant="ghost" icon={ExternalLink} to={`/booking/${booking.id}`}>
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash}
                      onClick={() => setDeleteTarget(booking)}
                      className="ml-auto text-rejected"
                    >
                      Delete
                    </Button>
                  </div>
                  {!available.length && (
                    <p className="mt-2 text-[11.5px] text-content-muted">
                      {STATUS_META[booking.status].blurb} No further transitions are permitted for admin here.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* --------------------------------------- reason modal for reject / cancel */}
      <Modal
        open={Boolean(transition)}
        onClose={closeTransition}
        title={`${transition ? ACTION_META[transition.action].label : ''} ${transition?.booking.code ?? ''}`}
        description={
          transition
            ? `${STATUS_META[transition.action].blurb} The reason is stored on the booking and shown to both sides.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={closeTransition}>
              Go back
            </Button>
            <Button
              variant={transition?.action === STATUS.REJECTED ? 'danger' : 'dark'}
              icon={CircleAlert}
              onClick={submitTransition}
            >
              Confirm {transition ? ACTION_META[transition.action].label.toLowerCase() : ''}
            </Button>
          </>
        }
      >
        <Textarea
          label={transition?.action === STATUS.REJECTED ? 'Why is this request rejected?' : 'Why is this booking cancelled?'}
          required
          rows={3}
          maxLength={240}
          showCount
          value={reason}
          error={errors.reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (errors.reason) setErrors({});
          }}
          hint="A short, factual sentence the customer can act on."
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete booking ${deleteTarget?.code ?? ''}?`}
        message={
          <span className="block">
            This hard-deletes the record from the prototype store, including its timeline and any link from a
            complaint. Prefer cancelling with a reason if the booking still needs to stay auditable.
          </span>
        }
        confirmLabel="Delete permanently"
        tone="danger"
      />
    </>
  );
}
