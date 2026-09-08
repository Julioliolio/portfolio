# Convertr (web demo)

The UI of the Convertr desktop video converter, vendored into the portfolio
as an embedded demo. The FFmpeg backend is replaced by a local simulation
in `src/api/` (same signatures, everything resolves in the browser), so the
full flow — drop a file, pick a format, convert, get a result — works with
no server. Built by `scripts/build-demos.mjs` into `/demos/convertr/`.
