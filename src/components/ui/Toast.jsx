import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, TriangleAlert, CircleX, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

let seq = 0;

const TONES = {
  success: { icon: CircleCheck, ring: 'ring-completed/35', bar: 'bg-completed', tint: 'text-completed' },
  error: { icon: CircleX, ring: 'ring-rejected/35', bar: 'bg-rejected', tint: 'text-rejected dark:text-[#ff8a8a]' },
  warning: { icon: TriangleAlert, ring: 'ring-pending/40', bar: 'bg-pending', tint: 'text-[#a27400] dark:text-glow-300' },
  info: { icon: Info, ring: 'ring-brand-500/35', bar: 'bg-brand-500', tint: 'text-brand-600 dark:text-brand-300' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = 'info', title, duration = 3800 } = {}) => {
      seq += 1;
      const id = `toast-${seq}`;
      setToasts((list) => [...list.slice(-3), { id, message, tone, title }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, opts) => push(message, { ...opts, tone: 'success' }),
      error: (message, opts) => push(message, { ...opts, tone: 'error' }),
      warning: (message, opts) => push(message, { ...opts, tone: 'warning' }),
      info: (message, opts) => push(message, { ...opts, tone: 'info' }),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 bottom-3 z-200 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const tone = TONES[t.tone] ?? TONES.info;
            const Icon = tone.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 22, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.96 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'glass pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-md p-3.5 pl-4 ring-1',
                  tone.ring
                )}
              >
                <span className={cn('absolute inset-y-0 left-0 w-[3px]', tone.bar)} aria-hidden="true" />
                <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', tone.tint)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  {t.title && (
                    <p className="font-display text-[13.5px] font-bold tracking-[-0.01em] text-content">{t.title}</p>
                  )}
                  <p className="text-[13px] leading-snug text-content-soft">{t.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-xs text-content-muted transition-colors hover:bg-canvas-2 hover:text-content"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
