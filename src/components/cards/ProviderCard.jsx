import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';
import { formatPKR, formatDayShort } from '../../utils/format';
import { cn } from '../../utils/cn';
import { TiltCard } from '../ui/Card';
import { Badge, VerificationBadge } from '../ui/Badge';
import { Rating } from '../ui/Rating';
import { tradePhoto } from '../../assets/photos/index.js';

// The marketplace listing card. Everything shown here is derived from the store,
// so a new review or a status change appears immediately.

// The banner crops a 3:2 photo into a ~2.6:1 band, so a centred crop can slice the
// subject out of frame entirely — the cleaning shot becomes blank carpet. Where
// that happens the focal point is stated here; every other photo keeps the centre.
const PHOTO_FOCUS = {
  cleaning: '30% 0%',
};

// The banner. A trade photo over the category's own accent gradient; until a
// photo exists the gradient stands on its own, so the header is never empty. The
// scrim keeps the city and category labels legible over either.
function CardMedia({ provider, compact }) {
  const { t } = useI18n();
  const [from, to] = provider.category?.accent ?? ['#09318D', '#4A6FD0'];
  const photo = tradePhoto(provider.category?.slug);
  const focus = PHOTO_FOCUS[provider.category?.slug];
  const badge = provider.badges?.[0];

  return (
    <div className={cn('noise relative shrink-0 overflow-hidden', compact ? 'w-28 sm:w-36' : 'h-36')}>
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(125deg, ${from}, ${to})` }}
      />
      {photo && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          style={focus ? { objectPosition: focus } : undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink-800/90 via-ink-800/30 to-transparent"
      />

      {!compact && (
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-1.5">
          {badge && (
            <span className="max-w-full truncate rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-ink-800 backdrop-blur-sm">
              {badge}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-800/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
            {provider.nextAvailable
              ? t('card.nextSlot', { day: formatDayShort(provider.nextAvailable) })
              : t('card.noSlots')}
          </span>
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-ink-800/55 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{provider.city}</span>
        </span>
        {!compact && provider.category && (
          <span className="truncate text-[11px] font-bold tracking-[0.12em] text-white/90 uppercase">
            {t(`category.${provider.category.id}`, null, provider.category.name)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProviderCard({ provider, compact = false }) {
  const { t } = useI18n();
  const price = provider.minPrice === null ? t('card.priceOnRequest') : formatPKR(provider.minPrice);
  const tags = provider.services.slice(0, compact ? 3 : 4);

  return (
    <TiltCard className="h-full" contentClassName={cn('flex h-full flex-col', compact && 'flex-row')}>
      <CardMedia provider={provider} compact={compact} />

      <div className={cn('flex min-w-0 flex-1 flex-col', compact ? 'p-4' : 'px-5 pb-5 pt-4')}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate font-display text-[17px] leading-tight font-bold">
            <Link to={`/provider/${provider.slug}`} className="transition-colors hover:text-brand-600">
              {provider.name}
            </Link>
          </h3>
          <VerificationBadge status={provider.verificationStatus} className="shrink-0" />
        </div>

        <p className="mt-1.5 truncate text-[13px] text-content-muted">{provider.tagline}</p>

        {provider.reviewCount > 0 ? (
          <div className="mt-2.5 flex items-center gap-2">
            <Rating value={provider.rating} size="md" />
            <span className="text-[12px] text-content-muted">
              {t('card.reviews', { count: provider.reviewCount })}
            </span>
          </div>
        ) : (
          <div className="mt-2.5">
            <Badge tone="neutral" size="sm">
              {t('card.newOn')}
            </Badge>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((s) => (
              <span
                key={s.id}
                className="rounded-sm bg-canvas-2 px-2 py-1 text-[12px] font-medium text-content-soft ring-1 ring-line"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="truncate font-display text-[19px] leading-none font-extrabold tracking-[-0.02em]">
              {price}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold tracking-[0.1em] text-content-muted uppercase">
              {t('card.startingFrom')}
            </p>
          </div>
          <Link
            to={`/provider/${provider.slug}`}
            className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-brand-500/45 px-4 text-[13px] font-bold text-brand-600 transition-colors duration-300 hover:bg-brand-500 hover:text-white active:scale-95 dark:text-brand-300"
          >
            {t('card.viewProfile')}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>
    </TiltCard>
  );
}
