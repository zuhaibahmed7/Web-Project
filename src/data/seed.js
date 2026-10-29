// Assembles the starting state for the app from the sample data files.
// Called once on first load, or whenever the demo data is reset.

import { CATEGORIES } from './categories';
import { USERS } from './users';
import { PROVIDERS } from './providers';
import { SEED_BOOKINGS, buildSeedNotifications } from './bookings';
import { buildSeedReviews, CUSTOMER_SEED_REVIEWS } from './reviews';
import { SEED_COMPLAINTS } from './complaints';
import { isoFromToday } from '../utils/date';

export const STATE_VERSION = 3;

export function createInitialState() {
  const reviews = [...buildSeedReviews(PROVIDERS), ...CUSTOMER_SEED_REVIEWS];

  const users = USERS.map((u) => ({ ...u, joinedAt: isoFromToday(-u.joinedDaysAgo) }));

  const providers = PROVIDERS.map((p) => ({
    ...p,
    joinedAt: isoFromToday(-p.joinedDaysAgo),
  }));

  const notifications = buildSeedNotifications(SEED_BOOKINGS, USERS, PROVIDERS);

  // Admin always has something waiting in the verification queue on first load.
  const pendingCount = providers.filter((p) => p.verificationStatus === 'pending').length;
  if (pendingCount > 0) {
    notifications.unshift({
      id: 'nt-admin-1',
      userId: 'u-admin',
      kind: 'verification',
      read: false,
      createdAt: `${isoFromToday(0)}T08:00:00.000Z`,
      title: `${pendingCount} providers awaiting verification`,
      message: 'Review their documents in the Verification screen before they appear publicly.',
    });
  }

  return {
    version: STATE_VERSION,
    session: null,
    categories: CATEGORIES,
    users,
    providers,
    bookings: SEED_BOOKINGS,
    reviews,
    complaints: SEED_COMPLAINTS,
    notifications,
  };
}
