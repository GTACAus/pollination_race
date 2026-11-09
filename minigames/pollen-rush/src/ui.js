export class UI {
  constructor(root) {
    this.overlay = root.querySelector(".pr-screen-overlay");
    this.title = root.querySelector(".pr-overlay-title");
    this.copy = root.querySelector(".pr-overlay-copy");
    this.results = root.querySelector(".pr-results-content");
    this.primary = root.querySelector(".pr-primary-action");
    this.pause = root.querySelector(".pr-pause-button");
    this.exitButton = root.querySelector(".pr-exit-button");
  }

  showMenu(onPlay) {
    this.overlay.classList.remove("is-hidden");
    this.title.textContent = "Ready to fly?";
    this.copy.textContent = "Collect pollen, pollinate matching flowers, then bank your points at the hive.";
    this.results.hidden = true;
    this.primary.hidden = false;
    this.primary.textContent = "Play";
    this.primary.disabled = false;
    this.primary.onclick = onPlay;
    this.pause.disabled = true;
    this.pause.textContent = "Pause";
  }

  showRunning(paused, onResume, onPause) {
    this.overlay.classList.toggle("is-hidden", !paused);
    this.primary.hidden = false;
    this.pause.disabled = false;
    this.pause.textContent = paused ? "Resume" : "Pause";
    if (paused) {
      this.title.textContent = "Paused";
      this.copy.textContent = "Take a breather. Your flowers and timer are waiting.";
      this.results.hidden = true;
      this.primary.textContent = "Resume";
      this.primary.onclick = onResume;
    } else {
      this.primary.onclick = onPause;
    }
  }

  showResults(stats) {
    this.overlay.classList.remove("is-hidden");
    this.title.textContent = "Trip score recorded";
    this.copy.textContent = "Your banked score is ready for the Transporter.";
    const rows = [
      ["Banked score", stats.bankedScore.toLocaleString()],
      ["Pollen collected", stats.pollenCollected.toLocaleString()],
      ["Successful pollinations", stats.successfulPollinations.toLocaleString()],
      ["Flower orders", stats.completedOrders.toLocaleString()],
      ["Best combo", `×${stats.highestCombo}`],
      ["Hive deposits", stats.hiveReturns.toLocaleString()]
    ];
    this.results.innerHTML = rows.map(([label, value]) =>
      `<span class="result-label">${label}</span><strong class="result-value">${value}</strong>`
    ).join("");
    this.results.hidden = false;
    this.primary.hidden = true;
    this.pause.disabled = true;
    this.pause.textContent = "Pause";
  }

  showError(error) {
    this.overlay.classList.remove("is-hidden");
    this.title.textContent = "Could not load the game";
    this.copy.textContent = error.message;
    this.results.hidden = true;
    this.primary.hidden = true;
    this.pause.disabled = true;
  }

  setExitHandler(onExit) {
    this.exitButton.hidden = !onExit;
    this.exitButton.onclick = onExit;
  }
}
