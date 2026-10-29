// Sample customer reviews. Instead of hand-writing 90+ near-identical records,
// reviews are generated deterministically from name/comment pools with a seeded
// PRNG — so every provider has realistic, stable feedback on every reload.
// Reviews written by a logged-in customer are appended to this list at runtime.

import { PROVIDERS } from './providers';
import { isoFromToday } from '../utils/date';

// mulberry32: tiny deterministic PRNG. Same seed -> same reviews every time.
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const NAMES = [
  'Ahmed Raza', 'Mariam Aslam', 'Bilal Hussain', 'Hina Shahzad', 'Talha Iqbal',
  'Rabia Nawaz', 'Omar Farooq', 'Sadia Perveen', 'Kamran Yousaf', 'Nimra Javed',
  'Adil Sarwar', 'Zoya Anwar', 'Shahid Mehmood', 'Iqra Saleem', 'Waqas Nadeem',
  'Areeba Tariq', 'Sohail Ahmed', 'Mahnoor Kazmi', 'Junaid Alam', 'Saima Rehman',
  'Hassan Mirza', 'Farah Deeba', 'Noman Ashraf', 'Kiran Fatima', 'Rizwan Haider',
];

const COMMENTS = {
  'cat-plumbing': [
    'Found the hidden leak behind the bathroom wall in ten minutes. Fixed properly, no damage left.',
    'Drain was completely blocked for a week. Cleared it and explained what was causing it.',
    'Arrived on time and finished the tap work quickly. Price matched what was quoted.',
    'Good work overall, but had to wait about half an hour past the booked slot.',
    'Motor installation was neat and the wiring is properly insulated. Happy with it.',
  ],
  'cat-electrical': [
    'Explained the whole load calculation before adding new points. Very professional approach.',
    'Short circuit was traced to a burnt neutral. Fixed and tested everything afterwards.',
    'Board upgrade done cleanly, labelled every breaker. Worth the price.',
    'Wiring is neat but the finishing plates were slightly crooked. Still satisfied.',
    'Inverter installed and running perfectly through load shedding now.',
  ],
  'cat-ac-repair': [
    'Jet service made a huge difference — cooling is like new. Gave a pressure report too.',
    'Gas refilling was honest; they showed me the leak point before charging.',
    'PCB repair saved me from buying a new unit. Excellent diagnosis.',
    'Service was fine but the technician had to reschedule once.',
    'Installation was quick and the piping is properly insulated.',
  ],
  'cat-cleaning': [
    'The crew brought everything and left the house spotless. Kitchen tiles look brand new.',
    'Very polite staff and they respected our privacy throughout the day.',
    'Sofa shampoo removed stains I thought were permanent.',
    'Good clean but they ran about 40 minutes over the estimated time.',
    'Water tank cleaning was thorough and they showed photos afterwards.',
  ],
  'cat-painting': [
    'Covered all the furniture properly, zero paint splashes anywhere.',
    'Accent wall turned out exactly like the reference photo I shared.',
    'Three coats, smooth finish, and they filled every crack first.',
    'Colour was slightly different from the sample but the finish quality is great.',
    'Finished a full room in two days as promised. Very tidy work.',
  ],
  'cat-carpentry': [
    'Wardrobe doors now close perfectly. Hinges and alignment all sorted.',
    'They shared a drawing before starting, so there were no surprises.',
    'Solid wood work is genuinely well finished, edges are smooth.',
    'Assembly was quick but one screw point needed a second visit.',
    'Kitchen cabinet shutters replaced and re-laminated beautifully.',
  ],
  'cat-mechanics': [
    'Diagnostics found a sensor issue two other garages missed. Fixed at my doorstep.',
    'Oil service done properly with genuine filter. Car runs smoother now.',
    'Jump-started my battery at 8am and reached within 25 minutes.',
    'Work was good but the bill was slightly higher than the estimate.',
    'Bike tune-up made it feel new again. Chain and carburettor both sorted.',
  ],
};

const GENERIC = [
  'Polite, punctual and clear about pricing. Would book again.',
  'Communication was easy and the job was completed as described.',
  'Reasonable rates for the quality of work delivered.',
];

