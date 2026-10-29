import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, LayoutGrid, List, Funnel, Sparkles } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { publicProviders } from '../utils/selectors';
import { DEFAULT_FILTERS, activeFilterCount, filterProviders, priceBounds, SORT_OPTIONS } from '../utils/filters';
import { CATEGORIES, CATEGORY_BY_SLUG, CITIES } from '../data/categories';
import { formatPKR } from '../utils/format';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select, Toggle } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { ProviderCardSkeleton } from '../components/ui/Skeleton';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Reveal, Stagger, StaggerItem } from '../components/ui/Reveal';

const RATINGS = [
  { value: 0, label: 'Any' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
  { value: 4.8, label: '4.8+' },
];

// Reads the initial filters from the URL so /browse?category=plumbing&q=ac works
// from the navbar, the home search and the footer links alike.
function filtersFromParams(params) {
  const slug = params.get('category');
  return {
    ...DEFAULT_FILTERS,
    q: params.get('q') ?? '',
    categoryId: slug && CATEGORY_BY_SLUG[slug] ? CATEGORY_BY_SLUG[slug].id : 'all',
    city: params.get('city') || 'all',
  };
}

function FilterPanel({ filters, setFilters, bounds, onClear, count }) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">Category</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilters({ categoryId: 'all' })}
            aria-pressed={filters.categoryId === 'all'}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-300',
              filters.categoryId === 'all'
                ? 'border-transparent bg-ink-800 text-white dark:bg-white dark:text-ink-800'
                : 'border-line bg-surface-2 text-content-muted hover:text-content'
            )}
          >
            All trades
          </button>
          {CATEGORIES.map((c) => {
            const active = filters.categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilters({ categoryId: active ? 'all' : c.id })}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-[border-color,background-color,color] duration-300',
                  active
                    ? 'border-brand-500/40 bg-brand-500/12 text-brand-600 dark:text-brand-300'
                    : 'border-line bg-surface-2 text-content-muted hover:text-content'
                )}
              >
                <CategoryIcon icon={c.icon} className="h-3.5 w-3.5" />
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">Location</h2>
        <Select
          label="City"
          value={filters.city}
          onChange={(e) => setFilters({ city: e.target.value })}
          options={[{ value: 'all', label: 'Anywhere in Pakistan' }, ...CITIES.map((c) => ({ value: c, label: c }))]}
        />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">
            Starting price
          </h2>
          <span className="font-display text-[13px] font-bold">
            {Number.isFinite(filters.maxPrice) ? formatPKR(filters.maxPrice) : 'No limit'}
          </span>
        </div>
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={500}
          value={Number.isFinite(filters.maxPrice) ? filters.maxPrice : bounds.max}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFilters({ maxPrice: v >= bounds.max ? null : v });
          }}
          aria-label="Maximum starting price in PKR"
          className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-canvas-2 accent-brand-500"
        />
        <div className="mt-2 flex justify-between text-[11.5px] text-content-muted">
          <span>{formatPKR(bounds.min)}</span>
          <span>{formatPKR(bounds.max)}</span>
        </div>
      </section>

      <section>
        <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">
          Minimum rating
        </h2>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Minimum rating">
          {RATINGS.map((r) => {
            const active = filters.minRating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setFilters({ minRating: r.value })}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-300',
                  active
                    ? 'border-glow-400/50 bg-glow-400/15 text-glow-700 dark:text-glow-300'
                    : 'border-line bg-surface-2 text-content-muted hover:text-content'
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </section>

      <Toggle
        checked={filters.availableOnly}
        onChange={(v) => setFilters({ availableOnly: v })}
        label="Available this week"
        description="Hides providers whose calendar has no open slot."
      />

      {count > 0 && (
        <Button variant="quiet" size="sm" icon={X} onClick={onClear}>
          Clear {count} filter{count === 1 ? '' : 's'}
        </Button>
      )}
    </div>
  );
}

