// Read-only helpers that shape raw store data for the screens.
// Ratings are always derived from the reviews list, so a new review instantly
// changes the provider's public score.

import { ratingSummary } from '../data/reviews';
import { isActiveBooking } from './booking';
import { isoFromToday } from './date';

export function findProvider(state, id) {
  return state.providers.find((p) => p.id === id) ?? null;
}

export function findCategory(state, id) {
  return state.categories.find((c) => c.id === id) ?? null;
}

export function findUser(state, id) {
  return state.users.find((u) => u.id === id) ?? null;
}

export function findBooking(state, id) {
  return state.bookings.find((b) => b.id === id) ?? null;
}

export function reviewsFor(state, providerId) {
  return state.reviews
    .filter((r) => r.providerId === providerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function hasReviewForBooking(state, bookingId) {
  return state.reviews.some((r) => r.bookingId === bookingId);
}

// A provider enriched with everything cards and profiles need to display.
export function decorateProvider(state, provider) {
  const { average, count, breakdown } = ratingSummary(state.reviews, provider.id);
  const servicePrices = (provider.services ?? []).map((s) => s.price).filter((n) => Number.isFinite(n));
  const bookings = state.bookings.filter((b) => b.providerId === provider.id);

  return {
    ...provider,
    rating: average,
    reviewCount: count,
    ratingBreakdown: breakdown,
    minPrice: servicePrices.length ? Math.min(...servicePrices) : null,
    maxPrice: servicePrices.length ? Math.max(...servicePrices) : null,
    activeBookings: bookings.filter(isActiveBooking).length,
    totalBookings: bookings.length,
    acceptedBookings: bookings.filter((b) => b.status !== 'pending').length,
    completedBookings: bookings.filter((b) => b.status === 'completed').length,
    nextAvailable: nextAvailableISO(provider),
    category: findCategory(state, provider.categoryId),
  };
}

export function decoratedProviders(state) {
  return state.providers.map((p) => decorateProvider(state, p));
}

// Only verified providers appear in public listings (admin queue controls this).
export function publicProviders(state) {
  return decoratedProviders(state).filter((p) => p.verificationStatus === 'verified');
}

export function bookingsByCustomer(state, customerId) {
  return state.bookings
    .filter((b) => b.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function bookingsByProvider(state, providerId) {
  return state.bookings
    .filter((b) => b.providerId === providerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function notificationsByUser(state, userId) {
  return state.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function unreadCount(state, userId) {
  return state.notifications.filter((n) => n.userId === userId && !n.read).length;
}

export function nextAvailableISO(provider) {
  const days = provider.availability?.days ?? [];
  if (!days.length) return null;
  for (let i = 0; i < 14; i += 1) {
    const iso = isoFromToday(i);
    const dow = new Date(`${iso}T00:00:00`).getDay();
    if (days.includes(dow)) return iso;
  }
  return null;
}

// True when the provider has at least one working day in the next 7 days.
export function isAvailableSoon(provider) {
  const iso = nextAvailableISO(provider);
  return Boolean(iso) && iso <= isoFromToday(7);
}

/* ------------------------------------------------------------ admin stats */

export function marketplaceStats(state) {
  const { bookings, providers, users, reviews, complaints } = state;

  const byStatus = bookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    },
    { pending: 0, accepted: 0, in_progress: 0, completed: 0, rejected: 0, cancelled: 0 }
  );

  const byCategory = state.categories.map((c) => {
    const catProviders = providers.filter((p) => p.categoryId === c.id);
    const catBookings = bookings.filter((b) => catProviders.some((p) => p.id === b.providerId));
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      providers: catProviders.length,
      bookings: catBookings.length,
      completed: catBookings.filter((b) => b.status === 'completed').length,
    };
  });

  // Last 14 days of demand, used by the admin area chart.
  const trend = [];
  for (let i = 13; i >= 0; i -= 1) {
    const iso = isoFromToday(-i);
    trend.push({
      day: new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      bookings: bookings.filter((b) => b.createdAt.slice(0, 10) === iso).length,
      completed: bookings.filter((b) => b.createdAt.slice(0, 10) === iso && b.status === 'completed').length,
    });
  }

  const completed = byStatus.completed ?? 0;
  const decided = bookings.filter((b) => b.status !== 'pending').length;

  return {
    totalBookings: bookings.length,
    activeBookings: bookings.filter(isActiveBooking).length,
    byStatus,
    byCategory,
    trend,
    totalProviders: providers.length,
    verifiedProviders: providers.filter((p) => p.verificationStatus === 'verified').length,
    pendingVerification: providers.filter((p) => p.verificationStatus === 'pending').length,
    rejectedVerification: providers.filter((p) => p.verificationStatus === 'rejected').length,
    totalUsers: users.length,
    customers: users.filter((u) => u.role === 'customer').length,
    providerAccounts: users.filter((u) => u.role === 'provider').length,
    admins: users.filter((u) => u.role === 'admin').length,
    totalReviews: reviews.length,
    averageRating: reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0,
    openComplaints: complaints.filter((c) => c.status === 'open' || c.status === 'in_review').length,
    resolvedComplaints: complaints.filter((c) => c.status === 'resolved').length,
    completionRate: decided ? Math.round((completed / decided) * 100) : 0,
    revenueEstimate: bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.estimate ?? 0), 0),
  };
}

// Top providers by rating for the home page rail.
export function topRated(state, limit = 6) {
  return publicProviders(state)
    .filter((p) => p.reviewCount > 0)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}
