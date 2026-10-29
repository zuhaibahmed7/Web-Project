import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';

// Animated counter used by the home page stats band and the admin tiles.
// Jumps straight to the final value when the user prefers reduced motion.
export function useCountUp(target = 0, { duration = 1.5, decimals = 0 } = {}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px 0px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return undefined;
    }

    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, target, duration]);

  const display = value.toLocaleString('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return { ref, value, display };
}
