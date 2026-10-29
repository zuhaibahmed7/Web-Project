// Tiny class joiner: keeps JSX readable and drops falsy values.
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
