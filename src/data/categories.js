// The 7 service categories from the SRS (section 7.4.4, UC-01).
// `icon` is a key resolved to a Lucide component in components/ui/CategoryIcon.jsx
// so this file stays plain data.

export const CATEGORIES = [
  {
    id: 'cat-plumbing',
    slug: 'plumbing',
    name: 'Plumbing',
    icon: 'droplets',
    tagline: 'Leaks, taps, drains & motors',
    description:
      'Burst pipes, dripping taps, blocked drains, water-motor fitting and bathroom leakage repaired by verified plumbers.',
    from: 800,
    accent: ['#3B82F6', '#00D4C8'],
  },
  {
    id: 'cat-electrical',
    slug: 'electrical',
    name: 'Electrical',
    icon: 'zap',
    tagline: 'Wiring, boards, fans & UPS',
    description:
      'Faulty switches, short circuits, new wiring, distribution boards, fans, lights and UPS / inverter installation.',
    from: 900,
    accent: ['#FFB020', '#FF7A1A'],
  },
  {
    id: 'cat-ac-repair',
    slug: 'ac-repair',
    name: 'AC Repair',
    icon: 'snowflake',
    tagline: 'Service, gas, inverters & install',
    description:
      'Split and window AC servicing, gas refilling, PCB repair, installation and annual maintenance contracts.',
    from: 2500,
    accent: ['#00D4C8', '#6C5CE7'],
  },
  {
    id: 'cat-cleaning',
    slug: 'cleaning',
    name: 'Cleaning',
    icon: 'sparkles',
    tagline: 'Deep clean, sofas & water tanks',
    description:
      'Full home deep cleaning, kitchen and bathroom scrubbing, sofa and carpet shampoo, water-tank and disinfection service.',
    from: 1500,
    accent: ['#6C5CE7', '#00D4C8'],
  },
  {
    id: 'cat-painting',
    slug: 'painting',
    name: 'Painting',
    icon: 'roller',
    tagline: 'Interior, exterior & polish',
    description:
      'Wall preparation, emerald/emulsion painting, weather-coat exterior work, wood polish and waterproofing.',
    from: 2000,
    accent: ['#FF7A1A', '#FFB020'],
  },
  {
    id: 'cat-carpentry',
    slug: 'carpentry',
    name: 'Carpentry',
    icon: 'hammer',
    tagline: 'Doors, furniture & fittings',
    description:
      'Door and lock repair, wardrobe and kitchen cabinet work, furniture assembly, hinges, handles and custom fittings.',
    from: 1200,
    accent: ['#0F1535', '#6C5CE7'],
  },
  {
    id: 'cat-mechanics',
    slug: 'mechanics',
    name: 'Mechanics',
    icon: 'car',
    tagline: 'At-home car & bike repair',
    description:
      'On-site car and bike servicing, battery jump-start, tyre change, oil service, tuning and computer diagnostics.',
    from: 1000,
    accent: ['#EF4444', '#FFB020'],
  },
];

export const CATEGORY_BY_SLUG = CATEGORIES.reduce((acc, c) => {
  acc[c.slug] = c;
  return acc;
}, {});

export const CATEGORY_BY_ID = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

// Cities covered by the marketplace — used for the location filter.
export const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Hyderabad',
  'Sukkur',
];
