import { useMemo, useState } from 'react';
import {
  Briefcase,
  Plus,
  Pencil,
  Trash,
  Tag,
  CircleAlert,
  IdCard,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { isActiveBooking } from '../utils/booking';
import { formatPKR } from '../utils/format';
import { uid } from '../utils/id';
import { hasErrors, minLength, required, runValidation, validPrice } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Reveal } from '../components/ui/Reveal';

// Units a Pakistani home-service customer expects to read next to a price.
const UNIT_OPTIONS = [
  { value: 'visit', label: 'Per visit' },
  { value: 'hour', label: 'Per hour' },
  { value: 'item', label: 'Per item / unit' },
  { value: 'quote', label: 'Fixed quote' },
];

const EMPTY_DRAFT = { name: '', description: '', price: '', unit: 'visit' };

export default function ProviderServices() {
  const { state, currentProvider, currentUser, updateProvider } = useStore();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [errors, setErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);

  const services = useMemo(() => currentProvider?.services ?? [], [currentProvider]);

  // Which live bookings depend on each service — used to block removals that would
  // orphan an accepted job (BRL-05: a confirmed booking must stay describable).
  const usage = useMemo(() => {
    if (!currentProvider) return {};
    return state.bookings
      .filter((b) => b.providerId === currentProvider.id && isActiveBooking(b))
      .reduce((acc, b) => {
        acc[b.serviceId] = (acc[b.serviceId] ?? 0) + 1;
        return acc;
      }, {});
  }, [state.bookings, currentProvider]);

  if (!currentUser) return null;

  if (!currentProvider) {
    return (
      <>
        <PageHeader eyebrow="Catalogue" title="Services & prices" />
        <EmptyState
          icon={IdCard}
          tone="dashed"
          title="No business profile linked to this account"
          description={`${currentUser.name} is signed in as a service provider, but there is no provider record to attach services to. Register as a service provider or ask an administrator to link your business.`}
          action={<Button to="/login">Sign in with another account</Button>}
        />
      </>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setEditingId(service.id);
    setDraft({
      name: service.name ?? '',
      description: service.description ?? '',
      price: String(service.price ?? ''),
      unit: normalizeUnit(service.unit),
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
  };

  const set = (key) => (event) => {
    const value = event.target.value;
    setDraft((d) => ({ ...d, [key]: value }));
    // Clear the error for the field being edited so the form feels responsive.
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
  };

  const submit = () => {
    const next = runValidation(draft, {
      name: (v) => required(v, 'Service name') || minLength(v, 3, 'Service name'),
      description: (v) => minLength(v, 10, 'The description'),
      // SC-06: indicative price must be numeric and can never be negative.
      price: (v) => validPrice(v, 'Price'),
    });
    if (hasErrors(next)) {
      setErrors(next);
      toast.error('Fix the highlighted fields before saving.', { title: 'Check the form' });
      return;
    }

    const record = {
      id: editingId ?? uid('svc'),
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: Math.round(Number(draft.price)),
      unit: draft.unit,
    };

    // `services` is replaced wholesale because updateProvider shallow-merges.
    const list = editingId
      ? services.map((s) => (s.id === editingId ? record : s))
      : [...services, record];

    updateProvider(currentProvider.id, { services: list });
    toast.success(
      editingId ? `"${record.name}" updated.` : `"${record.name}" is live at ${formatPKR(record.price)}.`,
      { title: editingId ? 'Service updated' : 'Service added' }
    );
    closeModal();
  };

  const askDelete = (service) => {
    const count = usage[service.id] ?? 0;
    if (count > 0) {
      toast.error(
        `"${service.name}" is on ${count} active booking${count === 1 ? '' : 's'}. Complete or let those jobs close first, then remove it.`,
        { title: 'Cannot delete yet' }
      );
      return;
    }
    setPendingDelete(service);
  };

  const confirmDelete = () => {
    updateProvider(currentProvider.id, { services: services.filter((s) => s.id !== pendingDelete.id) });
    toast.info(`"${pendingDelete.name}" removed from your catalogue.`);
    setPendingDelete(null);
  };

  const cheapest = services.length ? Math.min(...services.map((s) => s.price)) : null;
  const dearest = services.length ? Math.max(...services.map((s) => s.price)) : null;

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Services & prices"
        description="Everything customers can book from you. Prices are indicative starting points — the final amount is agreed on site, and FixNow never charges through the platform."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add service
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-brand-500/12 text-brand-600 dark:text-brand-300">
            <Briefcase className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">Live services</span>
            <span className="mt-1 block font-display text-[18px] leading-none font-extrabold tabular-nums">{services.length}</span>
          </span>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-aqua-400/14 text-aqua-700 dark:text-aqua-300">
            <Wallet className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">Price range</span>
            <span className="mt-1 block font-display text-[15px] leading-tight font-extrabold tabular-nums">
              {cheapest === null ? 'Add a service' : cheapest === dearest ? formatPKR(cheapest) : `${formatPKR(cheapest)} – ${formatPKR(dearest)}`}
            </span>
          </span>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-glow-400/16 text-glow-700 dark:text-glow-300">
            <Tag className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">On active bookings</span>
            <span className="mt-1 block font-display text-[18px] leading-none font-extrabold tabular-nums">
              {Object.values(usage).reduce((a, b) => a + b, 0)}
            </span>
          </span>
        </Card>
      </div>

      {services.length === 0 ? (
        // SC-14: an empty catalogue must still render a usable page.
        <EmptyState
          icon={Briefcase}
          tone="dashed"
          title="You have not listed a service yet"
          description="Customers cannot book anything until at least one service with an indicative price exists. Add your most requested job first."
          action={<Button icon={Plus} onClick={openCreate}>Add your first service</Button>}
          secondaryAction={
            <Button variant="outline" to="/partner/profile">
              Check the rest of your profile
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop: compact table. Mobile: stacked cards — same data, same actions. */}
          <Card padding="none" className="hidden overflow-hidden lg:block">
            <table className="w-full text-left text-[13.5px]">
              <caption className="sr-only">Your services, indicative prices and actions</caption>
              <thead>
                <tr className="border-b border-line bg-canvas-2/60 text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">
                  <th scope="col" className="px-5 py-3">Service</th>
                  <th scope="col" className="px-5 py-3">Indicative price</th>
                  <th scope="col" className="px-5 py-3">Bookings using it</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {services.map((service) => (
                  <tr key={service.id} className="transition-colors hover:bg-canvas-2/50">
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-content">{service.name}</p>
                      <p className="mt-1 max-w-prose text-[12.5px] leading-relaxed text-content-muted">
                        {service.description || 'No description yet — add one so customers know the scope.'}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <span className="font-display text-[15px] font-bold tabular-nums">{formatPKR(service.price)}</span>
                      <span className="mt-0.5 block text-[12px] text-content-muted">{priceSuffix(service.unit)}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {(usage[service.id] ?? 0) > 0 ? (
                        <Badge tone="amber" size="sm">
                          {usage[service.id]} active
                        </Badge>
                      ) : (
                        <span className="text-[12.5px] text-content-muted">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" icon={Pencil} onClick={() => openEdit(service)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash}
                          onClick={() => askDelete(service)}
                          aria-label={`Delete ${service.name}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <ul className="space-y-4 lg:hidden">
            {services.map((service, i) => (
              <li key={service.id}>
                <Reveal delay={Math.min(i, 5) * 0.05}>
                  <Card padding="sm" className="grad-frame relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] font-bold tracking-[-0.02em]">{service.name}</p>
                        <p className="mt-1 text-[13px] font-bold tabular-nums text-brand-600 dark:text-brand-300">
                          {formatPKR(service.price)} <span className="font-normal text-content-muted">{priceSuffix(service.unit)}</span>
                        </p>
                      </div>
                      {(usage[service.id] ?? 0) > 0 && (
                        <Badge tone="amber" size="sm">
                          {usage[service.id]} active
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="mt-2.5 text-[12.5px] leading-relaxed text-content-muted">{service.description}</p>
                    )}
                    <div className="mt-3.5 flex gap-2">
                      <Button size="sm" variant="outline" icon={Pencil} onClick={() => openEdit(service)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" icon={Trash} onClick={() => askDelete(service)}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>

          <p className="mt-5 flex items-start gap-2 text-[12.5px] leading-relaxed text-content-muted">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Prices shown to customers are indicative starting points only. Keep them realistic — search results list your
            lowest price first, and an estimate far off the mark hurts your rating.
          </p>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit service' : 'Add a service'}
        description="Shown exactly as written on your public profile and inside the booking form."
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? 'Save changes' : 'Add service'}</Button>
          </>
        }
      >
        <form
          className="space-y-1"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            id="service-name"
            label="Service name"
            required
            value={draft.name}
            onChange={set('name')}
            error={errors.name}
            placeholder="Distribution board upgrade"
            maxLength={70}
          />
          <Textarea
            id="service-description"
            label="What is included"
            rows={3}
            value={draft.description}
            onChange={set('description')}
            error={errors.description}
            hint="Scope, materials and prep help customers choose correctly."
            placeholder="Replace MCBs, add earth-leakage protection and label every circuit."
            maxLength={220}
            showCount
          />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Input
              id="service-price"
              label="Indicative price"
              required
              type="number"
              inputMode="numeric"
              min="0"
              step="50"
              suffix="PKR"
              value={draft.price}
              onChange={set('price')}
              error={errors.price}
              placeholder="6500"
            />
            <Select
              id="service-unit"
              label="Charged per"
              options={UNIT_OPTIONS}
              value={draft.unit}
              onChange={set('unit')}
              hint="Shown next to the price, e.g. PKR 6,500 per visit or a fixed quote."
            />
          </div>
          <button type="submit" className="sr-only">
            Save service
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete "${pendingDelete?.name ?? ''}"?`}
        message="It disappears from your public profile immediately, and customers can no longer request it. Past bookings keep their history, but this cannot be undone from this screen."
        confirmLabel="Delete service"
        tone="danger"
      />

      {services.length > 0 && (
        <p className="mt-6 flex flex-wrap items-center gap-2 text-[13px] text-content-muted">
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          Customers see these on your public profile under{" "}
          <span className="font-semibold text-content">Services &amp; prices</span>.
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- helpers */

// Existing seed data uses varied unit words; map them onto the four supported
// options so editing a service never silently rewrites its billing unit.
function normalizeUnit(unit) {
  const map = {
    visit: 'visit',
    hour: 'hour',
    unit: 'item',
    item: 'item',
    room: 'item',
    job: 'quote',
    quote: 'quote',
    wall: 'item',
    tank: 'item',
    year: 'quote',
    sqft: 'item',
    rft: 'item',
    point: 'item',
    step: 'item',
  };
  return map[unit] ?? 'visit';
}

function unitLabel(unit) {
  return { visit: 'visit', hour: 'hour', item: 'item', quote: 'fixed quote' }[unit] ?? 'visit';
}

// Seed data uses many unit words (room, sqft, rft…); group them so the catalogue
// never reads "per undefined", and drop "per" for a lump-sum quote.
function priceSuffix(unit) {
  const label = unitLabel(normalizeUnit(unit));
  return label === 'fixed quote' ? 'fixed quote' : `per ${label}`;
}
