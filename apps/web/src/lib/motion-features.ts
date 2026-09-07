/**
 * The Motion feature bundle, split into its own chunk. `LazyMotion` fetches
 * it through the loader in motion.tsx after hydration instead of shipping
 * it with every page's first load — the home page animates nothing with
 * `m`, and the lab pieces that do are lazy themselves.
 */
export { domAnimation as default } from "motion/react";
