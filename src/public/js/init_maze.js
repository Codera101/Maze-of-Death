import { app } from './maze.js';

socket.on("draw_maze", async ({ maze: { row, col, layout } }) => {
    rows = row;
    cols = col;
    mazeLayout = layout;
    drawMaze(app);
})