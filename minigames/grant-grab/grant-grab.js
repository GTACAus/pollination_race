var C = Object.defineProperty;
var T = (l, t, e) => t in l ? C(l, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : l[t] = e;
var r = (l, t, e) => T(l, typeof t != "symbol" ? t + "" : t, e);
const x = {
  introDuration: 3,
  gameplayDuration: 20,
  resultsDuration: 5,
  rejectedApplicationGracePeriod: 3,
  difficultyTransitionDuration: 1,
  maxBonus: 2e4,
  basketSpeed: 680,
  basketWidth: 80,
  basketHeight: 25,
  itemFallSpeed: 145,
  fallSpeedMultiplier: 1,
  spawnRateMultiplier: 1,
  rejectedChanceMultiplier: 1,
  penaltyDuration: 2,
  penaltySpeedMultiplier: 0.5,
  stages: [
    { startsAt: 0, speedMultiplier: 1, rejectedChance: 0, spawnInterval: 1.2 },
    { startsAt: 3, speedMultiplier: 1.2, rejectedChance: 0.1, spawnInterval: 1 },
    { startsAt: 8, speedMultiplier: 1.5, rejectedChance: 0.2, spawnInterval: 0.8 },
    { startsAt: 14, speedMultiplier: 1.9, rejectedChance: 0.3, spawnInterval: 0.65 }
  ],
  items: [
    { type: "community", label: "Community Donation", value: 1e3, color: "#5ee27c", weight: 55 },
    { type: "growers", label: "Local Growers' Sponsorship", value: 2e3, color: "#53b9ff", weight: 25 },
    { type: "research", label: "Agricultural Research Grant", value: 3e3, color: "#c084fc", weight: 15 },
    { type: "innovation", label: "Major Innovation Grant", value: 5e3, color: "#ffd447", weight: 5 },
    { type: "rejected", label: "Rejected Application", value: 0, color: "#ff5b67" }
  ]
};
function D(l = {}) {
  const t = {
    ...x,
    ...l,
    stages: l.stages ?? x.stages,
    items: l.items ?? x.items
  };
  if (!Number.isFinite(t.maxBonus) || t.maxBonus < 0)
    throw new RangeError("The maximum bonus must be a non-negative number.");
  if (!Number.isFinite(t.basketSpeed) || t.basketSpeed <= 0)
    throw new RangeError("Basket speed must be greater than zero.");
  if (!Number.isFinite(t.itemFallSpeed) || t.itemFallSpeed <= 0)
    throw new RangeError("Item falling speed must be greater than zero.");
  if (!Number.isFinite(t.spawnRateMultiplier) || t.spawnRateMultiplier <= 0)
    throw new RangeError("Spawn rate multiplier must be greater than zero.");
  if (!Number.isFinite(t.fallSpeedMultiplier) || t.fallSpeedMultiplier <= 0)
    throw new RangeError("Fall speed multiplier must be greater than zero.");
  if (!Number.isFinite(t.rejectedChanceMultiplier) || t.rejectedChanceMultiplier < 0)
    throw new RangeError("Rejected application chance multiplier cannot be negative.");
  if (!Number.isFinite(t.introDuration) || t.introDuration <= 0 || !Number.isFinite(t.gameplayDuration) || t.gameplayDuration <= 0 || !Number.isFinite(t.resultsDuration) || t.resultsDuration < 0)
    throw new RangeError("Game phase durations must be valid positive numbers.");
  if (!Number.isFinite(t.penaltyDuration) || t.penaltyDuration <= 0 || !Number.isFinite(t.penaltySpeedMultiplier) || t.penaltySpeedMultiplier < 0.5 || t.penaltySpeedMultiplier > 1)
    throw new RangeError("Slowdown settings must retain between 50% and 100% basket speed.");
  if (!Number.isFinite(t.rejectedApplicationGracePeriod) || t.rejectedApplicationGracePeriod < 3)
    throw new RangeError("Rejected applications must have at least three seconds of grace.");
  if (!Number.isFinite(t.difficultyTransitionDuration) || t.difficultyTransitionDuration <= 0)
    throw new RangeError("Difficulty transition duration must be greater than zero.");
  const e = t.items.filter((i) => i.type !== "rejected");
  if (e.length === 0 || e.some((i) => !Number.isFinite(i.weight) || (i.weight ?? 0) <= 0))
    throw new RangeError("Each positive funding item must have a positive spawn weight.");
  if (!t.stages.length || t.stages[0].startsAt !== 0)
    throw new RangeError("Difficulty stages must start at zero seconds.");
  if (t.stages.some(
    (i, s) => !Number.isFinite(i.startsAt) || s > 0 && i.startsAt <= t.stages[s - 1].startsAt || !Number.isFinite(i.rejectedChance) || i.rejectedChance < 0 || i.rejectedChance > 1 || !Number.isFinite(i.spawnInterval) || i.spawnInterval <= 0 || !Number.isFinite(i.speedMultiplier) || i.speedMultiplier <= 0
  ))
    throw new RangeError("Difficulty stages must have increasing times and valid values.");
  return t;
}
const k = "/grant-grab-assets/", F = {
  background: "backgrounds/gtac_lab_background.png",
  scientist: "characters/scientist_atlas.png",
  fundingItems: "items/funding_items_atlas.png"
};
function N(l = k) {
  const t = l.endsWith("/") ? l : `${l}/`;
  return {
    background: `${t}${F.background}`,
    scientist: `${t}${F.scientist}`,
    fundingItems: `${t}${F.fundingItems}`
  };
}
const g = {
  width: 200,
  height: 250,
  baselineY: 520
}, R = {
  x: 0.3,
  y: 0.48,
  width: 0.4,
  height: 0.1
}, A = {
  left: R.x,
  top: g.baselineY - g.height + g.height * R.y,
  width: g.width * R.width,
  height: g.height * R.height
}, j = {
  frameWidth: 256,
  frameHeight: 320,
  columns: 5
}, E = {
  animations: {
    idle: {
      frames: [0, 5, 0, 1, 0],
      durationsMs: [360, 300, 390, 130, 380]
    },
    walk: {
      frames: [2, 6, 3, 7],
      durationsMs: [135, 135, 135, 135]
    },
    rejected: {
      frames: [4, 8, 4, 9],
      durationsMs: [160, 140, 180, 160]
    }
  }
}, L = {
  items: {
    community_donation: { x: 0, y: 0, width: 128, height: 128 },
    growers_sponsorship: { x: 128, y: 0, width: 128, height: 128 },
    research_grant: { x: 256, y: 0, width: 128, height: 128 },
    innovation_grant: { x: 384, y: 0, width: 128, height: 128 },
    rejected_application: { x: 512, y: 0, width: 128, height: 128 }
  }
};
function G(l, t, e = 1) {
  let i = 0;
  for (; i + 1 < t.length && l >= t[i + 1].startsAt; )
    i += 1;
  const s = t[i], n = t[i - 1];
  if (!n)
    return {
      speedMultiplier: s.speedMultiplier,
      rejectedChance: s.rejectedChance,
      spawnInterval: s.spawnInterval
    };
  const a = Math.max(0, Math.min(1, (l - s.startsAt) / e));
  return {
    speedMultiplier: n.speedMultiplier + (s.speedMultiplier - n.speedMultiplier) * a,
    rejectedChance: s.rejectedChance,
    spawnInterval: n.spawnInterval + (s.spawnInterval - n.spawnInterval) * a
  };
}
function P(l, t) {
  const e = t.stages.find((i) => i.rejectedChance > 0);
  return e !== void 0 && l >= Math.max(t.rejectedApplicationGracePeriod, e.startsAt);
}
function B(l, t, e) {
  return Math.min(e, l + t);
}
function _(l, t) {
  return Math.max(l, t);
}
function U(l, t, e, i) {
  return {
    initialFunding: l,
    bonusFunding: t,
    finalFunding: l + t,
    grantsCollected: e,
    rejectedApplicationsCaught: i
  };
}
const h = 960, M = 540, $ = '"Courier New", monospace', z = {
  community: "community_donation",
  growers: "growers_sponsorship",
  research: "research_grant",
  innovation: "innovation_grant",
  rejected: "rejected_application"
};
class O {
  constructor(t, e, i = k) {
    r(this, "context");
    r(this, "reducedMotion", window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    r(this, "artwork", null);
    r(this, "latestState", null);
    r(this, "scientistState", "idle");
    r(this, "scientistFrame", 0);
    r(this, "scientistFrameElapsed", 0);
    r(this, "assetUrls");
    this.canvas = t, this.onAssetError = e, this.assetBaseUrl = i;
    const s = t.getContext("2d", { alpha: !1 });
    if (!s)
      throw new Error("Grant Grab could not create a 2D canvas context.");
    this.context = s, this.assetUrls = N(this.assetBaseUrl), this.loadArtwork();
  }
  resize() {
    const t = this.canvas.getBoundingClientRect(), e = Math.min(window.devicePixelRatio || 1, 2), i = Math.max(1, Math.round(t.width * e)), s = Math.max(1, Math.round(t.height * e));
    (this.canvas.width !== i || this.canvas.height !== s) && (this.canvas.width = i, this.canvas.height = s);
  }
  draw(t, e = 0) {
    this.latestState = t, this.updateScientistAnimation(t, e);
    const i = this.context, s = this.canvas.width / h, n = this.canvas.height / M;
    i.setTransform(1, 0, 0, 1, 0, 0), i.fillStyle = "#101824", i.fillRect(0, 0, this.canvas.width, this.canvas.height), i.setTransform(s, 0, 0, n, 0, 0), i.imageSmoothingEnabled = !1, this.drawBackground(t.elapsed), this.drawHud(t);
    const a = t.phase === "intro" && !this.reducedMotion ? h / 2 + Math.sin(t.elapsed * Math.PI * 2 / 1.7) * 150 : t.phase === "intro" ? h / 2 : t.basketX;
    for (const o of t.items)
      this.drawItem(o.type, o.x, o.y);
    if (this.artwork ? this.drawScientist(a) : this.drawBasket(a, t.basketWidth, t.basketHeight, t.slowedFor > 0), t.phase === "playing" && this.drawFrenzy(t.elapsed, t.frenzyAt), !this.reducedMotion)
      for (const o of t.particles)
        i.globalAlpha = Math.max(0, o.life / o.duration), i.fillStyle = o.color, i.fillRect(Math.round(o.x), Math.round(o.y), o.size, o.size);
    i.globalAlpha = 1;
    for (const o of t.floatingTexts)
      i.globalAlpha = Math.min(1, o.life / 0.18), this.text(o.text, o.x, o.y, 16, o.color, "center");
    i.globalAlpha = 1, t.phase === "intro" ? this.drawIntro(t) : t.phase === "results" && this.drawResults(t);
  }
  drawBackground(t) {
    const e = this.context;
    if (e.fillStyle = "#101824", e.fillRect(0, 0, h, M), this.artwork)
      e.drawImage(this.artwork.background, 0, 0, h, M);
    else {
      e.fillStyle = "#172534", e.fillRect(0, 144, h, 396);
      for (let i = 18; i < h; i += 48)
        for (let s = 158; s < 510; s += 48)
          e.fillStyle = (i / 48 + s / 48) % 2 < 1 ? "#1a2938" : "#182635", e.fillRect(i, s, 2, 2);
      e.fillStyle = "#26394a", e.fillRect(0, 510, h, 30), e.fillStyle = "#527b61", e.fillRect(0, 510, h, 4);
    }
    e.fillStyle = "rgba(10, 20, 32, 0.84)", e.fillRect(0, 0, h, 145);
  }
  drawHud(t) {
    const e = this.context;
    this.text("GRANT GRAB!", 34, 41, 22, "#f5f8ff"), this.text("TOTAL FUNDING", h / 2, 20, 12, "#9cb2c6", "center"), this.text(this.money(t.initialFunding + t.bonusFunding), h / 2, 54, 27, "#ffffff", "center");
    const i = t.phase === "results" ? "TIME  00" : `TIME  ${Math.ceil(t.remaining).toString().padStart(2, "0")}`;
    this.text(i, 926, 40, 18, "#f5f8ff", "right");
    const s = 44, n = 76, a = 872, o = 32, c = 3, d = (a - (o - 1) * c) / o, u = t.initialFunding + t.maxBonus, p = u === 0 ? 0 : Math.min(o, t.initialFunding / u * o), f = u === 0 ? 0 : Math.min(o - p, t.bonusFunding / u * o);
    for (let m = 0; m < o; m += 1) {
      const v = s + m * (d + c);
      e.fillStyle = "#263545", e.fillRect(Math.round(v), n, Math.ceil(d), 17);
      const y = Math.max(0, Math.min(1, p - m)), S = Math.max(0, Math.min(1, p + f - m) - y);
      y > 0 && (e.fillStyle = "#4aa8ff", e.fillRect(Math.round(v), n, d * y, 17)), S > 0 && (e.fillStyle = "#55dc83", e.fillRect(
        v + d * y,
        n,
        d * S,
        17
      )), (y > 0 || S > 0) && (e.fillStyle = "rgba(255,255,255,0.12)", e.fillRect(Math.round(v), n, Math.ceil(d * (y + S)), 3));
    }
    this.text(`STARTING: ${this.money(t.initialFunding)}`, s, 115, 12, "#83c2ff"), this.text(`BONUS: +${this.money(t.bonusFunding)}`, h - s, 115, 12, "#7af09a", "right"), this.text("GRANTS", h / 2, 115, 11, "#8da2b7", "center"), t.slowedFor > 0 && (this.text("SLOWED!", h / 2, 130, 12, "#ff6874", "center"), e.fillStyle = "#442730", e.fillRect(h / 2 - 46, 139, 92, 4), e.fillStyle = "#ff6874", e.fillRect(
      h / 2 - 46,
      139,
      92 * Math.min(1, t.slowedFor / t.penaltyDuration),
      4
    ));
  }
  drawIntro(t) {
    const e = this.context;
    e.fillStyle = "rgba(8, 15, 24, 0.84)", e.fillRect(116, 154, 728, 286), e.strokeStyle = "#5ba2d9", e.lineWidth = 4, e.strokeRect(118, 156, 724, 282), this.text("GRANT GRAB!", h / 2, 207, 32, "#ffd447", "center"), this.text("Your transporter has received its starting funding!", h / 2, 251, 17, "#f4f7fb", "center"), this.text(this.money(t.initialFunding), h / 2, 296, 30, "#76c2ff", "center"), this.text("Catch grants to grow your budget.", h / 2, 336, 17, "#a9f0b7", "center"), this.text("Avoid rejected applications — they'll slow you down!", h / 2, 366, 15, "#ff9aa1", "center"), this.text("MOVE YOUR BASKET WITH YOUR POINTER OR ARROW KEYS", h / 2, 410, 12, "#b6c8d8", "center"), this.drawScientistAt(186, 316, 72, 90);
  }
  drawResults(t) {
    const e = this.context;
    e.fillStyle = "rgba(8, 15, 24, 0.88)", e.fillRect(172, 142, 616, 282), e.strokeStyle = "#ffd447", e.lineWidth = 4, e.strokeRect(174, 144, 612, 278), this.text("FUNDING SECURED!", h / 2, 191, 28, "#ffd447", "center"), this.text(`STARTING FUNDING      ${this.money(t.initialFunding)}`, h / 2, 247, 17, "#83c2ff", "center"), this.text(`ADDITIONAL FUNDING  +${this.money(t.bonusFunding)}`, h / 2, 286, 17, "#7af09a", "center"), this.text(`FINAL CONSTRUCTION BUDGET  ${this.money(t.initialFunding + t.bonusFunding)}`, h / 2, 333, 16, "#ffffff", "center"), this.text("Your funding is safe and ready for the workshop!", h / 2, 373, 13, "#b9cad8", "center");
  }
  drawFrenzy(t, e) {
    const i = t - e;
    if (i < 0 || i > 2.5) return;
    const s = this.context, n = this.reducedMotion ? 1 : 0.97 + Math.sin(i * 12) * 0.03;
    s.save(), s.translate(h / 2, 169), s.scale(n, n), s.fillStyle = "#342c20", s.fillRect(-180, -20, 360, 40), s.strokeStyle = "#ffd447", s.lineWidth = 3, s.strokeRect(-180, -20, 360, 40), this.text("FUNDING FRENZY!", 0, 1, 19, "#ffd447", "center"), s.fillStyle = "#ffe789";
    for (const a of [-1, 1])
      s.fillRect(a * 163 - 3, -4, 6, 6), s.fillRect(a * 151 - 2, 10, 4, 4);
    s.restore();
  }
  drawBasket(t, e, i, s) {
    const n = this.context, a = Math.round(t - e / 2), o = A.top, c = s ? "#ff5864" : "#ffd447";
    n.fillStyle = "#0a1119", n.fillRect(a - 5, o + 9, e + 10, i - 5), n.fillStyle = c, n.fillRect(a + 4, o + 1, e - 8, 7), n.fillRect(a, o + 9, 6, i - 10), n.fillRect(a + e - 6, o + 9, 6, i - 10), n.fillRect(a + 8, o + i - 6, e - 16, 6), n.fillStyle = "#45687b";
    for (let d = 0; d < 5; d += 1)
      n.fillRect(a + 13 + d * 19, o + 15, 4, 10);
    n.fillStyle = "#f4f7fb", n.fillRect(a + e / 2 - 5, o + 12, 10, 4);
  }
  drawItem(t, e, i) {
    const s = this.context, n = Math.round(e), a = Math.round(i), o = 58;
    if (this.artwork) {
      const c = L.items[z[t]];
      s.drawImage(
        this.artwork.fundingItems,
        c.x,
        c.y,
        c.width,
        c.height,
        n - o / 2,
        a - o / 2,
        o,
        o
      );
      return;
    }
    switch (t) {
      case "community":
        s.fillStyle = "#5ee27c", s.fillRect(n - 10, a - 12, 20, 24), s.fillRect(n - 13, a - 8, 26, 16), s.fillStyle = "#b7ff9a", s.fillRect(n - 2, a - 8, 4, 16), s.fillRect(n - 7, a - 2, 14, 4);
        break;
      case "growers":
        s.fillStyle = "#53b9ff", s.fillRect(n - 11, a - 12, 22, 24), s.fillRect(n - 15, a - 7, 30, 14), s.fillStyle = "#c8edff", s.fillRect(n - 2, a - 6, 4, 12), s.fillRect(n - 6, a - 2, 12, 4);
        break;
      case "research":
        s.fillStyle = "#c084fc", s.fillRect(n - 5, a - 15, 10, 7), s.fillRect(n - 10, a - 8, 20, 7), s.fillRect(n - 14, a - 1, 28, 12), s.fillRect(n - 10, a + 11, 20, 5), s.fillStyle = "#f1d8ff", s.fillRect(n - 5, a - 2, 10, 4);
        break;
      case "innovation":
        s.fillStyle = "#ffd447";
        for (let c = 0; c < 8; c += 1) {
          const d = -Math.PI / 2 + c * Math.PI / 4, u = c % 2 === 0 ? 16 : 8;
          s.fillRect(
            Math.round(n + Math.cos(d) * u - 3),
            Math.round(a + Math.sin(d) * u - 3),
            7,
            7
          );
        }
        s.fillRect(n - 7, a - 7, 14, 14), s.fillStyle = "#fff4a8", s.fillRect(n - 3, a - 5, 5, 5);
        break;
      case "rejected":
        s.fillStyle = "#ff5b67", s.fillRect(n - 12, a - 15, 24, 30), s.fillRect(n - 8, a - 19, 16, 4), s.fillStyle = "#ffe4e6", s.fillRect(n - 7, a - 7, 14, 3), s.fillRect(n - 7, a + 3, 14, 3), s.fillStyle = "#7e1d35", s.fillRect(n - 6, a - 4, 12, 3), s.fillRect(n - 1, a - 9, 3, 13);
        break;
    }
  }
  drawScientist(t) {
    this.artwork && this.drawScientistAt(
      t,
      g.baselineY - g.height,
      g.width,
      g.height
    );
  }
  drawScientistAt(t, e, i, s) {
    if (!this.artwork) return;
    const n = E.animations[this.scientistState].frames[this.scientistFrame], { frameWidth: a, frameHeight: o, columns: c } = j, d = n % c * a, u = Math.floor(n / c) * o;
    this.context.drawImage(
      this.artwork.scientist,
      d,
      u,
      a,
      o,
      t - i / 2,
      e,
      i,
      s
    );
  }
  updateScientistAnimation(t, e) {
    const i = t.slowedFor > 0 ? "rejected" : t.phase === "playing" && t.basketMoving ? "walk" : "idle";
    if (i !== this.scientistState && (this.scientistState = i, this.scientistFrame = 0, this.scientistFrameElapsed = 0), this.reducedMotion) return;
    const s = E.animations[this.scientistState];
    for (this.scientistFrameElapsed += Math.min(Math.max(e, 0), 0.1) * 1e3; this.scientistFrameElapsed >= s.durationsMs[this.scientistFrame]; )
      this.scientistFrameElapsed -= s.durationsMs[this.scientistFrame], this.scientistFrame = (this.scientistFrame + 1) % s.frames.length;
  }
  async loadArtwork() {
    try {
      const [t, e, i] = await Promise.all([
        this.loadImage("background", this.assetUrls.background),
        this.loadImage("scientist", this.assetUrls.scientist),
        this.loadImage("funding items", this.assetUrls.fundingItems)
      ]);
      this.artwork = { background: t, scientist: e, fundingItems: i }, this.latestState && this.draw(this.latestState);
    } catch (t) {
      this.onAssetError(t instanceof Error ? t.message : String(t));
    }
  }
  loadImage(t, e) {
    return new Promise((i, s) => {
      const n = new Image();
      n.onload = () => i(n), n.onerror = () => s(new Error(`Unable to load the ${t} game artwork: ${e}`)), n.src = e;
    });
  }
  text(t, e, i, s, n, a = "left") {
    const o = this.context;
    o.font = `bold ${s}px ${$}`, o.textAlign = a, o.textBaseline = "middle", o.fillStyle = n, o.fillText(t, e, i);
  }
  money(t) {
    return `$${Math.round(t).toLocaleString("en-AU")}`;
  }
}
const W = 960, K = 540, w = 58;
class X {
  constructor(t, e) {
    r(this, "spawnClock", 0);
    r(this, "items", []);
    this.config = t, this.random = e;
  }
  get visibleItems() {
    return this.items;
  }
  reset() {
    this.spawnClock = 0, this.items = [];
  }
  update(t, e, i, s, n, a = 468) {
    const o = i.spawnInterval / this.config.spawnRateMultiplier;
    this.spawnClock += t, this.spawnClock >= o && (this.spawnClock %= o, this.spawnItem(e, i));
    const c = s - n / 2, d = s + n / 2, u = [], p = [];
    for (const f of this.items)
      f.y += this.config.itemFallSpeed * this.config.fallSpeedMultiplier * i.speedMultiplier * t, f.y + w / 2 >= a && f.y - w / 2 <= a + this.config.basketHeight && f.x + w / 2 >= c && f.x - w / 2 <= d ? p.push(f) : f.y - w / 2 <= K && u.push(f);
    return this.items = u, p;
  }
  spawnItem(t, e) {
    const i = P(t, this.config) ? Math.min(1, e.rejectedChance * this.config.rejectedChanceMultiplier) : 0;
    let s;
    if (this.random() < i)
      s = this.config.items.find((n) => n.type === "rejected") ?? { type: "rejected", label: "Rejected Application", value: 0, color: "#ff5b67" };
    else {
      const n = this.config.items.filter((c) => c.type !== "rejected"), a = n.reduce((c, d) => c + (d.weight ?? 0), 0);
      let o = this.random() * a;
      s = n[n.length - 1];
      for (const c of n)
        if (o -= c.weight ?? 0, o < 0) {
          s = c;
          break;
        }
    }
    this.items.push({
      x: 38 + this.random() * (W - 76),
      y: 138,
      type: s.type,
      value: s.value,
      color: s.color
    });
  }
}
const b = 960;
class H {
  constructor(t, e) {
    r(this, "heldKeys", /* @__PURE__ */ new Set());
    r(this, "targetX", b / 2);
    r(this, "positionX", b / 2);
    r(this, "moving", !1);
    this.width = t, this.height = e;
  }
  get x() {
    return this.positionX;
  }
  get isMoving() {
    return this.moving;
  }
  moveTo(t) {
    this.targetX = t;
  }
  setKey(t, e) {
    e ? this.heldKeys.add(t) : this.heldKeys.delete(t);
  }
  clearKeys() {
    this.heldKeys.clear();
  }
  update(t, e) {
    const i = Number(this.heldKeys.has("ArrowRight")) - Number(this.heldKeys.has("ArrowLeft"));
    i !== 0 && (this.targetX += i * e * t);
    const s = this.width / 2;
    this.targetX = Math.max(s, Math.min(b - s, this.targetX));
    const n = this.targetX - this.positionX, a = e * t, o = Math.sign(n) * Math.min(Math.abs(n), a);
    this.positionX += o, this.moving = o !== 0;
  }
  reset() {
    this.positionX = b / 2, this.targetX = b / 2, this.moving = !1, this.clearKeys();
  }
}
const I = 960;
class Y {
  constructor(t, e = {}) {
    r(this, "root");
    r(this, "canvas");
    r(this, "renderer");
    r(this, "config");
    r(this, "basket");
    r(this, "fallingItems");
    r(this, "onRoundStart");
    r(this, "onComplete");
    r(this, "onContinue");
    r(this, "continueButton");
    r(this, "replayButton");
    r(this, "announcer");
    r(this, "resizeObserver");
    r(this, "random");
    r(this, "initialFunding");
    r(this, "bonusFunding", 0);
    r(this, "grantsCollected", 0);
    r(this, "rejectedApplicationsCaught", 0);
    r(this, "elapsed", 0);
    r(this, "introElapsed", 0);
    r(this, "resultsElapsed", 0);
    r(this, "remaining", 0);
    r(this, "slowedFor", 0);
    r(this, "phase", "idle");
    r(this, "floatingTexts", []);
    r(this, "particles", []);
    r(this, "rafId", null);
    r(this, "previousFrame", null);
    r(this, "destroyed", !1);
    r(this, "resultDelivered", !1);
    r(this, "currentResult", null);
    r(this, "frenzyAnnounced", !1);
    r(this, "activePointerId", null);
    r(this, "handlePointerMove", (t) => {
      t.pointerType !== "mouse" && this.activePointerId !== t.pointerId || this.basket.moveTo(this.pointerToWorldX(t.clientX));
    });
    r(this, "handlePointerDown", (t) => {
      if (t.pointerType !== "mouse") {
        if (this.activePointerId !== null) return;
        this.activePointerId = t.pointerId;
      }
      this.canvas.focus({ preventScroll: !0 }), this.basket.moveTo(this.pointerToWorldX(t.clientX)), t.pointerType !== "mouse" && (this.canvas.setPointerCapture(t.pointerId), t.preventDefault());
    });
    r(this, "handlePointerUp", (t) => {
      t.pointerId === this.activePointerId && (this.activePointerId = null), this.canvas.hasPointerCapture(t.pointerId) && this.canvas.releasePointerCapture(t.pointerId);
    });
    r(this, "handleKeyDown", (t) => {
      (t.key === "ArrowLeft" || t.key === "ArrowRight") && (t.preventDefault(), this.basket.setKey(t.key, !0));
    });
    r(this, "handleKeyUp", (t) => {
      this.basket.setKey(t.key, !1);
    });
    r(this, "clearKeys", () => {
      this.basket.clearKeys();
    });
    r(this, "handleContinue", () => {
      var t;
      this.currentResult && ((t = this.onContinue) == null || t.call(this, this.currentResult));
    });
    r(this, "handleReplay", () => {
      this.reset();
    });
    r(this, "handleVisibilityChange", () => {
      document.hidden ? (this.cancelFrame(), this.previousFrame = null) : !this.destroyed && this.shouldAnimate() && this.scheduleFrame();
    });
    r(this, "frame", (t) => {
      if (this.rafId = null, this.destroyed || document.hidden) return;
      const e = this.previousFrame === null ? 0 : Math.min((t - this.previousFrame) / 1e3, 0.05);
      this.previousFrame = t;
      try {
        this.update(e);
      } finally {
        this.draw(e), this.shouldAnimate() && this.scheduleFrame();
      }
    });
    this.container = t, this.initialFunding = this.validateFunding(e.initialFunding ?? 12e4), this.config = D(e.config), this.random = this.createRandom(e.seed), this.basket = new H(this.config.basketWidth, this.config.basketHeight), this.fallingItems = new X(this.config, this.random), this.onRoundStart = e.onRoundStart, this.onComplete = e.onComplete, this.onContinue = e.onContinue, this.root = document.createElement("div"), this.root.className = "gg-root", this.root.innerHTML = `
      <div class="gg-stage">
        <canvas class="gg-canvas" tabindex="0" aria-label="Grant Grab! mini-game. Move the basket with a pointer or the left and right arrow keys."></canvas>
        <div class="gg-result-actions" hidden>
          <button class="gg-continue" type="button"></button>
          <button class="gg-replay" type="button">Play Again</button>
        </div>
      </div>
      <p class="gg-asset-error" role="alert" hidden></p>
      <div class="gg-sr-only" aria-live="polite" aria-atomic="true"></div>
    `, this.container.replaceChildren(this.root), this.canvas = this.root.querySelector(".gg-canvas"), this.continueButton = this.root.querySelector(".gg-continue"), this.replayButton = this.root.querySelector(".gg-replay"), this.announcer = this.root.querySelector(".gg-sr-only"), this.continueButton.textContent = e.continueLabel ?? "Continue to Transporter Workshop", this.renderer = new O(
      this.canvas,
      (i) => this.showAssetError(i),
      e.assetBaseUrl
    ), this.resizeObserver = new ResizeObserver(() => this.renderer.resize()), this.resizeObserver.observe(this.canvas), this.renderer.resize(), this.canvas.addEventListener("pointermove", this.handlePointerMove), this.canvas.addEventListener("pointerdown", this.handlePointerDown), this.canvas.addEventListener("pointerup", this.handlePointerUp), this.canvas.addEventListener("pointercancel", this.handlePointerUp), this.canvas.addEventListener("keydown", this.handleKeyDown), this.canvas.addEventListener("keyup", this.handleKeyUp), this.canvas.addEventListener("blur", this.clearKeys), this.continueButton.addEventListener("click", this.handleContinue), this.replayButton.addEventListener("click", this.handleReplay), document.addEventListener("visibilitychange", this.handleVisibilityChange), this.draw();
  }
  start() {
    var t;
    this.assertAlive(), this.phase === "idle" && (this.phase = "intro", this.introElapsed = 0, this.announce(`Starting funding: ${this.money(this.initialFunding)}. Catch grants and avoid rejected applications.`), this.draw(), this.scheduleFrame(), (t = this.onRoundStart) == null || t.call(this));
  }
  reset(t = this.initialFunding) {
    this.assertAlive(), this.cancelFrame(), this.previousFrame = null, this.initialFunding = this.validateFunding(t), this.bonusFunding = 0, this.grantsCollected = 0, this.rejectedApplicationsCaught = 0, this.elapsed = 0, this.introElapsed = 0, this.resultsElapsed = 0, this.remaining = 0, this.slowedFor = 0, this.basket.reset(), this.fallingItems.reset(), this.phase = "idle", this.floatingTexts = [], this.particles = [], this.resultDelivered = !1, this.currentResult = null, this.frenzyAnnounced = !1, this.activePointerId = null, this.root.querySelector(".gg-result-actions").hidden = !0, this.announcer.textContent = "", this.draw(), this.start();
  }
  destroy() {
    this.destroyed || (this.destroyed = !0, this.cancelFrame(), this.resizeObserver.disconnect(), document.removeEventListener("visibilitychange", this.handleVisibilityChange), this.canvas.removeEventListener("pointermove", this.handlePointerMove), this.canvas.removeEventListener("pointerdown", this.handlePointerDown), this.canvas.removeEventListener("pointerup", this.handlePointerUp), this.canvas.removeEventListener("pointercancel", this.handlePointerUp), this.canvas.removeEventListener("keydown", this.handleKeyDown), this.canvas.removeEventListener("keyup", this.handleKeyUp), this.canvas.removeEventListener("blur", this.clearKeys), this.continueButton.removeEventListener("click", this.handleContinue), this.replayButton.removeEventListener("click", this.handleReplay), this.root.remove());
  }
  scheduleFrame() {
    this.rafId === null && !this.destroyed && !document.hidden && (this.rafId = requestAnimationFrame(this.frame));
  }
  cancelFrame() {
    this.rafId !== null && (cancelAnimationFrame(this.rafId), this.rafId = null);
  }
  shouldAnimate() {
    return this.phase === "intro" || this.phase === "playing" || this.phase === "results" && this.resultsElapsed < this.config.resultsDuration;
  }
  update(t) {
    if (this.phase === "intro") {
      this.introElapsed += t, this.introElapsed >= this.config.introDuration && (this.phase = "playing", this.remaining = this.config.gameplayDuration, this.announce("Game started. Catch funding grants!"));
      return;
    }
    if (this.phase === "results") {
      this.resultsElapsed += t, this.updateEffects(t), this.resultsElapsed >= this.config.resultsDuration && (this.root.querySelector(".gg-result-actions").hidden = !1);
      return;
    }
    if (this.phase !== "playing") return;
    this.elapsed = Math.min(this.config.gameplayDuration, this.elapsed + t), this.remaining = Math.max(0, this.config.gameplayDuration - this.elapsed);
    const e = this.config.stages[this.config.stages.length - 1].startsAt;
    !this.frenzyAnnounced && this.elapsed >= e && (this.frenzyAnnounced = !0, this.announce("Funding frenzy! Final six seconds!")), this.slowedFor = Math.max(0, this.slowedFor - t);
    const i = this.config.basketSpeed * (this.slowedFor > 0 ? this.config.penaltySpeedMultiplier : 1);
    this.basket.update(t, i);
    const s = G(
      this.elapsed,
      this.config.stages,
      this.config.difficultyTransitionDuration
    ), n = this.fallingItems.update(
      t,
      this.elapsed,
      s,
      this.basket.x,
      this.basket.width,
      A.top
    );
    for (const a of n) this.collect(a);
    this.updateEffects(t), this.elapsed >= this.config.gameplayDuration && this.finishRound();
  }
  collect(t) {
    if (t.type === "rejected") {
      this.rejectedApplicationsCaught += 1, this.slowedFor = _(this.slowedFor, this.config.penaltyDuration), this.addFloatingText(t.x, 444, "SLOWED!", "#ff6874"), this.announce("Rejected application caught. Basket slowed for two seconds."), this.addParticles(t.x, 454, t.color, 7);
      return;
    }
    this.grantsCollected += 1;
    const e = this.bonusFunding;
    this.bonusFunding = B(this.bonusFunding, t.value, this.config.maxBonus);
    const i = this.bonusFunding - e;
    this.addFloatingText(
      t.x,
      444,
      i > 0 ? `+${this.money(i)}` : "BONUS MAX!",
      t.color
    ), this.addParticles(t.x, 454, t.color, t.type === "innovation" ? 16 : 8), this.announce(
      i > 0 ? `Grant collected. ${this.money(i)} added. Bonus funding: ${this.money(this.bonusFunding)}.` : `Grant collected, but the bonus limit of ${this.money(this.config.maxBonus)} is already reached.`
    );
  }
  finishRound() {
    var t;
    this.phase = "results", this.resultsElapsed = 0, this.fallingItems.reset(), this.currentResult = U(
      this.initialFunding,
      this.bonusFunding,
      this.grantsCollected,
      this.rejectedApplicationsCaught
    ), this.root.querySelector(".gg-result-actions").hidden = !0, this.addCelebration(), this.announce(
      `Funding secured. Starting funding ${this.money(this.currentResult.initialFunding)}. Additional funding ${this.money(this.currentResult.bonusFunding)}. Final construction budget ${this.money(this.currentResult.finalFunding)}. ${this.currentResult.grantsCollected} grants and ${this.currentResult.rejectedApplicationsCaught} rejected applications caught.`
    ), this.resultDelivered || (this.resultDelivered = !0, (t = this.onComplete) == null || t.call(this, this.currentResult));
  }
  updateEffects(t) {
    this.floatingTexts = this.floatingTexts.map((e) => ({ ...e, y: e.y - 36 * t, life: e.life - t })).filter((e) => e.life > 0), this.particles = this.particles.map((e) => ({ ...e, y: e.y - 28 * t, life: e.life - t })).filter((e) => e.life > 0);
  }
  addFloatingText(t, e, i, s) {
    this.floatingTexts.push({ x: t, y: e, text: i, color: s, life: 0.9, duration: 0.9 });
  }
  addParticles(t, e, i, s) {
    for (let n = 0; n < s; n += 1)
      this.particles.push({
        x: t + (this.random() - 0.5) * 45,
        y: e + (this.random() - 0.5) * 22,
        color: i,
        life: 0.5 + this.random() * 0.4,
        duration: 0.9,
        size: 3 + Math.floor(this.random() * 4)
      });
  }
  addCelebration() {
    const t = ["#ffd447", "#5ee27c", "#53b9ff", "#c084fc"];
    for (let e = 0; e < 48; e += 1)
      this.particles.push({
        x: this.random() * I,
        y: 145 + this.random() * 300,
        color: t[e % t.length],
        life: 3 + this.random() * 2,
        duration: 5,
        size: 4 + Math.floor(this.random() * 5)
      });
  }
  draw(t = 0) {
    this.renderer.draw({
      phase: this.phase,
      initialFunding: this.initialFunding,
      bonusFunding: this.bonusFunding,
      maxBonus: this.config.maxBonus,
      remaining: this.remaining,
      elapsed: this.phase === "intro" ? this.introElapsed : this.elapsed,
      basketX: this.basket.x,
      basketWidth: this.basket.width,
      basketHeight: this.basket.height,
      slowedFor: this.slowedFor,
      penaltyDuration: this.config.penaltyDuration,
      frenzyAt: this.config.stages[this.config.stages.length - 1].startsAt,
      items: this.fallingItems.visibleItems,
      floatingTexts: this.floatingTexts,
      particles: this.particles,
      basketMoving: this.basket.isMoving
    }, t);
  }
  showAssetError(t) {
    const e = this.root.querySelector(".gg-asset-error");
    e.textContent = `Some game artwork could not be loaded. The game will use its fallback graphics. ${t}`, e.hidden = !1;
  }
  pointerToWorldX(t) {
    const e = this.canvas.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(I, (t - e.left) / e.width * I)
    );
  }
  validateFunding(t) {
    if (!Number.isSafeInteger(t) || t < 0)
      throw new RangeError("Initial funding must be a non-negative whole number.");
    return t;
  }
  money(t) {
    return `$${Math.round(t).toLocaleString("en-AU")}`;
  }
  announce(t) {
    this.announcer.textContent = t;
  }
  createRandom(t) {
    if (t === void 0) return Math.random;
    let e = typeof t == "number" ? t >>> 0 : this.hashSeed(t);
    return () => {
      e += 1831565813;
      let i = e;
      return i = Math.imul(i ^ i >>> 15, i | 1), i ^= i + Math.imul(i ^ i >>> 7, i | 61), ((i ^ i >>> 14) >>> 0) / 4294967296;
    };
  }
  hashSeed(t) {
    let e = 2166136261;
    for (let i = 0; i < t.length; i += 1)
      e = Math.imul(e ^ t.charCodeAt(i), 16777619);
    return e >>> 0;
  }
  assertAlive() {
    if (this.destroyed)
      throw new Error("This Grant Grab instance has been destroyed.");
  }
}
function V(l, t = {}) {
  return new Y(l, t);
}
export {
  k as DEFAULT_ASSET_BASE_URL,
  x as DEFAULT_CONFIG,
  X as FallingItemManager,
  F as GRANT_GRAB_ASSET_PATHS,
  Y as GrantGrabController,
  H as PlayerBasket,
  A as SCIENTIST_COLLECTION_ZONE,
  g as SCIENTIST_SPRITE,
  G as difficultyAt,
  V as mountGrantGrab
};
