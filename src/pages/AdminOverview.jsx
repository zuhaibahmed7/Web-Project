import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChartColumn,
  CircleAlert,
  CircleQuestionMark,
  Flag,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { decoratedProviders, findProvider, findUser, marketplaceStats } from '../utils/selectors';
import { STATUS_META, STATUS_ORDER, isActiveBooking } from '../utils/booking';
import { formatDate, formatPKR, relativeTime } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Reveal, Stagger, StaggerItem } from '../components/ui/Reveal';
import { StatCard } from '../components/cards/StatCard';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge, Badge } from '../components/ui/Badge';

// Brand series colours. Fixed hex (not Tailwind tokens) because SVG fill
// attributes cannot resolve CSS custom properties reliably.
const VIOLET = '#6C5CE7';
const AQUA = '#00D4C8';
const AMBER = '#FFB020';

const ATTENTION_TONES = {
  amber: 'border-glow-400/40 bg-glow-400/8',
  danger: 'border-rejected/35 bg-rejected/8',
  neutral: 'border-line-strong bg-canvas-2/60',
};

// Shared tooltip so all three charts read the same way in both themes.
function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-sm px-3 py-2 text-[12px] shadow-lift">
      {label && <p className="mb-1 font-display font-bold text-content">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 whitespace-nowrap text-content-soft">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
          <span className="font-semibold text-content">{entry.value}</span>
          {unit} {entry.name}
        </p>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const { state } = useStore();
  const stats = useMemo(() => marketplaceStats(state), [state]);

  // Axis/grid colours ride on `currentColor`, so they follow the container's
  // Tailwind text token and adapt to dark mode without reading <html>.
  const axisProps = {
    stroke: 'currentColor',
    tick: { fill: 'currentColor', fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: 'currentColor', strokeOpacity: 0.25 },
  };

  const statusSeries = STATUS_ORDER.map((status) => ({
    name: STATUS_META[status].label,
    count: stats.byStatus[status] ?? 0,
    color: STATUS_META[status].color,
  }));

  const trendSeries = stats.trend;

  const categorySeries = useMemo(
    () =>
      stats.byCategory
        .filter((c) => c.bookings > 0)
        .map((c, i) => ({
          ...c,
          fill: [VIOLET, AQUA, AMBER][i % 3],
        })),
    [stats.byCategory]
  );

  const attention = useMemo(() => {
    const pendingVerifications = state.providers.filter((p) => p.verificationStatus === 'pending');
    const highPriorityComplaints = state.complaints.filter(
      (c) => c.priority === 'high' && (c.status === 'open' || c.status === 'in_review')
    );
    const emptyProfiles = decoratedProviders(state).filter((p) => (p.services?.length ?? 0) === 0);
    return { pendingVerifications, highPriorityComplaints, emptyProfiles };
  }, [state]);

  const recentActivity = useMemo(
    () => [...state.bookings].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8),
    [state.bookings]
  );

  const openRequests = state.bookings.filter((b) => b.status === 'pending').length;

  const attentionItems = [
    {
      key: 'verification',
      href: '/admin/verification',
      icon: ShieldCheck,
      tone: 'amber',
      count: attention.pendingVerifications.length,
      title: 'Providers awaiting verification',
      detail:
        attention.pendingVerifications.length === 0
          ? 'Nothing waiting — every applicant has been reviewed.'
          : `${attention.pendingVerifications.map((p) => p.name).slice(0, 2).join(', ')}${
              attention.pendingVerifications.length > 2 ? ` +${attention.pendingVerifications.length - 2}` : ''
            } not publicly listed yet.`,
      cta: 'Open verification queue',
    },
    {
      key: 'complaints',
      href: '/admin/complaints',
      icon: Flag,
      tone: 'danger',
      count: attention.highPriorityComplaints.length,
      title: 'High-priority complaints unresolved',
      detail:
        attention.highPriorityComplaints.length === 0
          ? 'No high-priority issue is currently open or in review.'
          : attention.highPriorityComplaints
              .map((c) => c.subject)
              .slice(0, 2)
              .join(' · '),
      cta: 'Go to complaint desk',
    },
    {
      key: 'profiles',
      href: '/admin/users',
      icon: CircleQuestionMark,
      tone: 'neutral',
      count: attention.emptyProfiles.length,
      title: 'Businesses with no services published',
      detail:
        attention.emptyProfiles.length === 0
          ? 'Every registered business lists at least one service.'
          : `${attention.emptyProfiles
              .map((p) => p.name)
              .slice(0, 3)
              .join(', ')}${attention.emptyProfiles.length > 3 ? ` +${attention.emptyProfiles.length - 3}` : ''} cannot be booked until prices are added.`,
      cta: 'Review accounts',
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Marketplace overview"
        description="Live figures computed from the store on every render — bookings, verifications, complaints and revenue move as soon as any role acts."
        actions={
          <>
            <Link
              to="/admin/reports"
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-line-strong px-4 text-[13px] font-semibold text-content transition-colors hover:border-brand-500/60 hover:bg-brand-500/8"
            >
              <ChartColumn className="h-4 w-4" aria-hidden="true" />
              Reports
            </Link>
            <Link
              to="/admin/bookings"
              className="inline-flex h-10 items-center gap-2 rounded-sm grad-brand px-4 text-[13px] font-bold text-white shadow-[0_10px_26px_-14px_rgb(108_92_231_/_0.9)] transition-[filter] hover:brightness-105"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Bookings ledger
            </Link>
          </>
        }
      />

      {/* ---------------------------------------------------- headline numbers */}
      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Total bookings"
            value={stats.totalBookings}
            hint={`${stats.activeBookings} still in the pipeline`}
            icon={CalendarDays}
            tone="brand"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Active bookings"
            value={stats.activeBookings}
            hint={`${openRequests} awaiting a provider decision`}
            icon={CircleAlert}
            tone="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Verified providers"
            value={stats.verifiedProviders}
            hint={`of ${stats.totalProviders} registered businesses`}
            icon={BadgeCheck}
            tone="aqua"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pending verifications"
            value={stats.pendingVerification}
            hint="Hidden from public listings until approved"
            icon={ShieldCheck}
            tone="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Open complaints"
            value={stats.openComplaints}
            hint={`${stats.resolvedComplaints} resolved to date`}
            icon={Flag}
            tone="danger"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Completion rate"
            value={stats.completionRate}
            suffix="%"
            hint="Completed ÷ decided bookings"
            icon={ChartColumn}
            tone="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Average rating"
            value={stats.averageRating}
            hint={`${stats.totalReviews} customer reviews`}
            icon={Star}
            tone="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Revenue estimate"
            value={stats.revenueEstimate}
            format={(v) => formatPKR(v)}
            hint="Sum of completed booking estimates"
            icon={Wallet}
            tone="brand"
          />
        </StaggerItem>
      </Stagger>

      {/* ------------------------------------------------------- needs attention */}
      <Reveal delay={0.05} className="mt-8">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-[17px] font-bold tracking-[-0.02em] text-content">Needs attention</h2>
              <p className="mt-1 text-[13px] text-content-muted">
                Work items the platform cannot leave untouched.
              </p>
            </div>
            <Badge tone={stats.pendingVerification + stats.openComplaints > 0 ? 'amber' : 'success'} size="sm">
              {stats.pendingVerification + stats.openComplaints > 0 ? 'Action required' : 'All clear'}
            </Badge>
          </div>

          <ul className="grid gap-px bg-line md:grid-cols-3">
            {attentionItems.map((item) => (
              <li key={item.key} className="bg-surface">
                <Link
                  to={item.href}
                  className={`group flex h-full flex-col gap-3 border-l-2 p-5 transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-canvas-2 ${ATTENTION_TONES[item.tone]}`}
                >
                  <span className="flex items-start gap-3">
                    <item.icon
                      className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${
                        item.count === 0 ? 'text-completed' : item.tone === 'danger' ? 'text-rejected' : 'text-glow-600 dark:text-glow-300'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[14.5px] leading-snug font-bold text-content">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-content-muted">{item.detail}</span>
                    </span>
                    <span
                      className={`grid h-8 min-w-8 shrink-0 place-items-center rounded-full px-2 text-[13px] font-extrabold tabular-nums ${
                        item.count === 0
                          ? 'bg-completed/12 text-completed'
                          : item.tone === 'danger'
                            ? 'bg-rejected/12 text-rejected'
                            : 'bg-glow-400/16 text-glow-700 dark:text-glow-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600 dark:text-brand-300">
                    {item.cta}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>

      {/* ------------------------------------------------------------- charts */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card padding="none" className="h-full">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Bookings by status</h2>
              <p className="mt-1 text-[12.5px] text-content-muted">
                The four lifecycle stages that still occupy capacity. Rejected and cancelled bookings are terminal and
                counted in Reports instead.
              </p>
            </div>
            <div className="h-64 px-3 py-5 text-content-muted">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusSeries} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.18} vertical={false} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis allowDecimals={false} width={44} {...axisProps} />
                  <Tooltip content={<ChartTooltip unit="bookings" />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                  <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    {statusSeries.map((row) => (
                      <Cell key={row.name} fill={row.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.06}>
          <Card padding="none" className="h-full">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Demand, last 14 days</h2>
              <p className="mt-1 text-[12.5px] text-content-muted">
                Requests created per day against requests completed the same day.
              </p>
            </div>
            <div className="h-64 px-3 py-5 text-content-muted">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendSeries} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="ov-bookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={VIOLET} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={VIOLET} stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="ov-completed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={AQUA} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={AQUA} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.18} vertical={false} />
                  <XAxis dataKey="day" interval={1} {...axisProps} />
                  <YAxis allowDecimals={false} width={44} {...axisProps} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'currentColor', strokeOpacity: 0.3 }} />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="Created"
                    stroke={VIOLET}
                    strokeWidth={2}
                    fill="url(#ov-bookings)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke={AQUA}
                    strokeWidth={2}
                    fill="url(#ov-completed)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-[12px] text-content-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: VIOLET }} aria-hidden="true" />
                Created
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: AQUA }} aria-hidden="true" />
                Completed
              </span>
            </p>
          </Card>
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Reveal>
          <Card padding="none" className="h-full">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Share of bookings by category</h2>
              <p className="mt-1 text-[12.5px] text-content-muted">Categories with at least one request.</p>
            </div>
            {categorySeries.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-content-muted">No bookings recorded yet.</p>
            ) : (
              <>
                <div className="h-56 px-3 py-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ChartTooltip unit="bookings" />} />
                      <Pie
                        data={categorySeries}
                        dataKey="bookings"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {categorySeries.map((row) => (
                          <Cell key={row.id} fill={row.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="grid gap-x-4 gap-y-1.5 border-t border-line px-5 py-4 sm:grid-cols-2">
                  {categorySeries.map((row) => (
                    <li key={row.id} className="flex items-center gap-2 text-[12.5px]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: row.fill }} aria-hidden="true" />
                      <span className="truncate text-content-soft">{row.name}</span>
                      <span className="ml-auto shrink-0 font-bold tabular-nums text-content">{row.bookings}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.06}>
          <Card padding="none" className="h-full">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
              <div>
                <h2 className="font-display text-[16px] font-bold tracking-[-0.02em]">Recent activity</h2>
                <p className="mt-1 text-[12.5px] text-content-muted">Newest updated bookings first.</p>
              </div>
              <Link
                to="/admin/bookings"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600 hover:text-aqua-600 dark:text-brand-300 dark:hover:text-aqua-300"
              >
                All bookings
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <ol className="divide-y divide-line">
              {recentActivity.map((booking) => {
                const provider = findProvider(state, booking.providerId);
                const customer = findUser(state, booking.customerId);
                const active = isActiveBooking(booking);
                return (
                  <li key={booking.id}>
                    <Link
                      to={`/booking/${booking.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas-2"
                    >
                      <Avatar name={provider?.name ?? 'Removed'} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-display text-[13px] font-bold tracking-[-0.01em] text-content">
                            {booking.code}
                          </span>
                          <span className="truncate text-[12.5px] text-content-muted">
                            {provider?.name ?? 'Provider removed'} · {customer?.name ?? 'Customer'}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[11.5px] text-content-muted">
                          {formatDate(booking.date)} · {relativeTime(booking.updatedAt)}
                          {active ? ' · still running' : ''}
                        </span>
                      </span>
                      <StatusBadge status={booking.status} size="sm" showDot={false} className="shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
