# paururo.github.io

Personal site of Paula Ruiz-Rodriguez, served by GitHub Pages from `main`.
Plain HTML, CSS and JavaScript: no build step, no framework.

## Files

| File | What it holds |
|---|---|
| `index.html` | The page: one scroll, nine sections |
| `css/style.css` | Notebook look, light and dark themes |
| `js/content.js` | **Everything you edit**: papers I led, tools, news, career steps, helix labels |
| `js/art.js` | Drawings: pixel sprites, the koi pond behind the page and its 3D shows, helices, the career chromosome, the genome ruler, the tree of the fourteen TB lineages |
| `js/play.js` | The desk in *Off the bench* (keyboard, the console under it, the monitor, a Bambu Lab X1C, lamp, mug, microbes), the coffee on the letter, the pond tricks |
| `js/polar.js` | Polar, the lovebird: my shoulder in the photo, real perches, the desk, the ruler with the plush bacillus |
| `assets/img/polar.png` | Polar's poses, generated (see below) |
| `js/main.js` | Behaviour and live data |
| `i2sysbio-networks.html` | The I2SysBio researchers map (standalone) |
| `preview.html` | Single-file copy of the page, generated |

## Updating the content

Open `js/content.js` and add one object to the matching list:

- **A paper I led**: `SELECTED_WORK`. It also marks the paper as first or co-first author in the live list.
- **A news post**: `BLOG_POSTS` (newest first).
- **A tool**: `FEATURED_TOOLS`. Only public repositories; add `bioconda: '<package>'` to show its live download count.
- **A career step**: `CAREER`. `end: null` means "until now".

The rest updates itself, with a one-day cache in the visitor's browser:
publications from [ORCID](https://orcid.org/0000-0003-0727-5974), citations
from Semantic Scholar, repositories from GitHub and Bioconda downloads through
shields.io.

## Previewing locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Generated files

After changing the page, rebuild the single-file copy:

```bash
python3 scripts/build-preview.py
```

After changing the name, title or photo, rebuild the link preview image
(`assets/img/og-card.png`, needs Chrome):

```bash
python3 scripts/build-og-card.py
```

Polar is pixel art redrawn from his character sheet. To draw him again (for
example after touching up the script), pass the sheet to the build; it prints
the pose names that go in `POLAR_POSES` in `js/polar.js`:

```bash
python3 scripts/build-polar.py path/to/polar-character-sheet.png
```
