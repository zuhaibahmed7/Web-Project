import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Star,
  Briefcase,
  BadgeCheck,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useI18n } from '../i18n/useI18n';
import { decorateProvider, findProvider, reviewsFor, findCategory } from '../utils/selectors';
import { formatPKR, formatDate, formatTime, relativeTime } from '../utils/format';
import { nextDays, todayISO, WEEKDAYS } from '../utils/date';
import { providerAddress } from '../data/locations';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Card, Band } from '../components/ui/Card';
import { Badge, VerificationBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Rating, RatingBreakdown } from '../components/ui/Rating';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal, Stagger, StaggerItem } from '../components/ui/Reveal';
import { ReviewCard } from '../components/cards/ReviewCard';

// Days are JS getDay() numbers: 0 = Sunday … 6 = Saturday. Monday-first, matching
// the provider's own availability editor.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const FULL_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProviderProfile() {
  const { slug } = useParams();
  const { state, currentUser } = useStore();
  const { t } = useI18n();

  const provider = useMemo(() => {
    const raw = findProvider(state, state.providers.find((p) => p.slug === slug)?.id);
    return raw ? decorateProvider(state, raw) : null;
  }, [state, slug]);

  const reviews = useMemo(() => (provider ? reviewsFor(state, provider.id) : []), [state, provider]);
  const breakdown = provider?.ratingBreakdown ?? [0, 0, 0, 0, 0];
  const days = nextDays(10, 1);

  const [previewDay, setPreviewDay] = useState(null);

  if (!provider) {
    return (
      <div className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8">
        <EmptyState
          icon={Briefcase}
          title={t('profile.notListedTitle')}
          description={t('profile.notListedBody')}
          action={
            <Button to="/browse" icon={ArrowLeft}>
              {t('profile.back')}
            </Button>
          }
        />
      </div>
    );
  }

  // Unverified businesses must not be publicly reachable (admin queue controls this).
  if (provider.verificationStatus !== 'verified') {
    return (
      <div className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShieldCheck}
          title={t('profile.notPublicTitle')}
          description={t('profile.notPublicBody', {
            name: provider.name,
            state: t(
              provider.verificationStatus === 'pending' ? 'profile.awaitingVerification' : 'profile.notApproved'
            ),
          })}
          action={
            <Button to="/browse" icon={ArrowLeft}>
              {t('profile.findVerified')}
            </Button>
          }
        />
      </div>
    );
  }

  const category = findCategory(state, provider.categoryId);
  const [from, to] = category?.accent ?? ['#09318D', '#4A6FD0'];
  const address = providerAddress(provider);
  const open = provider.availability?.days ?? [];
  const bookableDays = days.filter((d) => open.includes(d.dow) && d.iso >= todayISO());

  const slotLabel = provider.availability?.slots?.length
    ? provider.availability.slots.map((s) => `${formatTime(s.start)}–${formatTime(s.end)}`).join(' · ')
    : t('profile.noSlotsPublished');

  return (
    <>
      {/* ---------- header ---------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-80"
          style={{ background: `linear-gradient(170deg, ${from}24, ${to}14 45%, transparent)` }}
        />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="relative mx-auto max-w-[84rem] px-4 pt-6 pb-10 sm:px-6 lg:px-8 lg:pt-8">
          <Link
            to="/browse"
            className="group inline-flex items-center gap-2 text-[13px] font-semibold text-content-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 rtl:-scale-x-100 rtl:group-hover:translate-x-1" />
            {t('profile.back')}
          </Link>

          <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
            <div>
              <div className="flex flex-wrap items-start gap-5">
                <Avatar name={provider.name} size="2xl" ring verified={provider.verificationStatus === 'verified'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="glass inline-flex items-center gap-1.5 rounded-full py-1 pe-3 ps-1 text-[12px] font-bold">
                      <CategoryIcon icon={category?.icon} className="h-3.5 w-3.5 text-brand-500" />
                      {t(`category.${category?.id}`, null, category?.name)}
                    </span>
                    <VerificationBadge status={provider.verificationStatus} />
                    {provider.badges?.length > 0 && (
                      <Badge tone="aqua" size="sm" icon={BadgeCheck}>
                        {provider.badges[0]}
                      </Badge>
                    )}
                  </div>

                  <h1 className="mt-3.5 font-display text-[clamp(1.8rem,5vw,2.85rem)] leading-[1.02] font-extrabold tracking-[-0.04em]">
                    {provider.name}
                  </h1>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-content-soft text-pretty">
                    {provider.tagline}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
                    <span className="flex items-center gap-2">
                      <Rating value={provider.rating} showValue={false} size="sm" />
                      <span className="font-display font-bold">{provider.rating.toFixed(1)}</span>
                      <span className="text-content-muted">
                        ({provider.reviewCount} {t('common.reviews')})
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-content-muted">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {provider.city}
                    </span>
                    <span className="flex items-center gap-1.5 text-content-muted">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {t('profile.repliesIn', { mins: provider.responseMins })}
                    </span>
                  </div>
                </div>
              </div>

              <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: t('profile.statJobs'), value: provider.jobsCompleted, icon: Briefcase },
                  {
                    label: t('profile.statExperience'),
                    value: t('profile.yrs', { count: provider.yearsExperience }),
                    icon: ShieldCheck,
                  },
                  { label: t('profile.statServices'), value: provider.services.length, icon: CalendarPlus },
                  {
                    label: t('common.rating'),
                    value: provider.reviewCount ? `${provider.rating.toFixed(1)}★` : t('profile.new'),
                    icon: Star,
                  },
                ].map((s) => (
                  <StaggerItem key={s.label}>
                    <Card padding="sm" className="h-full">
                      <s.icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                      <p className="mt-2.5 font-display text-[19px] leading-none font-extrabold">{s.value}</p>
                      <p className="mt-1.5 text-[12px] font-semibold tracking-[0.1em] text-content-muted uppercase">
                        {s.label}
                      </p>
                    </Card>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>

            {/* ---------- sticky booking panel ---------- */}
            <Card padding="lg" className="lg:sticky lg:top-24">
              <p className="text-[12px] font-bold tracking-[0.16em] text-content-muted uppercase">
                {t('profile.indicativePrice')}
              </p>
              <p className="mt-1.5 font-display text-[28px] leading-none font-extrabold tracking-[-0.03em]">
                {provider.minPrice === null
                  ? t('profile.onRequest')
                  : t('common.fromPrice', { price: formatPKR(provider.minPrice) })}
              </p>
              {provider.maxPrice !== null && provider.minPrice !== provider.maxPrice && (
                <p className="mt-1.5 text-[13px] text-content-muted">
                  {t('profile.upTo', { price: formatPKR(provider.maxPrice) })}
                </p>
              )}

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[12px] font-bold tracking-[0.16em] text-content-muted uppercase">
                  {t('profile.nextDays')}
                </p>
                {bookableDays.length ? (
                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {bookableDays.slice(0, 5).map((d) => (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setPreviewDay(d.iso)}
                        className={cn(
                          'rounded-xs border px-1 py-2 text-center transition-colors duration-300',
                          previewDay === d.iso
                            ? 'border-brand-500/50 bg-brand-500/12'
                            : 'border-line bg-surface-2 hover:border-brand-500/30'
                        )}
                      >
                        <span className="block text-[11px] font-bold tracking-[0.06em] text-content-muted uppercase">
                          {d.isToday ? t('profile.today') : d.weekday}
                        </span>
                        <span className="mt-0.5 block font-display text-[15px] font-bold">{d.day}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-sm bg-pending/12 px-3 py-2.5 text-[13px] font-medium text-[#8a6500] dark:text-pending">
                    {t('profile.noSlotNote')}
                  </p>
                )}
                {previewDay && (
                  <p className="mt-3 text-[13px] text-content-muted">
                    {t('profile.slotsOn', { date: formatDate(previewDay), slots: slotLabel })}
                  </p>
                )}
              </div>

              {currentUser ? (
                <Button to={`/book/${provider.slug}`} full size="lg" className="mt-6" iconRight={CalendarPlus}>
                  {t('profile.requestProvider')}
                </Button>
              ) : (
                <div className="mt-6">
                  <Button
                    to={`/login?next=/provider/${provider.slug}`}
                    full
                    size="lg"
                    icon={Lock}
                  >
                    {t('profile.loginToBook')}
                  </Button>
                  <p className="mt-2.5 flex items-start gap-1.5 text-[12px] leading-snug text-content-muted">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    {t('profile.browseNote')}
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-2 border-t border-line pt-5 text-[13px]">
                {address && (
                  <p className="flex items-start gap-2 text-content-soft">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-content-muted">
                        {t('profile.shopBase')}
                      </span>
                      {address}
                    </span>
                  </p>
                )}
                <p className="flex items-center gap-2 text-content-soft">
                  <Phone className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                  {provider.phone || t('profile.phoneHidden')}
                </p>
                <p className="flex items-center gap-2 text-content-soft">
                  <Mail className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                  {provider.email || t('profile.emailOnRequest')}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ---------- detail columns ---------- */}
      <Band tone="cloud" className="py-14 lg:py-18">
        <div className="mx-auto grid grid-cols-1 max-w-[84rem] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:px-8">
          <div className="space-y-12">
            <Reveal>
              <h2 className="font-display text-[22px] font-bold tracking-[-0.03em] sm:text-[26px]">
                {t('profile.aboutTeam', { name: provider.ownerName.split(' ')[0] })}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-content-soft text-pretty">
                {provider.bio || t('profile.noBio')}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {provider.areas.map((a) => (
                  <Badge key={a} tone="neutral" size="sm" icon={MapPin}>
                    {a}
                  </Badge>
                ))}
              </div>
            </Reveal>

            <Reveal>
              <h2 className="font-display text-[22px] font-bold tracking-[-0.03em] sm:text-[26px]">
                {t('profile.servicesHeading')}
              </h2>
              {provider.services.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  tone="dashed"
                  icon={Briefcase}
                  title={t('profile.noServicesTitle')}
                  description={t('profile.noServicesBody')}
                />
              ) : (
                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                  {provider.services.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-canvas-2/60">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[16px] font-bold">{s.name}</p>
                        {s.description && (
                          <p className="mt-1 text-[13px] leading-snug text-content-muted">{s.description}</p>
                        )}
                      </div>
                      <div className="text-end">
                        <p className="font-display text-[17px] leading-none font-extrabold">{formatPKR(s.price)}</p>
                        <p className="mt-1 text-[12px] text-content-muted">{s.unit}</p>
                      </div>
                      {currentUser ? (
                        <Button to={`/book/${provider.slug}?service=${s.id}`} variant="outline" size="sm">
                          {t('profile.bookThis')}
                        </Button>
                      ) : (
                        <span className="text-[12px] font-semibold text-content-muted">{t('profile.loginToBook')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[13px] text-content-muted">{t('profile.priceNote')}</p>
            </Reveal>

            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.03em] sm:text-[26px]">
                  {t('profile.reviewsHeading')}
                </h2>
                <p className="flex items-center gap-1.5 text-[13px] text-content-muted">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  {t('profile.totalReviews', { count: provider.reviewCount })}
                </p>
              </div>

              {provider.reviewCount === 0 ? (
                <EmptyState
                  className="mt-4"
                  tone="dashed"
                  icon={Star}
                  title={t('profile.noReviewsTitle')}
                  description={t('profile.noReviewsBody')}
                />
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                  <Card padding="md" className="h-fit">
                    <p className="font-display text-[38px] leading-none font-extrabold tracking-[-0.04em]">
                      {provider.rating.toFixed(1)}
                    </p>
                    <Rating value={provider.rating} showValue={false} size="sm" className="mt-2.5" />
                    <p className="mt-2 text-[13px] text-content-muted">
                      {t('profile.basedOn', { count: provider.reviewCount })}
                    </p>
                    <div className="mt-4 border-t border-line pt-4">
                      <RatingBreakdown breakdown={breakdown} total={provider.reviewCount} />
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {reviews.slice(0, 6).map((r, i) => (
                      <Reveal key={r.id} delay={i * 0.05}>
                        <ReviewCard review={r} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </Reveal>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-[15px] font-bold">{t('profile.weeklyAvailability')}</h3>
                <span className="text-[12px] font-semibold text-content-muted">
                  {t('profile.openCount', { count: open.length })}
                </span>
              </div>
              <ul className="mt-3.5 space-y-1.5" aria-label={t('profile.workingDaysAria')}>
                {DAY_ORDER.map((index) => {
                  // Availability days follow JS getDay(): 0 = Sunday … 6 = Saturday.
                  const isOpen = open.includes(index);
                  return (
                    <li
                      key={WEEKDAYS[index]}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xs border px-2.5 py-1.5 text-[13px]',
                        isOpen ? 'border-brand-500/25 bg-brand-500/8' : 'border-line'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          isOpen ? 'bg-brand-500' : 'border border-line-strong'
                        )}
                      />
                      <span
                        className={cn(
                          'font-semibold',
                          isOpen ? 'text-content' : 'text-content-muted line-through'
                        )}
                      >
                        {t(`day.${index}`, null, FULL_WEEKDAYS[index])}
                      </span>
                      <span
                        className={cn(
                          'ms-auto text-[11px] font-bold tracking-[0.08em] uppercase',
                          isOpen ? 'text-brand-600 dark:text-brand-300' : 'text-content-muted'
                        )}
                      >
                        {isOpen ? t('profile.open') : t('profile.closed')}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3.5 flex items-start gap-2 rounded-xs bg-canvas-2/70 px-2.5 py-2 text-[12px] leading-snug text-content-soft">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
                <span>
                  <span className="font-semibold">{t('profile.hoursOnOpenDays')}</span>
                  <span className="mt-0.5 block tabular-nums">{slotLabel}</span>
                </span>
              </p>
              <p className="mt-3.5 border-t border-line pt-3.5 text-[12px] leading-snug text-content-muted">
                {t('profile.outsideWindows')}
              </p>
            </Card>

            <Card padding="md" className="bg-canvas-2/40">
              <h3 className="font-display text-[15px] font-bold">{t('profile.howRun')}</h3>
              <ol className="mt-3 space-y-2.5 text-[13px] text-content-soft">
                {[
                  t('profile.run1'),
                  t('profile.run2', { name: provider.ownerName.split(' ')[0] }),
                  t('profile.run3', { status: t('status.in_progress') }),
                  t('profile.run4', { status: t('status.completed') }),
                ].map((line, i) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/12 text-[12px] font-bold text-brand-600 dark:text-brand-300">
                      {i + 1}
                    </span>
                    {line}
                  </li>
                ))}
              </ol>
              <Button to="/how-it-works" variant="quiet" size="sm" className="mt-4" full>
                {t('profile.readRules')}
              </Button>
            </Card>

            <p className="text-[12px] leading-relaxed text-content-muted">
              {t('profile.joinedListed', {
                when: relativeTime(provider.joinedAt),
                city: provider.city,
                category: t(`category.${category?.id}`, null, category?.name),
              })}
            </p>
          </aside>
        </div>
      </Band>
    </>
  );
}
