import { useSyncExternalStore } from 'react';
import { readTheme, writeTheme } from '../utils/storage';

// Theme lives outside React so every ThemeToggle on the page stays in sync —
// each component subscribes to the same tiny store instead of holding its own copy.
let listeners = [];
let current = readInitial();

function readInitial() {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  return readTheme() ?? 'light';
}

function apply(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  writeTheme(mode);
}

function set(next) {
  if (next === current) return;
  current = next;
  apply(next);
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'light'
  );

  return {
    theme,
    isDark: theme === 'dark',
    setTheme: set,
    toggleTheme: () => set(current === 'dark' ? 'light' : 'dark'),
  };
}
