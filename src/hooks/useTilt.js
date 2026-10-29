import { useCallback, useRef } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';

// 3D tilt + cursor-follow highlight for interactive cards.
// Returns motion values (so nothing re-renders per mouse move) plus the
// event handlers a card needs to wire them up.
export function useTilt({ max = 7, stiffness = 220, damping = 20 } = {}) {
  const ref = useRef(null);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const springConfig = { stiffness, damping, mass: 0.5 };
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [max, -max]), springConfig);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-max, max]), springConfig);
  const scale = useSpring(hover, { stiffness: 260, damping: 24 });

  // Position of the soft light that follows the cursor inside the card.
  const glowX = useTransform(pointerX, (v) => `${v * 100}%`);
  const glowY = useTransform(pointerY, (v) => `${v * 100}%`);
  const glowOpacity = useSpring(useTransform(hover, [0, 1], [0, 1]), springConfig);
  const cardScale = useTransform(scale, [0, 1], [1, 1.015]);

  const onMouseMove = useCallback(
    (event) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pointerX.set((event.clientX - rect.left) / rect.width);
      pointerY.set((event.clientY - rect.top) / rect.height);
    },
    [pointerX, pointerY]
  );

  const onMouseEnter = useCallback(() => hover.set(1), [hover]);
  const onMouseLeave = useCallback(() => {
    hover.set(0);
    pointerX.set(0.5);
    pointerY.set(0.5);
  }, [hover, pointerX, pointerY]);

  return {
    ref,
    style: { rotateX, rotateY, scale: cardScale },
    glow: { x: glowX, y: glowY, opacity: glowOpacity },
    handlers: { onMouseMove, onMouseEnter, onMouseLeave },
  };
}
