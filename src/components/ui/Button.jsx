import { Link } from 'react-router-dom';
import { LoaderCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

// One button component used everywhere. Pass `to` to render as a router link.
const VARIANTS = {
  primary:
    'grad-brand text-white shadow-[0_10px_30px_-12px_rgb(108_92_231_/_0.85)] hover:shadow-[0_16px_40px_-12px_rgb(108_92_231_/_1)] hover:brightness-[1.06]',
  dark: 'bg-ink-800 text-white hover:bg-ink-700 shadow-hair',
  secondary:
    'glass text-content hover:border-brand-500/45 hover:shadow-lift',
  outline:
    'border border-line-strong bg-transparent text-content hover:border-brand-500/60 hover:bg-brand-500/8',
  ghost: 'bg-transparent text-content-soft hover:bg-ink-800/6 hover:text-content dark:hover:bg-white/8',
  danger: 'bg-rejected text-white hover:brightness-110 shadow-[0_10px_28px_-14px_rgb(239_68_68_/_0.9)]',
  success: 'bg-completed text-white hover:brightness-110 shadow-[0_10px_28px_-14px_rgb(16_185_129_/_0.9)]',
  accent: 'bg-aqua-400 text-ink-800 hover:brightness-105 shadow-[0_10px_28px_-14px_rgb(0_212_200_/_0.9)]',
  amber: 'bg-glow-400 text-ink-800 hover:brightness-105 shadow-[0_10px_28px_-14px_rgb(255_176_32_/_0.9)]',
  quiet: 'bg-canvas-2 text-content hover:bg-cloud-300 dark:hover:bg-ink-700',
  neutral: 'border border-line-strong bg-canvas-2 text-content-soft hover:bg-cloud-300 dark:hover:bg-ink-700',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xs',
  md: 'h-11 px-5 text-sm gap-2 rounded-sm',
  lg: 'h-13 px-7 text-[15px] gap-2.5 rounded-md',
  icon: 'h-10 w-10 justify-center rounded-sm',
  iconSm: 'h-8 w-8 justify-center rounded-xs',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  full = false,
  className,
  ...rest
}) {
  const classes = cn(
    'group relative inline-flex select-none items-center justify-center overflow-hidden font-semibold tracking-[-0.01em]',
    'transition-[transform,box-shadow,background-color,border-color,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'active:scale-[0.975] disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    full && 'w-full',
    className
  );

  const inner = (
    <>
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className={cn('h-4 w-4 shrink-0', IconRight ? '' : '-ml-0.5')} aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={classes} {...rest}>
        {inner}
      </Link>
    );
  }

  if (href && !disabled && !loading) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...rest}>
        {inner}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled || loading} className={classes} {...rest}>
      {inner}
    </button>
  );
}

// Small text-shaped action used inside tables and card footers.
export function LinkButton({ to, children, className, icon: Icon = ArrowRight, ...rest }) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-aqua-600 dark:text-brand-300 dark:hover:text-aqua-300',
        className
      )}
      {...rest}
    >
      {children}
      <Icon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
