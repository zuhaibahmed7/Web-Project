import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Layers, LayersPlus, Pencil, Plus, Trash, Wallet } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatPKR } from '../utils/format';
import { hasErrors, minLength, required, runValidation, validPrice } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Stagger, StaggerItem } from '../components/ui/Reveal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils/cn';

// The icon keys CategoryIcon.jsx can actually resolve — offering anything else
// would render a fallback tile and misrepresent the category.
const ICON_KEYS = ['droplets', 'zap', 'snowflake', 'sparkles', 'roller', 'hammer', 'car', 'wrench'];
const ICON_OPTIONS = ICON_KEYS.map((key) => ({ value: key, label: key.charAt(0).toUpperCase() + key.slice(1) }));

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const BLANK = {
  name: '',
  slug: '',
  icon: 'wrench',
  tagline: '',
  description: '',
  from: '',
  accentFrom: '#6C5CE7',
  accentTo: '#00D4C8',
};

export default function AdminCategories() {
  const { state, addCategory, updateCategory, removeCategory } = useStore();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // category id being edited, null = create
  const [values, setValues] = useState(BLANK);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Provider usage is derived live, so a category can never be deleted out from
  // under businesses that still depend on it.
  const rows = useMemo(
    () =>
      state.categories.map((category) => ({
        category,
        providers: state.providers.filter((p) => p.categoryId === category.id),
        bookings: state.bookings.filter((b) =>
          state.providers.some((p) => p.categoryId === category.id && p.id === b.providerId)
        ).length,
      })),
    [state.categories, state.providers, state.bookings]
  );

  const slugTaken = useMemo(() => {
    const taken = new Set(state.categories.map((c) => c.slug));
    if (editing) {
      const original = state.categories.find((c) => c.id === editing)?.slug;
      if (original) taken.delete(original);
    }
    return taken;
  }, [state.categories, editing]);

  const validate = (next) => {
    const validation = runValidation(next, {
      name: (v) => required(v, 'Category name'),
      icon: (v) => (ICON_KEYS.includes(v) ? '' : 'Pick one of the supported icons.'),
      tagline: (v) => required(v, 'Tagline'),
      description: (v) => minLength(v, 20, 'Description'),
      from: (v) => validPrice(v, 'Starting price'),
    });
    if (!next.slug.trim()) validation.slug = 'Slug is required.';
    else if (slugTaken.has(next.slug)) validation.slug = 'That slug is already used by another category.';
    return validation;
  };

  const openCreate = () => {
    setEditing(null);
    setValues(BLANK);
    setSlugTouched(false);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category.id);
    setValues({
      name: category.name ?? '',
      slug: category.slug ?? '',
      icon: ICON_KEYS.includes(category.icon) ? category.icon : 'wrench',
      tagline: category.tagline ?? '',
      description: category.description ?? '',
      from: String(category.from ?? ''),
      accentFrom: category.accent?.[0] ?? '#6C5CE7',
      accentTo: category.accent?.[1] ?? '#00D4C8',
    });
    setSlugTouched(true);
    setErrors({});
    setFormOpen(true);
  };

  const setField = (field) => (event) => {
    const raw = event.target.value;
    setValues((prev) => {
      // Slug auto-derives from the name until the admin edits it directly.
      const next = { ...prev, [field]: raw };
      if (field === 'name' && !slugTouched) next.slug = slugify(raw);
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = () => {
    const payload = { ...values, slug: slugify(values.slug) || slugify(values.name) };
    const validation = validate(payload);
    if (hasErrors(validation)) {
      setErrors(validation);
      toast.error('Fix the highlighted fields before saving.', { title: 'Category not saved' });
      return;
    }

    const record = {
      slug: payload.slug,
      name: payload.name.trim(),
      icon: payload.icon,
      tagline: payload.tagline.trim(),
      description: payload.description.trim(),
      from: Number(payload.from),
      accent: [payload.accentFrom, payload.accentTo],
    };

    if (editing) {
      updateCategory(editing, record);
      toast.success(`${record.name} updated across the marketplace.`, { title: 'Category saved' });
    } else {
      addCategory(record);
      toast.success(`${record.name} is now bookable through /browse?category=${record.slug}.`, {
        title: 'Category added',
      });
    }
    setFormOpen(false);
    setEditing(null);
    setValues(BLANK);
    setSlugTouched(false);
    setErrors({});
  };

  const confirmDelete = () => {
    const category = deleteTarget;
    if (!category) return;
    const usage = state.providers.filter((p) => p.categoryId === category.id);
    // Re-check at commit time in case a provider was assigned while the dialog was open.
    if (usage.length) {
      toast.error(`${category.name} still has ${usage.length} provider(s) using it. Reassign them first.`, {
        title: 'Delete blocked',
      });
      setDeleteTarget(null);
      return;
    }
    removeCategory(category.id);
    toast.success(`${category.name} removed from the catalogue.`, { title: 'Category deleted' });
    setDeleteTarget(null);
  };

  const totalProviders = state.providers.length;
  const uncategorised = state.providers.filter(
    (p) => !state.categories.some((c) => c.id === p.categoryId)
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Service categories"
        description="The taxonomy customers browse by. Each entry owns its icon, starting price and accent gradient across the whole marketplace."
        actions={
          <Button icon={LayersPlus} onClick={openCreate}>
            New category
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-content-muted">
        <span className="inline-flex items-center gap-1.5 font-semibold text-content">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {state.categories.length} categories
        </span>
        <span>· {totalProviders} businesses mapped</span>
        {uncategorised > 0 && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-rejected dark:text-[#ff8a8a]">
            <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            {uncategorised} provider(s) point at a missing category
          </span>
        )}
      </div>

      {state.categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          tone="dashed"
          title="No categories in the catalogue"
          description="Add one to give customers a starting point for browsing. Providers cannot be verified into an empty taxonomy."
          action={<Button icon={Plus} onClick={openCreate}>Add the first category</Button>}
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ category, providers, bookings }) => {
            const [from, to] = category.accent ?? ['#6C5CE7', '#00D4C8'];
            return (
              <StaggerItem key={category.id}>
                <Card padding="none" className="relative flex h-full flex-col overflow-hidden">
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-24 opacity-[0.16]"
                    style={{ backgroundImage: `linear-gradient(140deg, ${from}, ${to})` }}
                  />
                  <div className="relative flex items-start gap-3 p-5 pb-3">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-white"
                      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      <CategoryIcon icon={category.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-[17px] leading-tight font-bold tracking-[-0.02em]">
                        {category.name}
                      </h2>
                      <p className="mt-1 text-[13px] leading-snug text-content-muted">{category.tagline}</p>
                    </div>
                  </div>

                  <p className="relative px-5 text-[12.5px] leading-relaxed text-content-soft line-clamp-3">
                    {category.description}
                  </p>

                  <dl className="relative mt-4 grid grid-cols-3 gap-px border-y border-line bg-line">
                    <div className="bg-surface px-3 py-2.5">
                      <dt className="text-[10.5px] font-bold tracking-[0.1em] text-content-muted uppercase">From</dt>
                      <dd className="mt-0.5 text-[13px] font-bold tabular-nums">{formatPKR(category.from)}</dd>
                    </div>
                    <div className="bg-surface px-3 py-2.5">
                      <dt className="text-[10.5px] font-bold tracking-[0.1em] text-content-muted uppercase">Pros</dt>
                      <dd className="mt-0.5 text-[13px] font-bold tabular-nums">{providers.length}</dd>
                    </div>
                    <div className="bg-surface px-3 py-2.5">
                      <dt className="text-[10.5px] font-bold tracking-[0.1em] text-content-muted uppercase">Bookings</dt>
                      <dd className="mt-0.5 text-[13px] font-bold tabular-nums">{bookings}</dd>
                    </div>
                  </dl>

                  <div className="relative flex flex-1 flex-col justify-end gap-3 p-5 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral" size="sm">
                        /{category.slug}
                      </Badge>
                      <Badge tone="brand" size="sm" icon={Wallet}>
                        {formatPKR(category.from)}
                      </Badge>
                      <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-content-muted">
                        Accent
                        <span className="flex overflow-hidden rounded-xs ring-1 ring-line" aria-hidden="true">
                          <span className="h-4 w-4" style={{ backgroundColor: from }} />
                          <span className="h-4 w-4" style={{ backgroundColor: to }} />
                        </span>
                      </span>
                    </div>

                    {providers.length > 0 && (
                      <p className="text-[12px] leading-snug text-content-muted">
                        Locked while in use by{' '}
                        <Link
                          to="/admin/verification"
                          className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
                        >
                          {providers.length} provider{providers.length === 1 ? '' : 's'}
                        </Link>{' '}
                        e.g. {providers[0].name}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Pencil}
                        onClick={() => openEdit(category)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Trash}
                        onClick={() => setDeleteTarget(category)}
                        disabled={providers.length > 0}
                        title={
                          providers.length > 0
                            ? `Blocked: ${providers.length} provider(s) still use this category`
                            : `Delete ${category.name}`
                        }
                        className={cn(
                          'border-rejected/35 text-rejected',
                          providers.length > 0 && 'opacity-45'
                        )}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {/* ------------------------------------------------------- add / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setErrors({});
        }}
        size="lg"
        title={editing ? 'Edit category' : 'Add a category'}
        description="Name, icon, starting price and the two-tone accent drive every tile, filter chip and provider badge in the app."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setFormOpen(false);
                setEditing(null);
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button icon={editing ? null : Plus} onClick={submit}>
              {editing ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            value={values.name}
            onChange={setField('name')}
            error={errors.name}
            placeholder="e.g. Appliance Repair"
          />
          <Input
            label="URL slug"
            required
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setValues((prev) => ({ ...prev, slug: slugify(e.target.value) || e.target.value }));
              if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
            }}
            onBlur={() => setValues((prev) => ({ ...prev, slug: slugify(prev.slug) }))}
            error={errors.slug}
            hint="Auto-generated from the name; lowercase letters, digits and dashes only."
            placeholder="appliance-repair"
          />
          <Select
            label="Icon"
            required
            value={values.icon}
            onChange={setField('icon')}
            error={errors.icon}
            options={ICON_OPTIONS}
            hint="Only these eight keys have a matching glyph in the design system."
          />
          <Input
            label="Starting price (PKR)"
            required
            type="number"
            min={0}
            step={50}
            value={values.from}
            onChange={setField('from')}
            error={errors.from}
            suffix="PKR"
            hint="Shown as “from PKR …” on tiles and cards."
          />
          <Input
            label="Tagline"
            required
            className="sm:col-span-2"
            value={values.tagline}
            onChange={setField('tagline')}
            error={errors.tagline}
            maxLength={60}
            placeholder="Wiring, boards, fans & UPS"
          />
          <Textarea
            label="Description"
            required
            className="sm:col-span-2"
            rows={3}
            maxLength={220}
            showCount
            value={values.description}
            onChange={setField('description')}
            error={errors.description}
            hint="At least 20 characters so the category page has real copy."
          />

          <div className="sm:col-span-2">
            <Field label="Accent gradient" htmlFor="accent-from" hint="Two colours, used for the tile wash and rings.">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-[12.5px] font-semibold text-content-soft">
                  <input
                    id="accent-from"
                    type="color"
                    value={values.accentFrom}
                    onChange={setField('accentFrom')}
                    className="h-10 w-14 cursor-pointer rounded-sm border border-line-strong bg-surface p-1"
                    aria-label="Accent start colour"
                  />
                  {values.accentFrom}
                </label>
                <label className="flex items-center gap-2 text-[12.5px] font-semibold text-content-soft">
                  <input
                    type="color"
                    value={values.accentTo}
                    onChange={setField('accentTo')}
                    className="h-10 w-14 cursor-pointer rounded-sm border border-line-strong bg-surface p-1"
                    aria-label="Accent end colour"
                  />
                  {values.accentTo}
                </label>
                <span
                  aria-hidden="true"
                  className="ml-auto h-10 w-28 rounded-sm ring-1 ring-line"
                  style={{ backgroundImage: `linear-gradient(120deg, ${values.accentFrom}, ${values.accentTo})` }}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Live preview so the admin sees the tile they are creating. */}
        <div className="mt-5 rounded-md border border-line bg-canvas-2/50 p-4">
          <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">Preview</p>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-white"
              style={{ backgroundImage: `linear-gradient(135deg, ${values.accentFrom}, ${values.accentTo})` }}
            >
              <CategoryIcon icon={values.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-bold">{values.name || 'Category name'}</p>
              <p className="truncate text-[12.5px] text-content-muted">
                {values.tagline || 'Short promise shown under the name'} · from{' '}
                {Number.isFinite(Number(values.from)) ? formatPKR(values.from) : 'PKR —'}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.name ?? 'category'}?`}
        message={
          <span className="block">
            This removes the tile from browse, search filters and the home rail. Bookings and providers already using it
            would lose their category, so deletion is blocked while any provider is attached.
          </span>
        }
        confirmLabel="Delete category"
        tone="danger"
      />
    </>
  );
}
