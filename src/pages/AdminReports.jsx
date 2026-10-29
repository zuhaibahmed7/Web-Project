import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building, CircleCheck, Flag, Percent, Star, Timer, Wallet } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { decorateProvider, marketplaceStats } from '../utils/selectors';
import { STATUS_META, STATUS_ORDER } from '../utils/booking';
import { formatPKR } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Reveal, Stagger, StaggerItem } from '../components/ui/Reveal';
import { Badge } from '../components/ui/Badge';
import { Rating, RatingBreakdown } from '../components/ui/Rating';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../utils/cn';

const VIOLET = '#6C5CE7';
const AQUA = '#00D4C8';
const AMBER = '#FFB020';

const PALETTE = [VIOLET, AQUA, AMBER, '#3B82F6', '#FF7A1A', '#10B981', '#EF4444'];

// Every figure on this screen is printed with its formula and the raw numbers it
// came from, so a viva examiner can verify the arithmetic without opening code.
function Metric({ label, value, formula, numbers, tone = 'brand', icon: Icon, to, cta }) {
  return (
    <Card padding="none" className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        {Icon && (
          <span
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-sm',
              tone === 'aqua'
                ? 'bg-aqua-400/14 text-aqua-700 dark:text-aqua-300'
                : tone === 'amber'
                  ? 'bg-glow-400/16 text-glow-700 dark:text-glow-300'
                  : tone === 'success'
                    ? 'bg-completed/12 text-completed'
                    : 'bg-brand-500/12 text-brand-600 dark:text-brand-300'
            )}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">{label}</p>
          <p className="mt-1 font-display text-[24px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
            {value}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <p className="rounded-sm bg-canvas-2/70 px-3 py-2 font-mono text-[11.5px] leading-relaxed break-words text-content-soft">
          {formula}
        </p>
        <p className="text-[12.5px] leading-relaxed text-content-muted">{numbers}</p>
        {to && (
          <Link
            to={to}
            className="mt-auto inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600 hover:text-aqua-600 dark:text-brand-300"
          >
            {cta ?? 'Open screen'}
          </Link>
        )}
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-sm px-3 py-2 text-[12px] shadow-lift">
      <p className="mb-1 font-display font-bold text-content">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 whitespace-nowrap text-content-soft">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
          <span className="font-bold text-content">{entry.value}</span> {entry.name}
        </p>
      ))}
    </div>
  );
}

