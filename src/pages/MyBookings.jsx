import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  CircleX,
  Inbox,
  Search,
  Star,
  SearchX,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { bookingsByCustomer, decorateProvider, hasReviewForBooking } from '../utils/selectors';
import { STATUS, allowedActions, canCancel, canReview, isActiveBooking, statusLabel } from '../utils/booking';
import { PageHeader } from '../components/layout/PageHeader';
import { BookingCard } from '../components/cards/BookingCard';
import { Button } from '../components/ui/Button';
import { Input, Segmented } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Stagger, StaggerItem } from '../components/ui/Reveal';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 'review', label: 'Needs review' },
];

// The customer's own bookings (FR-BM-08). Every row offers only the actions the
// transition table allows for this status, so nothing illegal can be clicked.
export default function MyBookings() {
  const { state, currentUser, setBookingStatus } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  const rows = useMemo(() => {
    if (!currentUser) return [];
    return bookingsByCustomer(state, currentUser.id).map((booking) => {
      const raw = state.providers.find((p) => p.id === booking.providerId);
      const provider = raw ? decorateProvider(state, raw) : null;
      const service = raw?.services?.find((s) => s.id === booking.serviceId) ?? null;
      return { booking, provider, serviceName: service?.name ?? 'Service removed' };
    });
  }, [state, currentUser]);

  const counts = useMemo(() => {
    const by = (predicate) => rows.filter((r) => predicate(r.booking)).length;
    return {
      all: rows.length,
      active: by(isActiveBooking),
      pending: by((b) => b.status === STATUS.PENDING),
      completed: by((b) => b.status === STATUS.COMPLETED),
      closed: by((b) => b.status === STATUS.REJECTED || b.status === STATUS.CANCELLED),
      review: by((b) => canReview(b, hasReviewForBooking(state, b.id))),
    };
  }, [rows, state]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ booking, provider, serviceName }) => {
      if (tab === 'active' && !isActiveBooking(booking)) return false;
      if (tab === 'pending' && booking.status !== STATUS.PENDING) return false;
      if (tab === 'completed' && booking.status !== STATUS.COMPLETED) return false;
      if (tab === 'closed' && booking.status !== STATUS.REJECTED && booking.status !== STATUS.CANCELLED) return false;
      if (tab === 'review' && !canReview(booking, hasReviewForBooking(state, booking.id))) return false;
      if (q) {
        const haystack = `${booking.code} ${booking.address} ${serviceName} ${provider?.name ?? ''} ${booking.description ?? ''}`;
        if (!haystack.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, tab, query, state]);

  const tabOptions = TABS.map((t) => ({ value: t.value, label: `${t.label} (${counts[t.value]})` }));

  function confirmCancel() {
    const booking = cancelTarget;
    if (!booking) return;
    setBookingStatus(booking.id, STATUS.CANCELLED, 'customer', 'Cancelled by customer from My bookings.');
    toast.info(`${booking.code} cancelled. The provider has been notified.`, { title: 'Booking cancelled' });
    setCancelTarget(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Customer"
        title="My bookings"
        description="Every request you have sent, with the stage it reached. Cancelling stays free while a booking is Pending; reviews open once it is Completed."
        actions={
          <Button to="/browse" icon={CalendarPlus}>
            Book a service
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Segmented options={tabOptions} value={tab} onChange={setTab} ariaLabel="Filter bookings by stage" size="sm" />
        <div className="lg:w-72">
          <Input
            label="Search bookings"
            icon={Search}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code, provider or address"
            className="h-10"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            tone="dashed"
            title="No bookings yet"
            description="When you book a service it appears here with a live status. Start by finding a provider near you."
            action={<Button to="/browse">Find a service</Button>}
            secondaryAction={
              <Button variant="outline" to="/how-it-works">
                How FixNow works
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={SearchX}
            tone="dashed"
            title="Nothing matches this view"
            description={`No booking is in “${
              TABS.find((t) => t.value === tab)?.label ?? tab
            }”${query.trim() ? ` for “${query.trim()}”` : ''}. Clear the filters to see all ${rows.length}.`}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setTab('all');
                  setQuery('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        )
      ) : (
        <>
          <p className="mb-4 text-[13px] text-content-muted">
            Showing {visible.length} of {rows.length} booking{rows.length === 1 ? '' : 's'}
            {query.trim() ? ` for “${query.trim()}”` : ''}.
          </p>
          <Stagger className="space-y-4" as="ul">
            {visible.map(({ booking, provider, serviceName }) => (
              <StaggerItem key={booking.id} as="li">
                <BookingCard
                  booking={booking}
                  provider={provider}
                  serviceName={serviceName}
                  role="customer"
                  actions={
                    <>
                      <Button size="sm" variant="secondary" to={`/booking/${booking.id}`}>
                        Open
                      </Button>
                      {canCancel(booking, 'customer') && (
                        <Button
                          size="sm"
                          variant="neutral"
                          icon={CircleX}
                          onClick={() => setCancelTarget(booking)}
                        >
                          Cancel
                        </Button>
                      )}
                      {canReview(booking, hasReviewForBooking(state, booking.id)) && (
                        <Button size="sm" variant="amber" icon={Star} to={`/booking/${booking.id}#review`}>
                          Rate job
                        </Button>
                      )}
                      {allowedActions(booking, 'customer').length === 0 &&
                        !canReview(booking, hasReviewForBooking(state, booking.id)) && (
                          <Link
                            to={`/provider/${provider?.slug ?? ''}`}
                            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 hover:text-aqua-600 dark:text-brand-300"
                          >
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                            Book {provider?.name ?? 'this provider'} again
                          </Link>
                        )}
                      <span className="ml-auto text-[12px] text-content-muted">
                        {statusLabel(booking.status)} · {booking.code}
                      </span>
                    </>
                  }
                />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title={cancelTarget ? `Cancel ${cancelTarget.code}?` : 'Cancel booking?'}
        message="Cancellation is free while the request is Pending and the provider is told immediately. A cancelled booking cannot be reopened — you would need to send a fresh request."
        confirmLabel="Cancel booking"
      />
    </>
  );
}
