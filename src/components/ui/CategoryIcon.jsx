import { Droplets, Zap, Snowflake, Sparkles, PaintRoller, Hammer, Car, Wrench } from 'lucide-react';

// Maps the `icon` string stored on each category to a Lucide component.
const ICONS = {
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
