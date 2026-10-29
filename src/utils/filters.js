// Search + filter logic for the Browse screen (FR-SM-04, FR-SM-05, FR-PC-02).
// An empty search term simply shows every listing (SC-01).

export const DEFAULT_FILTERS = {
  q: '',
  categoryId: 'all',
  city: 'all',
  maxPrice: null,
  minRating: 0,
  availableOnly: false,
  sort: 'recommended',
};

export function activeFilterCount(filters) {
  let n = 0;
  if (filters.categoryId && filters.categoryId !== 'all') n += 1;
  if (filters.city && filters.city !== 'all') n += 1;
  if (Number.isFinite(filters.maxPrice)) n += 1;
  if (filters.minRating > 0) n += 1;
  if (filters.availableOnly) n += 1;
  return n;
}

export function filterProviders(list, filters) {
  const q = (filters.q ?? '').trim().toLowerCase();

  const result = list.filter((p) => {
    if (filters.categoryId && filters.categoryId !== 'all' && p.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.city && filters.city !== 'all' && p.city !== filters.city) return false;

    // Price filter compares against the provider's cheapest service (minPrice).
    if (Number.isFinite(filters.maxPrice) && p.minPrice !== null && p.minPrice > filters.maxPrice) {
      return false;
    }
    if (filters.minRating > 0 && p.rating < filters.minRating) return false;
    if (filters.availableOnly && !p.nextAvailable) return false;

    if (q) {
      const haystack = [
        p.name,
        p.ownerName,
        p.tagline,
        p.bio,
        p.city,
        p.category?.name,
        ...(p.areas ?? []),
        ...(p.services ?? []).map((s) => `${s.name} ${s.description}`),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return sortProviders(result, filters.sort);
}

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'fastest', label: 'Fastest response' },
  { value: 'jobs', label: 'Most jobs done' },
];

function sortProviders(list, sort) {
  const copy = [...list];
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'price_low':
      return copy.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    case 'price_high':
      return copy.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
    case 'fastest':
      return copy.sort((a, b) => a.responseMins - b.responseMins);
    case 'jobs':
      return copy.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
    default:
      // "Recommended" balances rating, verified status and demand.
      return copy.sort((a, b) => score(b) - score(a));
  }
}

function score(p) {
  const ratingPart = p.rating * 12;
  const volumePart = Math.min(30, Math.log10(p.reviewCount + 1) * 18);
  const trustPart = p.verificationStatus === 'verified' ? 10 : 0;
  const speedPart = Math.max(0, 12 - p.responseMins / 6);
  return ratingPart + volumePart + trustPart + speedPart;
}

// Price slider bounds derived from the actual data set.
export function priceBounds(list) {
  const prices = list.map((p) => p.minPrice).filter((n) => Number.isFinite(n));
  if (!prices.length) return { min: 0, max: 10000 };
  return { min: 0, max: Math.ceil(Math.max(...prices) / 1000) * 1000 };
}
