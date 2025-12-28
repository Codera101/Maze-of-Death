// import { app } from './maze.js';

function resizeMaze() {
  let w = mazeContainer.clientWidth;
  let h = mazeContainer.clientHeight;
  for (let size = 30; size <= 40; size++) {
    if (rows * size + (rows - 1) * strokeWidth * 2 <= h) {
      cellSize = size;
    }
  }

  cellSize = 32;
}

socket.on("draw_maze", ({ maze: { row, col, layout } }) => {
  rows = row;
  cols = col;
  mazeLayout = layout;
  resizeMaze();
  drawMaze(app);
});
