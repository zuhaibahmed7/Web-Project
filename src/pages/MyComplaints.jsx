import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Inbox, LifeBuoy, RotateCcw, Send } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { bookingsByCustomer, findProvider } from '../utils/selectors';
import { STATUS } from '../utils/booking';
import { hasErrors, minLength, required, runValidation } from '../utils/validation';
import { formatDate } from '../utils/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input, Select, Segmented, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/ui/Reveal';
import { useToast } from '../components/ui/Toast';
import { ComplaintCard } from '../components/cards/ComplaintCard';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
];

const EMPTY_FORM = { bookingId: '', subject: '', details: '', priority: 'medium' };

// The customer's complaint desk: raise an issue against a finished job and follow
// the admin's resolution (FR-RR-05, UC-12/UC-13).
export default function MyComplaints() {
  const { state, currentUser, addComplaint } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const mine = useMemo(
    () =>
      state.complaints
        .filter((c) => c.complainantId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [state.complaints, currentUser.id]
  );

  const shown = tab === 'all' ? mine : mine.filter((c) => c.status === tab);

  // Only decided bookings can be complained about — a Pending one has no outcome
  // to dispute yet, so offering it would invite noise complaints (BRL-07 sibling rule).
  const eligibleBookings = useMemo(
    () => bookingsByCustomer(state, currentUser.id).filter((b) => b.status !== STATUS.PENDING),
    [state, currentUser.id]
  );

  const openCount = mine.filter((c) => c.status === 'open' || c.status === 'in_review').length;

  const bookingOptions = eligibleBookings.map((b) => {
    const provider = findProvider(state, b.providerId);
    return {
      value: b.id,
      label: `${b.code} · ${provider?.name ?? 'Provider removed'} · ${formatDate(b.date)} (${b.status.replace('_', ' ')})`,
    };
  });

  const closeForm = () => {
    setOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const submit = () => {
    const found = runValidation(form, {
      bookingId: (v) => required(v, 'The booking'),
      subject: (v) => required(v, 'Subject') || minLength(v, 6, 'Subject'),
      details: (v) => required(v, 'Details') || minLength(v, 15, 'Details'),
    });
    if (hasErrors(found)) {
      setErrors(found);
      return;
    }

    const booking = eligibleBookings.find((b) => b.id === form.bookingId);
    addComplaint({
      complainantId: currentUser.id,
      providerId: booking.providerId,
      bookingId: booking.id,
      subject: form.subject.trim(),
      details: form.details.trim(),
      priority: form.priority,
    });

    closeForm();
    toast.success('Complaint filed. Every admin has been notified and will pick it up in the Complaints desk.', {
      title: 'Complaint submitted',
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="My complaints"
        description={
          mine.length
            ? `${mine.length} complaint${mine.length === 1 ? '' : 's'} raised on this account · ${openCount} still with the FixNow team. An admin reply appears on the card as a written resolution.`
            : 'Something went wrong on a completed, cancelled or rejected job? Raise it here — an administrator is notified immediately and their answer is recorded against your complaint.'
        }
        actions={
          <Button icon={Flag} onClick={() => (eligibleBookings.length ? setOpen(true) : navigate('/browse'))}>
            Raise a complaint
          </Button>
        }
      />

      {/* --------------------------------------------------- status summary rail */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented options={STATUS_TABS} value={tab} onChange={setTab} ariaLabel="Filter my complaints by status" />
        {mine.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-content-muted" role="status">
            <Badge tone="danger" size="sm">
              {mine.filter((c) => c.status === 'open').length} open
            </Badge>
            <Badge tone="amber" size="sm">
              {mine.filter((c) => c.status === 'in_review').length} in review
            </Badge>
            <Badge tone="success" size="sm">
              {mine.filter((c) => c.status === 'resolved').length} resolved
            </Badge>
          </p>
        )}
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={Inbox}
          tone="dashed"
          title="No complaints on this account"
          description="That is a good thing — but if a provider missed a slot, overcharged against the estimate or left the work unfinished, record it here so an admin can act on it."
          action={
            <Button icon={Flag} onClick={() => (eligibleBookings.length ? setOpen(true) : navigate('/browse'))}>
              Raise a complaint
            </Button>
          }
          secondaryAction={
            <Button variant="outline" to="/browse" icon={RotateCcw}>
              Book a verified provider
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          tone="dashed"
          title={`Nothing ${STATUS_TABS.find((t) => t.value === tab).label.toLowerCase()}`}
          description="Switch filters to see the rest of your complaint history."
          action={
            <Button variant="secondary" onClick={() => setTab('all')}>
              Show all complaints
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((complaint, i) => {
            const provider = findProvider(state, complaint.providerId);
            return (
              <li key={complaint.id}>
                <Reveal delay={i * 0.05}>
                  <ComplaintCard
                    complaint={complaint}
                    complainantName={currentUser.name}
                    providerName={provider?.name ?? null}
                  />
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-[12.5px] leading-relaxed text-content-muted">
        Complaints are visible to FixNow administrators only — the provider is not sent your text. Priority sets the
        order admins work through, not a guarantee of outcome, and everything is stored in this browser for the demo.
      </p>

      {/* ------------------------------------------------------------ modal */}
      <Modal
        open={open}
        onClose={closeForm}
        title="Raise a complaint"
        description="One structured report per problem. Admins see it the moment you submit."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeForm}>
              Discard
            </Button>
            <Button icon={Send} onClick={submit}>
              Submit complaint
            </Button>
          </>
        }
      >
        {eligibleBookings.length === 0 ? (
          <Card padding="sm">
            <p className="text-[13.5px] leading-relaxed text-content-soft">
              You have no decided bookings yet. A complaint needs a booking that the provider has already responded to,
              because there is nothing to assess while a request is still Pending.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-5">
            <Select
              label="Which booking does this concern?"
              required
              placeholder="Choose a booking…"
              options={bookingOptions}
              value={form.bookingId}
              error={errors.bookingId}
              hint="Completed, cancelled and rejected jobs only — a Pending request has no outcome to dispute yet."
              onChange={(e) => {
                setForm((f) => ({ ...f, bookingId: e.target.value }));
                setErrors((prev) => ({ ...prev, bookingId: undefined }));
              }}
            />

            <Input
              label="Subject"
              required
              placeholder="e.g. Charged PKR 2,000 above the quoted estimate"
              value={form.subject}
              maxLength={90}
              error={errors.subject}
              hint="One sentence an admin can scan in the queue."
              onChange={(e) => {
                setForm((f) => ({ ...f, subject: e.target.value }));
                setErrors((prev) => ({ ...prev, subject: undefined }));
              }}
            />

            <Textarea
              label="What happened?"
              required
              rows={5}
              maxLength={600}
              showCount
              placeholder="Times, what was agreed, what actually happened, and what you would like FixNow to do."
              value={form.details}
              error={errors.details}
              hint="Facts in order. Avoid phone numbers or CNIC details — they are not needed to resolve it."
              onChange={(e) => {
                setForm((f) => ({ ...f, details: e.target.value }));
                setErrors((prev) => ({ ...prev, details: undefined }));
              }}
            />

            <div>
              <p className="mb-2 text-[13px] font-semibold text-content-soft">
                Priority
                <span className="sr-only">(required)</span>
              </p>
              <Segmented
                options={PRIORITIES}
                value={form.priority}
                onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                ariaLabel="Complaint priority"
              />
              <p className="mt-2 text-[12.5px] text-content-muted">
                High means the visit never happened or money changed hands wrongly. Choose honestly — every high flag is
                read before the next one.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
