import { CONFIG } from "../config.js";

const CONFIGURED_PARTICLE_LIMIT = CONFIG.effects.maximumParticles;

export class Effects {
  constructor() {
    this.items = [];
  }

  burst(x, y, text, color, count = 8) {
    if (text) this.items.push({ type: "text", x, y: y - 10, text, color, age: 0, duration: 1.15 });
    const available = Math.max(0, CONFIGURED_PARTICLE_LIMIT - this.items.length);
    for (let i = 0; i < Math.min(count, available); i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 24 + Math.random() * 62;
      this.items.push({
        type: "particle",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 12,
        color,
        size: 2 + Math.floor(Math.random() * 3),
        age: 0,
        duration: .45 + Math.random() * .35
      });
    }
  }

  travel(x, y, targetX, targetY, color, count = 10) {
    const available = Math.max(0, CONFIGURED_PARTICLE_LIMIT - this.items.length);
    for (let i = 0; i < Math.min(count, available); i += 1) {
      this.items.push({
        type: "travel",
        x: x + (Math.random() - .5) * 25,
        y: y + (Math.random() - .5) * 25,
        startX: x,
        startY: y,
        targetX,
        targetY,
        color,
        size: 2 + Math.floor(Math.random() * 3),
        age: 0,
        duration: .35 + Math.random() * .4
      });
    }
  }

  clearText(prefix) {
    this.items = this.items.filter((item) => item.type !== "text" || !item.text.startsWith(prefix));
  }

  update(dt) {
    for (const item of this.items) {
      item.age += dt;
      if (item.type === "particle") {
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.vy += 70 * dt;
      } else if (item.type === "travel") {
        const progress = Math.min(item.age / item.duration, 1);
        const eased = 1 - (1 - progress) ** 2;
        item.x = item.startX + (item.targetX - item.startX) * eased;
        item.y = item.startY + (item.targetY - item.startY) * eased;
      } else {
        item.y -= 17 * dt;
      }
    }
    this.items = this.items.filter((item) => item.age < item.duration);
  }

  draw(ctx) {
    for (const item of this.items) {
      const alpha = Math.max(0, 1 - item.age / item.duration);
      ctx.globalAlpha = alpha;
      if (item.type === "particle" || item.type === "travel") {
        ctx.fillStyle = item.color;
        ctx.fillRect(Math.round(item.x), Math.round(item.y), item.size, item.size);
      } else {
        const scale = 1 + .18 * Math.sin(Math.min(item.age / item.duration, 1) * Math.PI);
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.scale(scale, scale);
        ctx.font = "bold 15px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#29432e";
        ctx.strokeText(item.text, 0, 0);
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, 0, 0);
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
  }
}
