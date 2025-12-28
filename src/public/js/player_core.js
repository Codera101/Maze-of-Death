// Refresh Player Status

function updateHealth(newHealth) {
  healthValue.textContent = newHealth;
  const percentage = (newHealth / 25) * 100;
  document
    .getElementById("health-progress")
    .style.setProperty("--health-percent", `${percentage}%`);
}

function updatePlayerInfo(playerData) {
  myPlayer = { ...myPlayer, ...playerData };
  updateHealth(playerData.health);
  scoreValue.textContent = playerData.score;
  killsValue.textContent = playerData.kill_count;
  if (typeof updateAmmoDisplay === "function") {
    updateAmmoDisplay(playerData.bullets, 5);
  }
}

socket.on("refresh_player", (playerData) => {
  updatePlayerInfo(playerData);
});

// Respawn Handler
socket.on("respawn", (player) => updatePlayerInfo(player));

// Hit Received Handler
let hitSound = new Audio("../sounds/hitHurt.wav");

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

// Death handler

const deadSound = new Audio("../sounds/gameover.mp3");
const countAllDownSound = new Audio("../sounds/countdown.mp3");

socket.on("died", ({ killer_name, respawn_time }) => {
  deadSound.play();
  countAllDownSound.play();

  const template = document.getElementById("death-screen-template");
  const deathOverlay = template.content
    .cloneNode(true)
    .querySelector("#death-overlay");

  deathOverlay.querySelector(".killer-name").textContent = killer_name;
  const timerElement = deathOverlay.querySelector("#respawn-timer");
  timerElement.textContent = Math.ceil(respawn_time / 1000);

  document.body.appendChild(deathOverlay);

  let remainingTime = respawn_time;
  const countdownInterval = setInterval(() => {
    remainingTime -= 100;
    if (timerElement) {
      timerElement.textContent = Math.max(0, Math.ceil(remainingTime / 1000));
    }
  }, 100);

  setTimeout(() => {
    clearInterval(countdownInterval);
    deathOverlay.remove();
  }, respawn_time);
});

// Move handler

// Direction mapping: Backend uses x=row (vertical), y=column (horizontal)
// U/D modify x (row), L/R modify y (column)
let dirArr = ["U", "D", "L", "R"];
let arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let wasd = ["w", "s", "a", "d"];
let moveDir;

let moveSound = new Audio("../sounds/move.mp3");

window.addEventListener("keydown", (e) => {
  e.preventDefault(), (moveDir = null); // Reset moveDir at the start of each key press
  for (let i = 0; i < wasd.length; i++) {
    if (e.key === wasd[i] || e.key === arrows[i]) {
      moveDir = dirArr[i];
    }
  }
  if (moveDir) {
    socket.emit("player_move", { direction: moveDir });
  }
});

// Mobile Controls
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
        e.preventDefault(), e.stopPropagation();
        socket.emit("player_move", { direction: dir });
      };

      btn.addEventListener("touchstart", handleMove, { passive: false });
      btn.addEventListener("click", handleMove);
    }
  });
};
// Initialize mobile controls
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupMobileControls);
} else {
  setupMobileControls();
}

socket.on("player_moved", ({ status }) => {
  if (status) {
    moveSound.play();
  }
});
