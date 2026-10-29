import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  ChevronDown,
  CircleSlash,
  Compass,
  ListChecks,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { PROGRESS_STEPS, STATUS, STATUS_META, STATUS_ORDER } from '../utils/booking';
import { formatPKR } from '../utils/format';
import { marketplaceStats } from '../utils/selectors';
import { useStore } from '../store/StoreContext';
import { cn } from '../utils/cn';
import { Button, LinkButton } from '../components/ui/Button';
import { Card, Band, TiltCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Reveal, Stagger, StaggerItem, MaskLines } from '../components/ui/Reveal';
import { CategoryIcon } from '../components/ui/CategoryIcon';

/* ------------------------------------------------------------------ content */

// The customer's visible state at each lifecycle stage (SRS UC-03, FR-BM-09).
const STEP_DETAIL = {
  pending: {
    title: 'You send the request',
    you: 'Pick a verified provider, choose a slot and describe the fault. The booking is created as Pending and the provider is notified straight away.',
    sees: 'Your booking card shows a yellow Pending dot and an expected response time taken from the provider profile.',
  },
  accepted: {
    title: 'The provider confirms',
    you: 'Nothing to do. The provider either accepts or rejects — an accepted request locks your slot.',
    sees: 'The stepper advances to step two, the address and time become final, and a notification arrives.',
  },
  in_progress: {
    title: 'Work starts at your address',
    you: 'Be reachable. The provider marks the job In Progress when they begin on site.',
    sees: 'An orange In Progress rail, plus the estimate that was agreed before the visit.',
  },
  completed: {
    title: 'Job finished, review opens',
    you: 'Settle the bill with the provider, then rate the work while the booking is still fresh.',
    sees: 'A green Completed badge and a review form on the same booking page (BRL-07: one review per booking).',
  },
};

// Off-path states are explained separately because they end the journey early.
const DEAD_ENDS = [
  {
    status: STATUS.REJECTED,
    icon: X,
    what: 'The provider could not take the request — no travel coverage, fully booked, or the fault is outside their trade.',
    next: 'Their reason is written on the booking. Book someone else; nothing was charged and nothing is held.',
  },
  {
    status: STATUS.CANCELLED,
    icon: Ban,
    what: 'The request was withdrawn while it was still Pending — by you, or by an admin if you asked them to.',
    next: 'Once a provider has accepted, cancellation needs an admin (BRL-05), so message support instead of assuming it went through.',
  },
];

const ROLES = [
  {
    key: 'guest',
    label: 'Guest',
    icon: Compass,
    tone: 'from-[#8B78F5] to-[#4CE8DE]',
    can: [
      'Browse every verified provider, its services and indicative PKR prices',
      'Read real reviews and ratings collected from completed jobs',
      'Open a category or city search without creating an account',
    ],
    cannot: [
      'Send a booking — the book button routes to login first (BRL-01)',
      'Contact a provider directly; phone details stay on the dashboard',
    ],
  },
  {
    key: 'customer',
    label: 'Customer',
    icon: Users,
    tone: 'from-[#6C5CE7] to-[#00D4C8]',
    can: [
      'Request a service for a chosen date, time slot and address',
      'Cancel a request yourself only while it is still Pending (BRL-05)',
      'Review a job after it is marked Completed — one review per booking (BRL-07)',
      'Raise a complaint and follow the admin resolution against it',
    ],
    cannot: ['Mark your own booking Accepted, In Progress or Completed'],
  },
  {
    key: 'provider',
    label: 'Service provider',
    icon: Wrench,
    tone: 'from-[#FFB020] to-[#FF7A1A]',
    can: [
      'Accept or reject incoming requests, with a reason for a rejection',
      'Start work and mark it completed as the job moves on site',
      'Publish their own services, unit prices and weekly availability',
    ],
    cannot: [
      'Edit another provider’s listing',
      'Appear publicly until an admin verifies the business (FR-AV-01)',
    ],
  },
  {
    key: 'admin',
    label: 'Administrator',
    icon: ShieldCheck,
    tone: 'from-[#10B981] to-[#3B82F6]',
    can: [
      'Verify or reject pending provider applications',
      'Move any booking forward and cancel an accepted one when needed',
      'Resolve or dismiss complaints and record the resolution text',
      'Manage the service categories the marketplace is built on',
    ],
    cannot: ['Book jobs as a customer or write reviews on their behalf'],
  },
];

