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
import { useI18n } from '../i18n/useI18n';
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
    labelKey: 'auth.roleCustomer',
    subKey: 'auth.roleCustomerSub',
    icon: User,
    tone: 'brand',
  },
  {
    value: 'provider',
    labelKey: 'auth.roleProvider',
    subKey: 'auth.roleProviderSub',
    icon: Building,
    tone: 'aqua',
  },
];

const PERKS = {
  customer: ['auth.perkCustomer1', 'auth.perkCustomer2', 'auth.perkCustomer3'],
  provider: ['auth.perkProvider1', 'auth.perkProvider2', 'auth.perkProvider3'],
};

export default function Register() {
  const { register } = useStore();
  const { t } = useI18n();
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
      confirm: (v) => (v !== values.password ? t('auth.passwordMismatch') : ''),
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
      setFormError(t(result.key, null, result.error));
      return;
    }

    toast.success(
      role === 'provider'
        ? t('auth.accountCreatedProvider')
        : t('auth.accountCreatedCustomer', { name: result.user.name.split(' ')[0] }),
      { title: t('auth.accountCreatedTitle') }
    );
    navigate(DASHBOARD_PATH[result.user.role], { replace: true });
  };

  return (
    <div className="relative overflow-hidden">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 start-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(253_129_204_/_0.18),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid grid-cols-1 max-w-[84rem] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:px-8 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[12px] font-bold tracking-[0.2em] text-brand-500 uppercase dark:text-brand-300">
            {t('auth.registerEyebrow')}
          </p>
          <h1 className="mt-3 font-display text-[32px] leading-[1.04] font-extrabold tracking-[-0.04em] sm:text-[42px]">
            {t('auth.registerTitle1')}
            <span className="block grad-text">{t('auth.registerTitle2')}</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-content-muted text-pretty">
            {t('auth.registerBody')}
          </p>

          {/* Role choice changes the form itself, so it sits above the fields. */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  aria-pressed={active}
                  className={cn(
                    'grad-frame group relative flex items-start gap-3.5 overflow-hidden rounded-xl p-4 text-start transition-[border-color,background-color,transform] duration-300 active:scale-[0.99]',
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
                    <span className="block font-display text-[16px] font-bold">{t(r.labelKey)}</span>
                    <span className="mt-1 block text-[13px] leading-snug text-content-muted">{t(r.subKey)}</span>
                  </span>
                  {active && (
                    <CircleCheck className="mt-0.5 ms-auto h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('auth.fullName')}
                required
                autoComplete="name"
                placeholder={t('auth.fullNamePlaceholder')}
                value={values.name}
                onChange={set('name')}
                error={errors.name}
              />
              <Input
                label={t('auth.email')}
                type="email"
                required
                icon={Mail}
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
                value={values.email}
                onChange={set('email')}
                error={errors.email}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('auth.phone')}
                type="tel"
                autoComplete="tel"
                placeholder={t('auth.phonePlaceholder')}
                hint={t('auth.phoneHint')}
                value={values.phone}
                onChange={set('phone')}
                error={errors.phone}
              />
              <Select
                label={t('common.city')}
                required
                value={values.city}
                onChange={set('city')}
                error={errors.city}
                placeholder={t('auth.cityPlaceholder')}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            {role === 'provider' && (
              <div className="glass rounded-xl p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-aqua-600 dark:text-aqua-300" aria-hidden="true" />
                  <h2 className="font-display text-[14px] font-bold">{t('auth.businessDetails')}</h2>
                  <Badge tone="amber" size="sm" className="ms-auto">
                    {t('auth.needsVerification')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label={t('auth.businessName')}
                    required
                    placeholder={t('auth.businessNamePlaceholder')}
                    value={values.businessName}
                    onChange={set('businessName')}
                    error={errors.businessName}
                  />
                  <Select
                    label={t('auth.mainCategory')}
                    required
                    value={values.categoryId}
                    onChange={set('categoryId')}
                    error={errors.categoryId}
                    placeholder={t('auth.chooseCategory')}
                    options={CATEGORIES.map((c) => ({ value: c.id, label: t(`category.${c.id}`, null, c.name) }))}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <Input
                    label={t('auth.years')}
                    type="number"
                    min="0"
                    max="60"
                    placeholder={t('auth.yearsPlaceholder')}
                    value={values.yearsExperience}
                    onChange={set('yearsExperience')}
                  />
                  <Input
                    label={t('auth.areas')}
                    placeholder={t('auth.areasPlaceholder')}
                    hint={t('auth.areasHint')}
                    value={values.areas}
                    onChange={set('areas')}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <Input
                    label={t('auth.tagline')}
                    placeholder={t('auth.taglinePlaceholder')}
                    value={values.tagline}
                    onChange={set('tagline')}
                  />
                  <Textarea
                    label={t('auth.bio')}
                    rows={3}
                    maxLength={280}
                    showCount
                    placeholder={t('auth.bioPlaceholder')}
                    hint={t('auth.bioHint')}
                    value={values.bio}
                    onChange={set('bio')}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('auth.password')}
                type="password"
                required
                autoComplete="new-password"
                placeholder={t('auth.passwordNew')}
                hint={t('auth.passwordHint')}
                value={values.password}
                onChange={set('password')}
                error={errors.password}
              />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                required
                autoComplete="new-password"
                placeholder={t('auth.passwordRepeat')}
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
              {role === 'provider' ? t('auth.createProvider') : t('auth.createCustomer')}
            </Button>

            <p className="text-center text-[14px] text-content-muted">
              {t('auth.alreadyRegistered')}{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                {t('auth.signInInstead')}
              </Link>
            </p>
          </form>
        </motion.div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <h2 className="font-display text-[16px] font-bold">
              {role === 'provider' ? t('auth.asideProviderTitle') : t('auth.asideCustomerTitle')}
            </h2>
            <ul className="mt-4 space-y-3">
              {PERKS[role].map((key) => (
                <li key={key} className="flex gap-2.5 text-[14px] leading-snug text-content-soft">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-aqua-500" aria-hidden="true" />
                  {t(key, {
                    pending: t('status.pending'),
                    completed: t('status.completed'),
                    status: t('status.pending'),
                  })}
                </li>
              ))}
            </ul>

            {role === 'provider' ? (
              <div className="mt-5 flex gap-3 rounded-sm bg-pending/10 p-3.5 text-[13px] leading-snug text-[#8a6500] dark:text-pending">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  {t('auth.verifyNoteA')}{' '}
                  <span dir="ltr" className="font-mono">
                    admin@kaarigar.pk
                  </span>{' '}
                  {t('auth.verifyNoteB')}
                </p>
              </div>
            ) : (
              <div className="mt-5 flex gap-3 rounded-sm bg-brand-500/8 p-3.5 text-[13px] leading-snug text-content-soft">
                <Wrench className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                <p>{t('auth.guestNote')}</p>
              </div>
            )}
          </Card>

          <Card padding="md" className="bg-canvas-2/40">
            <h2 className="font-display text-[15px] font-bold">{t('auth.seededTitle')}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-content-muted">{t('auth.seededBody')}</p>
            <Button to="/login" variant="outline" size="sm" className="mt-4" full>
              {t('auth.useDemo')}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
