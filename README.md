# FixNow — Find. Book. Fix.

A frontend-only prototype of a Pakistani home-service marketplace: households find a verified
plumber, electrician, AC technician, cleaner, painter, carpenter or mechanic, book a slot, and
rate the work once it is done. Built for a university software project from the
*Home Service Marketplace* SRS — the SRS supplied the roles, rules, data fields and statuses;
every screen, layout and interaction here was designed for this repository.

There is no backend. One reducer holds the whole marketplace and mirrors itself to
`localStorage`, which is what lets a provider accepting a request show up immediately in the
customer's dashboard and in the admin's statistics.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve the built bundle
```

Requires Node 18+. No environment variables, no API keys, no database.

**Reset the demo at any time:** account menu (top right) → *Reset demo data*, or
*My profile* → *Reset demo data*. This clears `fixnow.state.v3` and re-seeds every booking,
review, complaint and provider from `/src/data`.

---

## Demo accounts

`/login` has one-tap chips for all three roles, so you can jump between views in seconds.

| Role | Email | Password | What they can do |
| --- | --- | --- | --- |
| Customer | `customer@fixnow.pk` | `customer123` | Search, book, cancel while Pending, review, complain |
| Service provider | `provider@fixnow.pk` | `provider123` | Owns **Bilal Electrical Works** — accept/reject, progress jobs, manage services, prices, availability, public profile |
| Admin | `admin@fixnow.pk` | `admin123` | Users, provider verification, categories, bookings ledger, complaint desk, reports |

Guests can browse the whole marketplace but every booking, review, complaint and dashboard
redirects them to `/login`.

Other seeded logins exist for volume (`u-customer-2/3/4`, `u-provider-2/3`, `u-admin-2`) but
they are not needed for a walkthrough.

---

## Screens

### Public (guest)
| Route | Screen |
| --- | --- |
| `/` | Home — 3D tool moment, lifecycle demo, categories, top-rated pros, review wall |
| `/browse` | Marketplace search + filters (category, city, price, rating, availability, sort) |
| `/providers` | Full provider directory |
| `/provider/:slug` | Public provider profile — services, prices, reviews, slots |
| `/how-it-works` | Verification, pricing and dispute process |
| `/login`, `/register` | Auth; register offers customer *and* provider signup |
| `*` | 404 |

### Customer (`/app…`)
| Route | Screen |
| --- | --- |
| `/app` | Dashboard — next visit, stats, attention list, categories, activity |
| `/app/bookings` | My bookings with tabs (active / pending / completed / closed / needs review) |
| `/book/:slug` | 3-step booking wizard — service, schedule, details |
| `/booking/:id` | Booking detail — stepper, timeline, cancel, review, complaint |
| `/app/reviews` | Reviews written and received |
| `/app/complaints` | Raise and track complaints |
| `/app/profile` | Profile, address, theme, reset |
| `/notifications` | Notification inbox |

### Service provider (`/partner…`)
| Route | Screen |
| --- | --- |
| `/partner` | Business hub — today, earnings signals, queue |
| `/partner/requests` | Pending requests: accept or reject with a reason |
| `/partner/jobs` | Active jobs: start work, mark completed |
| `/partner/services` | Add / edit / delete services and indicative PKR prices |
| `/partner/availability` | Working days and arrival windows |
| `/partner/profile` | Edit the public listing (bio, areas, contact) |

### Admin (`/admin…`)
| Route | Screen |
| --- | --- |
| `/admin` | Marketplace overview + charts |
| `/admin/users` | Account list, activate/suspend |
| `/admin/verification` | Verification queue: approve, decline, re-open |
| `/admin/categories` | Add / edit / delete the SRS categories (name, slug, icon, starting price, tagline, gradient) |
| `/admin/bookings` | Every booking across the marketplace |
| `/admin/complaints` | Complaint desk with priorities and resolutions |
| `/admin/reports` | Revenue, acceptance-rate and rating analytics |

---

## Business rules actually enforced

Encoded once in `src/utils/booking.js` (transition table + helpers) and reused by every screen,
so the UI can't disagree with the reducer:

- A request is **Pending** until the provider accepts or rejects it.
- Providers may **accept or reject** Pending work; rejection requires a reason (min 8 characters).
- Customers may **cancel free of charge only while Pending**; the reason is recorded and the
  booking can never be reopened.
- **In Progress → Completed** is the provider's move; Rejected and Cancelled are terminal and are
  excluded from "active" counts everywhere.
- **Review only after Completed, one per booking** — the rating is averaged into the provider's
  public score on publish.
- Only **verified** providers appear publicly; pending and rejected listings stay in the admin queue.
- Booking slots are filtered by the provider's working days and arrival windows.
- Prices are indicative and always in **PKR**; FixNow never takes a payment.
- Guests browse freely but cannot book, review, complain or open a dashboard.
- Search & filter by service, provider, area, city, starting price, minimum rating and availability.

---

## Design system

Palette (CSS custom properties in `src/index.css`, exposed as Tailwind tokens):

| SRS colour | Token in `src/index.css` | Use |
| --- | --- | --- |
| Midnight Indigo `#0F1535` | `ink-800`, light-mode `--c-content` | Headings, dark surfaces |
| Electric Violet `#6C5CE7` | `brand-500` | Primary action, links, gradients |
| Aqua Teal `#00D4C8` | `aqua-400` | Secondary accent, success, gradients |
| Warm Amber `#FFB020` | `glow-400` (the amber scale is named *glow* so it never clashes with Tailwind's `amber`) | Highlights, warnings |
| Soft Cloud `#F6F7FF` | `cloud-100`, light-mode `--c-canvas` | Page background |
| Slate `#64748B` | light-mode `--c-content-muted` | Muted text |

Semantic surfaces (`canvas`, `canvas-2`, `surface`, `surface-2`, `line`, `content`,
`content-soft`, `content-muted`) are declared with `@theme inline` so the same utility classes
resolve to light values on `:root` and dark values under `.dark`.

Status colours follow the SRS: Pending `#F5B301`, Accepted `#3B82F6`, In Progress `#FF7A1A`,
Completed `#10B981`, Rejected `#EF4444`, Cancelled `#94A3B8`.

Typography: **Sora** for display/headings, **Inter** for body, on a single tight scale.
Light mode is the default; the toggle in the navbar persists to `fixnow.theme`.

Component library (`src/components/ui`, `src/components/cards`): Button, Input/Textarea/Select
(each renders its own labelled `Field`), Modal + ConfirmDialog, Toast stack, Badge/StatusBadge,
Rating + RatingInput, Avatar, Card / TiltCard / Band, FormStepper / BookingStepper / Segmented,
Skeletons, EmptyState, CategoryIcon, and the BookingCard / ProviderCard / StatCard / ReviewCard /
ComplaintCard / CategoryTile composites.

Motion: page transitions, scroll reveals with stagger, animated counters, an animated booking
progress stepper, 3D tilt with a cursor-follow glow, and micro-interactions on every control.
All of it is gated behind `prefers-reduced-motion` — with that flag set, counters jump to their
final value and the tilt/glow handlers are not attached.

The 3D moment lives in `src/components/three`: a lazy-loaded `@react-three/fiber` scene
(`ToolsScene`, its own chunk) mounted only when the device looks capable
(`useCanRender3D`); phones and low-end machines get `ToolsFallback` instead, and the page never
blocks on WebGL.

---

## Project layout

```
src/
  App.jsx                route table + role guards
  pages/                 29 screens, one per route
  components/
    ui/                  primitives (Button, Input, Modal, Stepper, Toast…)
    cards/               composite cards
    layout/              Navbar, Footer, AppLayout, DashboardShell, ProtectedRoute, PageTransition
    three/               lazy 3D scene + fallback
  store/StoreContext.jsx single reducer, mirrored to localStorage
  utils/                 booking rules, selectors, filters, dates, PKR formatting, validation
  data/                  seed: 25 providers, 7 categories, 22 bookings across every status,
                         116 reviews, 7 complaints, 9 users
  hooks/                 useTilt, useCountUp, useTheme, useMediaQuery, useDismiss, useCanRender3D
```

State keys: `fixnow.state.v3` (everything) and `fixnow.theme`. Bump `STATE_VERSION` in
`src/data/seed.js` when the shape changes and old saved states are discarded automatically.

---

## Scope and limitations

- Frontend only, by design: no server, no real auth, no payments. Passwords are demo shortcuts
  stored in your browser and never sent anywhere.
- All people, businesses, reviews and jobs are fictional sample data.
- Charts are Recharts; the bundle is split so `three`, `recharts` and `framer-motion` load as
  separate vendor chunks.
- Verified behaviour: `npm run build` completes with zero errors or warnings, and every route above
  was driven in a dev browser through the customer, provider, admin and guest paths with no console
  errors or React warnings. Booking creation → accept → in progress → completed → review,
  cancel-while-pending, rejection with reason, review validation, complaint fan-out to admins,
  provider verification, price/availability edits, sign-up, role redirects, filters and the theme
  toggle were each exercised end to end.
- Not verified here: pixel-level appearance and responsiveness at 375/768/1280. The browser used
  for testing reported a 0×0 hidden viewport, so `requestAnimationFrame` never ticked — visual
  screenshots, animated transitions and scroll-triggered counters cannot be observed in that
  environment. Open `npm run dev` in a normal browser to check those.