// Rating profile per provider: high-quality providers get mostly 5s.
const QUALITY = {
  'p-01': 4.7, 'p-02': 4.4, 'p-03': 4.8, 'p-04': 4.0,
  'p-05': 4.9, 'p-06': 4.6, 'p-07': 4.5, 'p-08': 3.9,
  'p-09': 4.8, 'p-10': 4.7, 'p-11': 4.3, 'p-12': 3.4,
  'p-13': 4.9, 'p-14': 4.5, 'p-15': 4.6, 'p-16': 3.8,
  'p-17': 4.7, 'p-18': 4.4, 'p-19': 4.1,
  'p-20': 4.8, 'p-21': 4.5, 'p-22': 4.3,
  'p-23': 4.7, 'p-24': 4.6, 'p-25': 4.0,
};

// Pick a rating that averages close to the target quality score.
function rollRating(random, target) {
  const spread = random();
  if (spread < 0.52) return Math.min(5, Math.round(target + 0.4));
  if (spread < 0.8) return Math.round(target);
  if (spread < 0.93) return Math.max(1, Math.round(target - 1));
  return Math.max(1, Math.round(target - 2));
}

function reviewCountFor(provider, random) {
  // Busier, longer-established providers naturally have more reviews.
  const base = Math.min(7, Math.max(3, Math.round(provider.jobsCompleted / 260)));
  return base + Math.floor(random() * 3);
}

export function buildSeedReviews(providers = PROVIDERS) {
  const reviews = [];
  let counter = 0;

  providers.forEach((provider) => {
    const random = mulberry32(seedFrom(provider.id));
    const pool = COMMENTS[provider.categoryId] ?? [];
    const target = QUALITY[provider.id] ?? 4.3;
    const count = reviewCountFor(provider, random);

    for (let i = 0; i < count; i += 1) {
      counter += 1;
      const usePool = random() > 0.22;
      const comment = usePool
        ? pool[Math.floor(random() * pool.length)]
        : GENERIC[Math.floor(random() * GENERIC.length)];

      reviews.push({
        id: `rev-${counter}`,
        providerId: provider.id,
        customerId: null,
        customerName: NAMES[Math.floor(random() * NAMES.length)],
        rating: Math.max(1, Math.min(5, rollRating(random, target))),
        comment,
        bookingId: null,
        createdAt: `${isoFromToday(-(3 + Math.floor(random() * 210)))}T1${Math.floor(random() * 9)}:00:00.000Z`,
      });
    }
  });

  return reviews;
}

// Reviews the demo customer already left, tied to specific completed bookings so
// the "already reviewed" rule (BRL-07) can be demonstrated.
export const CUSTOMER_SEED_REVIEWS = [
  {
    id: 'rev-mine-1',
    providerId: 'p-09',
    customerId: 'u-customer',
    customerName: 'Ayesha Khan',
    rating: 5,
    comment:
      'Booked the jet service for two split units. Technician arrived within the slot, showed me the before/after filter condition and cooling improved instantly.',
    bookingId: 'bk-06',
    createdAt: `${isoFromToday(-24)}T10:20:00.000Z`,
  },
  {
    id: 'rev-mine-2',
    providerId: 'p-13',
    customerId: 'u-customer',
    customerName: 'Ayesha Khan',
    rating: 4,
    comment:
      'Deep clean was thorough and the crew was very respectful. Only reason for four stars is that they started about half an hour late.',
    bookingId: 'bk-10',
    createdAt: `${isoFromToday(-9)}T16:05:00.000Z`,
  },
];

// Aggregate rating + count for a provider, recomputed whenever reviews change.
export function ratingSummary(reviews, providerId) {
  const mine = reviews.filter((r) => r.providerId === providerId);
  if (!mine.length) return { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] };
  const total = mine.reduce((sum, r) => sum + r.rating, 0);
  const breakdown = [0, 0, 0, 0, 0];
  mine.forEach((r) => {
    breakdown[r.rating - 1] += 1;
  });
  return {
    average: Math.round((total / mine.length) * 10) / 10,
    count: mine.length,
    breakdown,
  };
}
