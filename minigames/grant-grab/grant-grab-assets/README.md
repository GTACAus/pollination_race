# Grant Grab! — Pixel-Art Asset Pack

A standalone asset package for the **Grant Grab!** funding mini-game in **The Great Pollination Race**. This is an asset pack, **not the finished game**.

## Contents

| Path | Purpose |
|---|---|
| `characters/scientist_atlas.png` | Scientist animation atlas (5 columns × 2 rows; 256 × 320 px per frame). Transparent PNG. |
| `characters/scientist_animations.json` | Exact frame coordinates, animation frame sequences and durations. |
| `characters/frames/` | Ten individually extracted/derived PNG frames for engines that do not use an atlas. |
| `items/funding_items_atlas.png` | Five funding and hazard icons in one horizontal atlas (each 128 × 128 px). Transparent PNG. |
| `items/funding_items.json` | Item identifiers, values, image paths and atlas coordinates. |
| `items/individual/` | Individual funding item PNGs. |
| `backgrounds/gtac_lab_background.png` | Wide GTAC-inspired laboratory background (1672 × 941 px). |
| `grant-grab-manifest.json` | Paths and version information for your own asset loader. |
| `previews/*.gif` | Quick visual previews of idle, walking and rejected animations. Not required for the game. |
| `examples/preview.html` | Standalone interactive animation preview (no build step needed). |
| `examples/grantGrabSprites.ts` | Small TypeScript sprite animator for HTML Canvas. |
| `sources/` | Original generated sheets/background for future graphics changes. |

## Quick start in VS Code

1. Extract the ZIP and copy the whole `grant-grab-assets` folder into your project, for example under `public/grant-grab-assets/` if your project uses Vite.
2. Open `examples/preview.html` in a web browser to review the animations. This preview runs with local PNG paths; no dependencies required.
3. When you implement the game, load:
   - `/grant-grab-assets/characters/scientist_atlas.png`
   - `/grant-grab-assets/items/funding_items_atlas.png`
   - `/grant-grab-assets/backgrounds/gtac_lab_background.png`
4. Read the accompanying `.json` metadata files when using the atlases. The included TypeScript class demonstrates a frame renderer that uses exactly the source rectangles in the JSON.
5. Use `image-rendering: pixelated` for CSS-rendered sprites, or `ctx.imageSmoothingEnabled = false` when drawing on Canvas.

## Scientist animations

| State | Frame indices | Per-frame durations (ms) | When to use |
|---|---|---|---|
| Idle | 0, 5, 0, 1, 0 | 360, 300, 390, 130, 380 | Basket/scientist not moving |
| Walk | 2, 6, 3, 7 | 135, 135, 135, 135 | Scientist moving left or right |
| Rejected | 4, 8, 4, 9 | 160, 140, 180, 160 | During the two-second rejected-application slowdown |

Animation frames are **fixed, equal-size canvas cells** and aligned to the same floor baseline. Original art contains five poses; the extra five frames are subtle offset/tint variations based on those approved poses. These are suitable as an initial animation and can be extended later with bespoke frames.

**Use state priorities:** `rejected` overrides `walk`, and `walk` overrides `idle`.

**Sprite dimensions:** atlas 1280 × 640 px, each frame 256 × 320 px. An example on-screen character height is about 140–190 CSS pixels, depending on scene composition. Scale each frame uniformly to avoid jitter.

**Collection hitbox:** the JSON includes a suggested upper-container catch zone, expressed as a fraction of the frame width/height. Fine-tune the hitbox against the actual physics/feel of the finished game.

## Funding items

- `community_donation`: +$1,000, green coin
- `growers_sponsorship`: +$2,000, blue seed packet
- `research_grant`: +$3,000, purple flask
- `innovation_grant`: +$5,000, golden star
- `rejected_application`: $0, red crossed-out document; reduce movement speed by 50% for 2 seconds

The `rejected_application` is not spawned during the first **3 seconds of active gameplay**. Object spawn rates, rarity and speed remain part of your game code/configuration, not these image assets.

## Notes on background and art direction

- The lab is modelled on the GTAC reference photographs, featuring white cabinets, classroom lab benches, black stools, computers and microscopy equipment.
- The background contains no UI or characters. Draw the funding meter, clock, falling objects and scientist in separate Canvas layers.
- The canvas can be rendered at a 16:9 game viewport and the background can be cropped/scaled to fit. Preserve space at the bottom for the player character.
- The images are **raster pixel art** (not editable SVG vector assets).

## Minimal Canvas drawing example

```ts
// Assuming const sheet = await loadImage('/grant-grab-assets/characters/scientist_atlas.png');
const frameWidth = 256;
const frameHeight = 320;
const frameIndex = 2; // walk_step_a
const sourceX = (frameIndex % 5) * frameWidth;
const sourceY = Math.floor(frameIndex / 5) * frameHeight;
ctx.imageSmoothingEnabled = false;
ctx.drawImage(sheet, sourceX, sourceY, 256, 320, playerX, playerY, 128, 160);
```

You can also copy `examples/grantGrabSprites.ts` into a TypeScript project to draw animations using delta times.

## Testing checklist

- Ensure image paths resolve in the Vite/public directory or your framework's static asset configuration.
- Verify idle, walk and rejected animations display correctly using `examples/preview.html`.
- Confirm basket hit detection matches the collection container, not the scientist's hair or feet.
- Set `ctx.imageSmoothingEnabled = false` for pixel-art scaling.
- Keep animation timing independent of the gameplay timer.
- Confirm transparent items look correct on both light and dark backgrounds.
