# Fonts

The site's typeface is PP Neue Montreal (Pangram Pangram, commercial —
licensed to Julio; do not redistribute). Loaded in `src/app/layout.tsx` with
`next/font/local`, `display: "swap"`, and CSS variables
(`--font-neue-montreal`, `--font-neue-montreal-mono`), which `globals.css`
maps to Tailwind's `--font-sans` / `--font-mono`.

Files here are woff2 conversions of the installed static cuts (Regular 400,
Italic 400, Medium 500, SemiBold 600, Bold 700; Mono Regular 400 and Medium
500). The "Variable" file that ships with the family is a static export, not
a variable font, so the cuts are loaded individually. To regenerate from the
installed fonts (`%LOCALAPPDATA%\Microsoft\Windows\Fonts`):

```
pip install fonttools brotli
python -c "from fontTools.ttLib import TTFont; f=TTFont('PPNeueMontreal-Regular.ttf'); f.flavor='woff2'; f.save('PPNeueMontreal-Regular.woff2')"
```
