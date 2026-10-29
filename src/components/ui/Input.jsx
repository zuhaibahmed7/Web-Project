import { forwardRef, useId } from 'react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

const FIELD_BASE =
  'w-full rounded-sm border bg-surface px-3.5 text-[15px] text-content placeholder:text-content-muted/70 ' +
  'transition-[border-color,box-shadow,background-color] duration-200 outline-none ' +
  'border-line hover:border-line-strong ' +
  'focus:border-brand-500 focus:shadow-[0_0_0_3px_rgb(108_92_231_/_0.18)] ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

// Label + hint + error wrapper. Every form control in the app uses this so
// required fields are marked and errors read the same way everywhere (NFR-26/27).
export function Field({ label, htmlFor, error, hint, required, children, className, counter }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-[13px] font-semibold tracking-[-0.01em] text-content-soft"
        >
          {label}
          {required && (
            <span className="text-rejected" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}
      {children}
      <div className="flex min-h-[16px] items-start justify-between gap-3">
        {error ? (
          <p id={`${htmlFor}-error`} className="flex items-center gap-1 text-[12.5px] font-medium text-rejected dark:text-[#ff8a8a]">
            <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : (
          hint && <p className="text-[12.5px] text-content-muted">{hint}</p>
        )}
        {counter && <span className="shrink-0 text-[12px] tabular-nums text-content-muted">{counter}</span>}
      </div>
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, required, icon: Icon, className, inputClassName, id, type = 'text', suffix, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-content-muted"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={fieldId}
          type={type}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            FIELD_BASE,
            'h-11',
            Icon && 'pl-10',
            suffix && 'pr-14',
            error && 'border-rejected focus:border-rejected focus:shadow-[0_0_0_3px_rgb(239_68_68_/_0.18)]',
            inputClassName,
            className
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[12px] font-semibold text-content-muted">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, id, rows = 4, maxLength, showCount, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const value = rest.value;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      required={required}
      counter={showCount && maxLength ? `${value?.length ?? 0}/${maxLength}` : undefined}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          FIELD_BASE,
          'resize-y py-3 leading-relaxed',
          error && 'border-rejected focus:border-rejected focus:shadow-[0_0_0_3px_rgb(239_68_68_/_0.18)]',
          className
        )}
        {...rest}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, className, id, options = [], placeholder, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          className={cn(FIELD_BASE, 'h-11 appearance-none pr-10', error && 'border-rejected', className)}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-content-muted"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
});

// Checkbox with a proper label, used for filters and confirmations.
export function Checkbox({ label, description, id, className, ...rest }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        id={fieldId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
        aria-describedby={description ? `${fieldId}-desc` : undefined}
        {...rest}
      />
      <div className="min-w-0">
        <label htmlFor={fieldId} className="cursor-pointer text-[13.5px] font-medium text-content">
          {label}
        </label>
        {description && (
          <p id={`${fieldId}-desc`} className="mt-0.5 text-[12px] text-content-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// Segmented control used for sorting, status tabs and theme switching.
export function Segmented({ options, value, onChange, ariaLabel, size = 'md', className }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-full border border-line bg-canvas-2/80 p-1',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative rounded-full font-semibold tracking-[-0.01em] transition-all duration-200',
              size === 'sm' ? 'px-3 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]',
              active
                ? 'bg-ink-800 text-white shadow-hair dark:bg-white dark:text-ink-800'
                : 'text-content-muted hover:text-content'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Accessible on/off switch.
export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group inline-flex items-center gap-3 text-left disabled:opacity-50',
        label && 'cursor-pointer'
      )}
    >
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300',
          checked ? 'border-brand-500 bg-brand-500' : 'border-line-strong bg-canvas-2'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-hair transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            checked && 'translate-x-5'
          )}
        />
      </span>
      {label && (
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold text-content">{label}</span>
          {description && <span className="block text-[12px] text-content-muted">{description}</span>}
        </span>
      )}
    </button>
  );
}
