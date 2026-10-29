import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../../store/StoreContext';
import { navFor } from '../../utils/nav';
import { unreadCount } from '../../utils/selectors';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

const ROLE_HEADLINE = {
  customer: { title: 'My account', tone: 'brand' },
  provider: { title: 'Business hub', tone: 'aqua' },
  admin: { title: 'Control room', tone: 'amber' },
};

function RailLink({ item, badge, onNavigate }) {
  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} className="group relative block">
      {({ isActive }) => (
        <span
          className={cn(
            'relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-semibold transition-[background-color,color] duration-300',
            isActive ? 'text-content' : 'text-content-muted hover:bg-canvas-2 hover:text-content'
          )}
        >
          {isActive && (
            <motion.span
              layoutId="rail-active"
              className="absolute inset-0 rounded-sm bg-brand-500/10 ring-1 ring-brand-500/20"
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            />
          )}
          <item.icon
            className={cn('relative h-4 w-4 shrink-0 transition-colors', isActive && 'text-brand-500')}
            aria-hidden="true"
          />
          <span className="relative truncate">{item.label}</span>
          {badge > 0 && (
            <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
      )}
    </NavLink>
  );
}

export function DashboardShell({ children }) {
  const { currentUser, state } = useStore();
  const items = navFor(currentUser?.role ?? 'guest');
  const headline = ROLE_HEADLINE[currentUser?.role] ?? ROLE_HEADLINE.customer;
  const unread = currentUser ? unreadCount(state, currentUser.id) : 0;

  const badgeFor = (to) => (to === '/notifications' ? unread : 0);

  return (
    <div className="mx-auto grid max-w-[88rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_1fr] lg:gap-8 lg:px-8 lg:py-8">
      {/* Desktop rail */}
      <aside className="hidden lg:block">
        <div className="glass sticky top-24 overflow-hidden rounded-xl p-3">
          <div className="flex items-center gap-3 rounded-sm bg-canvas-2 px-3 py-3">
            <Avatar name={currentUser?.name ?? 'Guest'} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{currentUser?.name}</p>
              <Badge tone={headline.tone} size="sm" className="mt-0.5">
                {headline.title}
              </Badge>
            </div>
          </div>

          <nav aria-label="Dashboard" className="mt-3 flex flex-col gap-0.5">
            {items.map((item) => (
              <RailLink key={item.to} item={item} badge={badgeFor(item.to)} />
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile / tablet: one scrollable pill bar pinned under the top bar. */}
      <nav
        aria-label="Dashboard"
        className="no-bar -mx-4 sticky top-16 z-100 overflow-x-auto px-4 py-2 sm:top-18 sm:-mx-6 sm:px-6 lg:hidden"
      >
        <div className="flex w-max gap-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-300',
                  isActive
                    ? 'grad-brand border-transparent text-white'
                    : 'border-line bg-surface-2 text-content-muted'
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
              {badgeFor(item.to) > 0 && item.to === '/notifications' && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-rejected px-1 text-[9px] font-bold text-white">
                  {badgeFor(item.to)}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="min-w-0 pt-0 lg:pt-0">{children}</main>
    </div>
  );
}
