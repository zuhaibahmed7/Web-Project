// Full-colour artwork for the seven "find a service" category tiles.
// Keyed by category slug, so the mapping survives admin edits to the Lucide
// glyph names in data/categories.js. Small glyphs stay Lucide — a 14px raster
// illustration turns to mush inside a filter chip.
//
// Files keep the names they were downloaded with. To swap one, drop the new
// file in this folder and change its import below.

import plumbing from './water-filter.png';
import electrical from './engineering.png';
import acRepair from './air-conditioner.png';
import cleaning from './cleaning.svg';
import painting from './painter.png';
import carpentry from './carpenter.png';
import mechanics from './bike.png';

export const CATEGORY_ART = {
  plumbing,
  electrical,
  'ac-repair': acRepair,
  cleaning,
  painting,
  carpentry,
  mechanics,
};

export function categoryArt(slug) {
  return CATEGORY_ART[slug] ?? null;
}
