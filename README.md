# Kaarigar — Find. Book. Fixed.

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
*My profile* → *Reset demo data*. This clears `kaarigar.state.v3` and re-seeds every booking,
review, complaint and provider from `/src/data`.

---

## Demo accounts

`/login` has one-tap chips for all three roles, so you can jump between views in seconds.

| Role | Email | Password | What they can do |
| --- | --- | --- | --- |
| Customer | `customer@kaarigar.pk` | `customer123` | Search, book, cancel while Pending, review, complain |
| Service provider | `provider@kaarigar.pk` | `provider123` | Owns **Bilal Electrical Works** — accept/reject, progress jobs, manage services, prices, availability, public profile |
| Admin | `admin@kaarigar.pk` | `admin123` | Users, provider verification, categories, bookings ledger, complaint desk, reports |

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
- Prices are indicative and always in **PKR**; Kaarigar never takes a payment.
- Guests browse freely but cannot book, review, complain or open a dashboard.
- Search & filter by service, provider, area, city, starting price, minimum rating and availability.

---

## Design system

Palette (CSS custom properties in `src/index.css`, exposed as Tailwind tokens):

| Token in `src/index.css` | Value | Use |
| --- | --- | --- |
| `ink-950` | `#02061A` | Dark-mode canvas |
| `ink-800` | `#0B1C46` | Headings, light-mode `--c-content`, dark surfaces (navbar, footer, logo tile) |
| `brand-500` | `#09318D` | Deep blue — primary action, links, active states |
| `brand-400` | `#4A6FD0` | Lighter blue, gradient end, accent on navy |
| `aqua-300` / `aqua-400` | `#FD81CC` / `#FB6CC2` | Bubblegum pink — highlights on dark surfaces |
| `aqua-600` / `aqua-700` | `#D21F8B` / `#A3186B` | The same pink deepened, for text and icons on white |
| `glow-400` / `glow-500` | `#F0479F` / `#D92A80` | Hot magenta — rating stars, review CTAs, "attention" badges |
| `cloud-100` | `#F4F7FD` | Light-mode `--c-canvas`, page background |
| light `--c-content-muted` | `#55679A` | Muted text, held at 5.1:1 on `cloud-100` |

`aqua` and `glow` are legacy token names kept so component classes stay put — they now carry the two
pink ramps rather than teal and orange. Each ramp runs light-to-dark, so the low shades serve the navy
theme and the high shades serve the white one. `grad-brand` (primary buttons, white text) deliberately
stays inside the blue range end to end rather than running into pink, which would drop white label text
below AA; `grad-text` does sweep blue→magenta and carries a `.dark` override for the same reason.

Semantic surfaces (`canvas`, `canvas-2`, `surface`, `surface-2`, `line`, `content`,
`content-soft`, `content-muted`) are declared with `@theme inline` so the same utility classes
resolve to light values on `:root` and dark values under `.dark`.

Booking status colours are semantic rather than decorative and are deliberately untouched by the brand
palette: Pending `#F5B301`, Accepted `#3B82F6`, In Progress `#FF7A1A`,
Completed `#10B981`, Rejected `#EF4444`, Cancelled `#94A3B8`.

Photography: `public/images/pro-at-work.jpg` and `public/images/pro-at-board.jpg` — electricians on
the job, CC0 from StockSnap, so no attribution is required. `.hero-scene` lays a photograph under a
colour scrim: the image is duotoned by blending its luminosity over a flat brand blue, then faded out
behind the column of copy with a mask so text never fights it. Used on the landing hero, and with the
`--ink` variant (which shades with ink rather than the page canvas) on the sign-in story panel and the
provider pitch card. Override `--hero-photo` on a `.hero-photo` element to swap in a different image.

Listing photography is per category: `public/images/trades/<category-slug>.jpg`, read through the
generated manifest in `src/assets/photos/index.js`. A slug is listed only while its file exists, so a
card whose category has no photo falls back to that category's own accent gradient rather than
rendering a broken image. Every file was opened and looked at before it was kept — a licence filter
cannot tell an archival survey scan or a watermarked advertisement from a photograph of someone doing
the job. All are public domain or CC0 except two, which are CC BY and credited in the footer as well
as here: "Sink repair by female plumber" by [TWP Inc.](https://www.flickr.com/photos/163882903@N04/43619960520)
and "Carpet Deep Clean" by [flossyflotsam](https://www.flickr.com/photos/8260474@N07/5729073512), both
on Flickr.

Typography: **Sora** for display/headings, **Inter** for body, on a single tight scale.
Light mode is the default; the toggle in the navbar persists to `kaarigar.theme`.

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

State keys: `kaarigar.state.v3` (everything) and `kaarigar.theme`. Bump `STATE_VERSION` in
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
- Verified visually: headless Chrome screenshots of the landing, browse and sign-in screens in
  light and dark at 1280, plus same-origin 375/768 iframes, and every route was measured for
  horizontal overflow at 375 (none). The in-app browser reports a 0×0 hidden viewport, so
  `requestAnimationFrame`-driven checks — screenshots, scroll reveals, animated counters — have to
  go through headless Chrome; open `npm run dev` for a hands-on pass.
