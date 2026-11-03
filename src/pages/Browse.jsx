import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, LayoutGrid, List, Funnel, Sparkles } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useI18n } from '../i18n/useI18n';
import { publicProviders } from '../utils/selectors';
import { DEFAULT_FILTERS, activeFilterCount, filterProviders, priceBounds, SORT_OPTIONS } from '../utils/filters';
import { CATEGORIES, CATEGORY_BY_SLUG, CITIES } from '../data/categories';
import { formatPKR } from '../utils/format';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select, Toggle } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { EmptyState } from '../components/ui/EmptyState';
import { ProviderCardSkeleton } from '../components/ui/Skeleton';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Reveal } from '../components/ui/Reveal';

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
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">
          {t('browse.category')}
        </h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilters({ categoryId: 'all' })}
            aria-pressed={filters.categoryId === 'all'}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors duration-300',
              filters.categoryId === 'all'
                ? 'border-transparent bg-ink-800 text-white dark:bg-white dark:text-ink-800'
                : 'border-line bg-surface-2 text-content-muted hover:text-content'
            )}
          >
            {t('browse.allTrades')}
          </button>
          {CATEGORIES.map((c) => {
            const active = filters.categoryId === c.id;
            const [from, to] = c.accent ?? ['#09318D', '#4A6FD0'];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilters({ categoryId: active ? 'all' : c.id })}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition-[border-color,background-color,color] duration-300',
                  active
                    ? 'border-brand-500/40 bg-brand-500/12 text-brand-600 dark:text-brand-300'
                    : 'border-line bg-surface-2 text-content-muted hover:text-content'
                )}
              >
                <span
                  aria-hidden="true"
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white"
                  style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  <CategoryIcon icon={c.icon} className="h-3 w-3" />
                </span>
                {t(`category.${c.id}`, null, c.name)}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">
          {t('browse.location')}
        </h2>
        <Select
          label={t('browse.city')}
          value={filters.city}
          onChange={(e) => setFilters({ city: e.target.value })}
          options={[
            { value: 'all', label: t('browse.anywhere') },
            ...CITIES.map((c) => ({ value: c, label: c })),
          ]}
        />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">
            {t('browse.price')}
          </h2>
          <span className="font-display text-[13px] font-bold">
            {Number.isFinite(filters.maxPrice) ? formatPKR(filters.maxPrice) : t('browse.noLimit')}
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
          aria-label={t('browse.priceAria')}
          className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-canvas-2 accent-brand-500"
        />
        <div className="mt-2 flex justify-between text-[12px] text-content-muted">
          <span>{formatPKR(bounds.min)}</span>
          <span>{formatPKR(bounds.max)}</span>
        </div>
      </section>

      <section>
        <h2 className="font-display text-[13px] font-bold tracking-[0.12em] text-content-muted uppercase">
          {t('browse.rating')}
        </h2>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t('browse.rating')}>
          {RATINGS.map((r) => {
            const active = filters.minRating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setFilters({ minRating: r.value })}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors duration-300',
                  active
                    ? 'border-glow-400/50 bg-glow-400/15 text-glow-700 dark:text-glow-300'
                    : 'border-line bg-surface-2 text-content-muted hover:text-content'
                )}
              >
                {r.value === 0 ? t('browse.any') : r.label}
              </button>
            );
          })}
        </div>
      </section>

      <Toggle
        checked={filters.availableOnly}
        onChange={(v) => setFilters({ availableOnly: v })}
        label={t('browse.available')}
        description={t('browse.availableHint')}
      />

      {count > 0 && (
        <Button variant="quiet" size="sm" icon={X} onClick={onClear}>
          {count === 1 ? t('browse.clearOne') : t('browse.clearN', { count })}
        </Button>
      )}
    </div>
  );
}

