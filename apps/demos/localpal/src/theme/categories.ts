/**
 * Activity categories. Single source of truth for the search sheet's category
 * filter CHIPS (see search/filters) and the map's pin categorization
 * (data/categorize), so a chip you pick and a pin you hide always agree.
 */
import type { GlyphKey } from '../components/icons/Glyph';

export type CategoryId = 'drinks' | 'music' | 'sports' | 'food' | 'coffee';

export type Category = { id: CategoryId; label: string; glyph: GlyphKey };

export const CATEGORIES: Record<CategoryId, Category> = {
  drinks: { id: 'drinks', label: 'Drinks', glyph: 'cocktail' },
  music: { id: 'music', label: 'Music', glyph: 'music' },
  sports: { id: 'sports', label: 'Sports', glyph: 'climb' },
  food: { id: 'food', label: 'Food', glyph: 'fork' },
  coffee: { id: 'coffee', label: 'Coffee', glyph: 'coffee' },
};
