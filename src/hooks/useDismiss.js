import { useEffect, useRef } from 'react';

// Close a popover when the user clicks outside it or presses Escape.
// The listener is only attached while `open` is true so closed menus cost nothing.
export function useDismiss(open, onClose, extraRefs = []) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (ref.current?.contains(event.target)) return;
      if (extraRefs.some((r) => r?.current?.contains(event.target))) return;
      onClose();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return ref;
}
