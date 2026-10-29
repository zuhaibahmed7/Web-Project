import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

// FixNow wordmark. The mark is inline SVG so it stays crisp and needs no asset.
export function Logo({ withText = true, size = 'md', className, tagline = false, onDark = false }) {
  const box = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }[size];
  const text = { sm: 'text-[17px]', md: 'text-[19px]', lg: 'text-[25px]' }[size];

  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="FixNow home"
    >
      <span
        className={cn(
          'relative grid shrink-0 place-items-center overflow-hidden rounded-[11px] bg-ink-800 transition-transform duration-300 group-hover:-rotate-6',
          box
        )}
      >
        <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]" aria-hidden="true">
          <defs>
            <linearGradient id="fixnow-mark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8B78F5" />
              <stop offset="55%" stopColor="#6C5CE7" />
              <stop offset="100%" stopColor="#00D4C8" />
            </linearGradient>
          </defs>
          <path
            d="M23.4 8.1a6.2 6.2 0 0 0-7.9 7.6l-6.8 6.8a2.3 2.3 0 0 0 3.2 3.2l6.8-6.8a6.2 6.2 0 0 0 7.6-7.9l-3.6 3.6-2.9-.8-.8-2.9 3.6-3.6a6.2 6.2 0 0 0-.2.8z"
            fill="url(#fixnow-mark)"
          />
          <circle cx="8.6" cy="9.4" r="1.9" fill="#FFB020" />
        </svg>
        <span className="absolute inset-0 rounded-[11px] ring-1 ring-inset ring-white/14" />
      </span>
      {withText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display font-extrabold tracking-[-0.045em]',
              text,
              onDark ? 'text-white' : 'text-content'
            )}
          >
            Fix<span className={onDark ? 'text-aqua-400' : 'grad-text'}>Now</span>
          </span>
          {tagline && (
            <span
              className={cn(
                'mt-1 text-[9.5px] font-semibold tracking-[0.28em] uppercase',
                onDark ? 'text-cloud-300/70' : 'text-content-muted'
              )}
            >
              Find. Book. Fix.
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
