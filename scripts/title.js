// Title screen: animated bees that fly over the meadow, land on flowers
// briefly, then fly off again. Coordinates are percentages of the title art
// (1672 × 941), so they line up with the painted flowers at any size.
(function () {
  const stage = document.getElementById('title-stage');
  const layer = document.getElementById('title-bees');
  const screen = document.getElementById('title-screen');
  if (!stage || !layer || !screen) return;

  const BEE_SRC = 'assets/title/bee.webp';
  const BEE_COUNT = 7;
  // Centres of the painted flowers [x%, y%]; lower flowers are "closer".
  const FLOWERS = [
    [12.3, 81.5], [25.7, 82.6], [33.8, 82.8], [28.6, 94.0], [48.8, 93.2],
    [64.8, 79.6], [81.8, 83.8], [96.0, 79.0], [93.0, 93.0], [57.5, 89.5],
    [20.5, 70.4], [31.6, 71.4], [8.4, 66.0], [70.2, 72.0], [93.6, 70.6],
    [44.0, 76.5], [76.6, 70.0], [5.0, 84.0]
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const taken = new Set();

  function freeFlower(exclude) {
    const options = FLOWERS.map((_, i) => i).filter((i) => !taken.has(i) && i !== exclude);
    return options.length ? pick(options) : Math.floor(Math.random() * FLOWERS.length);
  }

  function offscreenPoint() {
    const side = Math.random() < 0.5 ? -8 : 108;
    return { x: side, y: rand(45, 85) };
  }

  // Bee size (as % of stage width) grows towards the bottom of the meadow.
  const sizeAt = (y) => 2.6 + Math.max(0, (y - 60) / 40) * 2.4;

  class Bee {
    constructor() {
      this.el = document.createElement('img');
      this.el.src = BEE_SRC;
      this.el.alt = '';
      this.el.className = 'title-bee';
      this.el.draggable = false;
      layer.appendChild(this.el);
      this.flower = -1;
      const start = Math.random() < 0.6 ? offscreenPoint() : { x: rand(5, 95), y: rand(55, 90) };
      this.x = start.x;
      this.y = start.y;
      this.phase = rand(0, Math.PI * 2);
      this.facing = -1;
      if (reducedMotion) {
        this.flower = freeFlower(-1);
        taken.add(this.flower);
        [this.x, this.y] = FLOWERS[this.flower];
        this.state = 'resting';
        this.wait = Infinity;
      } else {
        this.planFlight();
      }
    }

    planFlight() {
      if (this.flower >= 0) taken.delete(this.flower);
      // Mostly hop flower to flower; sometimes leave the screen for a bit.
      const leaving = this.flower >= 0 && Math.random() < 0.18;
      let target;
      if (leaving) {
        this.flower = -1;
        target = offscreenPoint();
      } else {
        this.flower = freeFlower(this.flower);
        taken.add(this.flower);
        const [fx, fy] = FLOWERS[this.flower];
        target = { x: fx, y: fy };
      }
      this.from = { x: this.x, y: this.y };
      this.to = target;
      // A curved path via a random control point above the straight line.
      this.ctrl = {
        x: (this.from.x + target.x) / 2 + rand(-15, 15),
        y: Math.min(this.from.y, target.y) - rand(8, 28)
      };
      const distance = Math.hypot(target.x - this.from.x, target.y - this.from.y);
      this.duration = Math.max(1.4, distance / rand(14, 22)); // seconds
      this.t = 0;
      this.state = leaving ? 'leaving' : 'flying';
    }

    update(dt, time) {
      if (this.state === 'flying' || this.state === 'leaving') {
        this.t = Math.min(1, this.t + dt / this.duration);
        const t = this.t;
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const u = 1 - ease;
        const nx = u * u * this.from.x + 2 * u * ease * this.ctrl.x + ease * ease * this.to.x;
        const ny = u * u * this.from.y + 2 * u * ease * this.ctrl.y + ease * ease * this.to.y;
        if (Math.abs(nx - this.x) > 0.01) this.facing = nx > this.x ? 1 : -1;
        this.x = nx;
        // Little wobble while flying.
        this.y = ny + Math.sin(time * 9 + this.phase) * 0.6 * (1 - Math.abs(0.5 - t) * 0.6);
        if (this.t >= 1) {
          if (this.state === 'leaving') {
            this.state = 'away';
            this.wait = rand(1, 4);
          } else {
            this.state = 'resting';
            this.wait = rand(1.2, 3.2);
          }
        }
      } else if (this.state === 'resting') {
        this.wait -= dt;
        // Gentle bob while sipping nectar.
        const [fx, fy] = FLOWERS[this.flower];
        this.x = fx;
        this.y = fy - 1.2 + Math.sin(time * 4 + this.phase) * 0.25;
        if (this.wait <= 0) this.planFlight();
      } else if (this.state === 'away') {
        this.wait -= dt;
        if (this.wait <= 0) {
          const entry = offscreenPoint();
          this.x = entry.x;
          this.y = entry.y;
          this.flower = -1;
          this.planFlight();
        }
      }
    }

    draw(width, height) {
      const size = sizeAt(this.y) / 100 * width;
      const px = this.x / 100 * width - size / 2;
      const py = this.y / 100 * height - size * 0.75;
      const resting = this.state === 'resting';
      this.el.style.width = `${size}px`;
      this.el.style.transform =
        `translate(${px}px, ${py}px) scaleX(${-this.facing}) rotate(${resting ? 0 : -6 * this.facing}deg)`;
      this.el.classList.toggle('is-resting', resting);
    }
  }

  const bees = Array.from({ length: BEE_COUNT }, () => new Bee());
  let last = performance.now();
  let rafId = null;

  function frame(now) {
    rafId = null;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const { width, height } = stage.getBoundingClientRect();
    bees.forEach((bee) => {
      bee.update(dt, now / 1000);
      bee.draw(width, height);
    });
    schedule();
  }

  function schedule() {
    if (rafId !== null) return;
    if (screen.classList.contains('hidden') || document.hidden) return;
    rafId = requestAnimationFrame(frame);
  }

  // Restart when the title screen is shown again.
  new MutationObserver(() => {
    last = performance.now();
    schedule();
  }).observe(screen, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
    schedule();
  });
  window.addEventListener('resize', () => {
    const { width, height } = stage.getBoundingClientRect();
    bees.forEach((bee) => bee.draw(width, height));
  });
  schedule();
})();
