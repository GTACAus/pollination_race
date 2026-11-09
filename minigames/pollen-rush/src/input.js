const MOVEMENT_KEYS = new Set([
  "w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"
]);

export class Input {
  constructor(canvas, toGamePoint, onEscape, isGameActive) {
    this.canvas = canvas;
    this.toGamePoint = toGamePoint;
    this.onEscape = onEscape;
    this.isGameActive = isGameActive;
    this.keys = new Set();
    this.target = null;
    this.pointerDown = false;
    this.listeners = [];

    this.listen(canvas, "keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "escape") {
        if (this.canvas.getClientRects().length === 0) return;
        event.preventDefault();
        this.onEscape();
        return;
      }
      if (!this.isGameActive() || this.canvas.getClientRects().length === 0) return;
      if (MOVEMENT_KEYS.has(key)) {
        event.preventDefault();
        this.keys.add(key);
      }
    });
    this.listen(canvas, "keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    this.listen(canvas, "blur", () => {
      this.keys.clear();
      this.pointerDown = false;
    });
    this.listen(canvas, "pointerdown", (event) => {
      canvas.focus();
      this.pointerDown = true;
      if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(event.pointerId);
      this.updateTarget(event);
    });
    this.listen(canvas, "pointermove", (event) => {
      if (this.pointerDown) this.updateTarget(event);
    });
    this.listen(canvas, "pointerup", () => {
      this.pointerDown = false;
    });
    this.listen(canvas, "pointercancel", () => {
      this.pointerDown = false;
    });
    this.listen(canvas, "contextmenu", (event) => event.preventDefault());
  }

  listen(target, type, listener) {
    target.addEventListener(type, listener);
    this.listeners.push(() => target.removeEventListener(type, listener));
  }

  updateTarget(event) {
    this.target = this.toGamePoint(event.clientX, event.clientY);
  }

  getMovement(x, y, stoppingDistance = 5) {
    let dx = 0;
    let dy = 0;
    if (this.keys.has("a") || this.keys.has("arrowleft")) dx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx += 1;
    if (this.keys.has("w") || this.keys.has("arrowup")) dy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) dy += 1;

    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      return { x: dx / length, y: dy / length, moving: true };
    }

    if (this.target) {
      dx = this.target.x - x;
      dy = this.target.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance > stoppingDistance) {
        return { x: dx / distance, y: dy / distance, moving: true };
      }
      if (!this.pointerDown) this.target = null;
    }
    return { x: 0, y: 0, moving: false };
  }

  clearTarget() {
    this.target = null;
    this.pointerDown = false;
    this.keys.clear();
  }

  destroy() {
    this.clearTarget();
    for (const removeListener of this.listeners) removeListener();
    this.listeners = [];
  }
}
