import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, Briefcase } from 'lucide-react';
import { formatPKR, formatDayShort } from '../../utils/format';
import { TiltCard } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge, VerificationBadge } from '../ui/Badge';
import { CategoryIcon } from '../ui/CategoryIcon';

// The marketplace listing card. Everything shown here is derived from the store,
// so a new review or a status change appears immediately.
export function ProviderCard({ provider, compact = false }) {
  const [from, to] = provider.category?.accent ?? ['#6C5CE7', '#00D4C8'];
  const priceLabel =
    provider.minPrice === null
      ? 'Price on request'
      : provider.minPrice === provider.maxPrice
        ? formatPKR(provider.minPrice)
        : `${formatPKR(provider.minPrice)} – ${formatPKR(provider.maxPrice)}`;

  return (
    <TiltCard className="h-full" contentClassName="flex h-full flex-col">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-24"
        style={{ background: `linear-gradient(125deg, ${from}2e, ${to}1f 55%, transparent)` }}
      />
      <span className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-canvas-2 text-brand-500 ring-1 ring-line">
        <CategoryIcon icon={provider.category?.icon} className="h-4 w-4" />
      </span>

      <div className="relative flex gap-4 p-5">
        <Avatar name={provider.name} size="lg" ring />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[17px] leading-tight font-bold">
            <Link to={`/provider/${provider.slug}`} className="transition-colors hover:text-brand-600">
              {provider.name}
            </Link>
          </h3>
          <p className="mt-1 truncate text-[13px] text-content-muted">{provider.tagline}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {provider.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[13px] font-bold">
                <Star className="h-3.5 w-3.5 fill-glow-400 text-glow-400" aria-hidden="true" />
                {provider.rating.toFixed(1)}
                <span className="font-normal text-content-muted">({provider.reviewCount})</span>
              </span>
            ) : (
              <Badge tone="neutral" size="sm">
                New on FixNow
              </Badge>
            )}
            <VerificationBadge status={provider.verificationStatus} />
          </div>
        </div>
      </div>

      {!compact && (
        <div className="px-5 pb-4 text-[13px] text-content-soft">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
            <span className="truncate">
              {provider.city} · {provider.areas.slice(0, 2).join(', ')}
              {provider.areas.length > 2 ? ` +${provider.areas.length - 2}` : ''}
            </span>
          </p>
          <p className="mt-2 flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
            <span className="truncate">
              {provider.services.length} service{provider.services.length === 1 ? '' : 's'} ·{' '}
              {provider.jobsCompleted} jobs done
            </span>
          </p>
          <p className="mt-2 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
            {provider.nextAvailable ? (
              <span className="font-semibold text-aqua-700 dark:text-aqua-300">
                Next slot {formatDayShort(provider.nextAvailable)}
              </span>
            ) : (
              <span className="text-content-muted">No open slots this week</span>
            )}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold tracking-[0.14em] text-content-muted uppercase">Indicative</p>
          <p className="truncate font-display text-[15px] font-bold">{priceLabel}</p>
        </div>
        <Link
          to={`/provider/${provider.slug}`}
          className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm grad-brand px-4 text-[13px] font-bold text-white shadow-[0_10px_26px_-14px_rgb(108_92_231_/_0.9)] transition-[transform,filter] duration-300 hover:brightness-105 active:scale-95"
        >
          View & book
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </TiltCard>
  );
}
