// Create app (constructor only)
const app = new PIXI.Application();

// Must await init()
await app.init({
    width: cols * cellSize,
    height: rows * cellSize,
    background: '#1e1e1e'
});

/* ***************************** ****************************** *********************** */

// function to create a rounded rectangle with fill and stroke
function createRoundedRect({
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    radius = 0,
    fillColor = 0xffffff,
    strokeColor = 0x000000,
    strokeWidth = 0
}) {
    const g = new PIXI.Graphics();

    // BORDER IS INSIDE: reduce drawing area by strokeWidth
    const half = strokeWidth / 2;

    g.roundRect(
        x + half,
        y + half,
        width - strokeWidth,
        height - strokeWidth,
        radius
    );

    // Fill
    g.fill({ color: fillColor });

    // Border (0 = no stroke)
    if (strokeWidth > 0) {
        g.stroke({
            color: strokeColor,
            width: strokeWidth,
            alignment: 0 // 0 = inside border
        });
    }
    app.stage.addChild(g);
    console.log(g);
    
    return g;
}


function drawMaze() {
    for (let row = 0; row < rows * cellSize; row += cellSize) {
        for (let col = 0; col < cols * cellSize; col += cellSize) {
            createRoundedRect({
                x: col,
                y: row,
                width: cellSize,
                height: cellSize,
                radius: 5,
                fillColor: 0x808080,
                strokeColor: 0x000000,
                strokeWidth: 2
            });
        }
    }
} 

function drawPlayer() {
    
}


drawMaze();










// app.stage.addChild();
// createRoundedRect({
//     x: 50,
//     y: 50,
//     width: 100,
//     height: 100,
//     radius: 20,
//     fillColor: 0x00ff00,
//     strokeColor: 0x0000ff,  
//     strokeWidth: 5
// })


mazeContent.appendChild(app.canvas);