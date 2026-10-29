import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building,
  CircleAlert,
  CircleQuestionMark,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { decoratedProviders, findCategory } from '../utils/selectors';
import { formatDate, formatPKR } from '../utils/format';
import { required, hasErrors, runValidation } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Avatar } from '../components/ui/Avatar';
import { Badge, VerificationBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Segmented, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils/cn';

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// SC-14: an application is only approvable when the profile can actually serve a
// customer. Missing bio, services or service areas are surfaced as blockers.
function profileGaps(provider) {
  const gaps = [];
  if (!provider.bio || provider.bio.trim().length < 20) gaps.push('Description missing or too short');
  if (!provider.services?.length) gaps.push('No services or prices published');
  if (!provider.areas?.length) gaps.push('No service areas listed');
  if (!provider.phone) gaps.push('No contact number');
  return gaps;
}

export default function AdminVerification() {
  const { state, setVerification, updateProvider } = useStore();
  const toast = useToast();

  const [tab, setTab] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  const queue = useMemo(() => {
    const all = decoratedProviders(state);
    const byStatus = (status) =>
      all
        .filter((p) => p.verificationStatus === status)
        .sort((a, b) => a.name.localeCompare(b.name));
    return {
      pending: byStatus('pending'),
      verified: byStatus('verified'),
      rejected: byStatus('rejected'),
    };
  }, [state]);

  const counts = {
    pending: queue.pending.length,
    verified: queue.verified.length,
    rejected: queue.rejected.length,
  };

  const list = queue[tab];

  const approve = (provider) => {
    const gaps = profileGaps(provider);
    setVerification(provider.id, 'verified');
    if (gaps.length) {
      // Approval is allowed, but an incomplete listing will look thin publicly.
      toast.warning(`${provider.name} is now publicly listed with ${gaps.length} profile gap(s) to chase up.`, {
        title: 'Approved — profile incomplete',
      });
      return;
    }
    toast.success(`${provider.name} is live in search and category listings.`, { title: 'Provider verified' });
  };

  const openReject = (provider) => {
    setRejectTarget(provider);
    setNote('');
    setErrors({});
  };

  const closeReject = () => {
    setRejectTarget(null);
    setNote('');
    setErrors({});
  };

  const submitRejection = () => {
    const validation = runValidation({ note }, { note: (v) => required(v, 'Rejection reason') });
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    const provider = rejectTarget;
    setVerification(provider.id, 'rejected');
    updateProvider(provider.id, { verificationNote: note.trim() });
    closeReject();
    toast.error(`${provider.name} was declined and stays hidden from the marketplace.`, {
      title: 'Application rejected',
    });
  };

  const reinstate = (provider) => {
    setVerification(provider.id, 'verified');
    toast.success(`${provider.name} is publicly listed again.`, { title: 'Reinstated' });
  };

  const revoke = (provider) => {
    setVerification(provider.id, 'pending');
    toast.info(`${provider.name} is back in the pending queue and hidden from public listings.`, {
      title: 'Verification withdrawn',
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Provider verification"
        description="Nothing reaches a customer until it is approved here: only businesses marked verified appear in public browse, search and booking."
        actions={
          <Badge tone={counts.pending > 0 ? 'amber' : 'success'} icon={ShieldCheck}>
            {counts.pending > 0 ? `${counts.pending} awaiting decision` : 'Queue clear'}
          </Badge>
        }
      />

      <Segmented
        className="w-full sm:w-auto"
        ariaLabel="Filter verification applications by state"
        value={tab}
        onChange={setTab}
        options={TABS.map((t) => ({ value: t.value, label: `${t.label} (${counts[t.value]})` }))}
      />

      <p className="mt-3 text-[12.5px] leading-relaxed text-content-muted">
        {tab === 'pending'
          ? 'Approve to publish the business, or reject with a written reason that is stored on the profile.'
          : tab === 'verified'
            ? 'Verified businesses are live in the marketplace. Withdrawing verification hides them again at once.'
            : 'Declined applications stay private. The stored reason is shown below each one.'}
      </p>

      {list.length === 0 ? (
        <Reveal className="mt-6 block">
          <EmptyState
            icon={tab === 'pending' ? BadgeCheck : ShieldCheck}
            tone="dashed"
            title={
              tab === 'pending'
                ? 'The verification queue is clear'
                : tab === 'verified'
                  ? 'No verified businesses yet'
                  : 'Nothing has been rejected'
            }
            description={
              tab === 'pending'
                ? 'Every applicant has a decision. New provider registrations land here automatically for review.'
                : tab === 'verified'
                  ? 'Once you approve an application it appears in this tab and in the public marketplace.'
                  : 'Applications you decline for insufficient documentation will be listed here with their reasons.'
            }
            action={
              tab !== 'pending' ? (
                <Button variant="secondary" onClick={() => setTab('pending')}>
                  Go to pending queue ({counts.pending})
                </Button>
              ) : undefined
            }
          />
        </Reveal>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {list.map((provider, i) => {
            const gaps = profileGaps(provider);
            const category = findCategory(state, provider.categoryId);
            return (
              <Reveal key={provider.id} delay={Math.min(i * 0.04, 0.2)} className="block">
                <Card padding="none" className="overflow-hidden">
                  <div className="flex flex-col gap-5 border-b border-line p-5 sm:flex-row sm:items-start">
                    <Avatar name={provider.name} size="lg" ring className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-[19px] leading-tight font-bold tracking-[-0.02em]">
                          <Link to={`/provider/${provider.slug}`} className="hover:text-brand-600 dark:hover:text-brand-300">
                            {provider.name}
                          </Link>
                        </h2>
                        <VerificationBadge status={provider.verificationStatus} />
                        {provider.reviewCount > 0 && (
                          <Badge tone="neutral" size="sm">
                            {provider.rating.toFixed(1)} ★ · {provider.reviewCount} reviews
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[13.5px] text-content-muted">{provider.tagline}</p>

                      <dl className="mt-4 grid gap-x-6 gap-y-3 text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
                        <DetailRow icon={Building} term="Owner">
                          {provider.ownerName}
                        </DetailRow>
                        <DetailRow icon={MapPin} term="Location">
                          {provider.city}
                          {provider.areas?.length ? ` · ${provider.areas.length} area(s)` : ''}
                        </DetailRow>
                        <DetailRow icon={Briefcase} term="Category">
                          {category?.name ?? 'Uncategorised'}
                        </DetailRow>
                        <DetailRow icon={Clock} term="Experience">
                          {provider.yearsExperience} years · replies in ~{provider.responseMins} min
                        </DetailRow>
                        <DetailRow icon={Phone} term="Phone">
                          {provider.phone || 'Not provided'}
                        </DetailRow>
                        <DetailRow icon={Mail} term="Email">
                          <span className="truncate">{provider.email || 'Not provided'}</span>
                        </DetailRow>
                      </dl>
                    </div>
                  </div>

                  {/* Services offered — evidence used to judge readiness */}
                  <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">
                        Services published ({provider.services?.length ?? 0})
                      </p>
                      {provider.services?.length ? (
                        <ul className="mt-2.5 flex flex-col gap-2">
                          {provider.services.map((service) => (
                            <li
                              key={service.id}
                              className="flex items-baseline justify-between gap-3 rounded-sm border border-line bg-canvas-2/50 px-3 py-2"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-[13px] font-semibold text-content">
                                  {service.name}
                                </span>
                                <span className="block truncate text-[12px] text-content-muted">
                                  {service.description}
                                </span>
                              </span>
                              <span className="shrink-0 text-[12.5px] font-bold whitespace-nowrap text-content">
                                {formatPKR(service.price)}
                                <span className="ml-1 font-normal text-content-muted">/{service.unit}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2.5 text-[13px] text-content-muted">
                          This business has not published any priced service yet.
                        </p>
                      )}
                      {provider.areas?.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {provider.areas.map((area) => (
                            <li key={area}>
                              <Badge tone="neutral" size="sm">
                                {area}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div
                        className={cn(
                          'rounded-sm border px-4 py-3',
                          gaps.length ? 'border-glow-400/45 bg-glow-400/8' : 'border-completed/35 bg-completed/8'
                        )}
                      >
                        <p
                          className={cn(
                            'flex items-center gap-2 font-display text-[13px] font-bold',
                            gaps.length ? 'text-glow-700 dark:text-glow-300' : 'text-completed'
                          )}
                        >
                          {gaps.length ? (
                            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          {gaps.length ? 'Insufficient profile data' : 'Profile complete'}
                        </p>
                        {gaps.length ? (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] leading-snug text-content-soft">
                            {gaps.map((gap) => (
                              <li key={gap}>{gap}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1.5 text-[12.5px] leading-snug text-content-soft">
                            Description, priced services and service areas are all present.
                          </p>
                        )}
                      </div>

                      {provider.verificationNote && (
                        <p className="rounded-sm border-l-2 border-rejected bg-rejected/8 px-3.5 py-3 text-[12.5px] leading-relaxed text-content-soft">
                          <span className="block font-bold text-content">Reason on file</span>
                          {provider.verificationNote}
                        </p>
                      )}

                      <p className="text-[12px] text-content-muted">
                        Registered {formatDate(provider.joinedAt)} · id {provider.id}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center gap-2">
                        {tab === 'pending' && (
                          <>
                            <Button size="sm" variant="success" icon={BadgeCheck} onClick={() => approve(provider)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" icon={CircleAlert} onClick={() => openReject(provider)}>
                              Reject
                            </Button>
                          </>
                        )}
                        {tab === 'verified' && (
                          <>
                            <Button size="sm" variant="secondary" icon={Clock} onClick={() => revoke(provider)}>
                              Send back for review
                            </Button>
                            <Button size="sm" variant="ghost" to={`/provider/${provider.slug}`} icon={Building}>
                              Public page
                            </Button>
                          </>
                        )}
                        {tab === 'rejected' && (
                          <>
                            <Button size="sm" variant="success" icon={BadgeCheck} onClick={() => reinstate(provider)}>
                              Approve after all
                            </Button>
                            <Button size="sm" variant="outline" icon={CircleQuestionMark} onClick={() => openReject(provider)}>
                              Update reason
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={closeReject}
        title={`Reject ${rejectTarget?.name ?? 'application'}`}
        description="A written reason is required and saved to the business record so the owner can be told what to fix."
        footer={
          <>
            <Button variant="ghost" onClick={closeReject}>
              Cancel
            </Button>
            <Button variant="danger" icon={CircleAlert} onClick={submitRejection}>
              Reject application
            </Button>
          </>
        }
      >
        <Textarea
          label="Rejection reason"
          required
          rows={4}
          maxLength={280}
          showCount
          value={note}
          error={errors.note}
          onChange={(e) => {
            setNote(e.target.value);
            if (errors.note) setErrors({});
          }}
          placeholder="e.g. Trade certificate unclear and no service prices published yet."
        />
        {rejectTarget && profileGaps(rejectTarget).length > 0 && (
          <p className="mt-1 flex items-start gap-2 rounded-sm border border-line bg-canvas-2/60 px-3.5 py-3 text-[12.5px] leading-relaxed text-content-soft">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-glow-600 dark:text-glow-300" aria-hidden="true" />
            Detected gaps you can quote directly: {profileGaps(rejectTarget).join('; ')}.
          </p>
        )}
      </Modal>
    </>
  );
}

function DetailRow({ icon: Icon, term, children }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-content-muted">{term}</dt>
        <dd className="truncate font-semibold text-content">{children}</dd>
      </div>
    </div>
  );
}
