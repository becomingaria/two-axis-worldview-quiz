# Two Axis Worldview Quiz

A no-build static site for a D&D table: players answer six scenario questions
in character, and the page plots them as a dot on a two-axis chart, styled as
a dark, starlit "mysterious" theme.

- **Axis I — Ideas & Circumstance**: Pragmatic to Idealistic (vertical, Idealistic at top)
- **Axis II — Optimism & Pessimism**: Pessimistic to Optimistic (horizontal, Optimistic at right)

Each axis totals -6..+6 from the raw scoring key, but everything shown to
players is capped to **-4..+4** — anything past the cap displays as the cap.

Everything runs client-side (no backend, no build step, no dependencies) —
just static HTML/CSS/JS, which is exactly what GitHub Pages serves.

## Pages

- **`index.html`** — the quiz itself. On submit it shows the character's
  archetype, chart, and score breakdown, plus:
  - **Download PNG** — exports a shareable image (character name, archetype,
    and chart) via canvas.
  - **Save My Results** — downloads a `<name>-worldview.txt` file containing
    the result as JSON (raw and capped scores, archetype, timestamp), meant
    to be re-loaded on the compare page.
  - **Copy Summary** — copies a plain-text summary to the clipboard.
- **`compare.html`** — load up to 10 saved `-worldview.txt` files (drag-and-drop
  or file picker) to see the whole party plotted on one chart. Each character
  gets a distinct color and a direct name label; characters who land on the
  exact same point are nudged into a small arc so every dot stays visible.
  **Download Combined PNG** exports the party chart with a color-coded legend.

## Files

- `index.html` / `compare.html` — page structure for the quiz and the compare page
- `style.css` — the shared dark/starlit theme, nav, cards, and compare-page
  components (drop zone, character list, etc.)
- `common.js` — shared logic used by both pages: scoring/archetype helpers,
  the SVG chart renderer (single-marker and multi-marker), the starfield
  background, and the save/PNG-export helpers
- `script.js` — quiz-page-specific: the `QUIZ` question data, form generation,
  and the submit/save/export handlers
- `compare.js` — compare-page-specific: file loading, color assignment, and
  the character list

The quiz questions and per-answer scores live in the `QUIZ` array at the top
of `script.js`. The four quadrant archetype blurbs, the display cap, and the
character color order live in `common.js` — edit those if you want to change
wording, the cap, or the palette.

Chart styling (colors, fonts) is duplicated as a literal `<style>` block
embedded directly in each generated chart SVG (see `CHART_STYLE` in
`common.js`), rather than only living in `style.css`. This is intentional:
the chart is later re-serialized standalone for PNG export, at which point it
has no access to the page's external stylesheet — so the chart carries its
own styling to render identically either way.

## Run it locally

No install needed. From this folder, run either:

```bash
python3 -m http.server 8000
```

or, if you have Node:

```bash
npx serve .
```

Then open `http://localhost:8000` in a browser.

## Publish to GitHub Pages

1. Create a new GitHub repo (or use an existing one) and push this folder's
   contents to it:
   ```bash
   git init
   git add index.html compare.html style.css common.js script.js compare.js README.md
   git commit -m "Add two axis worldview quiz"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a
   branch**, then pick branch `main` and folder `/ (root)`.
4. Save. GitHub will publish the site at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

No further configuration is required — there's no build step, so whatever is
on `main` is what gets served.

## Notes

- Saved `.txt` results files are plain JSON under the hood (the `.txt`
  extension is intentional, so players can open/inspect them easily). The
  compare page re-derives the display cap from the raw scores in the file
  rather than trusting stored capped values, so it stays consistent even if
  the cap or scoring logic changes later.
- The compare page supports up to 10 characters at once; adding more shows a
  warning and only the remaining slots are filled.
- Fonts (Cinzel for headings, Inter for body) load from Google Fonts via
  `style.css`'s `@import`. If you'd rather not depend on an external font
  host, swap that line for a local/system font stack.
