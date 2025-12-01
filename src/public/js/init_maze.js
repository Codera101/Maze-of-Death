import { app } from './maze.js';

socket.on("draw_maze", async ({ maze: { row, col, layout } }) => {
    rows = row;
    cols = col;
    mazeLayout = layout;
    // console.log(mazeLayout);
    // await app.init({
    //     width: cols * cellSize + (cols - 1) * strokeWidth * 2,
    //     height: rows * cellSize + (rows - 1) * strokeWidth * 2,
    //     background: '#0D0D16',
    // });
    drawMaze(app);
})