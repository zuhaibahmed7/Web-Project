import { ArrowRight, Compass, House, LogIn, Search, Users, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { DASHBOARD_PATH } from '../utils/nav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Reveal } from '../components/ui/Reveal';

// The four destinations a lost visitor actually needs, minus the one that would
// just send them back here.
const ROUTES = [
  { to: '/', label: 'Home', blurb: 'Categories, top-rated pros and the story so far', icon: House },
  { to: '/browse', label: 'Browse services', blurb: 'Search every verified provider by city and need', icon: Search },
  { to: '/providers', label: 'All providers', blurb: 'The full approved directory, filterable', icon: Users },
  { to: '/how-it-works', label: 'How it works', blurb: 'Statuses, rules and the honest FAQ', icon: Compass },
];

export default function NotFound() {
  const { currentUser } = useStore();

  // A signed-in visitor gets their own dashboard instead of a login prompt.
  const primary = currentUser
    ? { to: DASHBOARD_PATH[currentUser.role], label: 'Go to my dashboard', icon: ArrowRight }
    : { to: '/login', label: 'Log in to your account', icon: LogIn };

  const links = ROUTES.filter((r) => r.to !== primary.to);

  return (
    <div className="noise relative overflow-hidden">
      {/* Cold-start glow so the page still feels designed at 375px with no images. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_-10%,rgb(108_92_231_/_0.18),transparent_62%),radial-gradient(50%_40%_at_85%_100%,rgb(0_212_200_/_0.14),transparent)]"
      />

      <div className="relative mx-auto max-w-[84rem] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0">
            <Badge tone="glass" size="sm" icon={Wrench}>
              Error 404 · nothing here to fix
            </Badge>

            {/* Display type: the digits are built from the wrench motif itself. */}
            <Reveal>
              <p className="mt-6 flex items-end gap-3 font-display leading-[0.78] font-extrabold tracking-[-0.06em]">
                <span aria-hidden="true" className="text-[86px] sm:text-[128px] lg:text-[150px]">4</span>
                <span
                  aria-hidden="true"
                  className="grid h-[74px] w-[74px] shrink-0 -translate-y-1 place-items-center rounded-[22px] bg-ink-800 text-white animate-float sm:h-[108px] sm:w-[108px] sm:rounded-[30px]"
                >
                  <Wrench className="h-9 w-9 rotate-[-18deg] sm:h-14 sm:w-14" strokeWidth={1.6} />
                </span>
                <span aria-hidden="true" className="text-[86px] sm:text-[128px] lg:text-[150px]">4</span>
                <span className="sr-only">404 — page not found</span>
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-7 max-w-xl font-display text-[26px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[34px]">
                This page isn’t part of FixNow
              </h1>
              <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-content-soft text-pretty">
                The address you followed does not exist in this prototype — it may be an old bookmark, a typo, or a
                link to a screen the app never shipped. Nothing is broken on your side: your account, bookings and
                saved data are untouched.
              </p>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button to={primary.to} size="lg" icon={primary.icon}>
                  {primary.label}
                </Button>
                <Button to="/browse" variant="secondary" size="lg" icon={Search}>
                  Find a service
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Where to go instead — a working exit list, not a bare sentence. */}
          <Reveal delay={0.1} y={24}>
            <Card padding="none" className="overflow-hidden">
              <div className="dot-grid border-b border-line px-5 py-4">
                <p className="font-display text-[11px] font-bold tracking-[0.18em] text-content-muted uppercase">
                  Popular exits
                </p>
              </div>
              <ul className="divide-y divide-line">
                {links.map((route) => (
                  <li key={route.to}>
                    <Link
                      to={route.to}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas-2"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-brand-500/12 text-brand-600 transition-transform duration-300 group-hover:-translate-y-0.5 dark:text-brand-300">
                        <route.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[15px] font-bold">{route.label}</span>
                        <span className="block text-[12.5px] leading-snug text-content-muted">{route.blurb}</span>
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-content-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand-500"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line bg-canvas-2/60 px-5 py-4 text-[12.5px] leading-relaxed text-content-muted">
                FixNow is a frontend prototype: all state lives in this browser’s localStorage and there is no server
                to look up an old URL on (DR-09). If you got here from a link someone shared, ask them for the current
                address.
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
