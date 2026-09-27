# paururo.github.io

Personal site of Paula Ruiz-Rodriguez, served by GitHub Pages from `main`.
Plain HTML, CSS and JavaScript: no build step, no framework.

## Files

| File | What it holds |
|---|---|
| `index.html` | The page: one scroll, nine sections |
| `css/style.css` | Notebook look, light and dark themes |
| `js/content.js` | **Everything you edit**: papers I led, tools, the stops of the tool city, news, career steps, helix labels |
| `js/art.js` | Drawings: pixel sprites, the koi pond behind the page and its 3D shows, helices, the career chromosome, the genome ruler, the tree of the fourteen TB lineages |
| `js/play.js` | The desk in *Off the bench* (keyboard, the console under it, the monitor, a Bambu Lab X1C, lamp, mug, microbes), the coffee on the letter, the pond tricks |
| `js/polar.js` | Polar, the lovebird: my shoulder in the photo, real perches, the desk, the ruler with the plush bacillus, his coconut in the top right corner and the half coconut on the desk |
| `assets/img/polar.png` | Polar's poses, generated (see below) |
| `assets/img/coco.png`, `assets/img/coco-half.png` | His two coconuts, generated (see below) |
| `js/city.js` | The tools as a voxel city: a station for BAMpiro, a railway line and a building for each tool, a ticket for each building, and a map of the lines in a corner with the trains on it. Built of small blocks, two to a unit, so there is room for windows, clocks, rails and people; only the blocks that can be seen are drawn. Past a bridge to the east lie Sagunt and its port (the castle on its hill, the Roman theatre, orange groves, the blast furnace, the harbour, the beach), with a building for each paper I led; the yellow bus takes you there and back. Past one to the west is Paterna, by tram: the Parc Cientific and I2SysBio as it stands, at an angle, five floors, its door at the top of the slope and pillars under it where the ground falls away, its sign on the slope in front of it. Press the building and you step inside, into the lab, open like a doll's house (the walls on your side drop as you turn it): the benches, the biosafety cabinets, the fridges and freezers, and the desks, mine among them. It turns round and tilts, from nearly the ground to straight above. Drawn with three.js (from jsDelivr), loaded only when the section comes near and where WebGL works; otherwise the cards show as before |
| `js/main.js` | Behaviour and live data, the publications as a departures board |
| `i2sysbio-networks.html` | The I2SysBio researchers map (standalone) |
| `preview.html` | Single-file copy of the page, generated |

## Updating the content

Open `js/content.js` and add one object to the matching list:

- **A paper I led**: `SELECTED_WORK`. It also marks the paper as first or co-first author in the live list. Its building in Sagunt needs a stop in `SAGUNTO_STOPS` and a few blocks in `buildSagunto` in `js/city.js`.
- **A news post**: `BLOG_POSTS` (newest first).
- **A tool**: `FEATURED_TOOLS`. Only public repositories; add `bioconda: '<package>'` to show its live download count. Its ticket in the tool city is built from this entry; a new building needs a stop in `CITY_STOPS` and a few blocks in `buildTools` in `js/city.js`.
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

After changing anything under `css/` or `js/`, or Polar's sprite sheet, stamp
the links in `index.html` with the new file hashes. Browsers keep these files
for ten minutes, and without the stamps a phone can pair the new page with the
code of the previous version (`--check` only reports stale stamps):

```bash
python3 scripts/stamp-assets.py
```

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

His coconuts are drawn at his scale by a script too; it prints the points
that go in `COCO_*` and `BOWL_*` in `js/polar.js`:

```bash
python3 scripts/build-coco.py
```
