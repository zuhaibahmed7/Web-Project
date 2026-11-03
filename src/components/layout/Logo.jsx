import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

// Kaarigar lockup. The mark is a gable roof over a "K" monogram — home plus
// craftsman in one shape — so it reads as a trade business rather than a generic
// app icon. Inline SVG keeps it crisp at every size and needs no image asset.
export function Logo({ withText = true, size = 'md', className, tagline = false, onDark = false }) {
  const box = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }[size];
  const text = { sm: 'text-[17px]', md: 'text-[19px]', lg: 'text-[25px]' }[size];

  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Kaarigar home"
    >
      <span
        className={cn(
          'relative grid shrink-0 place-items-center overflow-hidden rounded-[11px] bg-ink-800 transition-transform duration-300 group-hover:-rotate-6',
          box
        )}
      >
        <svg viewBox="0 0 48 48" className="h-[78%] w-[78%]" aria-hidden="true">
          <defs>
            <linearGradient id="kaarigar-mark" x1="12" y1="44" x2="34" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#DDE6FA" />
              <stop offset="55%" stopColor="#8AA9EA" />
              <stop offset="100%" stopColor="#4A6FD0" />
            </linearGradient>
          </defs>
          {/* roof: the "home" half of the promise, in brand pink */}
          <path
            d="M9 16.5 24 6 39 16.5"
            fill="none"
            stroke="#FD81CC"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* K: stem plus a 45-degree arm and leg meeting on the stem */}
          <path
            d="M16 25.5v14"
            fill="none"
            stroke="url(#kaarigar-mark)"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <path
            d="M32 25.5 16 32.5 32 39.5"
            fill="none"
            stroke="url(#kaarigar-mark)"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
            kaarigar
          </span>
          {tagline && (
            <span
              className={cn(
                'mt-1 text-[11px] font-semibold tracking-[0.28em] uppercase',
                onDark ? 'text-cloud-300/70' : 'text-content-muted'
              )}
            >
              Find. Book. Fixed.
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
