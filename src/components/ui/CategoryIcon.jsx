import { Droplets, Zap, Snowflake, Sparkles, PaintRoller, Hammer, Car, Wrench } from 'lucide-react';
import { categoryArt } from '../../assets/icons/index.js';

// Maps the `icon` string stored on each category to a Lucide component.
export const ICONS = {
  droplets: Droplets,
  zap: Zap,
  snowflake: Snowflake,
  sparkles: Sparkles,
  roller: PaintRoller,
  hammer: Hammer,
  car: Car,
  wrench: Wrench,
};

export function CategoryIcon({ icon, categoryId, className, ...rest }) {
  const key = icon ?? ICONS[categoryId] ?? 'wrench';
  const Icon = ICONS[key] ?? Wrench;
  return <Icon className={className} aria-hidden="true" {...rest} />;
}

// Full-colour tile artwork, keyed by category slug. Renders nothing when a
// category has no artwork so the caller can fall back to CategoryIcon.
export function CategoryArt({ slug, className, ...rest }) {
  const src = categoryArt(slug);
  if (!src) return null;
  return <img src={src} alt="" className={className} loading="lazy" decoding="async" {...rest} />;
}
