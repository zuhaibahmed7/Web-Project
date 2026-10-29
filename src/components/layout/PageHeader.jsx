import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Reveal } from '../ui/Reveal';

// Shared page opener: eyebrow, one strong title, supporting line, actions on the
// right. Keeps every screen's first fold consistent.
export function PageHeader({ eyebrow, title, description, actions, back, backLabel, className }) {
  return (
    <div className={cn('mb-6', className)}>
      {back && (
        <Link
          to={back}
          className="group mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          {backLabel ?? 'Back'}
        </Link>
      )}
      <Reveal>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-brand-500 uppercase dark:text-brand-300">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-[26px] leading-[1.05] font-extrabold sm:text-[32px] lg:text-[38px]">
              {title}
            </h1>
            {description && (
              <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-content-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </Reveal>
    </div>
  );
}