const FAQS = [
  {
    q: 'Do I pay through FixNow?',
    a: 'No. Every price you see is indicative and comes from the provider’s own service list, shown as "from PKR …". Payment is settled directly with the provider once the work is done. The estimate on a booking is a record of what was quoted, not a charge, and FixNow never touches your card or bank details.',
  },
  {
    q: 'Can I cancel any booking?',
    a: 'Only while it is Pending. Cancelling an accepted or in-progress job affects someone who has already travelled or bought material, so that transition belongs to the provider or an admin (BRL-05). If a provider has accepted and you can no longer host the visit, raise a complaint or ask an admin to cancel it for you.',
  },
  {
    q: 'How are providers verified?',
    a: 'A new business profile starts as pending and is invisible to the public directory. An admin checks the trade details and flips it to verified, which is the only state that appears under Browse, Providers or a category page (FR-AV-01). A rejected profile stays private and its owner is notified of the decision.',
  },
  {
    q: 'What if the time I want is unavailable?',
    a: 'The booking form reads the provider’s weekly working days and slots, so a closed weekday simply does not offer a slot. Pick the next open day, or use the availability filter on Browse to see who has a free slot within seven days. Booking outside published hours is blocked rather than silently accepted.',
  },
  {
    q: 'Can I change a booking after sending it?',
    a: 'Not in place. A booking is a request tied to a slot, an address and a price estimate, so editing it after the provider has answered would misreport the job. Cancel while it is still Pending and send a corrected request, or add the missing detail in the description before you press send.',
  },
  {
    q: 'Is my data stored on a server?',
    a: 'No. This prototype is frontend-only: accounts, bookings, reviews and complaints live in your browser’s localStorage and disappear when you clear it. There is no backend, no API and no database (DR-09). Treat everything here as demo data — nothing is permanent, encrypted or secure.',
  },
  {
    q: 'Who can see my reviews?',
    a: 'Reviews are public and attached to the provider, not to you personally. They appear on the provider profile and feed the star average instantly. You may write one review per completed booking; after that the form closes for that job (BRL-07).',
  },
];

/* -------------------------------------------------------------------- parts */

function SectionHeading({ eyebrow, title, lead, className }) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <p className="text-[11px] font-bold tracking-[0.18em] text-brand-500 uppercase dark:text-brand-300">
        {eyebrow}
      </p>
      <h2 className="mt-2.5 font-display text-[26px] leading-[1.08] font-extrabold sm:text-[32px]">{title}</h2>
      {lead && <p className="mt-3 text-[15px] leading-relaxed text-content-muted text-pretty">{lead}</p>}
    </div>
  );
}

