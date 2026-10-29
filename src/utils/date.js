// Date helpers. Booking dates are plain "YYYY-MM-DD" strings so they are
// timezone-safe and work directly with <input type="date">.
export function toISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

// Positive = future, negative = past. Used by the seed data so bookings always
// look current no matter when the demo is run.
export function isoFromToday(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
}

export function isoFromNow(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function isPastDate(iso) {
  if (!iso) return false;
  return iso < todayISO();
}

// Next N days as { iso, weekday, day, month, isToday } — used by the booking calendar strip.
export function nextDays(count = 14, startOffset = 0) {
  const out = [];
  for (let i = startOffset; i < startOffset + count; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      iso: toISODate(d),
      weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      isToday: i === 0,
      dow: d.getDay(),
    });
  }
  return out;
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
