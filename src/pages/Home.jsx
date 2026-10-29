import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Star,
  ShieldCheck,
  Clock,
  MapPin,
  CircleCheck,
  Wrench,
  Sparkles,
  Zap,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { publicProviders, decoratedProviders, topRated, marketplaceStats } from '../utils/selectors';
import { STATUS_META, STATUS_ORDER, canCancel, canReview } from '../utils/booking';
import { formatPKRShort } from '../utils/format';
import { useCountUp } from '../hooks/useCountUp';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, Band, TiltCard } from '../components/ui/Card';
import { Reveal, Stagger, StaggerItem, MaskLines } from '../components/ui/Reveal';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { ProviderCard } from '../components/cards/ProviderCard';
import { CategoryTile } from '../components/cards/CategoryTile';
import { ReviewCard } from '../components/cards/ReviewCard';
import ToolsMoment from '../components/three/ToolsMoment';
import { DASHBOARD_PATH } from '../utils/nav';

const HERO_CHIPS = [
  { icon: Clock, text: 'Same-day slots', tone: 'from-brand-500 to-brand-400' },
  { icon: ShieldCheck, text: 'Verified pros only', tone: 'from-aqua-400 to-aqua-300' },
  { icon: Star, text: 'Real reviews', tone: 'from-glow-400 to-glow-300' },
];

function TrustNumber({ value, label, suffix = '', decimals = 0 }) {
  const { ref, display } = useCountUp(value, { decimals });
  return (
    <div ref={ref}>
      <p className="font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] sm:text-[30px]">
        {display}
        {suffix}
      </p>
      <p className="mt-1.5 text-[12px] font-semibold tracking-[0.1em] text-content-muted uppercase">{label}</p>
    </div>
  );
}

