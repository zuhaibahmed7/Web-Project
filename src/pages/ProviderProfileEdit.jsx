import { useMemo, useState } from 'react';
import { Save, IdCard, ShieldCheck, CircleAlert, Eye, Info } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { decorateProvider } from '../utils/selectors';
import { CITIES } from '../data/categories';
import { minLength, required, validEmail, validPhone } from '../utils/validation';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Reveal } from '../components/ui/Reveal';

const BIO_MAX = 420;
const TAGLINE_MAX = 80;

// Public business profile editor. Category and verification state are read-only
// here — categories belong to administrators (FR-AD-05) and verification is an
// admin decision, so a provider must never be able to self-certify.
export default function ProviderProfileEdit() {
  const { state, currentProvider, currentUser, updateProvider } = useStore();
  const toast = useToast();

  const [draft, setDraft] = useState(() => toDraft(currentProvider));
  const [errors, setErrors] = useState({});

  const savedDraft = useMemo(() => toDraft(currentProvider), [currentProvider]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft);

  // Preview decorates the *store* provider so rating, review count, price range and
  // next-slot are the real derived values; only the edited fields come from the draft.
  const preview = useMemo(() => {
    if (!currentProvider) return null;
    const merged = { ...currentProvider, ...fromDraft(draft), slug: currentProvider.slug };
    return decorateProvider(
      { ...state, providers: state.providers.map((p) => (p.id === currentProvider.id ? merged : p)) },
      merged
    );
  }, [state, currentProvider, draft]);

  if (!currentUser) return null;

  if (!currentProvider) {
    return (
      <>
        <PageHeader eyebrow="Identity" title="Public profile" />
        <EmptyState
          icon={IdCard}
          tone="dashed"
          title="No business profile linked to this account"
          description={`${currentUser.name} is signed in as a service provider, but there is no provider record to edit yet. Register choosing "Service provider", or ask an administrator to attach your business profile.`}
          action={<Button to="/login">Sign in with another account</Button>}
          secondaryAction={
            <Button variant="outline" to="/how-it-works">
              How FixNow works
            </Button>
          }
        />
      </>
    );
  }

  const set = (key) => (event) => {
    const value = event.target.value;
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
  };

  const submit = (event) => {
    event.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Some fields need attention before your profile can go live.', { title: 'Check the form' });
      return;
    }

    // Shallow merge: only the editable public fields are sent, so services,
    // availability, jobsCompleted and verificationStatus stay untouched.
    updateProvider(currentProvider.id, fromDraft(draft));
    toast.success('Your public profile is updated — customers see it immediately.', { title: 'Profile saved' });
  };

  const revert = () => {
    setDraft(savedDraft);
    setErrors({});
    toast.info('Changes discarded.');
  };

  const areaCount = splitList(draft.areas).length;

  return (
    <>
      <PageHeader
        eyebrow="Identity"
        title="Public profile"
        description="This is what customers judge before they book you. Keep the tagline specific and the bio honest — inflated claims show up in reviews."
        actions={
          <>
            {dirty && (
              <Button variant="ghost" size="sm" onClick={revert}>
                Discard
              </Button>
            )}
            <Button size="sm" icon={Save} onClick={submit} disabled={!dirty}>
              {dirty ? 'Save changes' : 'Saved'}
            </Button>
          </>
        }
      />

      {/* Not verified => filtered out of public search results (publicProviders). */}
      {currentProvider.verificationStatus !== 'verified' && (
        <Reveal>
          <Card padding="sm" className="mb-6 border-glow-400/45 bg-glow-400/8">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-glow-400/18 text-glow-700 dark:text-glow-300">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-[13.5px] leading-relaxed text-content-soft">
                <span className="font-bold text-content">
                  Verification is {currentProvider.verificationStatus}.{' '}
                </span>
                Until an administrator marks the business verified, {currentProvider.name} stays hidden from search and
                category listings. Completing every field below — especially contact details, services and areas served
                — is what makes that review quick.
              </p>
            </div>
          </Card>
        </Reveal>
      )}

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {/* ------------------------------------------------ basics */}
          <Reveal>
            <Card padding="md">
              <SectionTitle title="Business basics" hint="Name and headline shown on every listing." />
              <div className="mt-4 space-y-1">
                <Input
                  id="profile-name"
                  label="Business name"
                  required
                  value={draft.name}
                  onChange={set('name')}
                  error={errors.name}
                  maxLength={70}
                />
                <Input
                  id="profile-tagline"
                  label="Tagline"
                  required
                  value={draft.tagline}
                  onChange={set('tagline')}
                  error={errors.tagline}
                  maxLength={TAGLINE_MAX}
                  hint="One line of proof, e.g. Certified wiring, boards and inverter setup."
                />
                <Textarea
                  id="profile-bio"
                  label="About your business"
                  rows={5}
                  required
                  value={draft.bio}
                  onChange={set('bio')}
                  error={errors.bio}
                  maxLength={BIO_MAX}
                  showCount
                  hint="What you specialise in, what you bring, and how you price."
                />
              </div>
            </Card>
          </Reveal>

          {/* ------------------------------------------------ contact & coverage */}
          <Reveal>
            <Card padding="md">
              <SectionTitle title="Contact & coverage" hint="Customers and our support team use these to reach you." />
              <div className="mt-4 grid gap-x-4 sm:grid-cols-2">
                <Input
                  id="profile-owner"
                  label="Owner name"
                  required
                  value={draft.ownerName}
                  onChange={set('ownerName')}
                  error={errors.ownerName}
                />
                <Input
                  id="profile-phone"
                  label="Phone"
                  required
                  type="tel"
                  inputMode="tel"
                  value={draft.phone}
                  onChange={set('phone')}
                  error={errors.phone}
                  hint="Format 03001234567."
                />
                <Input
                  id="profile-email"
                  label="Email"
                  required
                  type="email"
                  value={draft.email}
                  onChange={set('email')}
                  error={errors.email}
                />
                <Select
                  id="profile-city"
                  label="City"
                  required
                  value={draft.city}
                  onChange={set('city')}
                  error={errors.city}
                  placeholder="Choose a city"
                  options={CITIES.map((c) => ({ value: c, label: c }))}
                  hint="Search filters group providers by city."
                />
                <Field
                  htmlFor="profile-areas"
                  label="Areas served"
                  hint="Separate with commas — shown under your city on the listing."
                  error={errors.areas}
                  counter={areaCount ? `${areaCount} area${areaCount === 1 ? '' : 's'}` : undefined}
                >
                  <input
                    id="profile-areas"
                    className="h-11 w-full rounded-sm border border-line bg-surface px-3.5 text-[15px] text-content outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-content-muted/70 hover:border-line-strong focus:border-brand-500 focus:shadow-[0_0_0_3px_rgb(108_92_231_/_0.18)]"
                    value={draft.areas}
                    onChange={set('areas')}
                    aria-invalid={errors.areas ? 'true' : undefined}
                    placeholder="Satellite Town, Bahria Town, Westridge"
                  />
                </Field>
              </div>
            </Card>
          </Reveal>

          {/* ------------------------------------------------ track record */}
          <Reveal>
            <Card padding="md">
              <SectionTitle title="Track record & trust" hint="Numbers customers weigh before choosing you." />
              <div className="mt-4 grid gap-x-4 sm:grid-cols-2">
                <Input
                  id="profile-years"
                  label="Years of experience"
                  type="number"
                  min="0"
                  max="70"
                  step="1"
                  suffix="yrs"
                  value={draft.yearsExperience}
                  onChange={set('yearsExperience')}
                  error={errors.yearsExperience}
                />
                <Input
                  id="profile-response"
                  label="Typical response time"
                  type="number"
                  min="1"
                  max="1440"
                  step="5"
                  suffix="mins"
                  value={draft.responseMins}
                  onChange={set('responseMins')}
                  error={errors.responseMins}
                  hint="How quickly you usually reply to a request."
                />
                <div className="sm:col-span-2">
                  <Field
                    htmlFor="profile-badges"
                    label="Badges"
                    hint="Comma-separated promises shown as pills on your card, e.g. Certified, 6-month warranty."
                    error={errors.badges}
                    counter={splitList(draft.badges).length ? `${splitList(draft.badges).length} badge(s)` : undefined}
                  >
                    <input
                      id="profile-badges"
                      className="h-11 w-full rounded-sm border border-line bg-surface px-3.5 text-[15px] text-content outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-content-muted/70 hover:border-line-strong focus:border-brand-500 focus:shadow-[0_0_0_3px_rgb(108_92_231_/_0.18)]"
                      value={draft.badges}
                      onChange={set('badges')}
                      aria-invalid={errors.badges ? 'true' : undefined}
                      placeholder="Certified, 6-month warranty"
                    />
                  </Field>
                  <div className="-mt-1 flex flex-wrap gap-2">
                    {splitList(draft.badges).map((b) => (
                      <Badge key={b} tone="brand" size="sm">
                        {b}
                      </Badge>
                    ))}
                    {!splitList(draft.badges).length && (
                      <p className="text-[12.5px] text-content-muted">No badges yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>

          {/* ------------------------------------------------ read-only governance */}
          <Reveal>
            <Card padding="md">
              <SectionTitle title="Managed by FixNow" hint="Fields a provider cannot change from here." />
              <div className="mt-4 space-y-3 text-[13px]">
                <ReadOnly label="Category" value={currentProvider.category?.name ?? 'Uncategorised'}>
                  Categories are created and assigned by administrators, so listings stay comparable across the
                  marketplace. Ask an admin to move you to another category.
                </ReadOnly>
                <ReadOnly label="Verification status" value={currentProvider.verificationStatus}>
                  An admin reviews your documents and sets this. Only verified businesses appear in public search.
                </ReadOnly>
                <ReadOnly label="Jobs completed" value={`${currentProvider.jobsCompleted.toLocaleString('en-PK')}`}>
                  Derived from your finished bookings — it cannot be edited.
                </ReadOnly>
                <ReadOnly label="Rating" value={`${decorateRating(preview)} of ${preview?.reviewCount ?? 0} review${preview?.reviewCount === 1 ? '' : 's'}`}>
                  Always calculated from real customer reviews on completed jobs.
                </ReadOnly>
              </div>
            </Card>
          </Reveal>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" icon={Save} disabled={!dirty}>
              {dirty ? 'Save profile' : 'Profile up to date'}
            </Button>
            {dirty && (
              <>
                <Button type="button" variant="ghost" onClick={revert}>
                  Discard changes
                </Button>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-glow-700 dark:text-glow-300">
                  <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" /> Unsaved changes
                </span>
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------ live preview */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Live preview
          </p>
          {preview && <ProviderCard provider={preview} />}
          <Card padding="sm" className="bg-brand-500/6">
            <p className="flex items-center gap-2 font-display text-[14px] font-bold tracking-[-0.02em]">
              <Info className="h-4 w-4 text-brand-500" aria-hidden="true" />
              Preview notes
            </p>
            <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-content-soft">
              <li>Prices come from your catalogue, not this form — edit them under Services &amp; prices.</li>
              <li>
                The next-slot line follows your availability calendar; {preview?.nextAvailable ? 'a booking window exists.' : 'it currently reads “no open slots”.'}
              </li>
              <li>Rating and review count are live figures from completed jobs.</li>
            </ul>
          </Card>
        </div>
      </form>
    </>
  );
}

/* ---------------------------------------------------------------- helpers */

function SectionTitle({ title, hint }) {
  return (
    <div>
      <h2 className="font-display text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-[13px] text-content-muted">{hint}</p>
    </div>
  );
}

function ReadOnly({ label, value, children }) {
  return (
    <div className="rounded-sm border border-line bg-canvas-2/50 px-4 py-3">
      <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">
        {label}
        <span className="rounded-full bg-ink-800/8 px-2 py-0.5 text-[10px] tracking-normal normal-case dark:bg-white/10">
          Read only
        </span>
      </p>
      <p className="mt-1.5 font-display text-[14px] font-bold tracking-[-0.01em] capitalize">{value}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-content-muted">{children}</p>
    </div>
  );
}

function toDraft(provider) {
  if (!provider) {
    return { name: '', tagline: '', bio: '', ownerName: '', phone: '', email: '', city: '', areas: '', yearsExperience: '0', responseMins: '30', badges: '' };
  }
  return {
    name: provider.name ?? '',
    tagline: provider.tagline ?? '',
    bio: provider.bio ?? '',
    ownerName: provider.ownerName ?? '',
    phone: provider.phone ?? '',
    email: provider.email ?? '',
    city: provider.city ?? '',
    areas: (provider.areas ?? []).join(', '),
    yearsExperience: String(provider.yearsExperience ?? 0),
    responseMins: String(provider.responseMins ?? 30),
    badges: (provider.badges ?? []).join(', '),
  };
}

// Text lists are stored as arrays on the provider record.
function fromDraft(draft) {
  return {
    name: draft.name.trim(),
    tagline: draft.tagline.trim(),
    bio: draft.bio.trim(),
    ownerName: draft.ownerName.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim().toLowerCase(),
    city: draft.city,
    areas: splitList(draft.areas),
    yearsExperience: Number(draft.yearsExperience) || 0,
    responseMins: Number(draft.responseMins) || 30,
    badges: splitList(draft.badges),
  };
}

function splitList(value) {
  return String(value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function validate(draft) {
  const found = {};
  const name = required(draft.name, 'Business name') || minLength(draft.name, 3, 'Business name');
  if (name) found.name = name;

  const tagline = required(draft.tagline, 'The tagline') || minLength(draft.tagline, 8, 'The tagline');
  if (tagline) found.tagline = tagline;

  const bio = required(draft.bio, 'The description') || minLength(draft.bio, 40, 'The description');
  if (bio) found.bio = bio;

  const ownerName = required(draft.ownerName, 'Owner name');
  if (ownerName) found.ownerName = ownerName;

  const phone = required(draft.phone, 'Phone') || validPhone(draft.phone);
  if (phone) found.phone = phone;

  const email = validEmail(draft.email);
  if (email) found.email = email;

  if (!CITIES.includes(draft.city)) {
    found.city = 'Pick one of the cities FixNow covers.';
  }

  if (!splitList(draft.areas).length) {
    found.areas = 'List at least one area you serve, separated by commas.';
  }

  const years = Number(draft.yearsExperience);
  if (!Number.isFinite(years) || years < 0) {
    found.yearsExperience = 'Years of experience must be zero or more.';
  } else if (years > 70) {
    found.yearsExperience = 'That is longer than most careers — enter a realistic number.';
  }

  const mins = Number(draft.responseMins);
  if (!Number.isFinite(mins) || mins < 1) {
    found.responseMins = 'Response time must be at least 1 minute.';
  } else if (mins > 1440) {
    found.responseMins = 'Keep it under 1440 minutes (one day).';
  }

  return found;
}

// The preview card needs a decorated provider; ratings stay derived, never typed.
function decorateRating(preview) {
  if (!preview || !preview.reviewCount) return 'New';
  return `${preview.rating.toFixed(1)}★`;
}
