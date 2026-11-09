import { CONFIG } from "../config.js";
import { loadAssets } from "./assets.js";
import { Effects } from "./effects.js";
import { Bee, Flower, Hive, Wasp } from "./entities.js";
import { Input } from "./input.js";
import { UI } from "./ui.js";

export function mountPollenRush(options = {}) {
const {
  container,
  siteId = null,
  durationSeconds = CONFIG.gameDurationSeconds,
  targetScore = CONFIG.performanceTargetScore,
  onComplete = null,
  onExit = null
} = options;

if (!(container instanceof Element)) {
  throw new TypeError("mountPollenRush requires a container Element.");
}
if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
  throw new RangeError("durationSeconds must be a positive finite number.");
}
if (!Number.isFinite(targetScore) || targetScore <= 0) {
  throw new RangeError("targetScore must be a positive finite number.");
}
if (onComplete !== null && typeof onComplete !== "function") {
  throw new TypeError("onComplete must be a function.");
}
if (onExit !== null && typeof onExit !== "function") {
  throw new TypeError("onExit must be a function.");
}

const mountNode = document.createElement("div");
mountNode.className = "pollen-rush-mount";
const root = mountNode.attachShadow({ mode: "open" });
root.innerHTML = `
  <link rel="stylesheet" href="${new URL("../pollen-rush.css", import.meta.url).href}">
  <main class="game-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">POLLINATION TRANSPORTER</p>
        <h1>Pollen Rush</h1>
      </div>
      <div class="page-tag">MEADOW RUN · 01:00</div>
    </header>
    <section class="game-frame" aria-label="Pollen Rush game">
      <canvas class="pr-game-canvas" width="960" height="540" tabindex="0"
        aria-label="Pollen Rush playfield. Click to move or focus and use WASD or arrow keys."></canvas>
      <div class="screen-overlay pr-screen-overlay">
        <div class="screen-card">
          <p class="eyebrow">A LITTLE BUZZ OF SCIENCE</p>
          <h2 class="pr-overlay-title">Ready to fly?</h2>
          <p class="pr-overlay-copy">Collect pollen, pollinate matching flowers, then bank your points at the hive.</p>
          <div class="results-content pr-results-content" hidden></div>
          <button class="primary-button pr-primary-action" type="button" disabled>Play</button>
        </div>
      </div>
    </section>
    <nav class="game-controls" aria-label="Game controls">
      <p><kbd>WASD</kbd> / <kbd>← ↑ → ↓</kbd> move <span aria-hidden="true">·</span> Click, tap or drag to fly</p>
      <div class="control-buttons">
        <button class="small-button pr-pause-button" type="button" disabled>Pause</button>
        <button class="small-button pr-exit-button" type="button">Exit</button>
      </div>
    </nav>
    <p class="footer-note">Bank your points at the hive before time runs out.</p>
  </main>
`;
container.append(mountNode);

const canvas = root.querySelector(".pr-game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const ui = new UI(root);
const effects = new Effects();
const game = {
  state: "loading",
  assets: null,
  bee: null,
  hive: null,
  flowers: [],
  wasps: [],
  props: [],
  order: [],
  orderIndex: 0,
  comboStreak: 0,
  comboMultiplier: 1,
  comboPulseTime: 0,
  highestCombo: 1,
  pollen: 0,
  unbankedScore: 0,
  bankedScore: 0,
  pollenCollected: 0,
  pollinations: 0,
  completedOrders: 0,
  deposits: 0,
  marker: null,
  remaining: CONFIG.gameDurationSeconds,
  countdown: CONFIG.countdownSeconds,
  spawnClock: 0,
  nextFlowerId: 1,
  elapsed: 0,
  phase: "spring",
  phaseBanner: null,
  basketWarning: 0,
  basketNoticeTime: 0,
  collisionImmunity: 0,
  secondWaspSpawned: false,
  superBloomFlash: 0,
  insideHive: false,
  bankedMessageTime: 0,
  lastDeposit: 0,
  backgroundPattern: null,
  durationSeconds: CONFIG.gameDurationSeconds,
  siteId: null,
  onComplete: null
};
game.durationSeconds = durationSeconds;
game.siteId = siteId;
game.onComplete = onComplete;
game.onExit = onExit;
game.targetScore = targetScore;
game.hazardCollisions = 0;
game.callbackSent = false;
game.exitSent = false;
game.destroyed = false;
game.animationFrameId = null;
game.lastFrameTime = 0;
game.startWhenReady = false;

const input = new Input(canvas, (clientX, clientY) => {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (clientX - bounds.left) * CONFIG.canvas.width / bounds.width,
    y: (clientY - bounds.top) * CONFIG.canvas.height / bounds.height
  };
}, handleEscape, () => game.state === "playing");

