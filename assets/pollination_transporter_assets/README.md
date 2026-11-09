# Pollination Transporter – Web Assets

Three independently usable transport illustrations from the approved PowerPoint grid design.

| Vehicle | Grid | Capacity | PNG size (px) |
|---|---|---:|---|
| Small | 8 columns × 3 rows | 24 slots | 755 × 327 |
| Medium | 10 columns × 3 rows | 30 slots | 878 × 310 |
| Large | 12 columns × 3 rows | 36 slots | 964 × 289 |

## Files
- `transporter_small.png`, `transporter_medium.png`, `transporter_large.png`: **transparent PNG** artwork with empty grids; place equipment on top programmatically.
- `transporter_*.svg`: grid lines are editable vector shapes; the original raster illustration is embedded. These are **not fully vectorized trucks**.
- `transporter_*_no_grid.png`: transparent bare trucks for drawing grids dynamically.
- `transporters.json`: intrinsic image dimensions and grid geometry for HTML canvas/game logic.

## Use in VS Code project
Copy the selected files to your project, for example `public/assets/transporters/`.

```html
<img src="/assets/transporters/transporter_small.png" alt="Small pollination transporter" width="755" height="327" />
```

The grid uses **60 source pixels per square** for all vehicles. Coordinates in `transporters.json` are measured from the **top left of each image**. To locate a component at `(column, row)` (0-based):

```js
const v = manifest.vehicles.small;
const x = v.gridX + column * v.cellSize;
const y = v.gridY + row * v.cellSize;
```

When rendering the image at a non-native size, multiply `x`, `y` and `cellSize` by the **same image scale factor** (displayed width / source width). Avoid cropping/stretching the image if you want grid-to-component alignment.

All backgrounds outside the truck and cargo area are transparent (RGBA).
