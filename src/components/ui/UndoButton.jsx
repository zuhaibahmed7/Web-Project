import { useEffect, useRef, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Button } from './Button';
import { cn } from '../../utils/cn';

// Two-step destructive action with a countdown instead of a modal.
//
// The first click arms it and hands the user a visible window to change their
// mind; only when the countdown runs out does onConfirm fire. That keeps the
// "delete" decision reversible without asking for a confirmation dialog, which
// people dismiss on reflex.
export function UndoButton({
  children,
  onConfirm,
  seconds = 5,
  icon,
  pendingLabel = 'Deleting in',
  className,
}) {
  const [armed, setArmed] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const reduce = useReducedMotion();

  // Latest callback without restarting the countdown when the parent re-renders.
  const fire = useRef(onConfirm);
  useEffect(() => {
    fire.current = onConfirm;
  });

  // Undoing swaps the control back to a button that did not exist a moment ago,
  // so focus has to be handed back explicitly instead of dropping to <body>.
  const refocus = useRef(false);

  useEffect(() => {
    if (!armed) return;
    const endsAt = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const left = endsAt - Date.now();
      if (left > 0) {
        setRemaining(Math.ceil(left / 1000));
        return;
      }
      clearInterval(id);
      setArmed(false);
      setRemaining(0);
      fire.current?.();
    }, 250);
    return () => clearInterval(id);
  }, [armed, seconds]);

  const disarm = () => {
    refocus.current = true;
    setArmed(false);
  };

  return (
    <>
      {armed ? (
        <div
          role="group"
          aria-label="Deletion scheduled"
          onKeyDown={(event) => {
            if (event.key === 'Escape') disarm();
          }}
          className={cn(
            'flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-sm border border-rejected/40 bg-rejected/8 py-1.5 ps-4 pe-1.5',
            className
          )}
        >
          <span
            aria-hidden="true"
            className="relative h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-rejected/20"
          >
            <span
              className={cn(
                'absolute inset-y-0 start-0 rounded-full bg-rejected',
                !reduce && 'transition-[width] duration-300 ease-linear'
              )}
              style={{ width: `${(remaining / seconds) * 100}%` }}
            />
          </span>

          <span
            aria-hidden="true"
            className="text-[13px] font-bold whitespace-nowrap text-rejected tabular-nums"
          >
            {pendingLabel} {remaining}s
          </span>

          <Button size="sm" variant="outline" icon={Undo2} onClick={disarm} autoFocus>
            Undo
          </Button>
        </div>
      ) : (
        <Button
          variant="danger"
          icon={icon}
          className={className}
          autoFocus={refocus.current}
          onClick={() => {
            setRemaining(seconds);
            setArmed(true);
          }}
        >
          {children}
        </Button>
      )}

      {/* Mounted in both states so the text change is actually announced. */}
      <span role="status" className="sr-only">
        {armed ? `Deleting in ${seconds} seconds. Press Undo to cancel.` : ''}
      </span>
    </>
  );
}
