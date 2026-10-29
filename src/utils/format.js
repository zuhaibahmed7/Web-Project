// All money in the app is Pakistani Rupees, so every price goes through here.
const pkr = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

export function formatPKR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'PKR —';
  return `PKR ${pkr.format(Math.round(n))}`;
}

// "PKR 1.2k" style compact label for tight spaces like filter chips.
export function formatPKRShort(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1000) return `PKR ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `PKR ${n}`;
}

// Some fields store a plain date ("2026-11-02"), others a full timestamp
// ("2026-10-05T10:20:00.000Z"). Timestamps are truncated so both display as a date.
function parseDate(iso) {
  const text = String(iso);
  const datePart = text.includes('T') ? text.slice(0, 10) : text;
  return new Date(`${datePart}T00:00:00`);
}

export function formatDate(iso, opts = {}) {
  if (!iso) return 'Date not set';
  const d = parseDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
}

export function formatDayShort(iso) {
  if (!iso) return '';
  const d = parseDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Booking slots are stored as "09:00" (24h) but shown in 12h for a Pakistani audience.
export function formatTime(t) {
  if (!t) return '';
  const [hRaw, m] = t.split(':');
  const h = Number(hRaw);
  if (!Number.isFinite(h)) return t;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m || '00'} ${suffix}`;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// Every provider avatar is a deterministic gradient so colours are stable per id.
export function gradientFor(seed = '') {
  const pairs = [
    ['#6C5CE7', '#00D4C8'],
    ['#FF7A1A', '#FFB020'],
    ['#3B82F6', '#6C5CE7'],
    ['#00B8AD', '#3B82F6'],
    ['#EF4444', '#FFB020'],
    ['#6C5CE7', '#FF7A1A'],
    ['#10B981', '#00D4C8'],
    ['#0F1535', '#6C5CE7'],
  ];
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return pairs[sum % pairs.length];
}
