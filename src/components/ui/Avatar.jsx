import { initials, gradientFor } from '../../utils/format';
import { cn } from '../../utils/cn';

// Initials avatar on a deterministic gradient — no external images needed.
export function Avatar({ name = '', size = 'md', ring = false, className, verified = false }) {
  const [from, to] = gradientFor(name);
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-[12px]',
    md: 'h-11 w-11 text-[14px]',
    lg: 'h-14 w-14 text-[17px]',
    xl: 'h-20 w-20 text-[24px]',
    '2xl': 'h-24 w-24 text-[28px]',
  };

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white',
        sizes[size],
        ring && 'ring-2 ring-brand-500/35 ring-offset-2 ring-offset-canvas',
        className
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      {initials(name) || '?'}
      {verified && (
        <span className="absolute -right-0.5 -bottom-0.5 grid h-4 w-4 place-items-center rounded-full bg-completed ring-2 ring-canvas">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      )}
    </span>
  );
}
