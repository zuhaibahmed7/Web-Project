import { motion, useMotionTemplate } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useTilt } from '../../hooks/useTilt';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

// Plain glass surface — the base of every card in the app.
export function Card({ children, className, padding = 'md', as: Tag = 'div', ...rest }) {
  const pads = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };
  return (
    <Tag className={cn('glass relative rounded-lg', pads[padding], className)} {...rest}>
      {children}
    </Tag>
  );
}

// Interactive card: 3D tilt, cursor-follow glow and a gradient hairline on hover.
export function TiltCard({ children, className, contentClassName, tilt = 7, glow = true, as = 'div', ...rest }) {
  const reduce = usePrefersReducedMotion();
  const { ref, style, glow: g, handlers } = useTilt({ max: reduce ? 0 : tilt });
  const glowBackground = useMotionTemplate`radial-gradient(340px circle at ${g.x} ${g.y}, rgb(108 92 231 / 0.16), transparent 65%)`;
  const Tag = motion[as] ?? motion.div;

  return (
    <Tag
      ref={ref}
      style={{ ...style, transformPerspective: 900 }}
      className={cn(
        'glass grad-frame group relative overflow-hidden rounded-lg will-change-transform',
        'transition-shadow duration-500 hover:shadow-lift',
        className
      )}
      {...(!reduce ? handlers : {})}
      {...rest}
    >
      <span className="grad-ring" aria-hidden="true" />
      {glow && !reduce && (
        <motion.span
          aria-hidden="true"
          style={{ background: glowBackground, opacity: g.opacity }}
          className="pointer-events-none absolute inset-0 z-0"
        />
      )}
      <div className={cn('relative z-10', contentClassName)}>{children}</div>
    </Tag>
  );
}

// Section wrapper with a soft top-lit gradient — used to separate page bands.
export function Band({ children, className, tone = 'default', id }) {
  const tones = {
    default: 'bg-transparent',
    cloud: 'bg-canvas-2/70',
    ink: 'bg-ink-800 text-cloud-100',
    grad: 'bg-[radial-gradient(120%_90%_at_50%_-10%,rgb(108_92_231_/_0.16),transparent_60%)]',
  };
  return (
    <section id={id} className={cn('relative w-full', tones[tone], className)}>
      {children}
    </section>
  );
}
