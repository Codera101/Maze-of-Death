// Create app (constructor only)
export const app = new PIXI.Application();

// Must await init()
await app.init({
    width: cols * cellSize + (cols - 1) * strokeWidth * 2,
    height: rows * cellSize + (rows - 1) * strokeWidth * 2,
    background: '#0D0D16',
});
mazeContent.appendChild(app.canvas);

// drawMaze(app);

// drawPlayer(app, {
//     x: 0 + (cellSize + strokeWidth * 2) * 3,
//     y: 0 + (cellSize + strokeWidth * 2) * 5,
//     dir: 'right',
//     fillColor: "#4CAF50"
// });

// drawPlayer(app, {
//     x: 0 + (cellSize + strokeWidth * 2) * 3,
//     y: 0 + (cellSize + strokeWidth * 2) * 2,
//     dir: 'up',
//     fillColor: "#ccAc50"
// });


// fireLaser(app, {
//     xStart: 0 ,
//     yStart: 0,
//     xEnd: 300,
//     yEnd: 300,
//     lineWidth: 5, 
// });
