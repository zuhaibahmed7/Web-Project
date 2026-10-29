import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CalendarDays, IdCard, KeyRound, LogOut, Mail, MonitorSmartphone, Phone, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { CITIES } from '../data/categories';
import { required, runValidation, hasErrors, validPhone } from '../utils/validation';
import { formatDate } from '../utils/format';
import { bookingsByCustomer } from '../utils/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Input, Select, Toggle } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/Modal';
import { Reveal } from '../components/ui/Reveal';
import { useToast } from '../components/ui/Toast';

// Preference defaults for a fresh account. Nothing is sent anywhere — see the
// prototype-security note below (DR-09 / NFR-08).
const DEFAULT_PREFS = { emailUpdates: true, smsAlerts: false, pushAlerts: true };

const PREF_ROWS = [
  {
    key: 'emailUpdates',
    label: 'Booking updates by email',
    description: 'Accepted, started and completed notifications for your own bookings.',
    icon: Mail,
  },
  {
    key: 'smsAlerts',
    label: 'SMS before the visit',
    description: 'A reminder on the morning of a booked slot. Off by default.',
    icon: Phone,
  },
  {
    key: 'pushAlerts',
    label: 'In-app alerts',
    description: 'The bell in the top bar and the notification centre.',
    icon: MonitorSmartphone,
  },
];

