import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { Logo } from './Logo';
import { cn } from '../../utils/cn';

function FooterColumn({ title, children }) {
  return (
    <div>
      <p className="font-display text-[11px] font-bold tracking-[0.16em] text-aqua-400 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-cloud-300/80">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="group inline-flex items-center gap-1 transition-colors duration-300 hover:text-white"
      >
        {children}
        <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
      </Link>
    </li>
  );
}

export function Footer({ className }) {
  return (
    <footer className={cn('relative mt-24 overflow-hidden bg-ink-800 text-white', className)}>
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 -right-24 h-80 w-80 rounded-full bg-brand-500/25 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[84rem] px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo onDark />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-cloud-300/75">
              FixNow connects households across Pakistan with verified plumbers, electricians, AC technicians,
              cleaners, painters, carpenters and mechanics — find, book, fix.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-cloud-300/75">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-aqua-400" /> support@fixnow.pk
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-aqua-400" /> 0800-349-669
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-aqua-400" /> Karachi · Lahore · Islamabad
              </li>
            </ul>
          </div>

          <FooterColumn title="Marketplace">
            {CATEGORIES.slice(0, 5).map((c) => (
              <FooterLink key={c.id} to={`/browse?category=${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
            <FooterLink to="/providers">All providers</FooterLink>
          </FooterColumn>

          <FooterColumn title="For providers">
            <FooterLink to="/register?role=provider">List your business</FooterLink>
            <FooterLink to="/how-it-works">How booking works</FooterLink>
            <FooterLink to="/login">Provider sign in</FooterLink>
          </FooterColumn>

          <FooterColumn title="About">
            <FooterLink to="/how-it-works">Trust & verification</FooterLink>
            <FooterLink to="/app/complaints">Report an issue</FooterLink>
            <FooterLink to="/browse">Start a booking</FooterLink>
          </FooterColumn>
        </div>

        <div
          className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-cloud-300/60 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>© {new Date().getFullYear()} FixNow — a frontend prototype built for a university software project.</p>
          <p>
            Sample data only. Prices are indicative and shown in PKR; no real payments or accounts exist in this
            demo.
          </p>
        </div>
      </div>
    </footer>
  );
}
