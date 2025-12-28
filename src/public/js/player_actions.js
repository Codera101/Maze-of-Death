// !! --------------- IMPORTS --------------- !!
// import { app } from "./maze.js";
import "./variables_mainpage.js";
import "./draw.js";
// !! --------------- AUDIO SETUP --------------- !!
const laserSound = new Audio("../sounds/laserShoot.wav");
const laserHitWallSound = new Audio("../sounds/laserHitWall.wav");
const laserHitPlayerSound = new Audio("../sounds/laserHitPlayer.wav");
const laserKillPlayerSound = new Audio("../sounds/KillPlayer.wav");
const moveSound = new Audio("../sounds/move.mp3");
const hitSound = new Audio("../sounds/hitHurt.wav");

// !! --------------- SHOOTING ACTIONS --------------- !!
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    socket.emit("shoot");
    // laserSound.play();
  }
});
window.addEventListener("click", (e) => {
  if (e.button === 0) {
    socket.emit("shoot");
  }
});

// Mobile Shoot Control
const setupMobileShoot = () => {
  const btnShoot = document.getElementById("btn-shoot");
  if (btnShoot) {
    const handleShoot = (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent bubbling to window click listener
      socket.emit("shoot");
    };

    btnShoot.addEventListener("touchstart", handleShoot, { passive: false });
    btnShoot.addEventListener("click", handleShoot);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupMobileShoot);
} else {
  setupMobileShoot();
}

socket.on("target_hit", (data) => {
  laserSound.play();
  // laserSound.play();
  const {
    status,
    resultType,
    direction,
    targetX,
    targetY,
    targetId,
    targetName,
  } = data;

  if (status === true) {
    if (resultType === "kill") {
      laserHitPlayerSound.play();
      laserKillPlayerSound.play();
      console.log(`You killed ${targetName} (ID: ${targetId})`);
    } else if (resultType === "Hit") {
      laserHitPlayerSound.play();
      console.log(`You hit ${targetName} (ID: ${targetId})`);
    } else {
      laserHitWallSound.play();
      console.log("You missed your shot.");
    }
  }

  if (
    status === true &&
    typeof app !== "undefined" &&
    typeof myPlayer !== "undefined"
  ) {
    // console.log("Target hit!", data);

    // Calculate laser beam coordinates
    const gridStep = cellSize + strokeWidth * 2;
    const shooterGridX = myPlayer.y * gridStep;
    const shooterGridY = myPlayer.x * gridStep;
    const shooterVisualX = shooterGridX + strokeWidth;
    const shooterVisualY = shooterGridY + strokeWidth;
    const shooterVisualWidth = cellSize - strokeWidth;

    const startX = shooterVisualX + shooterVisualWidth / 2;
    const startY = shooterVisualY + shooterVisualWidth / 2;

    let endX = startX;
    let endY = startY;

    // Calculate end position based on direction
    const dir =
      typeof direction === "string" ? direction.toUpperCase() : direction;

    // If hit a player, end laser at their position
    if (
      (resultType === "Hit" || resultType === "kill") &&
      targetX !== undefined &&
      targetY !== undefined
    ) {
      const targetGridX = targetY * gridStep;
      const targetGridY = targetX * gridStep;
      endX = targetGridX + strokeWidth + shooterVisualWidth / 2;
      endY = targetGridY + strokeWidth + shooterVisualWidth / 2;
    } else {
      // Hit wall or nothing - find where the wall is or use max range
      // Trace from shooter position to find the wall
      let currentX = myPlayer.x;
      let currentY = myPlayer.y;
      let distance = 0;
      const maxDistance = 20; // Max cells to check

      // Move step by step in the direction until we hit a wall or max distance
      while (distance < maxDistance) {
        // Move one step
        if (dir === "U") currentX--;
        else if (dir === "D") currentX++;
        else if (dir === "L") currentY--;
        else if (dir === "R") currentY++;

        distance++;

        // Check if out of bounds or hit a wall
        if (
          typeof mazeLayout !== "undefined" &&
          currentX >= 0 &&
          currentX < mazeLayout.length &&
          currentY >= 0 &&
          currentY < mazeLayout[0].length
        ) {
          if (mazeLayout[currentX][currentY] === 1) {
            // Hit a wall - end laser at wall edge
            const wallGridX = currentY * gridStep;
            const wallGridY = currentX * gridStep;
            endX = wallGridX + strokeWidth + shooterVisualWidth / 2;
            endY = wallGridY + strokeWidth + shooterVisualWidth / 2;
            break;
          }
        } else {
          // Out of bounds - end at edge
          const edgeGridX = currentY * gridStep;
          const edgeGridY = currentX * gridStep;
          endX = edgeGridX + strokeWidth + shooterVisualWidth / 2;
          endY = edgeGridY + strokeWidth + shooterVisualWidth / 2;
          break;
        }
      }

      // If no wall found, use the final position
      if (endX === startX && endY === startY) {
        const finalGridX = currentY * gridStep;
        const finalGridY = currentX * gridStep;
        endX = finalGridX + strokeWidth + shooterVisualWidth / 2;
        endY = finalGridY + strokeWidth + shooterVisualWidth / 2;
      }
    }

    // Draw laser beam
    if (typeof fireLaser === "function") {
      fireLaser(app, {
        xStart: startX,
        yStart: startY,
        xEnd: endX,
        yEnd: endY,
        lineWidth: 3,
      });
    }

    // Always show muzzle flash/spark effect when shooting
    if (typeof showWallImpact === "function") {
      showWallImpact(app, myPlayer.x, myPlayer.y, direction);
    }

    // Show additional visual feedback based on result
    if (resultType === "Hit" || resultType === "kill") {
      // Enemy hit - show hit marker at target location
      if (
        typeof showHitMarker === "function" &&
        targetX !== undefined &&
        targetY !== undefined
      ) {
        showHitMarker(app, targetX, targetY, resultType === "kill");
      }
    }
  }
});