ui.primary.onclick = () => game.startRound();
ui.pause.addEventListener("click", () => {
  if (game.state === "playing") pause();
  else if (game.state === "paused") resume();
});
ui.setExitHandler(onExit ? () => exit() : null);

function pause() {
  if (game.state !== "playing") return;
  game.state = "paused";
  ui.showRunning(true, resume, pause);
}

function handleEscape() {
  if (game.state === "playing") pause();
  else if (game.state === "paused") resume();
}

function resume() {
  if (game.state !== "paused") return;
  game.state = "playing";
  canvas.focus();
  ui.showRunning(false, resume, pause);
}

game.startRound = function startRound() {
  if (game.destroyed || !game.assets) return;
  this.bee = new Bee(CONFIG.canvas.width / 2, CONFIG.canvas.height * .68);
  this.hive = new Hive(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
  this.flowers = [];
  this.wasps = [];
  this.props = createProps();
  this.order = shuffled(CONFIG.species);
  this.orderIndex = 0;
  this.comboStreak = 0;
  this.comboMultiplier = 1;
  this.comboPulseTime = 0;
  this.highestCombo = 1;
  this.pollen = 0;
  this.unbankedScore = 0;
  this.bankedScore = 0;
  this.pollenCollected = 0;
  this.pollinations = 0;
  this.completedOrders = 0;
  this.deposits = 0;
  this.hazardCollisions = 0;
  this.marker = null;
  this.remaining = this.durationSeconds;
  this.countdown = CONFIG.countdownSeconds;
  this.spawnClock = CONFIG.flowerSpawnInterval;
  this.nextFlowerId = 1;
  this.elapsed = 0;
  this.phase = "spring";
  this.phaseBanner = null;
  this.basketWarning = 0;
  this.basketNoticeTime = 0;
  this.collisionImmunity = 0;
  this.secondWaspSpawned = false;
  this.superBloomFlash = 0;
  this.insideHive = false;
  this.bankedMessageTime = 0;
  this.lastDeposit = 0;
  effects.items = [];
  this.callbackSent = false;
  this.exitSent = false;
  input.clearTarget();

  for (let i = 0; i < 6; i += 1) spawnFlower();
  this.state = "countdown";
  this.startWhenReady = false;
  canvas.focus();
  ui.showRunning(false, resume, pause);
};

loadAssets()
  .then((assets) => {
    if (game.destroyed) return;
    game.assets = assets;
    game.backgroundPattern = ctx.createPattern(assets.background, "repeat");
    game.bee = new Bee(CONFIG.canvas.width / 2, CONFIG.canvas.height * .68);
    game.hive = new Hive(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
    game.order = shuffled(CONFIG.species);
    game.props = createProps();
    for (let i = 0; i < 6; i += 1) spawnFlower();
    game.state = "menu";
    ui.showMenu(() => game.startRound());
    scheduleFrame();
    if (game.startWhenReady) game.startRound();
  })
  .catch((error) => {
    if (game.destroyed) return;
    console.error(error);
    game.state = "error";
    ui.showError(error);
  });

function frame(timestamp) {
  if (game.destroyed) return;
  const dt = game.lastFrameTime ? Math.min((timestamp - game.lastFrameTime) / 1000, .05) : 0;
  game.lastFrameTime = timestamp;
  if (game.state === "playing") update(dt);
  else if (game.state === "countdown") updateCountdown(dt);
  render();
  scheduleFrame();
}

function scheduleFrame() {
  if (!game.destroyed && game.animationFrameId === null) {
    game.animationFrameId = requestAnimationFrame((timestamp) => {
      game.animationFrameId = null;
      frame(timestamp);
    });
  }
}

function updateCountdown(dt) {
  game.countdown -= dt;
  if (game.countdown <= 0) {
    game.countdown = 0;
    game.state = "playing";
    ui.showRunning(false, resume, pause);
  }
}

function update(dt) {
  game.elapsed += dt;
  game.remaining = Math.max(0, game.durationSeconds - game.elapsed);
  updatePhases();
  if (game.remaining <= 0) {
    finishRound();
    return;
  }

  if (game.phaseBanner) {
    game.phaseBanner.remaining -= dt;
    if (game.phaseBanner.remaining <= 0) game.phaseBanner = null;
  }
  game.collisionImmunity = Math.max(0, game.collisionImmunity - dt);
  game.basketNoticeTime = Math.max(0, game.basketNoticeTime - dt);
  game.superBloomFlash = Math.max(0, game.superBloomFlash - dt);
  game.comboPulseTime = Math.max(0, game.comboPulseTime - dt);
  if (game.marker) {
    game.marker.remaining -= dt;
    if (game.marker.remaining <= 0) game.marker = null;
  }

  const speed = CONFIG.movementSpeed * (1 - game.pollen * CONFIG.speedPenaltyPerPollen);
  const movement = input.getMovement(game.bee.x, game.bee.y);
  game.bee.update(dt, movement, speed, CONFIG.canvas.width, CONFIG.canvas.height);
  for (const wasp of game.wasps) wasp.update(dt, game.bee, game.hive, CONFIG.canvas.width, CONFIG.canvas.height);
  checkWaspCollisions();

  for (const flower of game.flowers) flower.update(dt);
  game.flowers = game.flowers.filter((flower) => !flower.remove);
  game.spawnClock += dt;
  const spawnInterval = game.phase === "superBloom"
    ? CONFIG.superBloom.spawnInterval
    : CONFIG.flowerSpawnInterval;
  if (game.spawnClock >= spawnInterval) {
    game.spawnClock %= spawnInterval;
    if (game.flowers.length < activeFlowerLimit()) spawnFlower();
  }
  maintainFlowerCount();

  visitNearbyFlowers();
  updateHive(dt);
  effects.update(dt);
  if (game.bankedMessageTime > 0) game.bankedMessageTime -= dt;
}

function updatePhases() {
  const phases = CONFIG.phases;
  if (game.phase === "spring" && game.elapsed >= phases.pestAlertStart) {
    game.phase = "pestAlert";
    game.phaseBanner = {
      text: "PEST ALERT! — Watch out for wasps!",
      color: "#ffe27c",
      remaining: phases.alertBannerDuration
    };
    spawnWasp();
  }
  if (!game.secondWaspSpawned && game.elapsed >= CONFIG.wasps.secondSpawnTime) {
    game.secondWaspSpawned = true;
    if (game.wasps.length < CONFIG.wasps.maximum) spawnWasp();
  }
  if (game.elapsed >= phases.superBloomStart && game.phase !== "superBloom") {
    game.phase = "superBloom";
    game.phaseBanner = {
      text: "SUPER BLOOM! — DOUBLE POINTS!",
      color: "#fff077",
      remaining: phases.superBloomBannerDuration
    };
    game.superBloomFlash = .7;
    effects.burst(CONFIG.canvas.width / 2, 158, "", "#fff077", 24);
  }
}

function activeFlowerLimit() {
  return game.phase === "superBloom"
    ? CONFIG.superBloom.maximumFlowers
    : CONFIG.maximumFlowers;
}

function maintainFlowerCount() {
  const minimum = game.phase === "superBloom" ? 11 : CONFIG.minimumFlowers;
  const accessibleCount = game.flowers.filter((flower) =>
    flower.species === currentOrder() &&
    (flower.state === "bud" || flower.state === "opening" || flower.state === "bloom")
  ).length;
  if (accessibleCount < 2 && game.flowers.length < activeFlowerLimit()) {
    spawnFlower(currentOrder());
  } else if (game.flowers.length < minimum && game.flowers.length < activeFlowerLimit()) {
    spawnFlower();
  }
}

function spawnFlower(forcedSpecies = null) {
  if (game.flowers.length >= activeFlowerLimit()) return;
  const margin = CONFIG.flowerKeepAwayFromEdge;
  const speciesCount = game.flowers.filter((flower) =>
    flower.species === currentOrder() &&
    ["bud", "opening", "bloom"].includes(flower.state)
  ).length;
  const species = forcedSpecies ||
    (speciesCount < 2 || Math.random() < .55
      ? currentOrder()
      : CONFIG.species[Math.floor(Math.random() * CONFIG.species.length)]);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const x = margin + Math.random() * (CONFIG.canvas.width - margin * 2);
    const y = 100 + Math.random() * (CONFIG.canvas.height - 230);
    const awayFromHive = Math.hypot(x - game.hive.x, y - game.hive.y) >= CONFIG.flowerKeepAwayFromHive;
    const awayFromBee = Math.hypot(x - game.bee.x, y - game.bee.y) >= 92;
    const awayFromOthers = game.flowers.every((flower) =>
      Math.hypot(x - flower.x, y - flower.y) >= CONFIG.flowerKeepAwayFromFlowers
    );
    const awayFromWasps = game.wasps.every((wasp) => Math.hypot(x - wasp.x, y - wasp.y) >= 48);
    if (awayFromHive && awayFromBee && awayFromOthers && awayFromWasps) {
      const duration = CONFIG.flowerBloomDurationMin +
        Math.random() * (CONFIG.flowerBloomDurationMax - CONFIG.flowerBloomDurationMin);
      game.flowers.push(new Flower(game.nextFlowerId++, x, y, species, duration));
      return;
    }
  }
}

function spawnWasp() {
  if (game.wasps.length >= CONFIG.wasps.maximum) return;
  const hive = game.hive;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const x = 70 + Math.random() * (CONFIG.canvas.width - 140);
    const y = 100 + Math.random() * (CONFIG.canvas.height - 190);
    if (Math.hypot(x - game.bee.x, y - game.bee.y) < CONFIG.wasps.spawnBeeClearance) continue;
    if (Math.hypot(x - hive.x, y - hive.y) < CONFIG.wasps.hiveSafeRadius + 25) continue;
    if (game.wasps.some((wasp) => Math.hypot(x - wasp.x, y - wasp.y) < 120)) continue;
    game.wasps.push(new Wasp(x, y, Math.random() * Math.PI * 2));
    return;
  }
}

