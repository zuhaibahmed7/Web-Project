import { motion } from 'framer-motion';
import { Check, X, Clock } from 'lucide-react';
import { PROGRESS_STEPS, STATUS_META } from '../../utils/booking';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

// Animated booking-progress stepper (BR-05, BR-09).
// Reads the booking timeline so every completed stage shows when it happened.
export function BookingStepper({ booking, className, compact = false }) {
  const meta = STATUS_META[booking.status];
  const terminal = booking.status === 'rejected' || booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const currentStep = terminal ? -1 : (meta?.step ?? 0);

  const entryFor = (status) => booking.timeline?.find((t) => t.status === status);

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-start">
        {PROGRESS_STEPS.map((step, i) => {
          const done = isCompleted || i < currentStep;
          const isCurrent = i === currentStep && !isCompleted;
          const entry = entryFor(step.key);
          const stepMeta = STATUS_META[step.key];

          return (
            <div key={step.key} className="relative flex-1">
              {i > 0 && (
                <span
                  className="absolute top-[15px] right-1/2 left-[-50%] h-[2px] overflow-hidden rounded-full bg-canvas-2"
                  aria-hidden="true"
                >
                  <motion.span
                    className="block h-full w-full origin-left rounded-full grad-brand"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: i <= currentStep || isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              )}

              <div className="relative flex flex-col items-center gap-2 text-center">
                <motion.span
                  className={cn(
                    'relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 transition-colors duration-300',
                    done && 'border-transparent text-white',
                    isCurrent && 'border-transparent text-white',
                    !done && !isCurrent && 'border-line bg-canvas text-content-muted'
                  )}
                  style={(done || isCurrent) && !terminal ? { backgroundColor: stepMeta?.color } : undefined}
                  animate={
                    isCurrent ? { scale: [1, 1.1, 1], transition: { duration: 2, repeat: Infinity } } : { scale: 1 }
                  }
                >
                  {done ? (
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  ) : isCurrent ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
                  ) : (
                    <span className="text-[11px] font-bold tabular-nums">{i + 1}</span>
                  )}
                </motion.span>

                <div className="min-w-0">
                  <p
                    className={cn(
                      'font-display text-[12.5px] font-bold tracking-[-0.01em]',
                      done || isCurrent ? 'text-content' : 'text-content-muted'
                    )}
                  >
                    {step.label}
                  </p>
                  {!compact && (
                    <p className="mt-0.5 text-[11px] leading-tight text-content-muted">
                      {entry ? formatDate(entry.at.slice(0, 10), { month: 'short', day: 'numeric' }) : step.hint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {terminal && (
        <div
          className={cn(
            'mt-5 flex items-start gap-3 rounded-sm border px-4 py-3',
            booking.status === 'rejected' ? 'border-rejected/35 bg-rejected/8' : 'border-cancelled/40 bg-cancelled/10'
          )}
        >
          {booking.status === 'rejected' ? (
            <X className="mt-0.5 h-4 w-4 shrink-0 text-rejected" aria-hidden="true" />
          ) : (
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-300" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="font-display text-[13px] font-bold text-content">{meta?.label}</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-content-soft">
              {booking.rejectReason || booking.cancelReason || meta?.blurb}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact 4-segment status rail used on booking cards.
export function StatusRail({ status, className }) {
  const index = STATUS_META[status]?.step ?? -1;
  const color = STATUS_META[status]?.color;
  return (
    <div className={cn('flex items-center gap-1', className)} aria-hidden="true">
      {PROGRESS_STEPS.map((s, i) => (
        <span
          key={s.key}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors duration-500',
            i > index && 'bg-canvas-2'
          )}
          style={i <= index ? { backgroundColor: color } : undefined}
        />
      ))}
    </div>
  );
}

// Simple wizard rail used by the booking form.
export function FormStepper({ steps, current, className }) {
  return (
    <ol className={cn('flex items-center gap-3', className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-3">
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold transition-colors',
                  done && 'grad-brand text-white',
                  active && 'bg-ink-800 text-white dark:bg-white dark:text-ink-800',
                  !done && !active && 'border border-line bg-canvas text-content-muted'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[12.5px] font-semibold sm:block',
                  active || done ? 'text-content' : 'text-content-muted'
                )}
              >
                {label}
              </span>
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}