export default function Browse() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(params));
  const [view, setView] = useState('grid');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const pool = useMemo(() => publicProviders(state), [state]);
  const bounds = useMemo(() => priceBounds(pool), [pool]);
  const results = useMemo(() => filterProviders(pool, filters), [pool, filters]);
  const activeCount = activeFilterCount(filters);

  // Simulated fetch on first paint so the skeleton state is demonstrable.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!params.get('category') && !params.get('q') && !params.get('city')) return;
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q);
    if (filters.categoryId !== 'all') {
      const cat = state.categories.find((c) => c.id === filters.categoryId);
      if (cat) next.set('category', cat.slug);
    }
    if (filters.city !== 'all') next.set('city', filters.city);
    setParams(next, { replace: true });
  }, [filters, params, setParams, state.categories]);

  const patch = (partial) => setFilters((f) => ({ ...f, ...partial }));
  const clear = () => {
    setFilters({ ...DEFAULT_FILTERS, sort: filters.sort });
    setParams(new URLSearchParams(), { replace: true });
  };

  const activeCategory = state.categories.find((c) => c.id === filters.categoryId);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(80%_100%_at_50%_0%,rgb(108_92_231_/_0.14),transparent_65%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[84rem] px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-12">
        <Reveal>
          <p className="text-[11px] font-bold tracking-[0.2em] text-brand-500 uppercase dark:text-brand-300">
            Marketplace
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-[32px] leading-[1.03] font-extrabold tracking-[-0.04em] sm:text-[44px]">
            {activeCategory ? activeCategory.name : 'Every verified professional'}
            {activeCategory && (
              <span className="block text-[17px] font-semibold tracking-normal text-content-muted">
                {activeCategory.description}
              </span>
            )}
          </h1>
        </Reveal>

        {/* Search + sort + view controls */}
        <div className="glass mt-7 flex flex-col gap-3 rounded-xl p-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2.5 px-2">
            <Search className="h-[18px] w-[18px] shrink-0 text-content-muted" aria-hidden="true" />
            <input
              value={filters.q}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="Try “split AC”, “leaking tap”, “sofa shampoo”…"
              aria-label="Search services, providers and areas"
              className="h-11 w-full bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-content-muted"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => patch({ q: '' })}
                aria-label="Clear search term"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-content-muted transition-colors hover:bg-canvas-2 hover:text-content"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 border-line lg:border-l lg:pl-3">
            <select
              value={filters.sort}
              onChange={(e) => patch({ sort: e.target.value })}
              aria-label="Sort results"
              className="h-11 w-44 rounded-sm border border-line bg-surface px-3 text-[14px] font-semibold text-content outline-none transition-colors hover:border-line-strong focus:border-brand-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>

            <div className="hidden rounded-sm bg-canvas-2 p-1 sm:flex" role="group" aria-label="Result layout">
              {[
                { value: 'grid', icon: LayoutGrid, label: 'Grid' },
                { value: 'list', icon: List, label: 'List' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setView(opt.value)}
                  aria-pressed={view === opt.value}
                  aria-label={`${opt.label} view`}
                  className={cn(
                    'grid h-8 w-9 place-items-center rounded-xs transition-colors duration-300',
                    view === opt.value ? 'bg-surface text-content shadow-hair' : 'text-content-muted hover:text-content'
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={SlidersHorizontal}
              className="lg:hidden"
              onClick={() => setSheetOpen(true)}
            >
              Filters
              {activeCount > 0 && (
                <span className="ml-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <Card className="sticky top-24" padding="lg">
              <div className="mb-5 flex items-center gap-2 border-b border-line pb-4">
                <Funnel className="h-4 w-4 text-brand-500" aria-hidden="true" />
                <h2 className="font-display text-[15px] font-bold">Refine</h2>
                {activeCount > 0 && (
                  <Badge tone="brand" size="sm" className="ml-auto">
                    {activeCount}
                  </Badge>
                )}
              </div>
              <FilterPanel
                filters={filters}
                setFilters={patch}
                bounds={bounds}
                onClear={clear}
                count={activeCount}
              />
            </Card>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] text-content-muted">
                <span className="font-display text-[16px] font-bold text-content">{results.length}</span> provider
                {results.length === 1 ? '' : 's'}
                {filters.q && (
                  <>
                    {' '}
                    for <span className="font-semibold text-content">“{filters.q}”</span>
                  </>
                )}
              </p>
              {results.length > 0 && (
                <p className="flex items-center gap-1.5 text-[12.5px] text-content-muted">
                  <Sparkles className="h-3.5 w-3.5 text-aqua-500" aria-hidden="true" />
                  Indicative PKR prices · verified businesses only
                </p>
              )}
            </div>

            {loading ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProviderCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                className="mt-5"
                icon={Search}
                title="No providers match those filters"
                description={
                  filters.availableOnly
                    ? 'Try turning off “Available this week”, widening the price limit, or searching a different word.'
                    : 'Loosen the price limit, lower the rating floor, or search the problem rather than the trade name.'
                }
                action={
                  <Button variant="secondary" icon={X} onClick={clear}>
                    Clear all filters
                  </Button>
                }
                secondaryAction={
                  <Button variant="outline" to="/providers">
                    See the full directory
                  </Button>
                }
              />
            ) : (
              <Stagger
                className={cn(
                  'mt-5 gap-4',
                  view === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col'
                )}
                gap={0.045}
              >
                {results.map((p) => (
                  <StaggerItem key={p.id} className="h-full">
                    <ProviderCard provider={p} compact={view === 'list'} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {!loading && results.length > 0 && (
              <p className="mt-8 text-center text-[13px] text-content-muted">
                Showing all {results.length} matching {results.length === 1 ? 'provider' : 'providers'}. Prices are
                indicative and confirmed on site.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-200 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-md" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-canvas p-5 pb-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-[19px] font-bold">Refine results</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-sm border border-line"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              setFilters={patch}
              bounds={bounds}
              onClear={clear}
              count={activeCount}
            />
            <Button full className="mt-6" onClick={() => setSheetOpen(false)}>
              Show {results.length} result{results.length === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