export default function Browse() {
  const { state } = useStore();
  const { t } = useI18n();
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
    const id = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(id);
  }, []);

  // The query string and the filter state have to stay in step in both
  // directions: a nav link can change ?category= while this page is mounted,
  // and a chip click has to land in the URL so the view is shareable and
  // survives a refresh. lastUrl records the string we last agreed on, so
  // neither effect re-triggers the other.
  const lastUrl = useRef(params.toString());

  useEffect(() => {
    const search = params.toString();
    if (search === lastUrl.current) return;
    lastUrl.current = search;
    const slug = params.get('category');
    setFilters((f) => ({
      ...f,
      q: params.get('q') ?? '',
      categoryId: state.categories.find((c) => c.slug === slug)?.id ?? 'all',
      city: params.get('city') || 'all',
    }));
  }, [params, state.categories]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q);
    const category = state.categories.find((c) => c.id === filters.categoryId);
    if (category) next.set('category', category.slug);
    if (filters.city !== 'all') next.set('city', filters.city);

    const search = next.toString();
    if (search === lastUrl.current) return;
    lastUrl.current = search;
    setParams(next, { replace: true });
  }, [filters, setParams, state.categories]);

  const patch = (partial) => setFilters((f) => ({ ...f, ...partial }));
  const clear = () => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort });

  const activeCategory = state.categories.find((c) => c.id === filters.categoryId);

  // Urdu and Sindhi do not pluralise by suffixing an "s", so the count picks the
  // whole word instead of the page appending grammar to a translated noun.
  const noun = (count) => t(count === 1 ? 'browse.nounOne' : 'browse.nounN');

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(80%_100%_at_50%_0%,rgb(9_49_141_/_0.14),transparent_65%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[84rem] px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-12">
        <Reveal>
          <p className="text-[12px] font-bold tracking-[0.2em] text-brand-500 uppercase dark:text-brand-300">
            {t('browse.eyebrow')}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-[32px] leading-[1.03] font-extrabold tracking-[-0.04em] sm:text-[44px]">
            {activeCategory
              ? t(`category.${activeCategory.id}`, null, activeCategory.name)
              : t('browse.title')}
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
              placeholder={t('browse.searchPlaceholder')}
              aria-label={t('browse.searchAria')}
              className="h-11 w-full bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-content-muted"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => patch({ q: '' })}
                aria-label={t('browse.clearSearch')}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-content-muted transition-colors hover:bg-canvas-2 hover:text-content"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 border-line lg:border-s lg:ps-3">
            <Dropdown
              value={filters.sort}
              onChange={(e) => patch({ sort: e.target.value })}
              ariaLabel={t('browse.sortAria')}
              options={SORT_OPTIONS.map((o) => ({
                value: o.value,
                label: t('browse.sortLabel', { label: t(`sort.${o.value}`, null, o.label) }),
              }))}
              triggerClassName="w-auto min-w-44 max-w-60 rounded-sm border-line bg-surface font-semibold"
            />

            <div className="hidden rounded-sm bg-canvas-2 p-1 sm:flex" role="group" aria-label={t('browse.layoutAria')}>
              {[
                { value: 'grid', icon: LayoutGrid, key: 'browse.viewGrid' },
                { value: 'list', icon: List, key: 'browse.viewList' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setView(opt.value)}
                  aria-pressed={view === opt.value}
                  aria-label={t(opt.key)}
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
              {t('browse.filters')}
              {activeCount > 0 && (
                <span className="ms-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <Card className="sticky top-24" padding="lg">
              <div className="mb-5 flex items-center gap-2 border-b border-line pb-4">
                <Funnel className="h-4 w-4 text-brand-500" aria-hidden="true" />
                <h2 className="font-display text-[15px] font-bold">{t('browse.refine')}</h2>
                {activeCount > 0 && (
                  <Badge tone="brand" size="sm" className="ms-auto">
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
                <span className="font-display text-[16px] font-bold text-content">{results.length}</span>
                {' '}
                {noun(results.length)}
                {filters.q && (
                  <>
                    {' '}
                    {t('browse.forQuery')}{' '}
                    <span dir="ltr" className="font-semibold text-content">
                      “{filters.q}”
                    </span>
                  </>
                )}
              </p>
              {results.length > 0 && (
                <p className="flex items-center gap-1.5 text-[13px] text-content-muted">
                  <Sparkles className="h-3.5 w-3.5 text-aqua-500" aria-hidden="true" />
                  {t('browse.liveNote')}
                </p>
              )}
            </div>

            {loading ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProviderCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                className="mt-5"
                icon={Search}
                title={t('browse.emptyTitle')}
                description={filters.availableOnly ? t('browse.emptyAvail') : t('browse.emptyDefault')}
                action={
                  <Button variant="secondary" icon={X} onClick={clear}>
                    {t('browse.clearAll')}
                  </Button>
                }
                secondaryAction={
                  <Button variant="outline" to="/providers">
                    {t('browse.fullDirectory')}
                  </Button>
                }
              />
            ) : (
              <div
                className={cn(
                  'mt-5 gap-4',
                  view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col'
                )}
              >
                {results.map((p, i) => (
                  // Each card reveals itself rather than inheriting a variant
                  // from the grid: the result set changes under the user, and a
                  // card that mounts into an already-revealed group must not be
                  // left at the hidden state.
                  <Reveal key={p.id} className="h-full" y={22} delay={Math.min(i, 8) * 0.045}>
                    <ProviderCard provider={p} compact={view === 'list'} />
                  </Reveal>
                ))}
              </div>
            )}

            {!loading && results.length > 0 && (
              <p className="mt-8 text-center text-[13px] text-content-muted">
                {t('browse.showingAll', { count: results.length, noun: noun(results.length) })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-200 lg:hidden" role="dialog" aria-modal="true" aria-label={t('browse.filters')}>
          <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-md" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-canvas p-5 pb-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-[19px] font-bold">{t('browse.refineResults')}</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t('browse.closeFilters')}
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
              {t('browse.showResults', { count: results.length, noun: noun(results.length) })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