export default function CustomerProfile() {
  const { state, currentUser, updateUser, resetDemoData, logout } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const prefs = { ...DEFAULT_PREFS, ...(currentUser.preferences ?? {}) };

  const [form, setForm] = useState({
    name: currentUser.name ?? '',
    phone: currentUser.phone ?? '',
    city: currentUser.city ?? '',
  });
  const [errors, setErrors] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);

  const dirty = form.name !== (currentUser.name ?? '') || form.phone !== (currentUser.phone ?? '') || form.city !== (currentUser.city ?? '');

  const stats = useMemo(() => {
    const mine = bookingsByCustomer(state, currentUser.id);
    return {
      total: mine.length,
      completed: mine.filter((b) => b.status === 'completed').length,
      reviews: state.reviews.filter((r) => r.customerId === currentUser.id).length,
    };
  }, [state, currentUser.id]);

  const field = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const save = () => {
    const found = runValidation(form, {
      name: (v) => required(v, 'Full name'),
      phone: (v) => validPhone(v),
    });
    if (hasErrors(found)) {
      setErrors(found);
      return;
    }

    updateUser(currentUser.id, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city,
    });
    toast.success('Account details saved to this browser.', { title: 'Profile updated' });
  };

  const setPref = (key) => (value) => {
    // Each toggle persists immediately so the demo shows preference survival
    // across reloads, without pretending a message was actually dispatched.
    updateUser(currentUser.id, { preferences: { ...prefs, [key]: value } });
  };

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Your name, number and city are what providers see on a booking card. Everything else about you stays inside this browser."
        actions={
          <>
            <Button variant="secondary" to="/app/bookings" icon={CalendarDays}>
              My bookings
            </Button>
            <Button onClick={save} icon={Save} disabled={!dirty}>
              {dirty ? 'Save changes' : 'Saved'}
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------------ identity */}
      <Reveal>
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={currentUser.name} size="xl" ring verified={false} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[20px] leading-tight font-extrabold tracking-[-0.02em]">
                {currentUser.name}
              </p>
              <p className="mt-1 truncate text-[13.5px] text-content-muted">{currentUser.email}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Badge tone="brand" icon={IdCard}>
                  {currentUser.role}
                </Badge>
                <Badge tone={currentUser.status === 'active' ? 'success' : 'danger'}>
                  {currentUser.status === 'active' ? 'Account active' : 'Account suspended'}
                </Badge>
                <Badge tone="neutral" icon={CalendarDays}>
                  Member since {formatDate(currentUser.joinedAt)}
                </Badge>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-x-6 border-line pl-0 sm:border-l sm:pl-6">
              {[
                { k: 'Bookings', v: stats.total },
                { k: 'Completed', v: stats.completed },
                { k: 'Reviews', v: stats.reviews },
              ].map((item) => (
                <div key={item.k}>
                  <dt className="text-[11px] font-bold tracking-[0.12em] text-content-muted uppercase">{item.k}</dt>
                  <dd className="mt-1 font-display text-[22px] leading-none font-extrabold tabular-nums">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        {/* --------------------------------------------------------- details */}
        <Reveal>
          <Card>
            <h2 className="font-display text-[17px] font-bold tracking-[-0.02em]">Personal details</h2>
            <p className="mt-1.5 mb-5 text-[13px] leading-relaxed text-content-muted">
              Providers read the phone number and city when a request arrives, so keep them current.
            </p>

            <div className="flex flex-col gap-4">
              <Input
                label="Full name"
                required
                value={form.name}
                onChange={field('name')}
                error={errors.name}
                hint="Shown on every booking you send."
              />

              <Input
                label="Mobile number"
                inputMode="tel"
                value={form.phone}
                onChange={field('phone')}
                error={errors.phone}
                placeholder="03001234567"
                hint="Pakistani mobile format: 03XX XXXXXXX. Optional, but providers cannot call you without it."
              />

              <Select
                label="City"
                value={form.city}
                onChange={field('city')}
                placeholder="Not set"
                options={CITIES.map((c) => ({ value: c, label: c }))}
                hint="Used to rank nearby providers in search results."
              />

              <div className="rounded-sm border border-line bg-canvas-2/60 px-4 py-3.5">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-content-soft">
                  <Mail className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
                  Login email
                </p>
                <p className="mt-1.5 select-all text-[14px] font-bold">{currentUser.email}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-content-muted">
                  Read-only. In this prototype the email is the login key that matches a seeded account, so changing it
                  here would sign you out of the record you are looking at. There is no password-reset flow because
                  there is no mail server.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <Button onClick={save} icon={Save} disabled={!dirty}>
                {dirty ? 'Save changes' : 'No unsaved changes'}
              </Button>
              {dirty && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm({
                        name: currentUser.name ?? '',
                        phone: currentUser.phone ?? '',
                        city: currentUser.city ?? '',
                      });
                      setErrors({});
                    }}
                  >
                    Discard
                  </Button>
                  <p className="text-[12.5px] font-semibold text-glow-600 dark:text-glow-300">Unsaved changes</p>
                </>
              )}
            </div>
          </Card>
        </Reveal>

        <div className="flex flex-col gap-6">
          {/* ----------------------------------------------------- preferences */}
          <Reveal delay={0.06}>
            <Card>
              <h2 className="flex items-center gap-2 font-display text-[17px] font-bold tracking-[-0.02em]">
                <BellRing className="h-4 w-4 text-brand-500" aria-hidden="true" />
                Notification preferences
              </h2>
              <p className="mt-1.5 mb-5 text-[13px] leading-relaxed text-content-muted">
                Demo-only switches: they persist against your account in this browser, but FixNow sends no email, SMS
                or push from here. The in-app bell is real; the other two channels are represented, not implemented.
              </p>

              <ul className="flex flex-col divide-y divide-line">
                {PREF_ROWS.map((row) => (
                  <li key={row.key} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-canvas-2 text-content-soft">
                      <row.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <Toggle
                      checked={Boolean(prefs[row.key])}
                      onChange={setPref(row.key)}
                      label={row.label}
                      description={row.description}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          {/* --------------------------------------------------- security note */}
          <Reveal delay={0.1}>
            <Card className="border-aqua-400/30">
              <h2 className="flex items-center gap-2 font-display text-[17px] font-bold tracking-[-0.02em]">
                <ShieldCheck className="h-4 w-4 text-aqua-500" aria-hidden="true" />
                Security in this prototype
              </h2>
              <ul className="mt-4 flex flex-col gap-3.5 text-[13px] leading-relaxed text-content-soft">
                <li className="flex gap-2.5">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                  <span>
                    Passwords are compared in memory during login and are never written to localStorage by any screen —
                    but the seeded accounts still hold plain text in the store, which is exactly why these are demo
                    credentials and not real ones (NFR-14).
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                  <span>
                    All state lives in this browser’s localStorage. It is neither permanent nor secure: anyone with the
                    device can read or edit it, clearing site data erases everything, and nothing is transmitted to a
                    server (DR-09 / NFR-08).
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                  <span>
                    Role checks happen at the route level and inside the status machine, not by hiding buttons — so a
                    typed URL still cannot let a customer accept their own booking.
                  </span>
                </li>
              </ul>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* -------------------------------------------------------- danger zone */}
      <Reveal delay={0.06}>
        <Card className="mt-6 border-rejected/30">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h2 className="font-display text-[17px] font-bold tracking-[-0.02em] text-rejected">Danger zone</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-content-muted">
                Resetting rebuilds the seed data — every booking, review, complaint and profile edit in this browser is
                replaced by the original demo state, including this account. Signing out only ends the session.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" icon={LogOut} onClick={() => {
                logout();
                navigate('/');
                toast.info('Signed out. Browse as a guest.');
              }}>
                Sign out
              </Button>
              <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>
                Reset demo data
              </Button>
            </div>
          </div>
        </Card>
      </Reveal>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          toast.warning('Demo data rebuilt from the seed. Your edits in this browser are gone.', {
            title: 'State reset',
          });
        }}
        title="Reset all demo data?"
        message="Bookings, reviews, complaints, notifications and profile edits created in this browser are deleted and replaced with the original sample data. This cannot be undone."
        confirmLabel="Yes, reset everything"
      />
    </>
  );
}
