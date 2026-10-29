// Small unique-id helper. `prefix` keeps ids readable in the UI (e.g. BK-8F3K2).
export function uid(prefix = 'ID') {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${time}${rand}`;
}