function checkWaspCollisions() {
  if (game.collisionImmunity > 0) return;
  const wasp = game.wasps.find((hazard) =>
    Math.hypot(game.bee.x - hazard.x, game.bee.y - hazard.y) <=
      CONFIG.beeRadius + CONFIG.wasps.collisionRadius
  );
  if (!wasp) return;

  setPollen(Math.max(0, game.pollen - 1));
  const lostScore = Math.floor(game.unbankedScore * CONFIG.wasps.scoreLossFraction);
  game.unbankedScore -= lostScore;
  game.collisionImmunity = CONFIG.wasps.immunitySeconds;
  game.bee.damageTime = CONFIG.wasps.immunitySeconds;
  game.hazardCollisions += 1;
  game.marker = null;
  effects.burst(game.bee.x, game.bee.y, lostScore > 0 ? `-${lostScore} Points!` : "Stung!", "#ffb17a",
    CONFIG.effects.damageParticleCount);
}

function setPollen(value) {
  const previous = game.pollen;
  game.pollen = Math.max(0, Math.min(CONFIG.pollenCapacity, value));
  const threshold = game.pollen >= CONFIG.basketWarnings.fullAt
    ? CONFIG.basketWarnings.fullAt
    : game.pollen >= CONFIG.basketWarnings.nearlyFullAt
      ? CONFIG.basketWarnings.nearlyFullAt
      : 0;
  if (threshold === game.basketWarning) return;
  game.basketWarning = threshold;
  if (threshold === CONFIG.basketWarnings.fullAt) {
    game.basketNoticeTime = 2.2;
    effects.burst(game.bee.x, game.bee.y - 28, "Basket Full! Return to Hive!", "#ff9a67", 4);
  } else if (threshold === CONFIG.basketWarnings.nearlyFullAt) {
    game.basketNoticeTime = 1.8;
    effects.burst(game.bee.x, game.bee.y - 28, "Basket Nearly Full!", "#ffd16b", 4);
  } else if (previous >= CONFIG.basketWarnings.nearlyFullAt) {
    game.basketNoticeTime = 0;
    effects.clearText("Basket ");
  }
}

