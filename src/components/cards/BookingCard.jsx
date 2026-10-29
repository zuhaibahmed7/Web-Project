import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Wallet, User, Building } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatPKR, formatDate, formatTime } from '../../utils/format';
import { STATUS_META } from '../../utils/booking';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { BookingStepper } from '../ui/Stepper';
import { Avatar } from '../ui/Avatar';

function MetaRow({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-2 text-[13px] text-content-soft">
      <Icon className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </p>
  );
}

// One booking row that works for every role — the caller decides who is shown as
// the counterparty and which actions appear.
export function BookingCard({
  booking,
  provider,
  customerName,
  role = 'customer',
  actions,
  serviceName,
  showStepper = true,
  to,
  className,
}) {
  const meta = STATUS_META[booking.status];
  const counterparty = role === 'customer' ? provider?.name : (customerName ?? 'Customer');
  const href = to ?? `/booking/${booking.id}`;

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className="flex">
        <span className={cn('w-1 shrink-0', meta?.dot)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3.5 sm:px-5">
            <Link to={href} className="font-display text-[15px] font-bold tracking-[-0.02em] hover:text-brand-600">
              {booking.code}
            </Link>
            <StatusBadge status={booking.status} size="sm" />
            <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-bold">
              <Wallet className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
              {booking.estimate ? formatPKR(booking.estimate) : 'Estimate pending'}
            </span>
          </div>

          <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={counterparty ?? '?'} size="sm" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[14px] font-bold">
                    {role === 'customer' ? (
                      <Building className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                    )}
                    {counterparty ?? 'Provider removed'}
                  </p>
                  <p className="truncate text-[12.5px] text-content-muted">
                    {serviceName ?? booking.serviceName} · {booking.city}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <MetaRow icon={CalendarDays}>{formatDate(booking.date)}</MetaRow>
                <MetaRow icon={Clock}>{formatTime(booking.time)}</MetaRow>
                <MetaRow icon={MapPin}>{booking.address}</MetaRow>
              </div>

              {booking.description && (
                <p className="line-clamp-2 text-[13px] leading-relaxed text-content-muted">{booking.description}</p>
              )}
            </div>

            {showStepper && (
              <div className="sm:w-56">
                <BookingStepper booking={booking} compact />
              </div>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas-2/50 px-4 py-3 sm:px-5">
              {actions}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
