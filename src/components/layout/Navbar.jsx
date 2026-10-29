import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Menu, X, LogIn, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { navFor } from '../../utils/nav';
import { cn } from '../../utils/cn';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { AccountMenu } from './AccountMenu';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

// Desktop nav: pills with one shared highlight that slides between items.
function NavItems({ items, onNavigate }) {
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-300',
              isActive ? 'text-content' : 'text-content-muted hover:text-content'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-brand-500/10 ring-1 ring-brand-500/25"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Navbar() {
  const { currentUser, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setCompact(y > 12));
  useEffect(() => setMenuOpen(false), [pathname]);

  // While the overlay is up the page behind it must not scroll.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const items = navFor(currentUser?.role ?? 'guest');

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-140 w-full transition-[background-color,box-shadow] duration-300',
          compact ? 'glass shadow-soft' : 'bg-transparent border-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-3 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
          <span className="shrink-0">
            <Logo />
          </span>

          <div className="mx-auto">
            <NavItems items={items} />
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link
              to="/browse"
              aria-label="Search for a service"
              className="hidden h-10 w-10 place-items-center rounded-sm border border-line bg-surface-2 text-content-soft transition-colors hover:border-brand-500/40 hover:text-content sm:grid"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>

            <ThemeToggle />
            <NotificationBell />

            {currentUser ? (
              <AccountMenu />
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Log in
                </Button>
                <Button to="/browse" size="sm" icon={ArrowRight} className="hidden md:inline-flex">
                  Book a service
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-line bg-surface-2 text-content lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu — full height so the targets are thumb-sized. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-200 lg:hidden"
          >
            <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="relative flex h-full flex-col overflow-y-auto bg-canvas px-5 pt-4 pb-8"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="grid h-10 w-10 place-items-center rounded-sm border border-line text-content"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              {currentUser && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-4">
                  <Avatar name={currentUser.name} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-bold">{currentUser.name}</p>
                    <p className="truncate text-xs text-content-muted">{currentUser.email}</p>
                  </div>
                  <Badge tone="brand" className="ml-auto">
                    {currentUser.role}
                  </Badge>
                </div>
              )}

              <nav aria-label="Mobile" className="mt-6 flex flex-col">
                {items.map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.045, duration: 0.3 }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between border-b border-line py-4 font-display text-[22px] font-bold tracking-tight transition-colors',
                          isActive ? 'grad-text' : 'text-content'
                        )
                      }
                    >
                      {item.label}
                      <item.icon className="h-5 w-5 opacity-60" aria-hidden="true" />
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto grid gap-2.5 pt-8">
                {currentUser ? (
                  <Button
                    variant="outline"
                    icon={LogIn}
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate('/');
                      toast.success('Signed out. Browse as a guest.');
                    }}
                  >
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button to="/login" icon={LogIn} onClick={() => setMenuOpen(false)}>
                      Log in
                    </Button>
                    <Button to="/register" variant="secondary" onClick={() => setMenuOpen(false)}>
                      Create an account
                    </Button>
                  </>
                )}
                <div className="flex items-center justify-between rounded-sm border border-line bg-surface-2 px-3 py-2">
                  <span className="text-[13px] font-semibold text-content-soft">Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
