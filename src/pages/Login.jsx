import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, LogIn, ArrowRight, ShieldCheck, Star, Wrench, Lock } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { DEMO_ACCOUNTS } from '../data/users';
import { DASHBOARD_PATH } from '../utils/nav';
import { runValidation, hasErrors, validEmail, validPassword } from '../utils/validation';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

// Left-hand story panel. Kept out of the form's DOM so the form stays a form.
function StoryPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-ink-800 text-white lg:block">
      <div className="dot-grid absolute inset-0 opacity-[0.12]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-brand-500/35 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-6rem] bottom-[-4rem] h-96 w-96 rounded-full bg-aqua-400/25 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col justify-between p-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase">
            <Wrench className="h-3.5 w-3.5 text-aqua-400" aria-hidden="true" />
            Find. Book. Fix.
          </span>
          <h2 className="mt-8 max-w-md font-display text-[40px] leading-[1.03] font-extrabold tracking-[-0.04em]">
            One account for the whole <span className="text-aqua-400">household repair</span> track.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-cloud-300/75">
            Send a request, watch it move from Pending to Completed, and rate the work when it is done. Providers and
            administrators sign in through the same door.
          </p>
        </div>

        <ul className="space-y-3.5">
          {[
            { icon: ShieldCheck, text: 'Only verified businesses appear in the marketplace.' },
            { icon: Lock, text: 'Cancel freely while a request is still Pending.' },
            { icon: Star, text: 'Reviews unlock after a job reaches Completed.' },
          ].map((row) => (
            <li key={row.text} className="flex items-center gap-3 text-[14px] text-cloud-100/85">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
                <row.icon className="h-4 w-4 text-aqua-400" aria-hidden="true" />
              </span>
              {row.text}
            </li>
          ))}
        </ul>

        <figure className="glass-2 rounded-xl border-white/12 p-5">
          <blockquote className="text-[14.5px] leading-relaxed text-cloud-100">
            “Booked an AC technician at 9am, cooling was back by 2pm. The status updates were the part my husband
            kept checking.”
          </blockquote>
          <figcaption className="mt-3 text-[12.5px] text-cloud-300/70">
            Sana R. — customer in Lahore (sample review)
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const toast = useToast();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ?next= keeps the deep link the user was trying to reach (e.g. a provider page).
  const requested = params.get('next') || location.state?.from || '';
  const safeNext = requested.startsWith('/') && !requested.startsWith('//') ? requested : '';

  const finish = (user) => {
    toast.success(`Welcome back, ${user.name.split(' ')[0]}.`, { title: 'Signed in' });
    navigate(safeNext || DASHBOARD_PATH[user.role], { replace: true });
  };

  const attempt = (email, password) => {
    setSubmitting(true);
    setFormError('');
    const result = login(email, password);
    if (result.ok) {
      finish(result.user);
      return true;
    }
    setFormError(result.error);
    setSubmitting(false);
    return false;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const next = runValidation(values, { email: validEmail, password: validPassword });
    setErrors(next);
    if (hasErrors(next)) return;
    attempt(values.email, values.password);
  };

  const useDemo = (account) => {
    setValues({ email: account.email, password: account.password });
    setErrors({});
    attempt(account.email, account.password);
  };

  return (
    <div className="mx-auto grid max-w-[84rem] gap-0 px-0 lg:min-h-[calc(100vh-4.5rem)] lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-10">
      <StoryPanel />

      <div className="flex items-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-[38px]">
              Sign in
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-content-muted">
              Not registered yet?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                Create an account
              </Link>
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <Input
                id="email"
                label="Email address"
                type="email"
                required
                icon={Mail}
                autoComplete="email"
                placeholder="you@example.pk"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                error={errors.email}
              />

              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(e) => setValues({ ...values, password: e.target.value })}
                  error={errors.password}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-[34px] right-0 grid h-11 w-11 place-items-center text-content-muted transition-colors hover:text-content"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-sm border border-rejected/30 bg-rejected/8 px-3.5 py-2.5 text-[13px] font-semibold text-rejected"
                >
                  {formError}
                </p>
              )}

              <Button type="submit" full size="lg" loading={submitting} icon={LogIn} iconRight={ArrowRight}>
                Sign in
              </Button>
            </form>

            <div className="mt-9">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
                <p className="text-[11px] font-bold tracking-[0.16em] text-content-muted uppercase">
                  Try a demo account
                </p>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>

              <div className="mt-4 grid gap-2.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => useDemo(account)}
                    className={cn(
                      'group flex items-center gap-3 rounded-sm border border-line bg-surface-2 p-3.5 text-left',
                      'transition-[border-color,background-color,transform] duration-300 hover:border-brand-500/45 hover:bg-brand-500/6 active:scale-[0.99]'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-[13px] font-bold text-white',
                        account.role === 'customer' && 'bg-brand-500',
                        account.role === 'provider' && 'bg-aqua-500',
                        account.role === 'admin' && 'bg-glow-500'
                      )}
                      aria-hidden="true"
                    >
                      {account.label.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold">{account.label}</span>
                      <span className="block truncate text-[12.5px] text-content-muted">{account.hint}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-[11.5px] text-content-muted">{account.email}</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-brand-600 group-hover:underline dark:text-brand-300">
                        one click
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-content-muted">
                This is a frontend prototype: accounts live in your browser&apos;s localStorage, so a password here is
                only a demo shortcut and is never sent anywhere.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
