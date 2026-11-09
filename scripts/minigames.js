// Mini-game bridge: loads the Grant Grab and Pollen Rush ES modules on demand
// and exposes promise-based helpers to game.js (a classic script).
(function () {
  const BASE = new URL('../minigames/', document.currentScript.src);
  const GRANT_GRAB_URL = new URL('grant-grab/grant-grab.js', BASE).href;
  const GRANT_GRAB_ASSETS = new URL('grant-grab/grant-grab-assets/', BASE).href;
  const POLLEN_RUSH_URL = new URL('pollen-rush/index.js', BASE).href;

  /**
   * Grant Grab: play to top up the starting funding.
   * Resolves with { finalFunding, bonusFunding, skipped }.
   */
  async function runGrantGrab({ container, skipButton, initialFunding, maxBonus }) {
    container.replaceChildren();
    let game = null;
    let settled = false;
    let latest = null;
    return new Promise((resolve) => {
      const finish = (result) => {
        if (settled) return;
        settled = true;
        skipButton.onclick = null;
        try { game?.destroy(); } catch (_) { /* already gone */ }
        container.replaceChildren();
        resolve(result);
      };
      skipButton.onclick = () => finish({
        finalFunding: latest?.finalFunding ?? initialFunding,
        bonusFunding: latest?.bonusFunding ?? 0,
        skipped: !latest
      });
      import(GRANT_GRAB_URL).then(({ mountGrantGrab }) => {
        if (settled) return;
        game = mountGrantGrab(container, {
          initialFunding,
          assetBaseUrl: GRANT_GRAB_ASSETS,
          config: { maxBonus },
          continueLabel: 'Continue to the Transporter Workshop ▶',
          onComplete(result) {
            latest = result;
            skipButton.textContent = 'Continue with this funding ▶';
          },
          onContinue(result) {
            finish({ finalFunding: result.finalFunding, bonusFunding: result.bonusFunding, skipped: false });
          }
        });
        game.start();
      }).catch((error) => {
        console.error('Grant Grab failed to load', error);
        finish({ finalFunding: initialFunding, bonusFunding: 0, skipped: true, error });
      });
    });
  }

  /**
   * Pollen Rush: 60-second meadow round. Resolves with the module's result
   * object ({ played, skipped, performanceIndex, bankedScore, ... }).
   */
  async function runPollenRush({ container, siteId, onFinished }) {
    container.replaceChildren();
    const { mountPollenRush } = await import(POLLEN_RUSH_URL);
    let settled = false;
    let game = null;
    return new Promise((resolve) => {
      const done = (result) => {
        if (settled) return;
        settled = true;
        onFinished?.(result);
        resolve(result);
      };
      game = mountPollenRush({
        container,
        siteId,
        onComplete: (result) => done(result),
        onExit: () => done({ siteId, played: false, skipped: true, performanceIndex: 0, bankedScore: 0 })
      });
      game.start();
      runPollenRush.current = {
        skip: () => { try { game.skip(); } catch (_) { done({ siteId, played: false, skipped: true, performanceIndex: 0, bankedScore: 0 }); } },
        destroy: () => { try { game.destroy(); } catch (_) { /* ignore */ } container.replaceChildren(); }
      };
    });
  }

  window.Minigames = { runGrantGrab, runPollenRush };
})();
