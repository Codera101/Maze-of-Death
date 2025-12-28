// import { app } from './maze.js';

function resizeMaze() {
    let w = mazeContainer.clientWidth;
    let h = mazeContainer.clientHeight;
    for (let size = 30; size <= 40; size++) {
        if (rows * size + (rows - 1) * strokeWidth * 2 <= h) {
            cellSize = size;
        }
    }

    // await app.init({
    //     width: cols * cellSize + (cols - 1) * strokeWidth * 2,
    //     height: rows * cellSize + (rows - 1) * strokeWidth * 2,
    //     // background: '#0D0D16',
    //     background: 'red',
    //     antialias: true,
    //     autoDensity:true,
    //     resolution: window.devicePixelRatio || 1,
    // });
    // app.resize (
    //     cols * cellSize + (cols - 1) * strokeWidth * 2,
    //     rows * cellSize + (rows - 1) * strokeWidth * 2,
    // );

    cellSize = 32;  
    console.log("resize ", cellSize, rows, cols, h);
}

// window.addEventListener('resize', () => {
//     resizeMaze();
//     drawMaze(app);
// });

socket.on("draw_maze", ({ maze: { row, col, layout } }) => {
    rows = row;
    cols = col;
    mazeLayout = layout;
    // cellSize = Math.floor(Math.min(mazeContainer.innerWidth / cols, mazeContainer.innerHeight / rows));
    resizeMaze();
    drawMaze(app);
})