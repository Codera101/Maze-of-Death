

function drawRoundedRect(app,{
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
    
    return g;
}



function drawCircle(app,{
    x = 0,
    y = 0,
    radius = 50,
    fillColor = 0xffffff,
    strokeColor = 0x000000,
    strokeWidth = 0
}) {
    const g = new PIXI.Graphics();

    // BORDER INSIDE: reduce radius by half of strokeWidth
    const r = radius - strokeWidth / 2;

    // Fill
    g.beginFill(fillColor);
    g.drawCircle(x, y, r);
    g.endFill();

    // Border
    if (strokeWidth > 0) {
        g.lineStyle(strokeWidth, strokeColor, 1, 0, false, false);
        g.drawCircle(x, y, r);
    }

    app.stage.addChild(g);
    return g;
}




function drawMaze(app) {
    for (let row = 0; row < rows * cellSize + (rows - 1) * strokeWidth; row += cellSize + strokeWidth * 2) {
        for (let col = 0; col < cols * cellSize + (cols - 1) * strokeWidth; col += cellSize + strokeWidth * 2) {

            if (mazeLayout[row / (cellSize + strokeWidth * 2)][col / (cellSize + strokeWidth * 2)] === 0) {
                drawRoundedRect(app, {
                    x: col,
                    y: row,
                    width: cellSize,
                    height: cellSize,
                    radius: 1,
                    fillColor: "#1a1a28",
                    strokeColor: "#FF2C47",
                    strokeWidth: strokeWidth  
                });
            } else {
                drawRoundedRect(app,{
                    x: col,
                    y: row,
                    width: cellSize,
                    height: cellSize,
                    radius: 1,
                    fillColor: "#0D0D16",
                    strokeColor: "#10212A",
                    strokeWidth: strokeWidth
                })
            }
        }
    }
} 



function drawPlayer(app, {
    x = 0,
    y = 0,
    width = cellSize,
    height = cellSize,
    radius = 7,
    dir = "up",
    fillColor,
}) {
    drawRoundedRect(app, {x, y, width: width, height: height, radius: 15, fillColor: fillColor, strokeColor: "#FFFFFF", strokeWidth: 0});
    let cx, cy;
    
    if (dir === 'up' || dir === 'down') {
        cx = x + width / 2;
        cy = dir === 'up' ? y + 15 : y + height - 15;
    } else if (dir === 'left' || dir === 'right') {
        cx = dir === 'left' ? x + 15 : x + width - 15;
        cy = y + height / 2;
    }
    drawCircle(app, {x: cx, y: cy, radius: radius, fillColor: "#fff", strokeColor: "#FFFFFF", strokeWidth: 2});
}

function drawPlayers(app) {
    if (visiblePlayers.length === 0) return;
    visiblePlayers.forEach(player => {
        drawPlayer(app, {
            x: player.x,
            y: player.y,
            dir: player.dir,
            fillColor: player.fillColor
        });
    });
}


function updateMaze(app) {
    drawMaze(app);
    drawPlayers(app);
}