function visitNearbyFlowers() {
  for (const flower of game.flowers) {
    if (flower.state !== "bloom" || flower.visited) continue;
    if (Math.hypot(game.bee.x - flower.x, game.bee.y - flower.y) >
      CONFIG.beeRadius + CONFIG.flowerRadius) continue;
    if (!flower.visit()) continue;

    if (game.pollen < CONFIG.pollenCapacity) {
      setPollen(game.pollen + 1);
      game.pollenCollected += 1;
      const points = CONFIG.collectionPoints * scoreMultiplier();
      game.unbankedScore += points;
      effects.burst(flower.x, flower.y, `+${points} Pollen!`, "#fff48b",
        game.phase === "superBloom" ? CONFIG.superBloom.collectionParticleCount : 7);
    }

    const markerCanPollinate = game.marker &&
      game.marker.species === flower.species &&
      game.marker.flowerId !== flower.id &&
      game.marker.remaining > 0;
    if (markerCanPollinate) {
      pollinate(flower);
    } else {
      effects.burst(flower.x, flower.y - 8,
        `Visit another ${capitalize(flower.species)}!`, "#fff3c5", 4);
    }

    game.marker = {
      species: flower.species,
      flowerId: flower.id,
      remaining: CONFIG.pollinationMarkerLifetime
    };
  }
}

