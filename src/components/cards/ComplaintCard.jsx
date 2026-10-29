import { Link } from 'react-router-dom';
import { Flag, CalendarDays, CircleAlert, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDate, relativeTime } from '../../utils/format';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const STATUS_TONE = {
  open: { tone: 'danger', label: 'Open' },
  in_review: { tone: 'amber', label: 'In review' },
  resolved: { tone: 'success', label: 'Resolved' },
  dismissed: { tone: 'neutral', label: 'Dismissed' },
};

const PRIORITY_TONE = { high: 'danger', medium: 'amber', low: 'neutral' };

// A complaint as seen by an administrator (who can change its state) or by the
// customer who filed it (who only reads it). `actions` is omitted for customers.
export function ComplaintCard({ complaint, complainantName, providerName, actions, className }) {
  const status = STATUS_TONE[complaint.status] ?? STATUS_TONE.open;

  return (
    <Card className={cn('p-0', className)}>
      <div className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-sm',
            complaint.status === 'resolved'
              ? 'bg-completed/12 text-completed'
              : 'bg-rejected/10 text-rejected'
          )}
          aria-hidden="true"
        >
          {complaint.status === 'resolved' ? <Check className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">
              {complaint.code}
            </p>
            <Badge tone={status.tone} size="sm">
              {status.label}
            </Badge>
            <Badge tone={PRIORITY_TONE[complaint.priority] ?? 'neutral'} size="sm" icon={CircleAlert}>
              {complaint.priority} priority
            </Badge>
          </div>
          <h3 className="mt-1.5 font-display text-[16px] leading-snug font-bold">{complaint.subject}</h3>
        </div>
        <p className="text-[12px] whitespace-nowrap text-content-muted">{relativeTime(complaint.createdAt)}</p>
      </div>

      <div className="px-5 py-4">
        <p className="text-[14px] leading-relaxed text-content-soft text-pretty">{complaint.details}</p>

        {complaint.resolution && (
          <p className="mt-4 rounded-sm border-l-2 border-completed bg-completed/8 px-4 py-3 text-[13px] leading-relaxed text-content-soft">
            <span className="font-bold text-content">Resolution</span>
            <span className="mt-1 block text-content-muted">{complaint.resolution}</span>
          </p>
        )}

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-3">
          <div>
            <dt className="text-content-muted">Raised by</dt>
            <dd className="font-semibold">{complainantName ?? 'Customer'}</dd>
          </div>
          <div>
            <dt className="text-content-muted">About provider</dt>
            <dd className="font-semibold">{providerName ?? 'Not linked'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-content-muted">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              Booking
            </dt>
            <dd className="font-semibold">
              {complaint.bookingId ? (
                <Link to={`/booking/${complaint.bookingId}`} className="text-brand-600 hover:underline dark:text-brand-300">
                  {complaint.bookingId.replace('bk-', 'BK-')} · {formatDate(complaint.createdAt)}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas-2/50 px-5 py-3">
          {actions}
        </div>
      )}
    </Card>
  );
}
