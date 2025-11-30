import { app } from "./maze.js";

let dx = [0, 0, -1, 1];
let dy = [-1, 1, 0, 0];
let dirArr = ["UP", "DOWN", "LEFT", "RIGHT"];
let arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let wasd = ["w", "s", "a", "d"];
let moveDir;

window.addEventListener("keydown", (e) => {
  for (let i = 0; i < wasd.length; i++) {
    if (e.key === wasd[i] || e.key === arrows[i]) {
      moveDir = dirArr[i];
    }
  }
  if (moveDir) {
    e.preventDefault();
    socket.emit("player_move", { direction: moveDir });
  }
});

socket.on("player_moved", ({ status }) => {
  if (status === true) {
    let dirIndex = dirArr.indexOf(moveDir);
    myPlayer.x += dx[dirIndex] * (cellSize + strokeWidth * 2);
    myPlayer.y += dy[dirIndex] * (cellSize + strokeWidth * 2);

    drawMaze(app);
    drawPlayer(app, {
      x: myPlayer.x,
      y: myPlayer.y,
      dir: moveDir.toLowerCase(),
      fillColor: "#ccAc50",
    });
  }
});
