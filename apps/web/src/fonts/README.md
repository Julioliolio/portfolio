# Fonts

The site's typeface is PP Neue Montreal (Pangram Pangram, commercial —
licensed to Julio; do not redistribute). Loaded in `src/app/layout.tsx` with
`next/font/local`, `display: "swap"`, and CSS variables
(`--font-neue-montreal`, `--font-neue-montreal-mono`), which `globals.css`
maps to Tailwind's `--font-sans` / `--font-mono`.

Only Regular and SemiBold are preloaded. Medium, Bold and Italic live in a
second family (`--font-neue-montreal-extra`, not preloaded) that
`globals.css` applies to `b`/`strong`/`.font-medium`/`.font-bold` and
`i`/`em`/`.italic`, so those files are only fetched by pages that use them.
Inline CSS that wants one of those cuts names the family explicitly. Mono
is not preloaded either; it is lab-only. The build's budget check
(`scripts/check-budget.mjs`) fails if the preloaded set grows.

The `.woff2` files are gitignored (the repo is public and the licence
forbids redistribution), so a fresh clone has none and `next build` fails
on `layout.tsx` until they are here. On another machine, either copy the
seven files from a machine that has them, or regenerate them as below.
The GitHub Pages deploy fails for the same reason until the fonts reach CI
some private way.

Files here are woff2 conversions of the installed static cuts (Regular 400,
Italic 400, Medium 500, SemiBold 600, Bold 700; Mono Regular 400 and Medium
500). The "Variable" file that ships with the family is a static export, not
a variable font, so the cuts are loaded individually. To regenerate from the
installed fonts (`%LOCALAPPDATA%\Microsoft\Windows\Fonts`):

```
pip install fonttools brotli
python -c "from fontTools.ttLib import TTFont; f=TTFont('PPNeueMontreal-Regular.ttf'); f.flavor='woff2'; f.save('PPNeueMontreal-Regular.woff2')"
```
