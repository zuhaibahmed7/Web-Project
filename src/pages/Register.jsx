import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Building,
  ArrowRight,
  Briefcase,
  ShieldCheck,
  Wrench,
  CircleCheck,
  Mail,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { CATEGORIES, CITIES } from '../data/categories';
import { DASHBOARD_PATH } from '../utils/nav';
import {
  runValidation,
  hasErrors,
  required,
  validEmail,
  validPhone,
  validPassword,
  minLength,
} from '../utils/validation';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';

const ROLES = [
  {
    value: 'customer',
    label: 'I need a service',
    sub: 'Browse providers, book, review',
    icon: User,
    tone: 'brand',
  },
  {
    value: 'provider',
    label: 'I offer a service',
    sub: 'Publish services and answer requests',
    icon: Building,
    tone: 'aqua',
  },
];

const PERKS = {
  customer: [
    'Compare indicative PKR prices side by side',
    'Track every request from Pending to Completed',
    'Cancel for free while a request is still Pending',
  ],
  provider: [
    'An administrator verifies you before customers see your business',
    'Accept or decline each request with a reason',
    'Publish the days and slots you can genuinely keep',
  ],
};

export default function Register() {
  const { register } = useStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'provider' ? 'provider' : 'customer');
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirm: '',
    businessName: '',
    categoryId: '',
    yearsExperience: '',
    areas: '',
    tagline: '',
    bio: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const rules = {
      name: (v) => required(v, 'Full name') || minLength(v, 3, 'Full name'),
      email: validEmail,
      phone: validPhone,
      city: (v) => required(v, 'City'),
      password: validPassword,
      confirm: (v) => (v !== values.password ? 'Passwords do not match.' : ''),
    };
    if (role === 'provider') {
      rules.businessName = (v) => required(v, 'Business name') || minLength(v, 3, 'Business name');
      rules.categoryId = (v) => required(v, 'Service category');
    }

    const next = runValidation(values, rules);
    setErrors(next);
    if (hasErrors(next)) return;

    setFormError('');
    const result = register({ ...values, role, yearsExperience: Number(values.yearsExperience) || 1 });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    toast.success(
      role === 'provider'
        ? 'Account created. An administrator will verify your business shortly.'
        : `Welcome to FixNow, ${result.user.name.split(' ')[0]}.`,
      { title: 'Account created' }
    );
    navigate(DASHBOARD_PATH[result.user.role], { replace: true });
  };

  return (
    <div className="relative overflow-hidden">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(0_212_200_/_0.18),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-[84rem] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:px-8 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] font-bold tracking-[0.2em] text-brand-500 uppercase dark:text-brand-300">
            Create your account
          </p>
          <h1 className="mt-3 font-display text-[32px] leading-[1.04] font-extrabold tracking-[-0.04em] sm:text-[42px]">
            Two kinds of member.
            <span className="block grad-text">One marketplace.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-content-muted text-pretty">
            Registering is instant in this prototype — the account is stored in your browser so you can switch between
            roles and watch the same data move across all three dashboards.
          </p>

          {/* Role choice changes the form itself, so it sits above the fields. */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  aria-pressed={active}
                  className={cn(
                    'grad-frame group relative flex items-start gap-3.5 overflow-hidden rounded-xl p-4 text-left transition-[border-color,background-color,transform] duration-300 active:scale-[0.99]',
                    active ? 'glass border-brand-500/45 shadow-lift' : 'glass-2 hover:border-brand-500/30'
                  )}
                >
                  <span className="grad-ring" aria-hidden="true" />
                  <span
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-sm transition-colors',
                      active
                        ? r.tone === 'aqua'
                          ? 'bg-aqua-400/18 text-aqua-600 dark:text-aqua-300'
                          : 'bg-brand-500/14 text-brand-600 dark:text-brand-300'
                        : 'bg-canvas-2 text-content-muted'
                    )}
                  >
                    <r.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[15.5px] font-bold">{r.label}</span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-content-muted">{r.sub}</span>
                  </span>
                  {active && (
                    <CircleCheck className="mt-0.5 ml-auto h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                required
                autoComplete="name"
                placeholder="Ayesha Khan"
                value={values.name}
                onChange={set('name')}
                error={errors.name}
              />
              <Input
                label="Email address"
                type="email"
                required
                icon={Mail}
                autoComplete="email"
                placeholder="you@example.pk"
                value={values.email}
                onChange={set('email')}
                error={errors.email}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Mobile number"
                type="tel"
                autoComplete="tel"
                placeholder="03001234567"
                hint="Pakistani format — optional in this demo."
                value={values.phone}
                onChange={set('phone')}
                error={errors.phone}
              />
              <Select
                label="City"
                required
                value={values.city}
                onChange={set('city')}
                error={errors.city}
                placeholder="Select your city"
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            {role === 'provider' && (
              <div className="glass rounded-xl p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-aqua-600 dark:text-aqua-300" aria-hidden="true" />
                  <h2 className="font-display text-[14px] font-bold">Business details</h2>
                  <Badge tone="amber" size="sm" className="ml-auto">
                    Needs verification
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Business name"
                    required
                    placeholder="Bilal Electrical Works"
                    value={values.businessName}
                    onChange={set('businessName')}
                    error={errors.businessName}
                  />
                  <Select
                    label="Main service category"
                    required
                    value={values.categoryId}
                    onChange={set('categoryId')}
                    error={errors.categoryId}
                    placeholder="Choose a category"
                    options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <Input
                    label="Years of experience"
                    type="number"
                    min="0"
                    max="60"
                    placeholder="5"
                    value={values.yearsExperience}
                    onChange={set('yearsExperience')}
                  />
                  <Input
                    label="Areas you cover"
                    placeholder="Gulshan, DHA, Clifton"
                    hint="Separate with commas — customers search on these."
                    value={values.areas}
                    onChange={set('areas')}
                  />
                </div>

                <div className="mt-4 grid gap-4">
                  <Input
                    label="One-line tagline"
                    placeholder="Same-day wiring fixes and DB boards"
                    value={values.tagline}
                    onChange={set('tagline')}
                  />
                  <Textarea
                    label="About your business"
                    rows={3}
                    maxLength={280}
                    showCount
                    placeholder="Tools you carry, guarantees you give, the jobs you decline…"
                    hint="Optional now — you can edit the public profile later."
                    value={values.bio}
                    onChange={set('bio')}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                hint="Demo only — stored in your browser, never sent anywhere."
                value={values.password}
                onChange={set('password')}
                error={errors.password}
              />
              <Input
                label="Confirm password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat it"
                value={values.confirm}
                onChange={set('confirm')}
                error={errors.confirm}
              />
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-sm border border-rejected/30 bg-rejected/8 px-3.5 py-2.5 text-[13px] font-semibold text-rejected"
              >
                {formError}
              </p>
            )}

            <Button type="submit" size="lg" full iconRight={ArrowRight}>
              {role === 'provider' ? 'Create provider account' : 'Create customer account'}
            </Button>

            <p className="text-center text-[13.5px] text-content-muted">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                Sign in instead
              </Link>
            </p>
          </form>
        </motion.div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <h2 className="font-display text-[16px] font-bold">
              {role === 'provider' ? 'What happens after you register' : 'What you can do straight away'}
            </h2>
            <ul className="mt-4 space-y-3">
              {PERKS[role].map((line) => (
                <li key={line} className="flex gap-2.5 text-[13.5px] leading-snug text-content-soft">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-aqua-500" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>

            {role === 'provider' ? (
              <div className="mt-5 flex gap-3 rounded-sm bg-pending/10 p-3.5 text-[12.5px] leading-snug text-[#8a6500] dark:text-glow-300">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  Your listing stays hidden until an administrator approves it. Sign in as{' '}
                  <span className="font-mono">admin@fixnow.pk</span> to watch the verification queue work.
                </p>
              </div>
            ) : (
              <div className="mt-5 flex gap-3 rounded-sm bg-brand-500/8 p-3.5 text-[12.5px] leading-snug text-content-soft">
                <Wrench className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                <p>
                  Guests can browse everything; an account is only needed to send a booking (business rule BRL-01).
                </p>
              </div>
            )}
          </Card>

          <Card padding="md" className="bg-canvas-2/40">
            <h2 className="font-display text-[15px] font-bold">Try the seeded accounts</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-content-muted">
              You do not have to register to explore — the sign-in page offers a customer, a provider and an admin
              account with data already in flight.
            </p>
            <Button to="/login" variant="outline" size="sm" className="mt-4" full>
              Use a demo account
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
