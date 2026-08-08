# Fonts

Convention for real fonts (replacing the placeholder Geist from `next/font/google`):

1. Put `.woff2` files in this directory.
2. Load them in `src/app/layout.tsx` with `next/font/local`, `display: "swap"`,
   and a CSS `variable`.
3. Consume the variable in Tailwind via `@theme` in `globals.css`
   (e.g. `--font-sans: var(--font-my-font);`).

Check the license before shipping a commercial typeface (PP Neue Montreal from
localpal is commercial).
