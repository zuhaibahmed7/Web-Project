import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import ToolsFallback from './ToolsFallback';
import { useCanRender3D } from '../../hooks/useCanRender3D';
import { usePrefersReducedMotion, useIsMobile } from '../../hooks/useMediaQuery';
import { cn } from '../../utils/cn';

// Three.js is only worth ~600kb on devices that can enjoy it, so the scene is
// lazy-loaded and swapped for a CSS fallback on phones / low-power / reduced motion.
const ToolsScene = lazy(() => import('./ToolsScene'));

export default function ToolsMoment({ className, label = 'Interactive 3D tools' }) {
  const capable = useCanRender3D();
  const reduce = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(false);
  const [inView, setInView] = useState(false);
  const hostRef = useRef(null);

  // Pause the render loop when the canvas is scrolled out of sight.
  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const show3D = capable && !isMobile && !dismissed;

  return (
    <div ref={hostRef} className={cn('relative overflow-hidden', className)}>
      {show3D ? (
        <Suspense
          fallback={
            <div className="grid h-full w-full place-items-center">
              <span className="flex items-center gap-2 text-[12px] font-medium tracking-[0.14em] text-content-muted uppercase">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Loading 3D
              </span>
            </div>
          }
        >
          <ToolsScene active={inView} reduced={reduce} />
        </Suspense>
      ) : (
        <ToolsFallback />
      )}

      <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2">
        <span className="hidden rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold tracking-[0.1em] text-content-muted uppercase sm:block">
          move your cursor
        </span>
        {capable && !isMobile && (
          <div
            role="group"
            aria-label="Scene quality"
            className="glass flex items-center gap-0.5 rounded-full p-1"
          >
            {[
              { value: false, label: '3D' },
              { value: true, label: '2D' },
            ].map((opt) => {
              const active = dismissed === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDismissed(opt.value)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] uppercase transition-colors',
                    active
                      ? 'bg-ink-800 text-white dark:bg-white dark:text-ink-800'
                      : 'text-content-muted hover:text-content'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="sr-only">{label}</p>
    </div>
  );
}
