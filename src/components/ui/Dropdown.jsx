import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDismiss } from '../../hooks/useDismiss';

const PANEL_MAX_HEIGHT = 16; // rem
const PANEL_GAP = 6; // px between the trigger and the panel
// The panel is portalled to document.body, so it must clear every layer the page
// uses on its own: navbar 140, modal 100, mobile filter sheet and toast 200.
const PANEL_Z = 220;

// Fixed-position geometry for the portalled panel, measured from the trigger.
function panelStyle(rect, viewport) {
  const below = viewport.height - rect.bottom - PANEL_GAP;
  const above = rect.top - PANEL_GAP;
  const flip = below < PANEL_MAX_HEIGHT * 16 * 0.6 && above > below;
  const maxH = Math.max(96, Math.min(PANEL_MAX_HEIGHT * 16, flip ? above : below));
  return {
    flip,
    css: {
      position: 'fixed',
      left: Math.max(PANEL_GAP, Math.min(rect.left, viewport.width - rect.width - PANEL_GAP)),
      top: flip ? undefined : rect.bottom + PANEL_GAP,
      bottom: flip ? viewport.height - rect.top + PANEL_GAP : undefined,
      width: rect.width,
      maxHeight: maxH,
      zIndex: PANEL_Z,
    },
  };
}

// The trigger skin. `bare` supplies nothing, so ui/Input.jsx can pass its own
// FIELD_BASE and keep the control identical to the inputs beside it.
const VARIANTS = {
  field: 'h-11 rounded-sm border border-line bg-surface px-3.5 text-[15px] text-content hover:border-line-strong',
  inline: 'h-11 rounded-sm border border-transparent bg-transparent px-3 text-[14px] text-content hover:bg-canvas-2',
  bare: '',
};

// The dropdown used by every select-style control in the app. A native <select>
// opens the operating system's own popup, which ignores the site's type, colours
// and dark mode, so the list is rendered here instead.
//
// `onChange` is handed a { target: { value } } object so the same field setters
// work for Input, Textarea and Select.
export function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  required = false,
  invalid = false,
  describedBy,
  id,
  ariaLabel,
  variant = 'field',
  triggerClassName,
}) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [panel, setPanel] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const typeahead = useRef({ word: '', at: 0 });
  const rootRef = useDismiss(open, () => setOpen(false), [listRef]);

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
  const selected = selectedIndex === -1 ? null : options[selectedIndex];
  const SelectedIcon = selected?.icon;

  const measure = () => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanel(panelStyle(rect, { width: window.innerWidth, height: window.innerHeight }));
  };

  useEffect(() => {
    if (open) {
      listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active]);

  // Capture phase: the panel must follow its trigger even when an inner
  // container scrolls, not just the window.
  useEffect(() => {
    if (!open) return undefined;
    const onMove = () => measure();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const openList = (fromEnd = false) => {
    if (disabled || !options.length) return;
    measure();
    setActive(fromEnd ? options.length - 1 : Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const commit = (index) => {
    const opt = options[index];
    if (!opt) return;
    onChange?.({ target: { value: opt.value, id } });
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Jump to the next option starting with the typed letters, wrapping around.
  const search = (char) => {
    const now = Date.now();
    const state = typeahead.current;
    state.word = now - state.at > 600 ? char : state.word + char;
    state.at = now;
    const word = state.word.toLowerCase();
    for (let step = 1; step <= options.length; step += 1) {
      const i = (active + step) % options.length;
      if (String(options[i].label).toLowerCase().startsWith(word)) {
        setActive(i);
        return;
      }
    }
  };

  const onKeyDown = (event) => {
    const { key } = event;
    if (key === 'Tab') return setOpen(false);
    if (key === 'Escape') {
      if (open) event.stopPropagation();
      setOpen(false);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault();
      if (!open) return openList(key === 'End' || key === 'ArrowUp');
      if (key === 'Enter' || key === ' ') return commit(active);
      if (key === 'ArrowDown') setActive((i) => Math.min(i + 1, options.length - 1));
      if (key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0));
      if (key === 'Home') setActive(0);
      if (key === 'End') setActive(options.length - 1);
      return;
    }
    if (open && key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      search(key);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'flex w-full items-center gap-2 outline-none',
          'transition-[border-color,background-color,box-shadow] duration-200',
          'focus-visible:border-brand-500 focus-visible:shadow-[0_0_0_3px_rgb(9_49_141_/_0.18)]',
          'disabled:cursor-not-allowed disabled:opacity-55',
          VARIANTS[variant],
          triggerClassName
        )}
      >
        {SelectedIcon && <SelectedIcon className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-content-muted')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-content-muted transition-transform duration-300', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open &&
            panel && (
              <motion.ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={ariaLabel}
                initial={{ opacity: 0, y: panel.flip ? 4 : -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: panel.flip ? 4 : -4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={panel.css}
                className={cn(
                  'glass overflow-y-auto rounded-lg p-1.5 shadow-lift',
                  panel.flip ? 'origin-bottom' : 'origin-top'
                )}
              >
                {!options.length && <li className="px-2.5 py-2 text-[14px] text-content-muted">No options</li>}
                {options.map((opt, i) => {
                  const isSelected = i === selectedIndex;
                  const isActive = i === active;
                  const Icon = opt.icon;
                  return (
                    <li
                      key={opt.value}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive || undefined}
                      title={opt.description ? `${opt.label} — ${opt.description}` : opt.label}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => commit(i)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-[14px] transition-colors duration-150',
                        isActive ? 'bg-brand-500/12 text-content' : 'text-content-soft'
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />}
                      <div className="min-w-0 flex-1">
                        <span className={cn('block truncate', isSelected && 'font-semibold')}>{opt.label}</span>
                        {opt.description && (
                          <span className="block truncate text-[12px] text-content-muted">{opt.description}</span>
                        )}
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />}
                    </li>
                  );
                })}
              </motion.ul>
            )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
