import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Eye, Flag, MessageSquareOff, Search, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { findBooking, findProvider, findUser } from '../utils/selectors';
import { COMPLAINT_STATUSES } from '../data/complaints';
import { formatDate, relativeTime } from '../utils/format';
import { required, hasErrors, runValidation } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Segmented, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ComplaintCard } from '../components/cards/ComplaintCard';
import { useToast } from '../components/ui/Toast';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export default function AdminComplaints() {
  const { state, setComplaintStatus } = useStore();
  const toast = useToast();

  const [tab, setTab] = useState('open');
  const [query, setQuery] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [resolving, setResolving] = useState(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  const counts = useMemo(() => {
    const base = { all: state.complaints.length, open: 0, in_review: 0, resolved: 0, dismissed: 0 };
    state.complaints.forEach((c) => {
      base[c.status] = (base[c.status] ?? 0) + 1;
    });
    return base;
  }, [state.complaints]);

  // High priority first, then newest, so the most damaging issues surface top.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.complaints
      .filter((c) => (tab === 'all' ? true : c.status === tab))
      .filter((c) => (priorityOnly ? c.priority === 'high' : true))
      .filter((c) => {
        if (!q) return true;
        const provider = findProvider(state, c.providerId);
        return [c.code, c.subject, c.details, provider?.name].join(' ').toLowerCase().includes(q);
      })
      .map((complaint) => {
        const complainant = findUser(state, complaint.complainantId);
        const provider = findProvider(state, complaint.providerId);
        const booking = complaint.bookingId ? findBooking(state, complaint.bookingId) : null;
        return { complaint, complainant, provider, booking };
      })
      .sort((a, b) => {
        const rank = PRIORITY_RANK[a.complaint.priority] - PRIORITY_RANK[b.complaint.priority];
        if (rank !== 0) return rank;
        return new Date(b.complaint.createdAt) - new Date(a.complaint.createdAt);
      });
  }, [state, tab, priorityOnly, query]);

  const move = (complaint, status, message, tone = 'info') => {
    setComplaintStatus(complaint.id, status);
    toast[tone](message, { title: `${complaint.code} · ${COMPLAINT_STATUSES[status].label}` });
  };

  const openResolve = (complaint) => {
    setResolving(complaint);
    setNote(complaint.resolution ?? '');
    setErrors({});
  };

  const closeResolve = () => {
    setResolving(null);
    setNote('');
    setErrors({});
  };

  const submitResolve = () => {
    const validation = runValidation({ note }, { note: (v) => required(v, 'Resolution note') });
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    const complaint = resolving;
    setComplaintStatus(complaint.id, 'resolved', note.trim());
    closeResolve();
    toast.success(`${complaint.code} closed with a written resolution.`, { title: 'Complaint resolved' });
  };

  const filtersActive = query.trim() !== '' || priorityOnly;
  const clearFilters = () => {
    setQuery('');
    setPriorityOnly(false);
  };

  const unresolved = counts.open + counts.in_review;

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Complaint desk"
        description="Customer escalations against providers. Every issue moves through review to a written resolution or a dismissal — nothing closes silently."
        actions={
          <Badge tone={unresolved > 0 ? 'danger' : 'success'} icon={unresolved > 0 ? Flag : ShieldCheck}>
            {unresolved > 0 ? `${unresolved} awaiting action` : 'Desk is clear'}
          </Badge>
        }
      />

      {/* --------------------------------------------------- summary strip by status */}
      <Card padding="sm">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
          {Object.entries(COMPLAINT_STATUSES).map(([key, meta]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key ? 'true' : undefined}
                className={`w-full rounded-sm border px-3 py-2.5 text-left transition-colors ${
                  tab === key ? 'border-brand-500/50 bg-brand-500/8' : 'border-line hover:border-line-strong hover:bg-canvas-2'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                  <span className="truncate text-[11px] font-bold tracking-[0.1em] text-content-muted uppercase">
                    {meta.label}
                  </span>
                </span>
                <span className="mt-1 block font-display text-[20px] leading-none font-extrabold tabular-nums">
                  {counts[key] ?? 0}
                </span>
              </button>
            </li>
          ))}
          <li className="col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => setTab('all')}
              aria-current={tab === 'all' ? 'true' : undefined}
              className={`w-full rounded-sm border px-3 py-2.5 text-left transition-colors ${
                tab === 'all' ? 'border-brand-500/50 bg-brand-500/8' : 'border-line hover:border-line-strong hover:bg-canvas-2'
              }`}
            >
              <span className="text-[11px] font-bold tracking-[0.1em] text-content-muted uppercase">All</span>
              <span className="mt-1 block font-display text-[20px] leading-none font-extrabold tabular-nums">
                {counts.all}
              </span>
            </button>
          </li>
        </ul>

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 lg:flex-row lg:items-end lg:justify-between">
          <Segmented
            ariaLabel="Filter complaints by state"
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'open', label: `Open (${counts.open})` },
              { value: 'in_review', label: `In review (${counts.in_review})` },
              { value: 'resolved', label: `Resolved (${counts.resolved})` },
              { value: 'dismissed', label: `Dismissed (${counts.dismissed})` },
              { value: 'all', label: `All (${counts.all})` },
            ]}
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 lg:w-64">
              <Input
                label="Search complaints"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Code, subject or provider"
                icon={Search}
              />
            </div>
            <button
              type="button"
              onClick={() => setPriorityOnly((v) => !v)}
              aria-pressed={priorityOnly}
              className={`inline-flex h-11 items-center gap-2 rounded-sm border px-3.5 text-[13px] font-semibold transition-colors ${
                priorityOnly
                  ? 'border-rejected/45 bg-rejected/10 text-rejected'
                  : 'border-line text-content-soft hover:border-line-strong hover:bg-canvas-2'
              }`}
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              High priority only
            </button>
            {filtersActive && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      <p className="mt-3 text-[12.5px] text-content-muted">
        Showing {rows.length} complaint{rows.length === 1 ? '' : 's'} — sorted high priority first, then newest.
      </p>

      {rows.length === 0 ? (
        <Reveal className="mt-4 block">
          <EmptyState
            icon={MessageSquareOff}
            tone="dashed"
            title={tab === 'resolved' ? 'Nothing resolved yet' : 'No complaints in this state'}
            description={
              filtersActive
                ? 'Your search or the high-priority switch is hiding records. Clear them to see the full desk.'
                : 'New complaints raised by customers appear here immediately and are notified to every admin.'
            }
            action={
              filtersActive ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
            secondaryAction={
              tab !== 'all' ? (
                <Button variant="ghost" onClick={() => setTab('all')}>
                  Show all {counts.all}
                </Button>
              ) : undefined
            }
          />
        </Reveal>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {rows.map(({ complaint, complainant, provider, booking }, i) => {
            const isClosed = complaint.status === 'resolved' || complaint.status === 'dismissed';
            return (
              <Reveal key={complaint.id} delay={Math.min(i * 0.04, 0.2)} className="block">
                <ComplaintCard
                  complaint={complaint}
                  complainantName={complainant?.name ?? 'Account removed'}
                  providerName={provider?.name ?? 'Provider removed'}
                  actions={
                    <>
                      {!isClosed && complaint.status === 'open' && (
                        <Button size="sm" variant="amber" icon={Eye} onClick={() => move(complaint, 'in_review', `${complaint.code} moved into review.`, 'info')}>
                          Start review
                        </Button>
                      )}
                      {!isClosed && complaint.status === 'in_review' && (
                        <Button size="sm" variant="secondary" icon={Eye} onClick={() => openResolve(complaint)}>
                          Prepare resolution
                        </Button>
                      )}
                      {!isClosed && (
                        <>
                          <Button size="sm" variant="success" icon={CircleCheck} onClick={() => openResolve(complaint)}>
                            Mark resolved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              move(
                                complaint,
                                'dismissed',
                                `${complaint.code} dismissed — no platform action required.`,
                                'warning'
                              )
                            }
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                      {isClosed && (
                        <Button size="sm" variant="ghost" onClick={() => move(complaint, 'open', `${complaint.code} reopened for review.`, 'warning')}>
                          Reopen
                        </Button>
                      )}
                      {provider && (
                        <Button size="sm" variant="ghost" icon={ShieldCheck} to={`/provider/${provider.slug}`}>
                          Provider page
                        </Button>
                      )}
                      {booking && (
                        <Link
                          to={`/booking/${booking.id}`}
                          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600 hover:text-aqua-600 dark:text-brand-300"
                        >
                          Booking {booking.code} · {formatDate(booking.date)}
                        </Link>
                      )}
                    </>
                  }
                />
              </Reveal>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-content-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        Resolution notes are stored on the complaint record and shown back to the customer in their own complaints
        screen, so the wording should stay factual and actionable. Last desk activity{' '}
        {state.complaints.length ? relativeTime(state.complaints[0].updatedAt) : '—'}.
      </p>

      <Modal
        open={Boolean(resolving)}
        onClose={closeResolve}
        title={`Resolve ${resolving?.code ?? 'complaint'}`}
        description="Summarise what was done and what the customer can expect. Required before a complaint can close."
        footer={
          <>
            <Button variant="ghost" onClick={closeResolve}>
              Cancel
            </Button>
            <Button variant="success" icon={CircleCheck} onClick={submitResolve}>
              Mark resolved
            </Button>
          </>
        }
      >
        {resolving && (
          <p className="mb-4 rounded-sm border border-line bg-canvas-2/60 px-3.5 py-3 text-[13px] leading-relaxed text-content-soft">
            <span className="block font-bold text-content">{resolving.subject}</span>
            <span className="mt-1 block text-content-muted">{resolving.details}</span>
          </p>
        )}
        <Textarea
          label="Resolution note"
          required
          rows={4}
          maxLength={320}
          showCount
          value={note}
          error={errors.note}
          onChange={(e) => {
            setNote(e.target.value);
            if (errors.note) setErrors({});
          }}
          hint="Visible to the complainant as the outcome of their case."
        />
      </Modal>
    </>
  );
}
