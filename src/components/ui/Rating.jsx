import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

// Read-only rating: filled stars + numeric value.
export function Rating({ value = 0, count, size = 'sm', className, showValue = true }) {
  const dims = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4.5 w-4.5', lg: 'h-6 w-6' };
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rounded - (i - 1)));
          return (
            <span key={i} className={cn('relative inline-block', dims[size])}>
              <Star className={cn(dims[size], 'absolute inset-0 text-cancelled/45')} strokeWidth={1.6} />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className={cn(dims[size], 'fill-glow-400 text-glow-400')} strokeWidth={0} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-[12.5px] font-semibold tabular-nums text-content">
          {value ? value.toFixed(1) : 'New'}
        </span>
      )}
      {count !== undefined && <span className="text-[12px] text-content-muted">({count})</span>}
    </div>
  );
}

// Keyboard-accessible 1–5 star input (FR-RR-02, BRL-08).
export function RatingInput({ value = 0, onChange, label = 'Rating', error, className }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label={label}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onClick={() => onChange(star)}
            className="rounded-xs p-1 transition-transform duration-200 hover:scale-115 active:scale-95"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors duration-200',
                star <= shown ? 'fill-glow-400 text-glow-400' : 'text-cancelled/50'
              )}
              strokeWidth={1.5}
            />
          </button>
        ))}
        <span className="ml-2 text-[13px] font-semibold text-content-soft">
          {shown ? RATING_WORDS[shown] : 'Tap a star'}
        </span>
      </div>
      {error && <p className="text-[12.5px] font-medium text-rejected dark:text-[#ff8a8a]">{error}</p>}
    </div>
  );
}

const RATING_WORDS = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

// Small horizontal bar chart of the 5→1 star split, used on provider profiles.
export function RatingBreakdown({ breakdown = [0, 0, 0, 0, 0], total }) {
  const max = Math.max(1, ...breakdown);
  return (
    <div className="flex flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((stars) => {
        const value = breakdown[stars - 1] ?? 0;
        const pct = total ? Math.round((value / total) * 100) : 0;
        return (
          <div key={stars} className="flex items-center gap-2.5 text-[12px]">
            <span className="w-3 tabular-nums text-content-muted">{stars}</span>
            <Star className="h-3 w-3 fill-glow-400 text-glow-400" strokeWidth={0} aria-hidden="true" />
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-2">
              <span
                className="block h-full rounded-full bg-glow-400 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </span>
            <span className="w-9 text-right tabular-nums text-content-muted">{pct}%</span>
            <span className="w-6 text-right tabular-nums text-content">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
