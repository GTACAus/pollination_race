import { CONFIG } from "../config.js";

export class Bee {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.direction = 0;
    this.frame = 0;
    this.animationClock = 0;
    this.damageTime = 0;
  }

  update(dt, movement, speed, width, height) {
    this.damageTime = Math.max(0, this.damageTime - dt);
    if (!movement.moving) return;
    this.x += movement.x * speed * dt;
    this.y += movement.y * speed * dt;
    this.x = clamp(this.x, CONFIG.beeRadius, width - CONFIG.beeRadius);
    this.y = clamp(this.y, CONFIG.beeRadius + 72, height - CONFIG.beeRadius - 82);
    this.animationClock += dt;
    this.frame = Math.floor(this.animationClock * CONFIG.beeAnimationFps) % 12;

    if (Math.abs(movement.x) > Math.abs(movement.y)) {
      this.direction = movement.x < 0 ? 2 : 3;
    } else {
      this.direction = movement.y < 0 ? 1 : 0;
    }
  }

  draw(ctx, assets, pollenCount) {
    const sx = this.frame * 48;
    const sy = this.direction * 48;
    const x = Math.round(this.x - 24);
    const y = Math.round(this.y - 24);
    const flashing = this.damageTime > 0 && Math.floor(this.damageTime * 12) % 2 === 0;
    if (!flashing) {
      ctx.drawImage(assets.bee, sx, sy, 48, 48, x, y, 48, 48);
      ctx.drawImage(assets.pollen, Math.min(pollenCount, CONFIG.pollenCapacity) * 48,
        this.direction * 48, 48, 48, x, y, 48, 48);
    }
    if (this.damageTime > 0) {
      ctx.strokeStyle = `rgba(255, 246, 145, ${.25 + .35 * Math.sin(this.damageTime * 18) ** 2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export class Flower {
  constructor(id, x, y, species, bloomDuration) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.species = species;
    this.state = "bud";
    this.stateTime = 0;
    this.bloomDuration = bloomDuration;
    this.visited = false;
    this.remove = false;
    this.variation = Math.floor(Math.random() * 4);
  }

  update(dt) {
    this.stateTime += dt;
    if (this.state === "bud" && this.stateTime >= CONFIG.flowerBudDuration) {
      this.changeState("opening");
    } else if (this.state === "opening" && this.stateTime >= CONFIG.flowerOpeningDuration) {
      this.changeState("bloom");
    } else if (this.state === "bloom" && this.stateTime >= this.bloomDuration) {
      this.changeState("wilting");
    } else if (this.state === "visited" && this.stateTime >= CONFIG.flowerVisitedDuration) {
      this.changeState("spent");
    } else if (this.state === "wilting" && this.stateTime >= CONFIG.flowerWiltingDuration) {
      this.changeState("spent");
    } else if (this.state === "spent" && this.stateTime >= CONFIG.flowerSpentDuration) {
      this.remove = true;
    }
  }

  changeState(state) {
    this.state = state;
    this.stateTime = 0;
  }

  visit() {
    if (this.state !== "bloom" || this.visited) return false;
    this.visited = true;
    this.changeState("visited");
    return true;
  }

  draw(ctx, assets, elapsed, superBloom = false) {
    const rows = { bud: 0, opening: 1, bloom: 2, visited: 3, wilting: 4, spent: 5 };
    const row = rows[this.state];
    const frame = this.state === "bloom" || this.state === "opening"
      ? Math.floor(elapsed * CONFIG.flowerFrameFps) % 4
      : this.variation;
    const image = assets[`flower_${this.species}`];
    const bloomProgress = this.state === "opening"
      ? clamp(this.stateTime / CONFIG.flowerOpeningDuration, 0, 1)
      : this.state === "bloom" ? 1 : 0;
    const scale = this.state === "opening" ? .75 + .25 * easeOut(bloomProgress) : 1;
    const size = 32 * scale;
    ctx.drawImage(image, frame * 32, row * 32, 32, 32,
      Math.round(this.x - size / 2), Math.round(this.y - size / 2), size, size);
    if (this.state === "visited" && this.stateTime < .32) {
      ctx.strokeStyle = `rgba(255, 245, 155, ${1 - this.stateTime / .32})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 17 + this.stateTime * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (superBloom && this.state === "bloom" && this.stateTime < 2.5) {
      const sparkle = Math.floor(elapsed * 8 + this.id) % 4;
      const angle = (elapsed * 2 + this.id) % (Math.PI * 2);
      ctx.fillStyle = "rgba(255, 247, 155, .8)";
      ctx.fillRect(Math.round(this.x + Math.cos(angle) * (18 + sparkle)),
        Math.round(this.y + Math.sin(angle) * (18 + sparkle)), 2, 2);
    }
  }
}

