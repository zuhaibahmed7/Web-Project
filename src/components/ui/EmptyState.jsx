import { cn } from '../../utils/cn';

// Friendly placeholder for empty lists and no-result searches (SC-02, SC-15).
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  tone = 'default',
  className,
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center overflow-hidden rounded-xl px-6 py-14 text-center',
        tone === 'dashed'
          ? 'border border-dashed border-line-strong bg-canvas-2/40'
          : 'glass',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(60%_100%_at_50%_100%,rgb(108_92_231_/_0.16),transparent)]"
      />
      {Icon && (
        <span className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-line bg-canvas-2 text-brand-500 dark:text-brand-300">
          <Icon className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
          <span className="absolute inset-0 rounded-2xl animate-pulse-ring" />
        </span>
      )}
      <h3 className="relative font-display text-[19px] font-bold tracking-[-0.02em] text-content">{title}</h3>
      {description && (
        <p className="relative mt-2 max-w-md text-[14.5px] leading-relaxed text-content-muted text-pretty">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
