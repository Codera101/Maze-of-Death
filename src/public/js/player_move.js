// Direction mapping: Backend uses x=row (vertical), y=column (horizontal)
// U/D modify x (row), L/R modify y (column)
let dirArr = ["U", "D", "L", "R"];
let arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let wasd = ["w", "s", "a", "d"];
let moveDir;

let moveSound = new Audio("../sounds/move.mp3");

window.addEventListener("keydown", (e) => {
  e.preventDefault();
  moveDir = null; // Reset moveDir at the start of each key press
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
        e.preventDefault(); // Prevent default touch behavior
        e.stopPropagation(); // Prevent event bubbling (stops shooting)
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
  if (status === true) {
    moveSound.play();
    // TODO
  }
});
