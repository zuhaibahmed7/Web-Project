import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';
import { formatPKR } from '../../utils/format';
import { categoryArt } from '../../assets/icons/index.js';
import { CategoryIcon } from '../ui/CategoryIcon';

// Category entry tile: one bold gradient panel per service family.
export function CategoryTile({ category, count, href, dense = false }) {
  const { t } = useI18n();
  const [from, to] = category.accent ?? ['#09318D', '#4A6FD0'];
  const art = categoryArt(category.slug);
  return (
    <Link
      to={href ?? `/browse?category=${category.slug}`}
      className="group glass grad-frame relative flex h-full flex-col overflow-hidden rounded-xl p-5 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.13] transition-opacity duration-500 group-hover:opacity-[0.22]"
        style={{ backgroundImage: `linear-gradient(140deg, ${from}, ${to})` }}
      />
      <span className="grad-ring" aria-hidden="true" />

      {art ? (
        <span
          aria-hidden="true"
          className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-line shadow-hair transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105"
        >
          <img src={art} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="relative grid h-16 w-16 place-items-center rounded-sm text-white transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
          style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <CategoryIcon icon={category.icon} className="h-7 w-7" />
        </span>
      )}

      <h3 className="relative mt-4 font-display text-[17px] font-bold tracking-[-0.02em]">
        {t(`category.${category.id}`, null, category.name)}
      </h3>
      {!dense && <p className="relative mt-1 text-[13px] leading-snug text-content-muted">{category.tagline}</p>}

      <div className="relative mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-[13px] font-semibold text-content-soft">
          {t('common.from')} <span className="text-content">{formatPKR(category.from)}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] text-content-muted">
          {count > 0 ? t(count === 1 ? 'tile.proOne' : 'tile.proN', { count }) : t('tile.noPros')}
          <ArrowUpRight className="h-3.5 w-3.5 text-brand-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