function pollinate(flower) {
  game.pollinations += 1;
  const requiredSpecies = currentOrder();
  if (flower.species === requiredSpecies) {
    game.comboStreak += 1;
    const comboIndex = Math.min(game.comboStreak - 1, CONFIG.comboMultipliers.length - 1);
    game.comboMultiplier = CONFIG.comboMultipliers[comboIndex];
    if (game.comboStreak > 1) game.comboPulseTime = .8;
    game.highestCombo = Math.max(game.highestCombo, game.comboMultiplier);
    game.completedOrders += 1;
    game.orderIndex += 1;
    if (game.orderIndex >= game.order.length) {
      game.order = shuffled(CONFIG.species);
      game.orderIndex = 0;
    }
    effects.burst(flower.x, flower.y - 14,
      game.comboStreak > 1
        ? `Order! Combo ×${game.comboMultiplier}`
        : "Order Complete!",
      "#fff08a", 9);
  } else {
    game.comboStreak = 0;
    game.comboMultiplier = 1;
    effects.burst(flower.x, flower.y - 14,
      `Need ${capitalize(requiredSpecies)} next!`, "#ffd0bd", 7);
  }

  const points = Math.round(CONFIG.pollinationPoints * game.comboMultiplier * scoreMultiplier());
  game.unbankedScore += points;
  effects.burst(flower.x, flower.y, `+${points} Pollination!`, "#d8f6ff",
    game.phase === "superBloom" ? CONFIG.superBloom.pollinationParticleCount : 10);
}

function scoreMultiplier() {
  return game.phase === "superBloom" ? CONFIG.superBloom.scoreMultiplier : 1;
}

function updateHive(dt) {
  game.hive.update(dt);
  const distance = Math.hypot(game.bee.x - game.hive.x, game.bee.y - game.hive.y);
  const inside = distance <= CONFIG.hiveDepositRadius;
  if (inside && !game.insideHive && (game.unbankedScore > 0 || game.pollen > 0)) {
    const deposited = game.unbankedScore;
    game.lastDeposit = deposited;
    game.bankedScore += game.unbankedScore;
    game.unbankedScore = 0;
    setPollen(0);
    game.marker = null;
    game.deposits += 1;
    game.bankedMessageTime = 1.8;
    game.hive.setState(2);
    effects.travel(game.bee.x, game.bee.y, game.hive.x, game.hive.y, "#ffe16b",
      CONFIG.effects.depositParticleCount);
    effects.burst(game.hive.x, game.hive.y - 25,
      `+${deposited} Banked!`, "#fff49a", CONFIG.effects.depositParticleCount);
  } else if (game.hive.state !== 2) {
    const fullBasket = game.pollen >= CONFIG.basketWarnings.fullAt;
    game.hive.setState(fullBasket && distance < 100 ? 3 : distance < 88 ? 1 : 0);
  }
  game.insideHive = inside;
}

