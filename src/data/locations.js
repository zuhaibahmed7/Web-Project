// Seed shop / base addresses keyed by provider slug.
//
// They live outside the seeded state because a returning visitor already has
// providers saved in localStorage, and adding a field to the seed would need a
// STATE_VERSION bump (wiping their bookings) before it showed up. A provider's
// own saved `address` — set in the profile editor — always wins over this map.
//
// Illustrative addresses only (DR-08); no real businesses.

export const PROVIDER_ADDRESSES = {
  'karachi-pipecare': 'Shop 8-C, Khokhelta Road, DHA Phase 4, Karachi',
  'lahore-waterworks': 'Office 3, Main Boulevard, Gulberg III, Lahore',
  'isb-aquafix': 'Shop 12, F-7 Markaz, Islamabad',
  'drain-masters-fsd': 'House 45, Peoples Colony A, Jaranwala Road, Faisalabad',
  'bilal-electrical-works': 'Shop 7, Satellite Town Central Market, Rawalpindi',
  'sparkpoint-karachi': 'Plot 22, Gulshan-e-Iqbal Block 6, Karachi',
  'voltcare-lahore': 'Lane C, DHA Phase 5 Y-Block Market, Lahore',
  'powerhouse-peshawar': 'Shop 3, University Road, University Town, Peshawar',
  'cooltech-ac-karachi': 'Plot 41, DHA Phase 6 Commercial Area, Karachi',
  'chillzone-isb': 'Shop 5, F-6 Markaz Central Street, Islamabad',
  'aircool-lahore': 'Workshop 9, Johar Town Block C1, Lahore',
  'frostcare-multan': 'Shop 22, Cantt Bus Adda, Multan',
  'sparklehome-lahore': 'Office 14, DHA Phase 3 Commercial, Lahore',
  'cleancrew-karachi': 'Block 8-C, Near Paper Market, Gulshan, Karachi',
  'purespace-isb': 'Workshop 6, I-9 Industrial Zone, Islamabad',
  'shineworks-hyd': 'Shop 11, Latifabad Unit 7, Hyderabad',
  'colourcraft-pindi': 'Shop Zone, Bahria Town Phase 2, Rawalpindi',
  'brush-roll-lahore': 'Back Lane, Main Boulevard, Gulberg III, Lahore',
  'wallart-karachi': 'Jauhar Block 10 Commercial, Gulistan-e-Jauhar, Karachi',
  'woodsmith-lahore': 'Trade & Development Society Block C2, Johar Town, Lahore',
  'furniture-fix-karachi': 'Block 10-A, Near Landhi Flyover, Karachi',
  'timberworks-isb': 'Factory 4, I-9 Industrial Area, Islamabad',
  'autocare-karachi': 'Plot 12, KDA Scheme 1, Shahrah-e-Faisal, Karachi',
  'bikemedics-lahore': 'Ichhra Main Market, Near Faisal Chowk, Lahore',
  'garage-express-quetta': 'Block 2, Jinnah Town, Airport Road, Quetta',

  /* Interior Sindh */
  'khairpur-pipeline': 'Shop 15, Ranipur Road, near Civil Line, Khairpur',
  'khairpur-bhan-electrics': 'Shop 4, Bhurgri Bazaar, Khairpur',
  'larkana-coolair': 'Plot 19, Id Gah Road, Larkana',
  'larkana-shinecrew': 'Office 7, Shahrah-e-Quaid, Residency Area, Larkana',
  'shikarpur-colourhouse': 'Shop 8, Qasim Road, Shikarpur',
  'shikarpur-woodline': 'Workshop 3, Bhambri Road, near Fort Road, Shikarpur',
  'ghotki-drain-doctors': 'Shop 11, Station Road, Ghotki',
  'ghotki-auto-medics': 'Plot 6, Highway Road, near Bazaar Area, Ghotki',
  'gambat-spark-works': 'Shop 2, Nawabshah Road, Gambat',
  'gambat-deepclean': 'Office 5, Bhan Road, Gambat',
  'ranipur-furniture-fix': 'Workshop 9, Khairpur Road, Ranipur',
  'ranipur-tapline': 'Shop 13, Ranipur Bazaar, Ranipur',
  'hyderabad-coolcare': 'Shop 21, Auto Bhan Road, Qasimabad, Hyderabad',
  'hyderabad-roadready': 'Garage 4, Residency Area, Hyderabad',
  'nawabshah-voltline': 'Shop 6, Bhitt Shahi Road, Nawabshah',
  'nawabshah-pipesolution': 'Plot 17, Station Road, near City Chowk, Nawabshah',
  'moro-home-clean': 'Office 8, Karachi Road, Moro',
  'moro-teakworks': 'Workshop 2, Bhan Quarter, Moro',
  'naushahro-ferozemotors': 'Shop 10, Sukkur Road, Main Bazaar, Naushahro Feroze',
  'naushahro-finefinish': 'House 24, Gharibabad, Naushahro Feroze',
};

// The address to show: what the provider saved, else the seed entry, else
// nothing — callers fall back to the city + service-area line.
export function providerAddress(provider) {
  if (!provider) return null;
  return provider.address?.trim() || PROVIDER_ADDRESSES[provider.slug] || null;
}
