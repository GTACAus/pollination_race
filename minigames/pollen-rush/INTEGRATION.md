# Pollen Rush integration

## Import and mount

Copy the whole `pollen-rush-module/` folder without changing its internal structure. The public entry point is `pollen-rush-module/index.js`. It exports `mountPollenRush`; there are no npm dependencies or build step.

```html
<div id="pollination-game"></div>
<script type="module">
  import { mountPollenRush } from "./pollen-rush-module/index.js";

  const game = mountPollenRush({
    container: document.querySelector("#pollination-game"),
    siteId: "site_01",
    durationSeconds: 60,
    onComplete(results) {
      console.log("Pollination mini-game results", results);
    },
    onExit() {
      console.log("Player exited the mini-game");
    }
  });

  game.start();
</script>
```

The `container` must be an existing DOM element. The module appends one mount element and renders inside its Shadow DOM, so its markup and CSS do not depend on or overwrite host-page IDs and styles. The canvas receives focus when the round starts; keyboard controls stay scoped to it. Click/tap movement is also scoped to the canvas. The standalone development page calls this same module.

## Instance methods

- `start()` begins the pre-game countdown and round. It is safe to call while module assets are still loading.
- `pause()` and `resume()` control active gameplay. Pausing freezes the active timer, flowers, wasps, and effects.
- `restart()` resets the instance to a new 60-second round.
- `skip()` completes with `played: false`, `skipped: true`, zero score/performance, and invokes `onComplete` and `onExit`.
- `exit()` invokes `onExit` once without completing the round.
- `destroy()` cancels the animation frame, removes canvas listeners, and removes only this module's mount element. It does not invoke callbacks.

`durationSeconds` defaults to 60; the three-second pre-game countdown is not included in that duration. Paused time is not counted. `targetScore` may be supplied to override the performance target; it defaults to `CONFIG.performanceTargetScore` (500).

## Result contract

`onComplete` is called once per round completion with:

```javascript
{
  siteId: "site_01",
  played: true,
  skipped: false,
  bankedScore: 0,
  pollenCollected: 0,
  successfulPollinations: 0,
  completedOrders: 0,
  highestCombo: 1,
  hiveReturns: 0,
  hazardCollisions: 0,
  performanceIndex: 0
}
```

Values above are examples; actual counters and score are returned. Only banked points contribute to the index:

```text
performanceIndex = min(1, bankedScore / targetScore)
```

The index is in the range 0–1. Banked points remain the game result; the module never changes Transporter state or scoring.

## Required files

Keep the complete `pollen-rush-module/` directory together. Its asset loader resolves artwork relative to `src/assets.js`; the art remains under `assets/`. The scoped stylesheet at `pollen-rush.css` is automatically attached inside Shadow DOM. No separate CSS import is needed.

## Testing the package independently

From the project root, serve `index.html` over HTTP with VS Code Live Server or another static server. The standalone wrapper imports `pollen-rush-module/index.js` and mounts the same implementation used by the host application. Browser module loading and image loading are not supported from a `file://` URL.
