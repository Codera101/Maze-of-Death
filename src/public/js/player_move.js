// Direction mapping: Backend uses x=row (vertical), y=column (horizontal)
// U/D modify x (row), L/R modify y (column)
let dirArr = ["U", "D", "L", "R"];
let arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let wasd = ["w", "s", "a", "d"];
let moveDir;

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

socket.on("player_moved", ({ status }) => {
  if (status === true) {
    // TODO 
  }
});
