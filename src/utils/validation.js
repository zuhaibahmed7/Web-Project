// Client-side form validation helpers (FR-UM-06, FR-BM-07, SC-16).
// Every rule returns a human sentence that says how to fix the problem (NFR-27).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
export const PHONE_RE = /^(\+92|0)?3\d{2}[-\s]?\d{7}$/;

export function required(value, label = 'This field') {
  if (value === undefined || value === null) return `${label} is required.`;
  if (typeof value === 'string' && value.trim() === '') return `${label} is required.`;
  return '';
}

export function validEmail(value) {
  if (!value) return 'Email is required.';
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email, e.g. name@example.com.';
  return '';
}

export function validPhone(value) {
  if (!value) return '';
  if (!PHONE_RE.test(value.trim())) return 'Enter a Pakistani mobile number, e.g. 03001234567.';
  return '';
}

export function validPassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

export function minLength(value, n, label = 'This field') {
  if (!value) return '';
  if (value.trim().length < n) return `${label} must be at least ${n} characters.`;
  return '';
}

// BRL-09 / SC-06: indicative prices must be non-negative numbers.
export function validPrice(value, label = 'Price') {
  if (value === '' || value === undefined || value === null) return `${label} is required.`;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (n < 0) return `${label} cannot be negative.`;
  if (n > 5_000_000) return `${label} looks too large — check the value.`;
  return '';
}

export function validRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Select a star rating first.';
  if (n < 1 || n > 5) return 'Rating must be between 1 and 5 stars.';
  return '';
}

// SC-04 / SC-05: block missing, malformed and past booking dates.
export function validBookingDate(value, todayISO) {
  if (!value) return 'Choose a preferred date.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Date must be in YYYY-MM-DD format.';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'That date is not valid.';
  if (value < todayISO) return 'Pick today or a future date — past dates cannot be booked.';
  return '';
}

export function validTime(value) {
  if (!value) return 'Choose a preferred time.';
  if (!/^\d{2}:\d{2}$/.test(value)) return 'Time must be in HH:MM format.';
  return '';
}

// Runs a { field: rule } map and returns the first error per field.
export function runValidation(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, rule]) => {
    const message = rule(values[field], values);
    if (message) errors[field] = message;
  });
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
