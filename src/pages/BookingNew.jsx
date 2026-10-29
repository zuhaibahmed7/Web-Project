import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Info,
  Lock,
  MapPin,
  Phone,
  SearchX,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useToast } from '../components/ui/Toast';
import { decorateProvider } from '../utils/selectors';
import { CITIES } from '../data/categories';
import { nextDays, todayISO } from '../utils/date';
import { formatPKR, formatDate, formatDayShort, formatTime } from '../utils/format';
import { minLength, required, validBookingDate, validTime } from '../utils/validation';
import { cn } from '../utils/cn';
import { Avatar } from '../components/ui/Avatar';
import { Rating } from '../components/ui/Rating';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FormStepper } from '../components/ui/Stepper';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/ui/Reveal';

const STEPS = ['Service', 'Schedule', 'Details'];

// The customer-side booking form (FR-BM-01 … FR-BM-07).
// Three steps so one screen does not throw eleven fields at once, and every
// step is validated before the next one can be reached.
export default function BookingNew() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const reduce = useReducedMotion();
  const { state, currentUser, createBooking } = useStore();

  const provider = useMemo(() => {
    const raw = state.providers.find((p) => p.slug === slug);
    return raw ? decorateProvider(state, raw) : null;
  }, [state, slug]);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() => ({
    serviceId: params.get('service') ?? '',
    date: '',
    time: '',
    address: currentUser?.address ?? '',
    city: currentUser?.city ?? '',
    description: '',
    phone: currentUser?.phone ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!provider) {
    return (
      <div className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8">
        <EmptyState
          icon={SearchX}
          title="That provider is not on FixNow"
          description={`No business matches “${slug}”. It may have been removed, or the link is out of date.`}
          action={<Button to="/browse">Browse providers</Button>}
          secondaryAction={<Button variant="outline" to="/how-it-works">How FixNow works</Button>}
        />
      </div>
    );
  }

  const service = provider.services.find((s) => s.id === values.serviceId) ?? null;
  const workingDays = provider.availability?.days ?? [];
  const days = nextDays(14, 0).map((d) => ({ ...d, bookable: workingDays.includes(d.dow) }));
  const slots = provider.availability?.slots ?? [];

  const set = (key) => (event) => {
    const next = event?.target ? event.target.value : event;
    setValues((v) => ({ ...v, [key]: next }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  function validateStep(index) {
    const next = {};
    if (index === 0) {
      next.serviceId = required(values.serviceId, 'A service');
    }
    if (index === 1) {
      next.date = validBookingDate(values.date, todayISO());
      next.time = validTime(values.time);
    }
    if (index === 2) {
      next.address = required(values.address, 'Service address');
      next.address = next.address || minLength(values.address, 10, 'The address');
      next.city = required(values.city, 'City');
      next.description = required(values.description, 'Job details');
      next.description = next.description || minLength(values.description, 15, 'Job details');
    }
    return Object.fromEntries(Object.entries(next).filter(([, message]) => message));
  }

  function goNext() {
    const found = validateStep(step);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Fix the highlighted field to continue.', { title: 'Almost there' });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit(event) {
    event.preventDefault();
    // Guards against double-taps creating two requests for the same job.
    if (submitting) return;
    const found = validateStep(2);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Check the highlighted fields before sending.', { title: 'Not sent yet' });
      return;
    }
    if (!service) return;

    setSubmitting(true);
    const booking = createBooking({
      customerId: currentUser.id,
      providerId: provider.id,
      serviceId: service.id,
      date: values.date,
      time: values.time,
      address: values.address.trim(),
      city: values.city,
      description: values.description.trim(),
      phone: values.phone.trim(),
      estimate: service.price ?? null,
    });
    toast.success(`${booking.code} sent to ${provider.name}. They will respond shortly.`, {
      title: 'Request sent',
    });
    navigate(`/booking/${booking.id}`, { replace: true });
  }

  return (
    <div className="pb-20">
      <div className="relative overflow-hidden border-b border-line bg-canvas-2/60">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(108_92_231_/_0.22),transparent_65%)] blur-2xl"
        />
        <div className="relative mx-auto max-w-[84rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <Link
            to={`/provider/${provider.slug}`}
            className="group mb-5 inline-flex items-center gap-2 text-[13px] font-semibold text-content-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to {provider.name}
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={provider.name} size="xl" ring verified={provider.verificationStatus === 'verified'} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.18em] text-brand-500 uppercase dark:text-brand-300">
                Booking a service
              </p>
              <h1 className="mt-1.5 font-display text-[24px] leading-[1.08] font-extrabold sm:text-[30px]">
                {provider.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-content-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CategoryIcon
                    icon={provider.category?.icon}
                    categoryId={provider.categoryId}
                    className="h-3.5 w-3.5 text-content-soft"
                  />
                  {provider.category?.name}
                </span>
                <Rating value={provider.rating} count={provider.reviewCount} />
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Replies in ~{provider.responseMins} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {provider.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[84rem] gap-7 px-4 pt-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-9 lg:px-8">
        <div>
          <Card className="mb-5" padding="sm">
            <FormStepper steps={STEPS} current={step} className="px-1 py-1" />
          </Card>

          <form onSubmit={submit} noValidate>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 26 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -26 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && (
                  <fieldset className="border-0 p-0">
                    <legend className="mb-1 font-display text-[19px] font-bold tracking-[-0.02em]">
                      What needs doing?
                    </legend>
                    <p className="mb-5 text-[14px] text-content-muted">
                      Pick one of {provider.name}&rsquo;s listed services. Prices are indicative and confirmed on site.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Service to book">
                      {provider.services.map((s) => {
                        const active = s.id === values.serviceId;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              setValues((v) => ({ ...v, serviceId: s.id }));
                              setErrors((e) => ({ ...e, serviceId: '' }));
                            }}
                            className={cn(
                              'group relative flex h-full flex-col items-start gap-2 overflow-hidden rounded-lg border p-4 text-left transition-[border-color,box-shadow,background-color] duration-300',
                              active
                                ? 'border-brand-500 bg-brand-500/8 shadow-glow'
                                : 'border-line bg-canvas hover:border-brand-500/45 hover:shadow-lift'
                            )}
                          >
                            <span className="flex w-full items-start gap-3">
                              <span
                                className={cn(
                                  'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200',
                                  active ? 'border-brand-500 bg-brand-500' : 'border-line-strong'
                                )}
                              >
                                {active && <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden="true" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[14.5px] font-bold leading-snug">{s.name}</span>
                                <span className="mt-1 block text-[12.5px] leading-relaxed text-content-muted">
                                  {s.description}
                                </span>
                              </span>
                            </span>
                            <span className="mt-auto flex items-center gap-1.5 pt-2 text-[13px] font-bold text-brand-600 dark:text-brand-300">
                              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatPKR(s.price)}
                              <span className="font-medium text-content-muted">/ {s.unit}</span>
                            </span>
                            <span
                              aria-hidden="true"
                              className={cn(
                                'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
                                !active && 'group-hover:opacity-100'
                              )}
                              style={{
                                background:
                                  'radial-gradient(340px circle at 70% 0%, rgb(0 212 200 / 0.10), transparent 70%)',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {errors.serviceId && (
                      <p className="mt-3 text-[12.5px] font-medium text-rejected dark:text-[#ff8a8a]">
                        {errors.serviceId}
                      </p>
                    )}
                    {provider.services.length === 0 && (
                      <p className="text-[13.5px] text-content-muted">
                        This provider has not published services yet — you can still send a request and describe the job
                        in the next steps.
                      </p>
                    )}
                  </fieldset>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="mb-1 font-display text-[19px] font-bold tracking-[-0.02em]">
                      When should they come?
                    </h2>
                    <p className="mb-5 text-[14px] text-content-muted">
                      Only the days {provider.name} works are selectable. Bookings must be today or later (SC-04).
                    </p>

                    <div className="no-bar -mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-7">
                      {days.map((d) => {
                        const active = d.iso === values.date;
                        return (
                          <button
                            key={d.iso}
                            type="button"
                            disabled={!d.bookable}
                            aria-pressed={active}
                            onClick={() => set('date')(d.iso)}
                            className={cn(
                              'flex min-w-[4.6rem] shrink-0 flex-col items-center gap-0.5 rounded-md border px-3 py-2.5 transition-[border-color,background-color,transform] duration-200 sm:min-w-0',
                              active && 'border-transparent bg-ink-800 text-white shadow-lift dark:bg-white dark:text-ink-800',
                              !active && d.bookable && 'border-line bg-canvas hover:border-brand-500/50 hover:shadow-hair',
                              !d.bookable && 'cursor-not-allowed border-line bg-canvas-2/50 opacity-45'
                            )}
                          >
                            <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase opacity-80">
                              {d.isToday ? 'Today' : d.weekday}
                            </span>
                            <span className="font-display text-[19px] leading-none font-extrabold tabular-nums">
                              {d.day}
                            </span>
                            <span className="text-[10.5px] opacity-70">{d.month}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mb-5 text-[12px] text-content-muted">
                      Grey dates are outside this provider&rsquo;s working week. Need a different day? Pick it below.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Preferred date"
                        type="date"
                        required
                        min={todayISO()}
                        value={values.date}
                        onChange={set('date')}
                        error={errors.date}
                        hint="YYYY-MM-DD, today or later."
                      />
                      <Select
                        label="Arrival window"
                        required
                        placeholder="Choose a slot"
                        value={values.time}
                        onChange={set('time')}
                        error={errors.time}
                        options={slots.map((s) => ({
                          value: s.start,
                          label: `${formatTime(s.start)} – ${formatTime(s.end)}`,
                        }))}
                        hint={slots.length ? '' : 'This provider has not set working slots yet.'}
                      />
                    </div>

                    {values.date && (
                      <Reveal className="mt-4">
                        <p className="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-canvas-2/60 px-4 py-3 text-[13px]">
                          <CalendarDays className="h-4 w-4 text-brand-500" aria-hidden="true" />
                          <span className="font-bold">
                            {formatDate(values.date, { weekday: 'long' })}
                          </span>
                          {values.time && <span className="text-content-muted">· {formatTime(values.time)} arrival</span>}
                          <span className="ml-auto text-content-muted">
                            {provider.name} usually replies in ~{provider.responseMins} minutes
                          </span>
                        </p>
                      </Reveal>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="mb-1 font-display text-[19px] font-bold tracking-[-0.02em]">
                      Where is the job, and what is wrong?
                    </h2>
                    <p className="mb-5 text-[14px] text-content-muted">
                      The more specific the note, the better the quote. Include landmarks, gate codes or the make and
                      model.
                    </p>

                    <div className="grid gap-4">
                      <Input
                        label="Service address"
                        icon={MapPin}
                        required
                        value={values.address}
                        onChange={set('address')}
                        error={errors.address}
                        placeholder="House 42, Street 7, DHA Phase 5"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                          label="City"
                          required
                          placeholder="Select your city"
                          value={values.city}
                          onChange={set('city')}
                          error={errors.city}
                          options={CITIES.map((c) => ({ value: c, label: c }))}
                        />
                        <Input
                          label="Contact number"
                          icon={Phone}
                          type="tel"
                          value={values.phone}
                          onChange={set('phone')}
                          hint="Shown to the provider only after they accept."
                          placeholder="03001234567"
                        />
                      </div>
                      <Textarea
                        label="Job details"
                        required
                        rows={5}
                        maxLength={400}
                        showCount
                        value={values.description}
                        onChange={set('description')}
                        error={errors.description}
                        placeholder="Describe the fault, when it started, and anything already tried."
                      />
                    </div>

                    {cityWarning(provider, values.city) && (
                      <p className="mt-1 flex items-start gap-2 rounded-sm border border-pending/40 bg-pending/10 px-4 py-3 text-[13px] text-content-soft">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-pending" aria-hidden="true" />
                        {cityWarning(provider, values.city)}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  icon={ArrowLeft}
                  onClick={() => setStep((s) => s - 1)}
                  disabled={submitting}
                >
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button
                  size="lg"
                  iconRight={ArrowRight}
                  onClick={goNext}
                  disabled={!canAdvance(step, values, provider)}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" size="lg" loading={submitting} disabled={submitting} icon={ShieldCheck}>
                  {submitting ? 'Sending request…' : 'Send booking request'}
                </Button>
              )}
              <p className="text-[12.5px] text-content-muted">
                No payment now. The provider confirms the price on site.
              </p>
            </div>
          </form>
        </div>

        {/* Sticky summary so the customer always sees what they have committed to. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden" padding="none">
            <div className="border-b border-line bg-canvas-2/60 px-5 py-4">
              <p className="flex items-center gap-2 font-display text-[14px] font-bold tracking-[-0.01em]">
                <Sparkles className="h-4 w-4 text-aqua-500" aria-hidden="true" />
                Request summary
              </p>
            </div>
            <dl className="divide-y divide-line text-[13px]">
              <SummaryRow icon={BadgeCheck} label="Provider" value={provider.name} />
              <SummaryRow
                icon={Wallet}
                label="Service"
                value={service ? `${service.name} · ${formatPKR(service.price)}` : 'Not chosen yet'}
              />
              <SummaryRow
                icon={CalendarDays}
                label="Date"
                value={values.date ? formatDayShort(values.date) : 'Not chosen yet'}
              />
              <SummaryRow
                icon={Clock}
                label="Arrival"
                value={values.time ? formatTime(values.time) : 'Not chosen yet'}
              />
              <SummaryRow
                icon={MapPin}
                label="Address"
                value={values.address || 'Not entered yet'}
              />
            </dl>
            <div className="flex items-baseline justify-between gap-3 border-t border-line px-5 py-4">
              <span className="text-[12.5px] font-semibold tracking-[0.06em] text-content-muted uppercase">
                Indicative
              </span>
              <span className="font-display text-[22px] font-extrabold tabular-nums">
                {service ? formatPKR(service.price) : 'PKR —'}
              </span>
            </div>
          </Card>

          <ul className="mt-4 space-y-2.5 text-[12.5px] leading-relaxed text-content-muted">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-completed" aria-hidden="true" />
              Your request stays Pending until {provider.name} accepts it. Cancel free of charge any time before that.
            </li>
            <li className="flex gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Signed in as {currentUser?.name}. Only a signed-in customer can send requests.
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
              Once the job is marked Completed you can rate it — one review per booking.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
      <dt className="w-20 shrink-0 text-content-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-right font-semibold break-words">{value}</dd>
    </div>
  );
}

// Light validation gate for the Continue button: it should not look enabled when
// the obvious requirement is missing (the real check still runs on click).
function canAdvance(step, values, provider) {
  if (step === 0) return Boolean(values.serviceId) || provider.services.length === 0;
  if (step === 1) return Boolean(values.date && values.time);
  return Boolean(values.address && values.city && values.description);
}

// Warn, but never block, when the chosen city is outside the provider's patch.
function cityWarning(provider, city) {
  if (!city) return '';
  if (provider.city !== city) {
    return `${provider.name} is based in ${provider.city} and travels to ${provider.areas.slice(0, 3).join(', ')}. Booking a different city may delay the visit — ask them to confirm.`;
  }
  return '';
}
