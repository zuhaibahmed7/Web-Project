import { Quote } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Rating } from '../ui/Rating';

// A single customer review. Used on provider profiles and in "My reviews".
export function ReviewCard({ review, providerName, showCustomer = true, className }) {
  return (
    <article className={cn('glass relative overflow-hidden rounded-lg p-5', className)}>
      <Quote
        className="absolute -top-2 right-3 h-14 w-14 text-brand-500/10"
        aria-hidden="true"
        strokeWidth={1.2}
      />
      <header className="relative flex items-center gap-3">
        <Avatar name={showCustomer ? review.customerName : (providerName ?? '?')} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold">
            {showCustomer ? review.customerName : providerName}
          </p>
          <p className="text-[12px] text-content-muted">{formatDate(review.createdAt)}</p>
        </div>
        <div className="ml-auto shrink-0">
          <Rating value={review.rating} showValue={false} size="sm" />
        </div>
      </header>
      <p className="relative mt-3.5 text-[14px] leading-relaxed text-content-soft text-pretty">{review.comment}</p>
    </article>
  );
}