// A small interactive demo of the lifecycle rules — the SRS's core logic, shown
// rather than described.
function LifecycleDemo() {
  const [status, setStatus] = useState('pending');
  const meta = STATUS_META[status];
  const sample = { id: 'demo', code: 'FN-DEMO', status };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] text-aqua-600 uppercase dark:text-aqua-300">
          Booking lifecycle
        </p>
        <h2 className="mt-4 font-display text-[30px] leading-[1.03] font-extrabold tracking-[-0.035em] sm:text-[38px]">
          Six statuses.
          <br />
          <span className="grad-text">Zero ambiguity.</span>
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-content-muted text-pretty">
          Every request moves through the same track, and the rules decide what you are allowed to do at each stop.
          Tap a status to see what it means.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          {Object.keys(STATUS_META).map((key) => {
            const active = key === status;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-300 active:scale-95',
                  active
                    ? 'border-transparent bg-ink-800 text-white dark:bg-white dark:text-ink-800'
                    : 'border-line bg-surface-2 text-content-muted hover:text-content'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', STATUS_META[key].dot)} aria-hidden="true" />
                {STATUS_META[key].label}
              </button>
            );
          })}
        </div>
      </div>

      <Reveal delay={0.1}>
        <Card padding="lg" className="relative overflow-hidden">
          <span
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: meta.color }}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-[19px] font-bold">{meta.label}</p>
              <p className="mt-1 text-[13.5px] text-content-muted">{meta.blurb}</p>
            </div>
            <span
              className="grid h-12 w-12 place-items-center rounded-full text-white"
              style={{ background: meta.color }}
              aria-hidden="true"
            >
              <Wrench className="h-5 w-5" />
            </span>
          </div>

          <ol className="mt-7 space-y-3.5">
            {STATUS_ORDER.map((key, i) => {
              const reached = STATUS_ORDER.indexOf(status) >= i && !['rejected', 'cancelled'].includes(status);
              return (
                <li key={key} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors duration-500',
                      reached ? 'bg-brand-500 text-white' : 'bg-canvas-2 text-content-muted'
                    )}
                  >
                    {reached ? <CircleCheck className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn('text-[14px] font-semibold', reached ? 'text-content' : 'text-content-muted')}>
                    {STATUS_META[key].label}
                  </span>
                  <span className="ml-auto text-[11.5px] text-content-muted">
                    {['Customer sends', 'Provider confirms', 'Work begins', 'Job finished'][i]}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 grid gap-2 border-t border-line pt-5 text-[13px]">
            <p className="flex items-center gap-2 text-content-soft">
              <CircleCheck className={cn('h-4 w-4', canCancel(sample, 'customer') ? 'text-completed' : 'text-cancelled')} />
              Cancel by customer {canCancel(sample, 'customer') ? 'is available' : 'is locked'}
            </p>
            <p className="flex items-center gap-2 text-content-soft">
              <CircleCheck className={cn('h-4 w-4', canReview(sample, false) ? 'text-completed' : 'text-cancelled')} />
              Review {canReview(sample, false) ? 'can be left' : 'stays locked until Completed'}
            </p>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

export default function Home() {
  const { state, currentUser } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');

  const providers = useMemo(() => publicProviders(state), [state]);
  const stats = useMemo(() => marketplaceStats(state), [state]);
  const featured = useMemo(() => topRated(state, 6), [state]);
  const wall = useMemo(
    () =>
      state.reviews
        .filter((r) => r.rating >= 4 && r.comment.length > 90)
        .slice(0, 3)
        .map((r) => ({ ...r, provider: decoratedProviders(state).find((p) => p.id === r.providerId) })),
    [state]
  );
  const cities = useMemo(() => [...new Set(providers.map((p) => p.city))].sort(), [providers]);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city) params.set('city', city);
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgb(108_92_231_/_0.28),transparent_65%)] blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-10 -right-24 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgb(0_212_200_/_0.22),transparent_65%)] blur-2xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-[84rem] gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:pt-16 lg:pb-24">
          <div>
            <Reveal>
              <span className="glass inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[12.5px] font-semibold">
                <span className="grid h-6 w-6 place-items-center rounded-full grad-brand text-white">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                </span>
                Pakistan&apos;s home service marketplace
              </span>
            </Reveal>

            <h1 className="mt-6 font-display text-[clamp(2.6rem,8.4vw,4.6rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
              <MaskLines lines={['Find a pro.', 'Book them today.']} />
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="grad-text block">Fix it this week.</span>
              </span>
            </h1>

            <Reveal delay={0.15}>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-content-soft text-pretty sm:text-[17px]">
                Plumbers, electricians, AC technicians, cleaners, painters, carpenters and mechanics — compared side by
                side on price, rating and availability, with a booking track you can actually follow.
              </p>
            </Reveal>

            {/* The search field IS the product's first action. */}
            <Reveal delay={0.22}>
              <form
                onSubmit={search}
                className="glass mt-8 flex flex-col gap-2 rounded-xl p-2 sm:flex-row sm:items-center sm:rounded-2xl"
              >
                <label htmlFor="hero-q" className="sr-only">
                  What service do you need?
                </label>
                <div className="flex flex-1 items-center gap-2.5 px-3">
                  <Search className="h-[18px] w-[18px] shrink-0 text-content-muted" aria-hidden="true" />
                  <input
                    id="hero-q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Leaking tap, split AC, deep clean…"
                    className="h-11 w-full bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-content-muted"
                  />
                </div>
                <label htmlFor="hero-city" className="sr-only">
                  City
                </label>
                <div className="flex items-center gap-2.5 border-line px-3 sm:border-l">
                  <MapPin className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                  <select
                    id="hero-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 w-full bg-transparent text-[14px] font-semibold outline-none sm:w-32"
                  >
                    <option value="">Any city</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" size="lg" iconRight={ArrowRight} className="sm:h-12">
                  Search
                </Button>
              </form>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {state.categories.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    to={`/browse?category=${c.slug}`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-content-soft transition-[border-color,color,transform] duration-300 hover:border-brand-500/40 hover:text-content active:scale-95"
                  >
                    <CategoryIcon icon={c.icon} className="h-3.5 w-3.5 text-brand-500" />
                    {c.name}
                    <span className="text-content-muted">from {formatPKRShort(c.from)}</span>
                  </Link>
                ))}
              </div>
            </Reveal>

            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-7 sm:grid-cols-4">
              <TrustNumber value={providers.length} label="Verified pros" />
              <TrustNumber value={stats.totalBookings} label="Bookings tracked" />
              <TrustNumber value={stats.averageRating} label="Average rating" decimals={1} suffix="★" />
              <TrustNumber value={state.categories.length} label="Service types" />
            </div>
          </div>

          {/* 3D moment, framed like a product panel rather than a decorative blob. */}
          <Reveal delay={0.1} y={30}>
            <div className="relative">
              <div className="glass grad-frame noise relative overflow-hidden rounded-3xl p-1">
                <span className="grad-ring" aria-hidden="true" />
                <div className="relative h-[22rem] overflow-hidden rounded-[26px] bg-[radial-gradient(120%_100%_at_50%_0%,rgb(108_92_231_/_0.14),transparent_60%)] sm:h-[27rem]">
                  <ToolsMoment className="h-full w-full" />

                  <div className="pointer-events-none absolute top-5 left-5 flex flex-col gap-2">
                    {HERO_CHIPS.map((chip, i) => (
                      <span
                        key={chip.text}
                        className={cn(
                          'glass inline-flex w-fit items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-[12px] font-bold',
                          i === 1 && 'ml-6',
                          i === 2 && 'ml-2'
                        )}
                        style={{ animation: `fixnow-float ${6 + i}s ease-in-out ${i * 0.4}s infinite` }}
                      >
                        <span
                          className={cn('grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br text-white', chip.tone)}
                          aria-hidden="true"
                        >
                          <chip.icon className="h-3 w-3" />
                        </span>
                        {chip.text}
                      </span>
                    ))}
                  </div>

                  <div className="pointer-events-none absolute right-5 bottom-5 w-44">
                    <Card padding="sm" className="glass-2 shadow-none">
                      <p className="text-[10.5px] font-bold tracking-[0.14em] text-content-muted uppercase">Live request</p>
                      <p className="mt-1.5 font-display text-[14px] font-bold">Split AC service</p>
                      <p className="text-[12px] text-content-muted">Gulshan-e-Iqbal · Karachi</p>
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-pending/15 px-2 py-0.5 text-[11px] font-bold text-[#8a6500] dark:text-glow-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-pending" aria-hidden="true" />
                        Pending
                      </span>
                    </Card>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[12.5px] text-content-muted lg:text-left">
                {currentUser
                  ? 'You are signed in — jump back into your workspace.'
                  : 'Browse freely as a guest. You only need an account to book.'}
              </p>
              {currentUser && (
                <Button to={DASHBOARD_PATH[currentUser.role]} className="mt-3 w-full lg:w-auto" iconRight={ArrowRight}>
                  Open my dashboard
                </Button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- marquee ---------------- */}
      <section className="relative overflow-hidden border-y border-line bg-ink-800 py-3.5 text-white">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap" aria-hidden="true">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-10">
              {state.categories.map((c) => (
                <span key={c.id} className="flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.08em] uppercase">
                  <CategoryIcon icon={c.icon} className="h-4 w-4 text-aqua-400" />
                  {c.name}
                  <span className="text-white/30">·</span>
                  <span className="text-white/55 normal-case">{formatPKRShort(c.from)}+</span>
                </span>
              ))}
              <span className="flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.08em] uppercase">
                <Zap className="h-4 w-4 text-glow-400" />
                Same-day booking
              </span>
            </div>
          ))}
        </div>
        <p className="sr-only">
          Categories available on FixNow: {state.categories.map((c) => c.name).join(', ')}.
        </p>
      </section>

      {/* ---------------- categories ---------------- */}
      <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="text-[11px] font-bold tracking-[0.2em] text-brand-500 uppercase dark:text-brand-300">
              Start with a category
            </p>
            <h2 className="mt-3 max-w-xl font-display text-[30px] leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-[40px]">
              Seven trades, one booking track
            </h2>
          </Reveal>
          <Link
            to="/providers"
            className="group inline-flex items-center gap-1.5 text-[14px] font-bold text-brand-600 transition-colors hover:text-aqua-600 dark:text-brand-300"
          >
            Browse every provider
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <Stagger className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.06}>
          {state.categories.map((c, i) => (
            <StaggerItem key={c.id} className={cn('h-full', i === 0 && 'sm:col-span-2 lg:col-span-2 lg:row-span-1')}>
              <CategoryTile
                category={c}
                count={providers.filter((p) => p.categoryId === c.id).length}
                dense={i !== 0}
              />
            </StaggerItem>
          ))}
          <StaggerItem className="h-full">
            <TiltCard contentClassName="flex h-full flex-col" tilt={4}>
              <div className="flex h-full flex-col justify-between p-5">
                <span className="grid h-11 w-11 place-items-center rounded-sm bg-canvas-2 text-brand-500">
                  <Wrench className="h-5 w-5" />
                </span>
                <div className="mt-6">
                  <h3 className="font-display text-[17px] font-bold">Need something unusual?</h3>
                  <p className="mt-1.5 text-[13px] leading-snug text-content-muted">
                    Search by the problem instead — &ldquo;water pump&rdquo;, &ldquo;fan motor&rdquo;, &ldquo;sofa
                    shampoo&rdquo;.
                  </p>
                  <Button to="/browse" variant="outline" size="sm" className="mt-4" iconRight={ArrowRight}>
                    Free-text search
                  </Button>
                </div>
              </div>
            </TiltCard>
          </StaggerItem>
        </Stagger>
      </section>

      {/* ---------------- lifecycle demo ---------------- */}
      <Band tone="grad" className="py-16 lg:py-24">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
          <LifecycleDemo />
        </div>
      </Band>

      {/* ---------------- featured providers ---------------- */}
      <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="text-[11px] font-bold tracking-[0.2em] text-aqua-600 uppercase dark:text-aqua-300">
              Highest rated this month
            </p>
            <h2 className="mt-3 font-display text-[30px] leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-[40px]">
              Trusted across Pakistan
            </h2>
          </Reveal>
          <p className="max-w-xs text-[13.5px] leading-relaxed text-content-muted">
            Ratings come from customers who finished a booking — the same maths powers the provider profile pages.
          </p>
        </div>

        <Stagger className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <StaggerItem key={p.id} className="h-full">
              <ProviderCard provider={p} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------------- provider pitch ---------------- */}
      <section className="mx-auto max-w-[84rem] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="noise relative overflow-hidden rounded-3xl bg-ink-800 text-white">
          <div
            className="pointer-events-none absolute -top-28 -right-16 h-80 w-80 rounded-full bg-brand-500/35 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-aqua-400/25 blur-[100px]"
            aria-hidden="true"
          />
          <div className="relative grid gap-10 p-7 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-aqua-400 uppercase">For service providers</p>
              <h2 className="mt-4 font-display text-[30px] leading-[1.04] font-extrabold tracking-[-0.035em] sm:text-[40px]">
                Your workshop, online by 6pm
              </h2>
              <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-cloud-300/80 text-pretty">
                Publish your services with indicative PKR prices, set the days and slots you can actually keep, then
                accept or decline requests with a reason. Nothing is billed through FixNow — you agree the job directly
                with the customer.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  'Verification badge once an admin approves you',
                  'Requests, confirmations and completions in one queue',
                  'Availability controls stop double-booking',
                  'Reviews rebuild your rating automatically',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[14px] text-cloud-100/90">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-aqua-400" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button to="/register?role=provider" variant="accent" size="lg" iconRight={ArrowRight}>
                  List your business
                </Button>
                <Button to="/how-it-works" variant="ghost" size="lg" className="text-cloud-100 hover:bg-white/10">
                  See how booking works
                </Button>
              </div>
            </div>

            <Reveal delay={0.12} y={26}>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[15px] font-bold">New request · FN-2841</p>
                  <Badge tone="amber" size="sm">
                    Pending
                  </Badge>
                </div>
                <p className="mt-3 text-[13.5px] text-cloud-300/80">
                  <span className="font-bold text-white">Ayesha Khan</span> needs Split AC servicing tomorrow at 11:00
                  in DHA Phase 5.
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-[12.5px]">
                  <div className="rounded-lg bg-white/8 p-3">
                    <dt className="text-cloud-300/70">Indicative price</dt>
                    <dd className="mt-1 font-display text-[16px] font-bold">PKR 2,500</dd>
                  </div>
                  <div className="rounded-lg bg-white/8 p-3">
                    <dt className="text-cloud-300/70">Response time</dt>
                    <dd className="mt-1 font-display text-[16px] font-bold">35 min</dd>
                  </div>
                </dl>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <span className="grid h-11 place-items-center rounded-sm bg-completed font-display text-[14px] font-bold text-white">
                    Accept
                  </span>
                  <span className="grid h-11 place-items-center rounded-sm border border-white/20 font-display text-[14px] font-bold text-white/85">
                    Decline
                  </span>
                </div>
                <p className="mt-3 text-[11.5px] text-cloud-300/60">
                  Illustrative UI from the prototype — decisions in the real dashboard update the customer instantly.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- reviews ---------------- */}
      {wall.length > 0 && (
        <section className="mx-auto max-w-[84rem] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <Reveal>
            <p className="text-[11px] font-bold tracking-[0.2em] text-glow-500 uppercase dark:text-glow-300">
              What customers said
            </p>
            <h2 className="mt-3 font-display text-[30px] leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-[40px]">
              Reviews left after a completed job
            </h2>
          </Reveal>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wall.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.08} className="h-full">
                <ReviewCard
                  review={r}
                  showCustomer={false}
                  providerName={r.provider?.name}
                  className={cn('h-full', i === 1 && 'sm:mt-6', i === 2 && 'lg:mt-3')}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- rules ---------------- */}
      <Band tone="cloud" className="py-16 lg:py-20">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: 'Verified before listed',
                body: 'Administrators approve each business, so the directory only shows providers who passed review.',
              },
              {
                icon: Clock,
                title: 'Cancel while Pending',
                body: 'You can withdraw a request until a provider accepts it. After that, talk to the provider.',
              },
              {
                icon: Star,
                title: 'Reviews need completion',
                body: 'Only a finished booking unlocks the rating form, so scores reflect real jobs.',
              },
              {
                icon: Wallet,
                title: 'Prices are indicative',
                body: 'PKR figures show what a job typically costs; the final amount is agreed on site.',
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <Card className="h-full">
                  <span className="grid h-10 w-10 place-items-center rounded-sm bg-brand-500/12 text-brand-500">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-[16px] font-bold">{item.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-content-muted">{item.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Band>

      {/* ---------------- closing CTA ---------------- */}
      <section className="mx-auto max-w-[84rem] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2rem,6vw,3.4rem)] leading-[1.02] font-extrabold tracking-[-0.04em]">
            The tap has been leaking since{' '}
            <span className="grad-text">last Tuesday.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-content-muted text-pretty">
            Pick a category, compare a few pros, and send the request. FixNow handles the rest of the track.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button to="/browse" size="lg" iconRight={ArrowRight}>
              Find a service
            </Button>
            <Button to="/how-it-works" size="lg" variant="outline">
              How it works
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
