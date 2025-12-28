/** @format */

const CELL_SIZE = typeof cellSize !== "undefined" ? cellSize : 40;
const STROKE_WIDTH = typeof strokeWidth !== "undefined" ? strokeWidth : 2;

let overlay = document.getElementById("spectator-overlay");
if (!overlay) {
  overlay = document.createElement("div");
  overlay.id = "spectator-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    pointer-events: none;
    font-family: 'Exo 2', sans-serif;
    text-align: center;
  `;
  document.body.appendChild(overlay);
}

function showSpectatorText(text, isKill) {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = `
    padding: 10px 20px;
    margin-bottom: 10px;
    border-radius: 8px;
    background: ${
      isKill ? "rgba(220, 20, 60, 0.9)" : "rgba(30, 144, 255, 0.9)"
    };
    color: white;
    font-weight: bold;
    font-size: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    border: 2px solid rgba(255,255,255,0.2);
    transition: all 0.5s ease;
    transform: scale(0.8);
    opacity: 0;
  `;

  overlay.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "1";
    el.style.transform = "scale(1)";
  }, 10);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-20px)";
    setTimeout(() => el.remove(), 500);
  }, 2500);
}

function drawSpectatorLaser(currentApp, xStart, yStart, xEnd, yEnd, isKill) {
  if (!currentApp || !currentApp.stage) return;

  const laser = new PIXI.Graphics();
  const color = 0xffd700;

  laser.beginPath();
  laser.moveTo(xStart, yStart);
  laser.lineTo(xEnd, yEnd);

  laser.stroke({ width: 4, color: 0xffcc00, alpha: 1, cap: "round" });
  laser.stroke({ width: 15, color, alpha: 0.8, cap: "round" });

  currentApp.stage.addChild(laser);

  laser.zIndex = 999999;

  if (currentApp.stage.sortableChildren !== true) {
    currentApp.stage.sortableChildren = true;
  }
  currentApp.stage.sortChildren();

  setTimeout(() => {
    if (!laser.destroyed) laser.destroy();
  }, 200);
}

function drawImpactEffect(app, x, y, isKill) {
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;
  app.stage.addChild(container);

  const circle = new PIXI.Graphics();
  circle.circle(0, 0, isKill ? 25 : 15);
  circle.fill({ color: isKill ? 0xff0000 : 0xffcc00, alpha: 0.6 });
  container.addChild(circle);

  let p = 0;
  const anim = () => {
    p += 0.1;
    circle.scale.set(1 + p);
    circle.alpha = 1 - p;
    if (p >= 1) {
      app.ticker.remove(anim);
      container.destroy({ children: true });
    }
  };
  app.ticker.add(anim);
}

if (typeof socket !== "undefined") {
  socket.on("viewer_joined", (data) => {
    if (data.status) {
      window.isViewer = true;
      console.log("✅ Spectator Mode Active");
    }
  });

  socket.on("spectator:shot", (data) => {
    console.log("🔫 SHOT ATTEMPT:", data);

    const currentApp = window.app;
    if (!currentApp || !data.from || !data.to) return;

    const cellSize = typeof CELL_SIZE !== "undefined" ? CELL_SIZE : 32;
    const strokeWidth = typeof STROKE_WIDTH !== "undefined" ? STROKE_WIDTH : 15;
    const step = cellSize + strokeWidth * 2;
    const xStart = data.from.y * step + step / 2;
    const yStart = data.from.x * step + step / 2;
    const xEnd = data.to.y * step + step / 2;
    const yEnd = data.to.x * step + step / 2;

    console.log(`📍 Drawing from [${xStart},${yStart}] to [${xEnd},${yEnd}]`);

    drawSpectatorLaser(currentApp, xStart, yStart, xEnd, yEnd, data.isKill);
    drawImpactEffect(currentApp, xEnd, yEnd, data.isKill);

    if (typeof showHitMarker === "function") {
      showHitMarker(currentApp, data.to.x, data.to.y, data.isKill);
    }
  });
}
