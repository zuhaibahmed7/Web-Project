import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useRef } from 'react';

const EASE = [0.16, 1, 0.3, 1];
const EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Fade + rise into view. Used once per section so scroll motion stays calm.
export function Reveal({ children, delay = 0, y = 20, x = 0, className, as = 'div', blur = true }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] ?? motion.div;
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, x, filter: blur ? 'blur(6px)' : 'none' }}
      whileInView={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-70px 0px' }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

// Parent that staggers its Reveal children. Pair with <StaggerItem>.
export function Stagger({ children, className, as = 'div', delay = 0, gap = 0.07 }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] ?? motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView={reduce ? undefined : 'show'}
      viewport={{ once: true, margin: '-60px 0px' }}
      transition={{ staggerChildren: gap, delayChildren: delay }}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className, as = 'div', y = 22 }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] ?? motion.div;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y, filter: 'blur(6px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
      }}
    >
      {children}
    </Tag>
  );
}

// Line-mask reveal for display headings: each line slides up behind a clip.
export function MaskLines({ lines, className, lineClassName, delay = 0 }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <span ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]">
          <span
            className={lineClassName}
            style={
              reduce
                ? undefined
                : {
                    display: 'block',
                    transform: inView ? 'translateY(0)' : 'translateY(105%)',
                    opacity: inView ? 1 : 0,
                    transition: `transform 0.9s ${EASE_CSS} ${delay + i * 0.09}s, opacity 0.6s ease ${delay + i * 0.09}s`,
                  }
            }
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
