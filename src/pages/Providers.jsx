import { useEffect, useMemo, useState } from 'react';
import { Funnel, RotateCcw, Search, SearchX, ShieldCheck, Store, Users } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { publicProviders, isAvailableSoon } from '../utils/selectors';
import { DEFAULT_FILTERS, SORT_OPTIONS, activeFilterCount, filterProviders } from '../utils/filters';
import { CITIES } from '../data/categories';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Card, Band } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input, Select, Toggle } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { ProviderCardSkeleton } from '../components/ui/Skeleton';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Reveal } from '../components/ui/Reveal';

const ALL_CITIES = [{ value: 'all', label: 'All cities' }];
const ALL_SORTS = SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

export default function Providers() {
  const { state } = useStore();

  // The directory only ever shows verified businesses (FR-AV-01).
  const verified = useMemo(() => publicProviders(state), [state]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // A short skeleton pass on first mount so the loading state is demonstrable.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  // `availableOnly` is handled here rather than in filterProviders, which only
  // checks that a provider has *any* open slot, not one inside a week.
  const results = useMemo(() => {
    const sorted = filterProviders(verified, filters);
    if (!filters.availableOnly) return sorted;
    return sorted.filter((p) => isAvailableSoon(p));
  }, [verified, filters]);

  const patch = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
  const used = activeFilterCount(filters) + (filters.q.trim() ? 1 : 0);
  const clearAll = () => setFilters(DEFAULT_FILTERS);

  const cityOptions = useMemo(() => {
    const present = new Set(verified.map((p) => p.city));
    return [...ALL_CITIES, ...CITIES.filter((c) => present.has(c)).map((c) => ({ value: c, label: c }))];
  }, [verified]);

  return (
    <>
      {/* ------------------------------------------------------------- header */}
      <Band tone="grad">
        <div className="mx-auto max-w-[84rem] px-4 pt-12 pb-8 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <Badge tone="glass" size="sm" icon={ShieldCheck}>
                  Verified listings only
                </Badge>
                <h1 className="mt-3 font-display text-[32px] leading-[1.03] font-extrabold tracking-[-0.035em] sm:text-[44px]">
                  Every professional on FixNow, in one directory
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-content-soft text-pretty">
                  {verified.length} approved businesses across plumbing, electrical, AC, cleaning, painting, carpentry
                  and mechanics. Unverified applications never reach this page — an admin approves them first.
                </p>
              </div>

              <dl className="flex shrink-0 gap-6 md:gap-8">
                {[
                  { k: 'Pros', v: verified.length, icon: Users },
                  { k: 'Cities', v: new Set(verified.map((p) => p.city)).size, icon: Store },
                  {
                    k: 'Open this week',
                    v: verified.filter((p) => isAvailableSoon(p)).length,
                    icon: Funnel,
                  },
                ].map((item) => (
                  <div key={item.k}>
                    <dt className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">
                      <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {item.k}
                    </dt>
                    <dd className="mt-1 font-display text-[26px] leading-none font-extrabold tabular-nums">
                      {item.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </Band>

      {/* ------------------------------------------------------------- filters */}
      <section className="mx-auto max-w-[84rem] px-4 pb-4 sm:px-6 lg:px-8">
        <Card className="relative z-90 mt-6">
          <div className="grid gap-x-4 gap-y-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
            <Input
              label="Search providers"
              icon={Search}
              type="search"
              placeholder="Name, tagline, city or the service you need…"
              value={filters.q}
              onChange={(e) => patch('q')(e.target.value)}
              hint="Matches business name, description, area and every listed service."
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="City"
                options={cityOptions}
                value={filters.city}
                onChange={(e) => patch('city')(e.target.value)}
              />
              <Select
                label="Sort by"
                options={ALL_SORTS}
                value={filters.sort}
                onChange={(e) => patch('sort')(e.target.value)}
              />
            </div>

            {/* The switch shares the row with the two selects, so it aligns to their baseline. */}
            <div className="flex items-center self-end pb-7 lg:pt-0">
              <Toggle
                checked={filters.availableOnly}
                onChange={(v) => patch('availableOnly')(v)}
                label="Available soon"
                description="A working day within the next 7 days"
              />
            </div>
          </div>

          {/* Category chips: horizontal scroll at 375px, wrapped row from sm up. */}
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2.5 text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">Category</p>
            <div className="no-bar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <CategoryChip
                active={filters.categoryId === 'all'}
                onClick={() => patch('categoryId')('all')}
                label="All categories"
                count={verified.length}
              />
              {state.categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  active={filters.categoryId === cat.id}
                  onClick={() => patch('categoryId')(filters.categoryId === cat.id ? 'all' : cat.id)}
                  label={cat.name}
                  count={verified.filter((p) => p.categoryId === cat.id).length}
                />
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* -------------------------------------------------------------- results */}
      <section className="mx-auto max-w-[84rem] px-4 pt-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-content-muted" role="status" aria-live="polite">
            {loading ? (
              'Loading verified providers…'
            ) : (
              <>
                <span className="font-display text-[15px] font-bold text-content tabular-nums">{results.length}</span>{' '}
                of {verified.length} providers
                {used > 0 && (
                  <span className="ml-1.5">
                    · <span className="font-semibold text-content">{used}</span> filter{used === 1 ? '' : 's'} active
                  </span>
                )}
              </>
            )}
          </p>
          {used > 0 && !loading && (
            <Button variant="outline" size="sm" icon={RotateCcw} onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>

        {loading ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <ProviderCardSkeleton />
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          // SC-01 / SC-02: no match always explains itself and offers two exits.
          <EmptyState
            icon={SearchX}
            title="No verified provider matches these filters"
            description={
              filters.q.trim()
                ? `Nothing in the verified directory mentions “${filters.q.trim()}”. Try a broader word such as “leak”, “inverter” or the city name, or widen the filters.`
                : 'This combination of category, city and availability has no verified business yet. Clearing a filter usually brings listings back.'
            }
            action={<Button icon={RotateCcw} onClick={clearAll}>Clear filters</Button>}
            secondaryAction={
              <Button to="/browse" variant="secondary">
                Search by service instead
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((provider, i) => (
              <li key={provider.id}>
                <Reveal delay={Math.min(i, 8) * 0.04} y={16}>
                  <ProviderCard provider={provider} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}

        {!loading && results.length > 0 && (
          <p className="mt-8 border-t border-line pt-6 text-[13px] leading-relaxed text-content-muted">
            Prices shown are indicative and come from each provider’s own service list — payment is settled directly
            with the professional after the visit (DR-08). Ratings are derived from reviews left on completed bookings.
          </p>
        )}
      </section>
    </>
  );
}

// One chip per category; a second tap deselects it back to "all".
function CategoryChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-300 active:scale-95',
        active
          ? 'grad-brand border-transparent text-white shadow-[0_10px_24px_-16px_rgb(108_92_231_/_0.9)]'
          : 'border-line bg-surface-2 text-content-muted hover:border-brand-500/40 hover:text-content'
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
          active ? 'bg-white/22 text-white' : 'bg-canvas-2 text-content-muted'
        )}
      >
        {count}
      </span>
    </button>
  );
}