export default function AdminReports() {
  const { state } = useStore();
  const stats = useMemo(() => marketplaceStats(state), [state]);

  const axisProps = {
    stroke: 'currentColor',
    tick: { fill: 'currentColor', fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: 'currentColor', strokeOpacity: 0.25 },
  };

  /* ------------------------------------------------------------- derivations */

  const total = stats.totalBookings;
  const pending = stats.byStatus.pending ?? 0;
  const completed = stats.byStatus.completed ?? 0;
  const cancelled = stats.byStatus.cancelled ?? 0;
  const rejected = stats.byStatus.rejected ?? 0;
  const decided = total - pending; // completion-rate denominator (see definition below)

  const statusRows = STATUS_ORDER.concat(['rejected', 'cancelled']).map((status) => {
    const count = stats.byStatus[status] ?? 0;
    return {
      status,
      label: STATUS_META[status].label,
      color: STATUS_META[status].color,
      count,
      pct: total ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });

  const categoryBars = useMemo(
    () =>
      [...stats.byCategory]
        .sort((a, b) => b.bookings - a.bookings)
        .map((row, i) => ({ ...row, fill: PALETTE[i % PALETTE.length] })),
    [stats.byCategory]
  );

  const busiestCategory = useMemo(() => {
    const withBookings = categoryBars.filter((c) => c.bookings > 0);
    return withBookings.length ? withBookings[0] : null;
  }, [categoryBars]);

  const providers = useMemo(() => state.providers.map((p) => decorateProvider(state, p)), [state]);

  // Acceptance rate = bookings that left "pending" ÷ all bookings for that provider.
  const acceptanceRows = useMemo(
    () =>
      providers
        .filter((p) => p.totalBookings > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category?.name ?? '—',
          city: p.city,
          jobs: p.jobsCompleted,
          rating: p.rating,
          reviewCount: p.reviewCount,
          active: p.activeBookings,
          total: p.totalBookings,
          accepted: p.acceptedBookings,
          completedBookings: p.completedBookings,
          acceptancePct: Math.round((p.acceptedBookings / p.totalBookings) * 1000) / 10,
          completionPct: p.acceptedBookings
            ? Math.round((p.completedBookings / p.acceptedBookings) * 1000) / 10
            : 0,
          verification: p.verificationStatus,
        }))
        .sort((a, b) => b.acceptancePct - a.acceptancePct || b.total - a.total),
    [providers]
  );

  const topFive = acceptanceRows.slice(0, 5);

  const ratingSplit = useMemo(() => {
    const breakdown = [0, 0, 0, 0, 0];
    state.reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating - 1] += 1;
    });
    return breakdown;
  }, [state.reviews]);

  const reviewSum = useMemo(() => state.reviews.reduce((sum, r) => sum + r.rating, 0), [state.reviews]);
  const globalRating = state.reviews.length ? Math.round((reviewSum / state.reviews.length) * 100) / 10 : 0;

  const verifiedWithResponse = providers.filter(
    (p) => p.verificationStatus === 'verified' && Number.isFinite(p.responseMins)
  );
  const avgResponseMins = verifiedWithResponse.length
    ? Math.round(
        verifiedWithResponse.reduce((sum, p) => sum + p.responseMins, 0) / verifiedWithResponse.length
      )
    : 0;

  const complaintTotal = state.complaints.length;
  const complaintResolved = state.complaints.filter((c) => c.status === 'resolved').length;
  const complaintDismissed = state.complaints.filter((c) => c.status === 'dismissed').length;
  const resolutionRate = complaintTotal ? Math.round((complaintResolved / complaintTotal) * 1000) / 10 : 0;

  const revenueBookings = state.bookings.filter((b) => b.status === 'completed');

  const hasData = total > 0 || state.reviews.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Marketplace reports"
        description="Each metric states its formula and the underlying counts next to the result, so every number on this page can be recomputed by hand from the store."
        actions={
          <Badge tone="neutral" icon={CircleCheck}>
            Computed live · {total} bookings read
          </Badge>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={Percent}
          tone="dashed"
          title="No marketplace activity to report yet"
          description="Once customers create bookings and leave reviews, every metric below fills in with its own working."
          action={<Badge tone="neutral">Reset demo data from the account menu to seed activity</Badge>}
        />
      ) : (
        <>
          {/* --------------------------------------------------- headline metrics */}
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StaggerItem>
              <Metric
                label="Total bookings"
                value={total.toLocaleString('en-PK')}
                formula="COUNT(state.bookings)"
                numbers={`${pending} pending, ${decided} past the pending stage. Covers ${providers.length} businesses across ${state.categories.length} categories.`}
                icon={Building}
                to="/admin/bookings"
                cta="Open bookings ledger"
              />
            </StaggerItem>

            <StaggerItem>
              <Metric
                label="Completion rate"
                value={`${stats.completionRate}%`}
                formula={`completed ÷ (total − pending) = ${completed} ÷ (${total} − ${pending}) = ${completed} ÷ ${decided}`}
                tone="success"
                icon={Percent}
                numbers={`Definition: pending requests are excluded because no decision has been taken yet, so a backlog of unanswered requests cannot depress the score. Cancelled and rejected bookings stay in the denominator as failed outcomes. Rounded to whole percent → ${stats.completionRate}%.`}
              />
            </StaggerItem>

            <StaggerItem>
              <Metric
                label="Revenue estimate"
                value={formatPKR(stats.revenueEstimate)}
                formula={`SUM(estimate WHERE status = 'completed') over ${revenueBookings.length} bookings`}
                tone="aqua"
                icon={Wallet}
                numbers={`Average completed-job value ${formatPKR(revenueBookings.length ? stats.revenueEstimate / revenueBookings.length : 0)}. Estimates are indicative customer quotes, not settled invoices, hence "estimate".`}
              />
            </StaggerItem>

            <StaggerItem>
              <Metric
                label="Average rating"
                value={globalRating.toFixed(2)}
                formula={`SUM(review.rating) ÷ COUNT(reviews) = ${reviewSum.toLocaleString('en-PK')} ÷ ${state.reviews.length}`}
                tone="amber"
                icon={Star}
                numbers={`${state.reviews.length} reviews across ${providers.filter((p) => p.reviewCount > 0).length} rated businesses. Recompute per provider on their public profile.`}
              />
            </StaggerItem>

            <StaggerItem>
              <Metric
                label="Complaint resolution rate"
                value={`${resolutionRate}%`}
                formula={`resolved ÷ total complaints = ${complaintResolved} ÷ ${complaintTotal}`}
                tone="danger"
                icon={Flag}
                numbers={`${complaintDismissed} dismissed as no-action, leaving ${complaintTotal - complaintResolved - complaintDismissed} still open or in review. Dismissals are deliberately not counted as resolutions.`}
                to="/admin/complaints"
                cta="Open complaint desk"
              />
            </StaggerItem>

            <StaggerItem>
              <Metric
                label="Average response time"
                value={avgResponseMins ? `${avgResponseMins} min` : '—'}
                formula={`AVG(responseMins WHERE verificationStatus = 'verified') over ${verifiedWithResponse.length} providers`}
                icon={Timer}
                numbers={`Fastest ${verifiedWithResponse.length ? Math.min(...verifiedWithResponse.map((p) => p.responseMins)) : '—'} min, slowest ${verifiedWithResponse.length ? Math.max(...verifiedWithResponse.map((p) => p.responseMins)) : '—'} min. Only verified businesses are measured, since unverified profiles never receive customer requests.`}
              />
            </StaggerItem>
          </Stagger>

          {/* ----------------------------------------------- bookings by status table */}
          <Reveal delay={0.05} className="mt-8 block">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-display text-[17px] font-bold tracking-[-0.02em]">Bookings by status</h2>
                <p className="mt-1 text-[12.5px] text-content-muted">
                  Each share is count ÷ {total} total bookings, rounded to one decimal. The six lifecycle states are
                  mutually exclusive and sum to the full ledger.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-[13px]" aria-label="Bookings grouped by lifecycle status">
                  <caption className="sr-only">
                    Booking counts per status with the percentage of the total ledger and the worked calculation.
                  </caption>
                  <thead>
                    <tr className="border-b border-line bg-canvas-2/60 text-[11px] font-bold tracking-[0.1em] text-content-muted uppercase">
                      <th scope="col" className="px-5 py-3">Status</th>
                      <th scope="col" className="px-3 py-3 text-right">Count</th>
                      <th scope="col" className="px-3 py-3 text-right">% of total</th>
                      <th scope="col" className="px-5 py-3">Calculation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {statusRows.map((row) => (
                      <tr key={row.status} className="transition-colors hover:bg-canvas-2/50">
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
                            <span className="font-bold text-content">{row.label}</span>
                          </span>
                        </th>
                        <td className="px-3 py-3 text-right font-bold tabular-nums">{row.count}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-content-soft">{row.pct}%</td>
                        <td className="px-5 py-3 font-mono text-[11.5px] text-content-muted">
                          {row.count} ÷ {total} = {row.pct}%
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-line-strong bg-canvas-2/40">
                      <th scope="row" className="px-5 py-3 text-left text-[12px] font-bold tracking-[0.06em] uppercase">
                        Ledger total
                      </th>
                      <td className="px-3 py-3 text-right font-extrabold tabular-nums">{total}</td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums text-content-soft">100%</td>
                      <td className="px-5 py-3 font-mono text-[11.5px] text-content-muted">
                        Σ counts = {statusRows.reduce((s, r) => s + r.count, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </Reveal>

          {/* ---------------------------------------------------- chart + ratings */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Reveal>
              <Card padding="none" className="h-full">
                <div className="border-b border-line px-5 py-4">
                  <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Bookings per category</h2>
                  <p className="mt-1 text-[12.5px] text-content-muted">
                    A booking is attributed to its provider&rsquo;s category. Categories with zero bookings are kept so
                    supply gaps stay visible.
                  </p>
                </div>
                <div className="h-72 px-3 py-5 text-content-muted">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryBars}
                      layout="vertical"
                      margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid stroke="currentColor" strokeOpacity={0.16} horizontal={false} />
                      <XAxis type="number" allowDecimals={false} {...axisProps} />
                      <YAxis type="category" dataKey="name" width={96} {...axisProps} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                      <Bar dataKey="bookings" name="Bookings" radius={[0, 6, 6, 0]} maxBarSize={22}>
                        {categoryBars.map((row) => (
                          <Cell key={row.id} fill={row.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="border-t border-line px-5 py-3 text-[12.5px] text-content-muted">
                  Busiest category:{' '}
                  <span className="font-bold text-content">
                    {busiestCategory ? busiestCategory.name : 'None yet'}
                  </span>
                  {busiestCategory
                    ? ` — ${busiestCategory.bookings} bookings via ${busiestCategory.providers} provider(s), ${
                        total ? Math.round((busiestCategory.bookings / total) * 1000) / 10 : 0
                      }% of the ledger, of which ${busiestCategory.completed} completed.`
                    : ' — no bookings recorded against any category.'}
                </p>
              </Card>
            </Reveal>

            <Reveal delay={0.06}>
              <Card padding="none" className="h-full">
                <div className="border-b border-line px-5 py-4">
                  <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Rating distribution</h2>
                  <p className="mt-1 text-[12.5px] text-content-muted">
                    All {state.reviews.length} reviews, counted per star band.
                  </p>
                </div>
                <div className="flex flex-col gap-5 p-5">
                  <div className="flex items-end gap-4">
                    <p className="font-display text-[40px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
                      {globalRating.toFixed(1)}
                    </p>
                    <div className="pb-1">
                      <Rating value={globalRating} showValue={false} size="md" />
                      <p className="mt-1 text-[12px] text-content-muted">
                        mean = {reviewSum} ÷ {state.reviews.length}
                      </p>
                    </div>
                  </div>
                  <RatingBreakdown breakdown={ratingSplit} total={state.reviews.length} />
                  <p className="text-[12px] leading-relaxed text-content-muted">
                    Five-star share{' '}
                    <span className="font-bold text-content">
                      {state.reviews.length ? Math.round((ratingSplit[4] / state.reviews.length) * 100) : 0}%
                    </span>
                    ; sub-three-star share{' '}
                    <span className="font-bold text-content">
                      {state.reviews.length
                        ? Math.round(((ratingSplit[0] + ratingSplit[1] + ratingSplit[2]) / state.reviews.length) * 100)
                        : 0}
                      %
                    </span>
                    . Reviews can only be written on completed bookings (BRL-07), so this distribution measures
                    delivered work rather than demand.
                  </p>
                </div>
              </Card>
            </Reveal>
          </div>

          {/* ------------------------------------------- provider acceptance top 5 */}
          <Reveal delay={0.05} className="mt-4 block">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">
                  Provider acceptance rate — top 5
                </h2>
                <p className="mt-1 text-[12.5px] text-content-muted">
                  Formula: bookings that left <code className="font-mono">pending</code> ÷ all bookings for that
                  provider. Providers with no bookings are excluded, since 0 ÷ 0 is undefined.
                </p>
              </div>
              {topFive.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-content-muted">
                  No provider has received a booking yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {topFive.map((row, i) => (
                    <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-canvas-2 text-[12px] font-extrabold tabular-nums text-content-soft">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/provider/${row.slug}`}
                          className="truncate font-display text-[14.5px] font-bold tracking-[-0.02em] hover:text-brand-600 dark:hover:text-brand-300"
                        >
                          {row.name}
                        </Link>
                        <p className="mt-0.5 truncate font-mono text-[11.5px] text-content-muted">
                          {row.accepted} ÷ {row.total} = {row.acceptancePct}%
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Badge tone="neutral" size="sm">
                          {row.category}
                        </Badge>
                        <Badge tone={row.acceptancePct >= 70 ? 'success' : row.acceptancePct >= 40 ? 'amber' : 'danger'} size="sm">
                          {row.acceptancePct}% accept
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>

          {/* ------------------------------------------ per-provider performance */}
          <Reveal delay={0.05} className="mt-4 block">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Per-provider performance</h2>
                <p className="mt-1 text-[12.5px] text-content-muted">
                  Completion column = completed ÷ accepted bookings for that provider. Active counts pending, accepted
                  and in-progress bookings together. Sorted by booking volume.
                </p>
              </div>

              <div className="hidden md:block">
                <table className="w-full text-left text-[13px]" aria-label="Provider performance table">
                  <caption className="sr-only">
                    Every business with its category, city, lifetime jobs, average rating, active bookings, acceptance
                    rate and completion rate.
                  </caption>
                  <thead>
                    <tr className="border-b border-line bg-canvas-2/60 text-[11px] font-bold tracking-[0.1em] text-content-muted uppercase">
                      <th scope="col" className="px-5 py-3">Business</th>
                      <th scope="col" className="px-3 py-3">Category</th>
                      <th scope="col" className="px-3 py-3">City</th>
                      <th scope="col" className="px-3 py-3 text-right">Lifetime jobs</th>
                      <th scope="col" className="px-3 py-3">Rating</th>
                      <th scope="col" className="px-3 py-3 text-right">Active</th>
                      <th scope="col" className="px-3 py-3 text-right">Accept %</th>
                      <th scope="col" className="px-5 py-3 text-right">Complete %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[...acceptanceRows]
                      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
                      .map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-canvas-2/50">
                          <th scope="row" className="px-5 py-3 text-left font-normal">
                            <Link
                              to={`/provider/${row.slug}`}
                              className="font-bold text-content hover:text-brand-600 dark:hover:text-brand-300"
                            >
                              {row.name}
                            </Link>
                            <span className="mt-0.5 block text-[11.5px] text-content-muted">
                              {row.verification} · {row.total} booking{row.total === 1 ? '' : 's'}
                            </span>
                          </th>
                          <td className="px-3 py-3 text-content-soft">{row.category}</td>
                          <td className="px-3 py-3 text-content-soft">{row.city}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{row.jobs.toLocaleString('en-PK')}</td>
                          <td className="px-3 py-3">
                            {row.reviewCount > 0 ? (
                              <Rating value={row.rating} count={row.reviewCount} size="xs" />
                            ) : (
                              <span className="text-content-muted">Unrated</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">{row.active}</td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {row.total ? `${row.acceptancePct}%` : '—'}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {row.accepted ? `${row.completionPct}%` : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Small screens: same rows reflowed into cards instead of scrolling. */}
              <ul className="divide-y divide-line md:hidden">
                {[...acceptanceRows]
                  .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
                  .map((row) => (
                    <li key={row.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/provider/${row.slug}`}
                            className="block truncate font-display text-[14.5px] font-bold tracking-[-0.02em] hover:text-brand-600 dark:hover:text-brand-300"
                          >
                            {row.name}
                          </Link>
                          <p className="mt-0.5 truncate text-[12px] text-content-muted">
                            {row.category} · {row.city}
                          </p>
                        </div>
                        <Badge tone={row.verification === 'verified' ? 'success' : 'amber'} size="sm">
                          {row.verification}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-[12px]">
                        <div>
                          <dt className="text-content-muted">Jobs</dt>
                          <dd className="font-bold tabular-nums text-content">{row.jobs.toLocaleString('en-PK')}</dd>
                        </div>
                        <div>
                          <dt className="text-content-muted">Active</dt>
                          <dd className="font-bold tabular-nums text-content">{row.active}</dd>
                        </div>
                        <div>
                          <dt className="text-content-muted">Rating</dt>
                          <dd className="font-bold tabular-nums text-content">
                            {row.reviewCount ? row.rating.toFixed(1) : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-content-muted">Accept</dt>
                          <dd className="font-bold tabular-nums text-content">
                            {row.total ? `${row.acceptancePct}%` : '—'}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-content-muted">Complete</dt>
                          <dd className="font-mono text-[11.5px] text-content">
                            {row.accepted
                              ? `${row.completedBookings} ÷ ${row.accepted} = ${row.completionPct}%`
                              : 'no accepted bookings yet'}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  ))}
              </ul>
            </Card>
          </Reveal>

          {/* ------------------------------------------------------------ footnotes */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Card padding="sm">
              <h2 className="font-display text-[14px] font-bold tracking-[-0.02em]">Definitions used above</h2>
              <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-content-muted">
                <li>
                  <span className="font-semibold text-content">Decided booking</span> — anything past{' '}
                  <code className="font-mono">pending</code>; the provider has accepted, rejected or the flow has moved
                  on.
                </li>
                <li>
                  <span className="font-semibold text-content">Active booking</span> —{' '}
                  <code className="font-mono">pending</code>, <code className="font-mono">accepted</code> or{' '}
                  <code className="font-mono">in_progress</code> (BRL-06).
                </li>
                <li>
                  <span className="font-semibold text-content">Terminal booking</span> —{' '}
                  <code className="font-mono">completed</code>, <code className="font-mono">rejected</code> or{' '}
                  <code className="font-mono">cancelled</code>; no further transitions allowed.
                </li>
              </ul>
            </Card>
            <Card padding="sm">
              <h2 className="font-display text-[14px] font-bold tracking-[-0.02em]">Data provenance</h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-content-muted">
                Nothing here is hard-coded: all figures are recomputed from <code className="font-mono">state</code>{' '}
                on render, so approving a provider, completing a job or resolving a complaint changes these numbers
                immediately. Ratings derive from the reviews list rather than a stored field, and revenue counts only
                completed bookings so an inflated estimate pipeline cannot look like income.
              </p>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
