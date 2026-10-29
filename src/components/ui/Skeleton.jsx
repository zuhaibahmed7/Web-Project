import { cn } from '../../utils/cn';

// Skeleton placeholders (used while the browser state hydrates or a list "loads").
export function Skeleton({ className, rounded = 'rounded-sm' }) {
  return <span className={cn('skeleton block', rounded, className)} aria-hidden="true" />;
}

export function ProviderCardSkeleton() {
  return (
    <div className="glass rounded-lg p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-5 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function RowSkeleton({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 border-b border-line px-2 py-3.5 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === 0 ? 'w-1/3' : 'flex-1')} />
      ))}
    </div>
  );
}
