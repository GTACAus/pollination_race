# Pollen Rush module

This folder is the self-contained, no-build integration package. Import `mountPollenRush` from `index.js`; it creates an isolated Shadow DOM game instance in the container supplied by the host.

The module uses native JavaScript ES modules and browser APIs only. Copy the entire `pollen-rush-module/` directory, preserving its internal paths. Required package paths are:

- `index.js` — public entry point.
- `src/` — gameplay implementation and asset loader.
- `config.js` — gameplay and performance configuration.
- `pollen-rush.css` — styles loaded inside the module's Shadow DOM.
- `assets/` — supplied sprites and backgrounds.

See this folder's `INTEGRATION.md` for the public API, result schema, and a working example. Open the project root `index.html` through a local HTTP server to run the standalone launcher.
