import { app } from './maze.js';

socket.on("draw_maze", async ({ maze: { row, col, layout } }) => {
    rows = row;
    cols = col;
    mazeLayout = layout;

    await app.init({
        width: cols * cellSize + (cols - 1) * strokeWidth * 2,
        height: rows * cellSize + (rows - 1) * strokeWidth * 2,
        background: '#0D0D16',
    });
    updateMaze(app);
})