function currentOrder() {
  return game.order[game.orderIndex] || CONFIG.species[0];
}

function finishRound() {
  game.state = "results";
  input.clearTarget();
  const result = buildResults(true, false);
  ui.showResults(result);
  sendCompletion(result);
}

function buildResults(played, skipped) {
  return {
    siteId: game.siteId,
    played,
    skipped,
    bankedScore: skipped ? 0 : game.bankedScore,
    pollenCollected: game.pollenCollected,
    successfulPollinations: game.pollinations,
    completedOrders: game.completedOrders,
    highestCombo: game.highestCombo,
    hiveReturns: game.deposits,
    hazardCollisions: game.hazardCollisions,
    performanceIndex: skipped ? 0 : Math.min(1, game.bankedScore / game.targetScore)
  };
}

function sendCompletion(result) {
  if (game.callbackSent) return;
  game.callbackSent = true;
  if (game.onComplete) {
    try {
      game.onComplete(result);
    } catch (error) {
      console.error("Pollen Rush completion callback failed.", error);
    }
  }
}

function skip() {
  if (game.destroyed || game.state === "results" || game.state === "error") return;
  game.state = "results";
  input.clearTarget();
  const result = buildResults(false, true);
  ui.showResults(result);
  sendCompletion(result);
  exit();
}

function exit() {
  if (game.exitSent || game.destroyed) return;
  game.exitSent = true;
  if (game.state !== "results" && game.state !== "error") {
    game.state = "exited";
    input.clearTarget();
  }
  if (game.onExit) {
    try {
      game.onExit();
    } catch (error) {
      console.error("Pollen Rush exit callback failed.", error);
    }
  }
}

function destroy() {
  if (game.destroyed) return;
  game.destroyed = true;
  game.state = "destroyed";
  if (game.animationFrameId !== null) {
    cancelAnimationFrame(game.animationFrameId);
    game.animationFrameId = null;
  }
  input.destroy();
  mountNode.remove();
}

return Object.freeze({
  start() {
    if (game.destroyed || game.state === "countdown" || game.state === "playing" || game.state === "paused") return;
    if (!game.assets) {
      game.startWhenReady = true;
      return;
    }
    game.startRound();
  },
  pause,
  resume,
  restart() {
    if (game.destroyed) return;
    if (!game.assets) {
      game.startWhenReady = true;
      return;
    }
    game.startRound();
  },
  skip,
  exit,
  destroy
});

function render() {
  if (!game.assets) return;
  drawBackground();
  drawDecorations();
  for (const flower of game.flowers) {
    flower.draw(ctx, game.assets, game.elapsed, game.phase === "superBloom");
  }
  game.hive.draw(ctx, game.assets.hive);
  for (const wasp of game.wasps) wasp.draw(ctx, game.assets.wasp, game.collisionImmunity > 0);
  if (game.bee) game.bee.draw(ctx, game.assets, game.pollen);
  effects.draw(ctx);
  drawHud();

  if (game.state === "countdown") {
    const number = Math.max(1, Math.ceil(game.countdown));
    drawCenterMessage(String(number), "GET READY!");
  } else if (game.state === "paused") {
    drawCenterMessage("PAUSED", "Take your time, pollinator.");
  }
}

function drawBackground() {
  ctx.fillStyle = "#a6ce7b";
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  if (game.backgroundPattern) {
    ctx.fillStyle = game.backgroundPattern;
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  }
  if (game.superBloomFlash > 0) {
    ctx.fillStyle = `rgba(255, 246, 171, ${game.superBloomFlash * .17})`;
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  }
}

function createProps() {
  const props = [];
  for (let i = 0; i < 46; i += 1) {
    const x = 14 + Math.random() * (CONFIG.canvas.width - 28);
    const y = 16 + Math.random() * (CONFIG.canvas.height - 32);
    const hiveClear = Math.hypot(x - CONFIG.canvas.width / 2, y - CONFIG.canvas.height / 2) > 58;
    if (hiveClear) props.push({ x, y, frame: Math.floor(Math.random() * 7) });
  }
  return props;
}

