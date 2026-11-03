import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useI18n } from '../../i18n/useI18n';
import { Logo } from './Logo';
import { LanguageToggle } from './LanguageToggle';
import { cn } from '../../utils/cn';

function FooterColumn({ title, children }) {
  return (
    <div>
      <p className="font-display text-[12px] font-bold tracking-[0.16em] text-aqua-400 uppercase">{title}</p>
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
        <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      </Link>
    </li>
  );
}

export function Footer({ className }) {
  const { t } = useI18n();

  return (
    <footer className={cn('relative mt-24 overflow-hidden bg-ink-800 text-white', className)}>
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 end-[-6rem] h-80 w-80 rounded-full bg-brand-500/25 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[84rem] px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo onDark />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-cloud-300/75">{t('footer.blurb')}</p>
            <ul className="mt-6 space-y-2 text-sm text-cloud-300/75">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-aqua-400" /> support@kaarigar.pk
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-aqua-400" /> 0800-349-669
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-aqua-400" /> {t('footer.cities')}
              </li>
            </ul>

            {/* Language lives in the footer as well, so the switcher is reachable
                from the bottom of a long page without scrolling back up. */}
            <div className="mt-6">
              <LanguageToggle
                triggerClassName="text-cloud-100! hover:bg-white/10!"
              />
            </div>
          </div>

          <FooterColumn title={t('footer.marketplace')}>
            {CATEGORIES.slice(0, 5).map((c) => (
              <FooterLink key={c.id} to={`/browse?category=${c.slug}`}>
                {t(`category.${c.id}`, null, c.name)}
              </FooterLink>
            ))}
            <FooterLink to="/providers">{t('footer.allProviders')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('footer.forProviders')}>
            <FooterLink to="/register?role=provider">{t('footer.listBusiness')}</FooterLink>
            <FooterLink to="/how-it-works">{t('footer.howBooking')}</FooterLink>
            <FooterLink to="/login">{t('footer.providerSignIn')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('footer.about')}>
            <FooterLink to="/how-it-works">{t('footer.trust')}</FooterLink>
            <FooterLink to="/app/complaints">{t('footer.reportIssue')}</FooterLink>
            <FooterLink to="/browse">{t('footer.startBooking')}</FooterLink>
          </FooterColumn>
        </div>

        <div
          className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-cloud-300/60 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            {/* CC BY obliges the credit to travel with the image, so it is stated
                here as well as in the README. Author names stay untranslated. */}
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span>{t('footer.photoCredits')}</span>
              <a
                href="https://www.flickr.com/photos/163882903@N04/43619960520"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/25 underline-offset-2 transition-colors duration-300 hover:text-white"
              >
                TWP Inc.
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="https://www.flickr.com/photos/8260474@N07/5729073512"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/25 underline-offset-2 transition-colors duration-300 hover:text-white"
              >
                flossyflotsam
              </a>
              <span className="text-cloud-300/40">CC BY</span>
            </p>
          </div>
          <p>{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
