// Language state, held outside React on purpose — the same shape as useTheme.
//
// Every switcher on the page (navbar, footer, mobile menu) subscribes to one
// store, so they can never disagree, and no provider has to wrap the route tree:
// any component can call useI18n(). The active code also drives <html lang> and
// <html dir>, which is what makes text alignment and CSS logical properties flip.

import { useSyncExternalStore } from 'react';
import { DICTIONARIES, LANGUAGES } from './strings';
import { readLang, writeLang } from '../utils/storage';

const SUPPORTED = new Set(LANGUAGES.map((l) => l.code));
let listeners = [];
let current = readInitial();

function readInitial() {
  // The inline script in index.html has already put the saved language on <html>.
  if (typeof document !== 'undefined' && SUPPORTED.has(document.documentElement.lang)) {
    return document.documentElement.lang;
  }
  const saved = readLang();
  return SUPPORTED.has(saved) ? saved : 'en';
}

function meta(code) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

function apply(code) {
  const el = document.documentElement;
  el.lang = code;
  el.dir = meta(code).dir;
  writeLang(code);
}

function set(next) {
  if (!SUPPORTED.has(next) || next === current) return;
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

// {name} placeholders; an unknown placeholder is left untouched rather than
// blanked, so a mistyped key shows up in the UI instead of silently vanishing.
function fill(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] === undefined || vars[key] === null ? match : String(vars[key])
  );
}

export function useI18n() {
  const lang = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'en'
  );

  // t('home.ctaBody') / t('nav.myBookings', null, 'My bookings')
  // The third argument is the English string to use when a key has not been
  // translated yet — it keeps un-translated screens (dashboards, admin) intact.
  const t = (key, vars, fallback) =>
    fill(DICTIONARIES[lang][key] ?? DICTIONARIES.en[key] ?? fallback ?? key, vars);

  return {
    lang,
    dir: meta(lang).dir,
    isRtl: meta(lang).dir === 'rtl',
    languages: LANGUAGES,
    setLang: set,
    t,
  };
}
