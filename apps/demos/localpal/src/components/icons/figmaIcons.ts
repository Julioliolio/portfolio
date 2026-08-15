/**
 * Icons exported straight from Figma (frame 1348:947) as SVG, so the sheet uses
 * the exact same glyphs and proportions as the design. Card glyphs are white
 * (#FEFEFE line + #3121FF interior); chip glyphs are the lavender variants.
 * Imported as URLs and rendered via <img> — vector, so crisp at any size.
 */
import cocktail from "../../assets/icons/icon-cocktail.svg";
import bouldering from "../../assets/icons/icon-bouldering.svg";
import utensils from "../../assets/icons/icon-utensils.svg";
import chevron from "../../assets/icons/icon-chevron.svg";
import clock from "../../assets/icons/icon-clock.svg";
import search from "../../assets/icons/icon-search.svg";
import shootingStar from "../../assets/icons/icon-shooting-star.svg";
import music from "../../assets/icons/icon-music.svg";
import coffee from "../../assets/icons/icon-coffee.svg";
import museum from "../../assets/icons/icon-museum.svg";
import chipDrinks from "../../assets/icons/icon-chip-drinks.svg";
import chipSports from "../../assets/icons/icon-chip-sports.svg";

// Crosses/pluses are NOT here — use <CrossIcon> (the one true cross glyph).
export const figmaIcons = {
  cocktail,
  bouldering,
  utensils,
  chevron,
  clock,
  search,
  shootingStar,
  music,
  coffee,
  museum,
  chipDrinks,
  chipSports,
} as const;
