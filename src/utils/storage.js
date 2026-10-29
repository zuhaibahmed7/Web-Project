// Thin, defensive wrapper around localStorage. The prototype keeps all app
// state in the browser so changes made by one role are visible to the others
// (DR-09: browser state is neither permanent nor secure — it is not real auth).

const STATE_KEY = 'fixnow.state.v3';
const THEME_KEY = 'fixnow.theme';

export function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('FixNow: could not read saved state, starting fresh.', err);
    return null;
  }
}

export function writeState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (err) {
    // Quota errors or private-mode restrictions should not break the session.
    console.warn('FixNow: state could not be saved to this browser.', err);
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch (err) {
    console.warn('FixNow: could not clear saved state.', err);
  }
}

export function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function writeTheme(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* ignore */
  }
}
