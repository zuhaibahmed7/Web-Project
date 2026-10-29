import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

// Screens rise and fade in as the route changes; reduced-motion users get an
// instant swap. Scroll is reset here so every page opens at its top, except when
// the URL carries an anchor (e.g. /how-it-works#steps).
export function PageTransition({ children, resetScroll = true }) {
  const { pathname, hash } = useLocation();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!resetScroll || hash) return;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }, [pathname, hash, reduced, resetScroll]);

  return (
    <motion.div
      key={pathname}
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
