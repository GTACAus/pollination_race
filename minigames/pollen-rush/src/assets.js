const ROOT = new URL("../assets/", import.meta.url);
const assetUrl = (path) => new URL(path, ROOT).href;

export const ASSET_PATHS = Object.freeze({
  bee: assetUrl("sprites/bee_flying_48.png"),
  wasp: assetUrl("sprites/wasp_flying_48.png"),
  pollen: assetUrl("sprites/bee_pollen_overlay_48.png"),
  hive: assetUrl("sprites/hive_64.png"),
  props: assetUrl("sprites/meadow_props_32.png"),
  background: assetUrl("backgrounds/meadow_tile_seamless_256.png"),
  flowers: Object.freeze({
    pink: assetUrl("sprites/flower_pink_32.png"),
    blue: assetUrl("sprites/flower_blue_32.png"),
    yellow: assetUrl("sprites/flower_yellow_32.png")
  }),
  icons: Object.freeze({
    pink: assetUrl("sprites/flower_pink_icon_64.png"),
    blue: assetUrl("sprites/flower_blue_icon_64.png"),
    yellow: assetUrl("sprites/flower_yellow_icon_64.png")
  })
});

export function loadAssets() {
  const entries = [
    ["bee", ASSET_PATHS.bee],
    ["wasp", ASSET_PATHS.wasp],
    ["pollen", ASSET_PATHS.pollen],
    ["hive", ASSET_PATHS.hive],
    ["props", ASSET_PATHS.props],
    ["background", ASSET_PATHS.background],
    ...Object.entries(ASSET_PATHS.flowers).map(([name, path]) => [`flower_${name}`, path]),
    ...Object.entries(ASSET_PATHS.icons).map(([name, path]) => [`icon_${name}`, path])
  ];

  return Promise.all(entries.map(([name, path]) => loadImage(name, path)))
    .then((loaded) => Object.fromEntries(loaded));
}

function loadImage(name, path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([name, image]);
    image.onerror = () => reject(new Error(`Unable to load game asset "${name}" from ${path}`));
    image.src = path;
  });
}
