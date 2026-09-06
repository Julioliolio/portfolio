# Fonts

The site's typeface is PP Neue Montreal (Pangram Pangram, commercial —
licensed to Julio; do not redistribute). Loaded in `src/app/layout.tsx` with
`next/font/local`, `display: "swap"`, and CSS variables
(`--font-neue-montreal`, `--font-neue-montreal-mono`), which `globals.css`
maps to Tailwind's `--font-sans` / `--font-mono`.

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
