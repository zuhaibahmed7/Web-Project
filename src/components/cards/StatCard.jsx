import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCountUp } from '../../hooks/useCountUp';
import { TiltCard } from '../ui/Card';

// Headline number used on every dashboard. Values count up when scrolled into
// view; `format` lets a screen render PKR or percentages without extra work.
export function StatCard({ label, value, suffix = '', prefix = '', hint, icon: Icon, tone = 'brand', delta, format }) {
  const { ref, display } = useCountUp(Number.isFinite(value) ? value : 0);
  const tones = {
    brand: 'bg-brand-500/12 text-brand-600 dark:text-brand-300',
    aqua: 'bg-aqua-400/14 text-aqua-700 dark:text-aqua-300',
    amber: 'bg-glow-400/16 text-glow-700 dark:text-glow-300',
    success: 'bg-completed/12 text-completed',
    danger: 'bg-rejected/12 text-rejected',
  };

  return (
    <TiltCard tilt={5} className="h-full">
      <div ref={ref} className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">{label}</p>
          <p className="mt-2 font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] sm:text-[30px]">
            {prefix}
            {format ? format(value) : display}
            {suffix}
          </p>
          {hint && <p className="mt-2 text-[12.5px] leading-snug text-content-muted">{hint}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {Icon && (
            <span className={cn('grid h-10 w-10 place-items-center rounded-sm', tones[tone])}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          )}
          {delta !== undefined && delta !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11.5px] font-bold',
                delta >= 0 ? 'text-completed' : 'text-rejected'
              )}
            >
              {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
      </div>
    </TiltCard>
  );
}