export class Hive {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.state = 0;
    this.stateTime = 0;
    this.frame = 0;
  }

  update(dt) {
    this.stateTime += dt;
    if (this.state === 2 && this.stateTime >= 1.1) this.setState(0);
    this.frame = Math.floor(this.stateTime * CONFIG.hiveFrameFps) % 4;
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.stateTime = 0;
  }

  draw(ctx, image) {
    if (this.state === 2) {
      ctx.fillStyle = `rgba(255, 212, 89, ${.16 + .14 * Math.sin(this.stateTime * 18) ** 2})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.drawImage(image, this.frame * 64, this.state * 64, 64, 64,
      Math.round(this.x - 32), Math.round(this.y - 32), 64, 64);
  }
}

export class Wasp {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = CONFIG.wasps.patrolSpeed;
    this.turnClock = .8 + Math.random() * 1.2;
    this.phase = Math.random() * Math.PI * 2;
    this.animationTime = Math.random() * 12;
    this.frame = 0;
    this.row = 0;
  }

  update(dt, bee, hive, width, height) {
    const dx = bee.x - this.x;
    const dy = bee.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.turnClock -= dt;
    if (distance <= CONFIG.wasps.detectionRadius) {
      const desired = Math.atan2(dy, dx);
      this.direction = approachAngle(this.direction, desired, dt * 1.8);
      this.speed = CONFIG.wasps.pursuitSpeed;
    } else {
      this.speed = CONFIG.wasps.patrolSpeed;
      if (this.turnClock <= 0) {
        this.direction += (Math.random() - .5) * 1.2;
        this.turnClock = .8 + Math.random() * 1.2;
      }
    }

    this.x += Math.cos(this.direction) * this.speed * dt;
    this.y += Math.sin(this.direction) * this.speed * dt;
    this.phase += dt * 12;
    this.animationTime += dt;
    this.frame = Math.floor(this.animationTime * CONFIG.waspAnimationFps) % 12;
    const directionX = Math.cos(this.direction);
    const directionY = Math.sin(this.direction);
    this.row = Math.abs(directionX) > Math.abs(directionY)
      ? directionX < 0 ? 2 : 3
      : directionY < 0 ? 1 : 0;

    const hiveDx = this.x - hive.x;
    const hiveDy = this.y - hive.y;
    const hiveDistance = Math.hypot(hiveDx, hiveDy);
    if (hiveDistance < CONFIG.wasps.hiveSafeRadius) {
      this.x = hive.x + hiveDx / Math.max(hiveDistance, 1) * CONFIG.wasps.hiveSafeRadius;
      this.y = hive.y + hiveDy / Math.max(hiveDistance, 1) * CONFIG.wasps.hiveSafeRadius;
      this.direction = Math.atan2(hiveDy, hiveDx);
    }

    if (this.x < 28 || this.x > width - 28) {
      this.direction = Math.PI - this.direction;
      this.x = clamp(this.x, 28, width - 28);
    }
    if (this.y < 86 || this.y > height - 76) {
      this.direction = -this.direction;
      this.y = clamp(this.y, 86, height - 76);
    }
  }

  draw(ctx, image, immune) {
    const { waspFrameWidth, waspFrameHeight } = CONFIG;
    const x = Math.round(this.x - waspFrameWidth / 2);
    const y = Math.round(this.y - waspFrameHeight / 2 + Math.sin(this.phase) * 2);
    if (immune) {
      ctx.globalAlpha = .58 + .42 * Math.sin(this.phase * 1.4) ** 2;
    }
    ctx.drawImage(image,
      this.frame * waspFrameWidth, this.row * waspFrameHeight,
      waspFrameWidth, waspFrameHeight,
      x, y, waspFrameWidth, waspFrameHeight);
    ctx.globalAlpha = 1;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeOut(value) {
  return 1 - (1 - value) ** 3;
}

function approachAngle(current, target, amount) {
  let delta = (target - current + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  delta = clamp(delta, -amount, amount);
  return current + delta;
}
