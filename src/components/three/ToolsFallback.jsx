import { Wrench, Hammer, Zap, Snowflake, Droplets, Sparkles } from 'lucide-react';

// Lightweight, dependency-free stand-in for the WebGL scene: used on phones,
// low-power devices, and when the visitor prefers reduced motion.
const ITEMS = [
  { icon: Wrench, className: 'left-[8%] top-[16%] text-brand-500', delay: '0s', size: 'h-8 w-8' },
  { icon: Hammer, className: 'right-[12%] top-[10%] text-glow-400', delay: '1.1s', size: 'h-7 w-7' },
  { icon: Zap, className: 'right-[6%] top-[46%] text-glow-300', delay: '2.2s', size: 'h-9 w-9' },
  { icon: Snowflake, className: 'left-[4%] top-[58%] text-aqua-400', delay: '0.6s', size: 'h-7 w-7' },
  { icon: Droplets, className: 'left-[34%] bottom-[8%] text-aqua-300', delay: '1.7s', size: 'h-8 w-8' },
  { icon: Sparkles, className: 'right-[28%] bottom-[14%] text-brand-300', delay: '2.7s', size: 'h-6 w-6' },
];

export default function ToolsFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(108_92_231_/_0.35),transparent_65%)] blur-2xl" />
      <div className="absolute right-[18%] bottom-[22%] h-[34%] w-[34%] rounded-full bg-[radial-gradient(circle,rgb(0_212_200_/_0.3),transparent_68%)] blur-2xl" />

      {ITEMS.map(({ icon: Icon, className, delay, size }) => (
        <span
          key={className}
          className={`absolute grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface shadow-soft animate-float ${className}`}
          style={{ animationDelay: delay }}
        >
          <Icon className={size} strokeWidth={1.6} />
        </span>
      ))}

      <div className="absolute inset-x-0 bottom-6 text-center text-[12px] font-medium tracking-[0.14em] text-content-muted uppercase">
        2D mode
      </div>
    </div>
  );
}