function drawDecorations() {
  if (!game.assets) return;
  for (const prop of game.props) {
    ctx.drawImage(game.assets.props, prop.frame * 32, 0, 32, 32,
      Math.round(prop.x - 16), Math.round(prop.y - 16), 32, 32);
  }
}

function drawHud() {
  drawPanel(14, 12, 132, 58);
  ctx.fillStyle = "#e7f2c9";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText("TIME", 25, 30);
  const finalTen = game.remaining <= 10 && game.state === "playing";
  const timerPulse = finalTen ? .85 + .15 * Math.sin(game.elapsed * 8) : 1;
  ctx.font = `bold ${finalTen ? 23 + Math.round(timerPulse * 3) : 23}px 'Courier New', monospace`;
  ctx.fillStyle = game.remaining <= 5 ? "#ff886e" : finalTen ? "#ffd06d" :
    game.remaining <= 20 ? "#ffb17a" : "#fff3c5";
  ctx.fillText(formatTime(game.remaining), 24, 57);

  drawPanel(298, 10, 364, 88);
  ctx.textAlign = "center";
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillStyle = "#e7f2c9";
  ctx.fillText("FLOWER ORDERS · PAIR SAME COLOR", 480, 25);
  const startX = 390;
  for (let i = 0; i < game.order.length; i += 1) {
    const x = startX + i * 90;
    const current = i === game.orderIndex;
    if (current) {
      ctx.strokeStyle = "#fff07c";
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 25, 28, 50, 52);
    }
    ctx.drawImage(game.assets[`icon_${game.order[i]}`], x - 18, 30, 36, 36);
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.fillStyle = current ? "#fff07c" : "#e7f2c9";
    ctx.fillText(capitalize(game.order[i]), x, 78);
    if (i < game.order.length - 1) {
      ctx.fillStyle = "#f4efc6";
      ctx.font = "bold 17px 'Courier New', monospace";
      ctx.fillText("›", x + 44, 56);
    }
  }

  drawPanel(820, 12, 126, 72);
  ctx.textAlign = "center";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = "#e7f2c9";
  ctx.fillText("COMBO", 883, 30);
  const comboPulse = game.comboPulseTime > 0
    ? 1 + .3 * Math.sin((.8 - game.comboPulseTime) / .8 * Math.PI)
    : 1;
  ctx.font = `bold ${Math.round(22 * comboPulse)}px 'Courier New', monospace`;
  ctx.fillStyle = game.comboStreak > 1 || game.comboPulseTime > 0 ? "#fff07c" : "#fff3c5";
  ctx.fillText(`×${game.comboMultiplier}`, 883, 57);
  if (game.phase === "superBloom") {
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.fillStyle = "#fff07c";
    ctx.fillText("×2 POINTS", 883, 75);
  }

  drawPanel(14, 462, 310, 62);
  ctx.textAlign = "left";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = "#e7f2c9";
  ctx.fillText("POLLEN BASKET", 25, 480);
  ctx.fillText("POLLEN MARKER", 190, 480);
  for (let i = 0; i < CONFIG.pollenCapacity; i += 1) {
    const warning = game.basketWarning === CONFIG.basketWarnings.fullAt
      ? "#ff805d"
      : game.basketWarning === CONFIG.basketWarnings.nearlyFullAt
        ? "#ffbf55"
        : "#ffd34e";
    const basketPulse = game.basketWarning > 0
      ? .78 + .22 * Math.sin(game.elapsed * 7) ** 2
      : 1;
    ctx.globalAlpha = i < game.pollen ? basketPulse : 1;
    ctx.fillStyle = i < game.pollen ? warning : "#647b53";
    ctx.fillRect(27 + i * 31, 490, 22, 18);
    ctx.strokeStyle = "#dce9b8";
    ctx.lineWidth = 1;
    ctx.strokeRect(27 + i * 31, 490, 22, 18);
    ctx.globalAlpha = 1;
  }
  if (game.marker) {
    ctx.drawImage(game.assets[`icon_${game.marker.species}`], 190, 486, 26, 26);
    ctx.font = "bold 10px 'Courier New', monospace";
    ctx.fillStyle = "#fff3c5";
    ctx.fillText(`${capitalize(game.marker.species)} ${Math.ceil(game.marker.remaining)}s`, 220, 504);
  } else {
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillStyle = "#b9c9a1";
    ctx.fillText("NONE", 190, 504);
  }

  drawPanel(710, 458, 236, 66);
  ctx.textAlign = "left";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = "#e7f2c9";
  ctx.fillText("BANKED", 724, 478);
  ctx.fillText("UNBANKED", 824, 478);
  ctx.font = "bold 19px 'Courier New', monospace";
  ctx.fillStyle = "#fff3c5";
  ctx.fillText(String(game.bankedScore).padStart(4, "0"), 724, 510);
  ctx.fillStyle = "#ffdf74";
  ctx.fillText(String(game.unbankedScore).padStart(4, "0"), 824, 510);

  drawPanel(374, 461, 212, 34);
  ctx.textAlign = "center";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = game.phase === "superBloom" ? "#fff07c" : "#e7f2c9";
  ctx.fillText(game.phase === "superBloom" ? "SUPER BLOOM · ×2 · WASPS" :
    game.phase === "pestAlert" ? "PEST ALERT · WASPS ACTIVE" : "SPRING BLOOM", 480, 483);

  if (game.basketNoticeTime > 0 && game.basketWarning > 0) {
    const full = game.basketWarning === CONFIG.basketWarnings.fullAt;
    ctx.textAlign = "center";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillStyle = full ? "#ff9a67" : "#ffd16b";
    ctx.strokeStyle = "#29432e";
    ctx.lineWidth = 3;
    const message = full ? "BASKET FULL! RETURN TO HIVE!" : "BASKET NEARLY FULL!";
    ctx.strokeText(message, 480, 449);
    ctx.fillText(message, 480, 449);
  }

  if (game.phase === "pestAlert" || game.phase === "superBloom") {
    const info = game.phase === "superBloom"
      ? "SUPER BLOOM · DOUBLE POINTS · WASPS ACTIVE"
      : "PEST ALERT · WATCH FOR WASPS";
    ctx.textAlign = "center";
    ctx.font = "bold 10px 'Courier New', monospace";
    ctx.fillStyle = game.phase === "superBloom" ? "#fff07c" : "#ffe27c";
    ctx.fillText(info, 480, 119);
  }

  if (game.phaseBanner) {
    const alpha = Math.min(1, game.phaseBanner.remaining * 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(35, 62, 39, .92)";
    ctx.fillRect(262, 128, 436, 42);
    ctx.strokeStyle = game.phaseBanner.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(262, 128, 436, 42);
    ctx.textAlign = "center";
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillStyle = game.phaseBanner.color;
    ctx.fillText(game.phaseBanner.text, 480, 155);
    ctx.globalAlpha = 1;
  }

  if (game.bankedMessageTime > 0) {
    ctx.textAlign = "center";
    ctx.font = "bold 15px 'Courier New', monospace";
    ctx.fillStyle = "#fff49a";
    ctx.strokeStyle = "#28452f";
    ctx.lineWidth = 4;
    ctx.strokeText(`+${game.lastDeposit} Points Banked!`, 480, 187);
    ctx.fillText(`+${game.lastDeposit} Points Banked!`, 480, 187);
  }
}

function drawCenterMessage(title, subtitle) {
  ctx.fillStyle = "rgba(33, 57, 34, .78)";
  ctx.fillRect(346, 205, 268, 116);
  ctx.strokeStyle = "#e8d878";
  ctx.lineWidth = 3;
  ctx.strokeRect(346, 205, 268, 116);
  ctx.textAlign = "center";
  ctx.font = "bold 45px 'Courier New', monospace";
  ctx.fillStyle = "#fff19a";
  ctx.fillText(title, 480, 263);
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = "#f4f2d5";
  ctx.fillText(subtitle, 480, 292);
}

function drawPanel(x, y, width, height) {
  ctx.fillStyle = "rgba(35, 62, 39, .88)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#d8dfaa";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
}

function formatTime(seconds) {
  const total = Math.ceil(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

}