// !! --------------- MOVEMENT ACTIONS --------------- !!
const dirArr = ["U", "D", "L", "R"];
const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const wasd = ["w", "s", "a", "d"];
let moveDir;

window.addEventListener("keydown", (e) => {
  e.preventDefault();
  moveDir = null;
  for (let i = 0; i < wasd.length; i++) {
    if (e.key === wasd[i] || e.key === arrows[i]) {
      moveDir = dirArr[i];
    }
  }
  if (moveDir) {
    socket.emit("player_move", { direction: moveDir });
  }
});

const setupMobileControls = () => {
  const directions = {
    "btn-up": "U",
    "btn-down": "D",
    "btn-left": "L",
    "btn-right": "R",
  };

  Object.entries(directions).forEach(([btnId, dir]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      const handleMove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        socket.emit("player_move", { direction: dir });
      };
      btn.addEventListener("touchstart", handleMove, { passive: false });
      btn.addEventListener("click", handleMove);
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupMobileControls);
} else {
  setupMobileControls();
}

socket.on("player_moved", ({ status }) => {
  if (status === true) moveSound.play();
});

// !! --------------- RESPAWN ACTIONS --------------- !!
socket.on("respawn", (player) => {
  updatePlayerInfo(player);
});

// !! --------------- HIT RECEIVED ACTIONS --------------- !!
socket.on("got_hit", ({ dir, shooter_name }) => {
  hitSound.play();
  if (typeof animateHit === "function" && app) {
    animateHit(app, myPlayer.id);
  }

  if (typeof mazeContainer !== "undefined" && mazeContainer) {
    mazeContainer.style.boxShadow = "inset 0 0 50px rgba(255, 0, 0, 0.8)";
    setTimeout(() => {
      mazeContainer.style.boxShadow = "";
    }, 300);
  }
});

// !! --------------- RELOAD SYSTEM --------------- !!
const MAX_CLIP_SIZE = 5;
let state = {
  bullets: MAX_CLIP_SIZE,
  maxBullets: MAX_CLIP_SIZE,
};

function updateAmmoDisplay(newBullets, newMaxBullets = state.maxBullets) {
  state.bullets = Math.max(0, newBullets);
  state.maxBullets = Math.max(1, newMaxBullets);

  const container = document.getElementById("reload");
  if (!container) return;

  let bulletIndicatorsHtml = "";
  for (let i = 0; i < state.maxBullets; i++) {
    const isActive = i < state.bullets;
    bulletIndicatorsHtml += `
            <div 
                class="bullet-bar"
                style="
                    background-color: ${
                      isActive ? "var(--color-ammo)" : "var(--bg-base)"
                    };
                    box-shadow: ${
                      isActive ? "0 0 8px rgba(255, 184, 44, 0.5)" : "none"
                    };
                    transform: scaleY(${isActive ? 1 : 0.8});
                    transition-delay: ${i * 0.05}s; 
                "
            ></div>
        `;
  }

  const panelHtml = `
        <div class="app-footer">
            <div class="hud-container">
                <div class="ammo-card">
                    <div class="ammo-hud-row">
                        <svg class="crosshair-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><circle cx="12" cy="12" r="7"></circle>
                        </svg>
                        <div class="ammo-display">
                            <div id="bullet-indicators" class="bullet-indicators">
                                ${bulletIndicatorsHtml}
                            </div>
                            <div class="bullet-count">
                                ${state.bullets}/${state.maxBullets}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  container.innerHTML = panelHtml;
}

window.onload = () => {
  updateAmmoDisplay(state.bullets, state.maxBullets);
  document.addEventListener("keydown", handleKeydown);
};
