import { cn } from '../../utils/cn';
import { STATUS_META } from '../../utils/booking';

// Generic pill badge.
export function Badge({ children, tone = 'neutral', size = 'md', className, icon: Icon }) {
  const tones = {
    neutral: 'bg-canvas-2 text-content-soft ring-line',
    brand: 'bg-brand-500/12 text-brand-600 ring-brand-500/28 dark:text-brand-300',
    aqua: 'bg-aqua-400/14 text-aqua-700 ring-aqua-400/30 dark:text-aqua-300',
    amber: 'bg-glow-400/16 text-glow-700 ring-glow-400/35 dark:text-glow-300',
    success: 'bg-completed/12 text-completed ring-completed/30 dark:text-[#4ade9f]',
    danger: 'bg-rejected/12 text-rejected ring-rejected/30 dark:text-[#ff8a8a]',
    ink: 'bg-ink-800 text-white ring-ink-800',
    glass: 'glass-2 text-content ring-transparent',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
        tones[tone],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

// Booking status badge — the single place status colours are decided (BR-09).
export function StatusBadge({ status, size = 'md', showDot = true, className }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
        meta.tone,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      )}
      {meta.label}
      <span className="sr-only">: {meta.blurb}</span>
    </span>
  );
}

export function VerificationBadge({ status, className }) {
  const map = {
    verified: { tone: 'success', label: 'Verified' },
    pending: { tone: 'amber', label: 'Pending review' },
    rejected: { tone: 'danger', label: 'Rejected' },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <Badge tone={cfg.tone} size="sm" className={className}>
      {cfg.label}
    </Badge>
  );
}
