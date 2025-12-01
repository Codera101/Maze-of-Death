let dx = [0, 0, -1, 1];
let dy = [-1, 1, 0, 0];
let dirArr = ["U", "D", "L", "R"];
let arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let wasd = ["w", "s", "a", "d"];
let moveDir;

window.addEventListener("keydown", (e) => {
  e.preventDefault();
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