// Connected happy-path journey rendered from PROGRESS_STEPS, not hand-written copy.
function LifecycleJourney() {
  return (
    <Stagger className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5" as="ol">
      {PROGRESS_STEPS.map((step, i) => {
        const meta = STATUS_META[step.key];
        const detail = STEP_DETAIL[step.key];
        const isLast = i === PROGRESS_STEPS.length - 1;

        return (
          <StaggerItem key={step.key} as="li" className="relative lg:flex-1">
            <TiltCard tilt={4} className="h-full" contentClassName="flex h-full flex-col p-5">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-[15px] font-extrabold text-white shadow-[0_10px_24px_-14px_rgb(15_21_53_/_0.9)]"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[16px] leading-tight font-bold">{detail.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: meta.color }}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
                    {meta.label}
                    {isLast && ' · review window open'}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[13.5px] leading-relaxed text-content-soft text-pretty">{detail.you}</p>

              <div className="mt-auto pt-4">
                <p className="rounded-sm bg-canvas-2 px-3 py-2.5 text-[12.5px] leading-relaxed text-content-muted">
                  <span className="font-bold text-content-soft">On screen: </span>
                  {detail.sees}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.1em] text-brand-500 uppercase dark:text-brand-300">
                  {isLast ? <Star className="h-3 w-3" aria-hidden="true" /> : <ArrowRight className="h-3 w-3" aria-hidden="true" />}
                  {step.hint}
                </p>
              </div>
            </TiltCard>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

export default function HowItWorks() {
  const { state } = useStore();
  const stats = marketplaceStats(state);
  const [openFaq, setOpenFaq] = useState(FAQS[0].q);

  const cheapest = Math.min(...state.categories.map((c) => c.from));

  return (
    <>
      {/* ---------------------------------------------------------- (a) intro */}
      <Band tone="grad" className="noise overflow-hidden">
        <div className="mx-auto max-w-[84rem] px-4 pt-14 pb-12 sm:px-6 sm:pt-20 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="min-w-0">
              <Badge tone="glass" size="sm" icon={Wrench}>
                Find. Book. Fix. — the whole lifecycle, in plain words
              </Badge>

              <h1 className="mt-5 font-display text-[38px] leading-[0.98] font-extrabold tracking-[-0.04em] sm:text-[54px] lg:text-[62px]">
                <MaskLines
                  lines={['A leak at 9 pm', 'should not need', 'three phone calls.']}
                  className="block"
                  lineClassName="block"
                />
              </h1>

              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-content-soft text-pretty">
                FixNow replaces the WhatsApp chain, the unverified contractor and the argument over the bill. You
                search a verified professional, send one structured request, watch it move through four honest
                statuses, and rate the work afterwards. Here is exactly how each stage behaves — including the two
                ways a booking can end early.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button to="/browse" size="lg" iconRight={ArrowRight}>
                  Browse providers
                </Button>
                <Button to="/providers" variant="secondary" size="lg">
                  All {stats.verifiedProviders} verified pros
                </Button>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                {[
                  { k: 'Verified pros', v: String(stats.verifiedProviders) },
                  { k: 'Cities live', v: new Set(state.providers.map((p) => p.city)).size.toString() },
                  { k: 'Cheapest visit', v: formatPKR(cheapest) },
                ].map((item) => (
                  <div key={item.k}>
                    <dt className="text-[11px] font-bold tracking-[0.14em] text-content-muted uppercase">{item.k}</dt>
                    <dd className="mt-1 font-display text-[22px] font-extrabold tabular-nums">{item.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The three verbs the product is named after, as a stacked visual. */}
            <Reveal delay={0.12} y={26}>
              <Card padding="none" className="overflow-hidden">
                <div className="dot-grid border-b border-line px-5 py-4">
                  <p className="font-display text-[11px] font-bold tracking-[0.18em] text-content-muted uppercase">
                    Three moves, one flow
                  </p>
                </div>
                <ul className="divide-y divide-line">
                  {[
                    {
                      icon: Search,
                      word: 'Find',
                      text: 'Seven categories, filtered by city, price, rating and who actually has a slot this week.',
                      tint: '#6C5CE7',
                    },
                    {
                      icon: ListChecks,
                      word: 'Book',
                      text: 'One request carries the date, slot, address and fault description. No calling around.',
                      tint: '#00B8AD',
                    },
                    {
                      icon: Wrench,
                      word: 'Fix',
                      text: 'The provider runs the status, you settle the bill in PKR, and the review keeps everyone honest.',
                      tint: '#FF7A1A',
                    },
                  ].map((row) => (
                    <li key={row.word} className="flex items-start gap-4 px-5 py-5">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-white"
                        style={{ backgroundImage: `linear-gradient(135deg, ${row.tint}, ${row.tint}99)` }}
                        aria-hidden="true"
                      >
                        <row.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-[17px] font-extrabold tracking-[-0.02em]">{row.word}</p>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-content-muted text-pretty">{row.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-canvas-2/60 px-5 py-4 text-[12.5px] text-content-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                    Prices are indicative
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Home-service visits only
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified before public
                  </span>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </Band>

      {/* --------------------------------------------------- (b) happy path */}
      <section className="mx-auto max-w-[84rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="The happy path"
            title="Four steps, and the same four steps on every booking card"
            lead="This is the real status machine behind the app (SRS section 9.1). Nothing skips a stage: a booking cannot jump from Requested to Completed, and the stepper on your booking card reads the actual timeline."
          />
        </Reveal>
        <LifecycleJourney />
        <Reveal delay={0.05}>
          <p className="mt-6 flex flex-wrap items-center gap-2 text-[13px] text-content-muted">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Want to try it end to end?{' '}
            <LinkButton to="/browse">Pick a provider</LinkButton>
            and send a request — the demo stores it in your browser.
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------------ (c) status legend */}
      <Band tone="cloud">
        <div className="mx-auto max-w-[84rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Status legend"
              title="Six statuses, and only four of them are progress"
              lead="Colour alone never carries meaning here — every status also has a label, a dot on the rail and a sentence explaining what happens next."
            />
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STATUS_ORDER.map((key, i) => {
              const meta = STATUS_META[key];
              return (
                <Reveal key={key} delay={i * 0.06}>
                  <Card className="h-full">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', meta.dot)} aria-hidden="true" />
                      <p className="font-display text-[15.5px] font-bold">{meta.label}</p>
                      <span className="ml-auto text-[11px] font-bold tabular-nums text-content-muted">
                        Step {meta.step + 1}/4
                      </span>
                    </div>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-content-soft text-pretty">{meta.blurb}</p>
                    <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-content-muted">
                      {STEP_DETAIL[key].sees}
                    </p>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.08}>
            <h3 className="mt-12 mb-4 font-display text-[18px] font-bold tracking-[-0.02em]">
              Off the happy path — terminal states
            </h3>
          </Reveal>
          <div className="grid gap-4 lg:grid-cols-2">
            {DEAD_ENDS.map((end, i) => {
              const meta = STATUS_META[end.status];
              return (
                <Reveal key={end.status} delay={i * 0.07}>
                  <Card className="h-full border-rejected/25">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-sm',
                          end.status === STATUS.REJECTED ? 'bg-rejected/12 text-rejected' : 'bg-cancelled/20 text-slate-600 dark:text-slate-300'
                        )}
                        aria-hidden="true"
                      >
                        <end.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-display text-[15.5px] font-bold">
                          {meta.label}
                          <Badge tone={end.status === STATUS.REJECTED ? 'danger' : 'neutral'} size="sm">
                            Terminal
                          </Badge>
                        </p>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-content-soft text-pretty">{end.what}</p>
                        <p className="mt-2.5 text-[12.5px] leading-relaxed text-content-muted">
                          <span className="font-bold text-content-soft">What you do next: </span>
                          {end.next}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Band>

      {/* -------------------------------------------- (d) who does what */}
      <section className="mx-auto max-w-[84rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Responsibility map"
            title="Who is allowed to do what"
            lead="Role is enforced at the route level and inside the status machine, not by hiding buttons — so these rules hold even if someone types a URL by hand."
          />
        </Reveal>

        <Stagger className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role, i) => (
            <StaggerItem key={role.key} as="div" className="h-full">
              <Card padding="none" className="flex h-full flex-col overflow-hidden">
                <div
                  className={cn('relative flex items-center gap-3 bg-gradient-to-br px-5 py-4 text-white', role.tone)}
                >
                  <role.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <p className="font-display text-[17px] font-extrabold tracking-[-0.02em]">{role.label}</p>
                  <span className="ml-auto text-[11px] font-bold tracking-[0.12em] uppercase opacity-80">
                    {i === 0 ? 'No account' : 'Signed in'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-completed uppercase">May do</p>
                    <ul className="flex flex-col gap-2">
                      {role.can.map((line) => (
                        <li key={line} className="flex gap-2 text-[13px] leading-snug text-content-soft">
                          <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-completed" aria-hidden="true" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-auto border-t border-line pt-4">
                    <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-rejected uppercase">Cannot</p>
                    <ul className="flex flex-col gap-2">
                      {role.cannot.map((line) => (
                        <li key={line} className="flex gap-2 text-[13px] leading-snug text-content-muted">
                          <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Categories the responsibility map applies to, with their entry price. */}
        <Reveal delay={0.06}>
          <div className="mt-10">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-content-muted uppercase">
              <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
              Seven categories, same rules everywhere
            </p>
            <ul className="no-bar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
              {state.categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/browse?category=${cat.slug}`}
                    className="glass group flex w-[10.5rem] flex-col items-start gap-2 rounded-md p-4 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-lift sm:w-full"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xs bg-canvas-2 text-brand-500 transition-colors group-hover:bg-brand-500/12">
                      <CategoryIcon icon={cat.icon} className="h-4 w-4" />
                    </span>
                    <span className="font-display text-[13.5px] leading-tight font-bold">{cat.name}</span>
                    <span className="text-[11.5px] text-content-muted">from {formatPKR(cat.from)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ (e) FAQ */}
      <Band tone="cloud">
        <div className="mx-auto max-w-[84rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <Reveal>
              <SectionHeading
                eyebrow="Questions we get asked"
                title="The honest answers, including about the money"
                lead="If a rule feels restrictive, there is usually a business rule behind it. Each answer names the SRS id where that rule lives."
              />
              <Card className="mt-8" padding="sm">
                <p className="flex items-start gap-3 text-[13px] leading-relaxed text-content-soft">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-aqua-500" aria-hidden="true" />
                  Still stuck? Sign in as the demo customer, raise a complaint against the booking, and the admin
                  account will pick it up in the Complaints desk.
                </p>
              </Card>
            </Reveal>

            <div>
              <ul className="flex flex-col gap-3">
                {FAQS.map((faq) => {
                  const open = openFaq === faq.q;
                  return (
                    <li key={faq.q}>
                      <div className={cn('glass rounded-lg transition-shadow duration-300', open && 'shadow-lift')}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenFaq(open ? '' : faq.q)}
                          className="flex w-full items-center gap-4 px-5 py-4 text-left"
                        >
                          <span className="min-w-0 flex-1 font-display text-[15px] leading-snug font-bold tracking-[-0.01em]">
                            {faq.q}
                          </span>
                          <span
                            className={cn(
                              'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-content-muted transition-transform duration-300',
                              open && 'rotate-180 border-brand-500/45 text-brand-500'
                            )}
                            aria-hidden="true"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        </button>
                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
                            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="border-t border-line px-5 py-4 text-[14px] leading-relaxed text-content-soft text-pretty">
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </Band>

      {/* -------------------------------------------------------- (f) CTA */}
      <Band tone="ink" className="noise relative overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_15%_-10%,rgb(108_92_231_/_0.55),transparent_60%),radial-gradient(60%_120%_at_90%_110%,rgb(0_212_200_/_0.35),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <h2 className="max-w-xl font-display text-[30px] leading-[1.04] font-extrabold tracking-[-0.035em] text-white sm:text-[40px]">
                Read enough. Send your first request, or put your tools on the map.
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-cloud-300/80">
                Customers: browse {stats.verifiedProviders} verified professionals across Pakistan, prices from{' '}
                {formatPKR(cheapest)}. Providers: register your business and reach an admin reviewer the same day.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Button to="/browse" size="lg" variant="accent" iconRight={ArrowRight}>
                  Find a service
                </Button>
                <Button
                  to="/register?role=provider"
                  size="lg"
                  variant="secondary"
                  className="border-white/25 bg-white/10 text-white hover:border-white/45 hover:bg-white/15"
                >
                  Register as a provider
                </Button>
              </div>
              <p className="mt-4 text-[12.5px] text-cloud-300/60 lg:text-right">
                No card details, no payment, no server — this is a frontend prototype.
              </p>
            </Reveal>
          </div>
        </div>
      </Band>
    </>
  );
}
