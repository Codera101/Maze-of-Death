// import { app } from "./maze.js"
// import { rows, cols, cellSize, strokeWidth, mazeLayout } from "./config.js"

// Socket setup
// const socket = io("http://localhost:3000");

if (typeof socket !== 'undefined') {
    socket.on("connect", () => {
        const params = new URLSearchParams(window.location.search);
        const username_value = params.get("username");
        socket.emit("join_player", { username: username_value });
        console.log("Joining as:", username_value);
    });

    socket.on("player_joined", (data) => {
        window.player = data.current_player;
    });
}

/**
 * Draws a rounded rectangle. 
 * Note: Accounts for strokeWidth by shrinking the visual box slightly 
 * so borders render inside the bounds.
 */
function drawRoundedRect(
    app,
    {
        x,
        y,
        width = 100,
        height = 100,
        radius = 0,
        fillColor = 0xffffff,
        strokeColor = 0x000000,
        strokeWidth = 0,
    }
) {
    const g = new PIXI.Graphics();

    // Calculate visual bounds (border inside)
    const visualX = x + strokeWidth;
    const visualY = y + strokeWidth;
    const visualWidth = width - strokeWidth;
    const visualHeight = height - strokeWidth;

    g.roundRect(visualX, visualY, visualWidth, visualHeight, radius);

    // Fill
    g.fill({ color: fillColor });

    // Border (0 = no stroke)
    if (strokeWidth > 0) {
        g.stroke({
            color: strokeColor,
            width: strokeWidth,
            alignment: 0, // 0 = inside border
        });
    }
    app.stage.addChild(g);

    return g;
}

/**
 * UPDATED: Uses PIXI v8 syntax to match drawRoundedRect.
 */
function drawCircle(
    app,
    {
        x,
        y,
        radius = 50,
        fillColor = 0xffffff,
        strokeColor = 0x000000,
        strokeWidth = 0,
    }
) {
    const g = new PIXI.Graphics();

    // BORDER INSIDE: reduce radius by half of strokeWidth
    const r = radius - strokeWidth / 2;

    g.circle(x, y, r);
    g.fill({ color: fillColor });

    if (strokeWidth > 0) {
        g.stroke({
            color: strokeColor,
            width: strokeWidth,
            alignment: 0.5 
        });
    }

    app.stage.addChild(g);
    return g;
}

function drawMaze(app) {
    // Check if variables are available (defensive coding)
    if (typeof rows === 'undefined' || typeof cols === 'undefined') return;

    for (
        let row = 0;
        row < rows * cellSize + (rows - 1) * strokeWidth;
        row += cellSize + strokeWidth * 2
    ) {
        for (
            let col = 0;
            col < cols * cellSize + (cols - 1) * strokeWidth;
            col += cellSize + strokeWidth * 2
        ) {
            // Determine cell type
            const rowIndex = Math.round(row / (cellSize + strokeWidth * 2));
            const colIndex = Math.round(col / (cellSize + strokeWidth * 2));
            
            // Safety check for array bounds
            if (!mazeLayout[rowIndex] || mazeLayout[rowIndex][colIndex] === undefined) continue;

            if (mazeLayout[rowIndex][colIndex] === 1) {
                // Wall
                drawRoundedRect(app, {
                    x: col,
                    y: row,
                    width: cellSize,
                    height: cellSize,
                    radius: 1,
                    fillColor: "#1a1a28",
                    strokeColor: "#FF2C47",
                    strokeWidth: strokeWidth,
                });
            } else {
                // Floor
                drawRoundedRect(app, {
                    x: col,
                    y: row,
                    width: cellSize,
                    height: cellSize,
                    radius: 1,
                    fillColor: "#0D0D16",
                    strokeColor: "#10212A",
                    strokeWidth: strokeWidth,
                });
            }
        }
    }
}

/**
 * FIXED: Player drawing logic.
 * Calculates position dynamically to push the dot to the edge
 * based on the direction.
 */
function drawPlayer(
    app,
    {
        x,
        y,
        width = cellSize,
        height = cellSize,
        radius = 7, // Radius of the direction dot
        dir,
        fillColor,
    }
) {
    // 1. Draw the Body
    drawRoundedRect(app, {
        x,
        y,
        width: width,
        height: height,
        radius: 10, // Rounded corners
        fillColor: fillColor,
        strokeColor: "#FFFFFF",
        strokeWidth: 0,
    });

    // 2. Calculate Visual Center
    // Since drawRoundedRect shifts x by strokeWidth and width by -strokeWidth,
    // we need to calculate the actual center of the drawn rectangle.
    
    const playerStrokeWidth = 0; 
    
    const visualBodyX = x + playerStrokeWidth;
    const visualBodyY = y + playerStrokeWidth;
    const visualBodyW = width - playerStrokeWidth;
    const visualBodyH = height - playerStrokeWidth;

    const centerX = visualBodyX + (visualBodyW / 2);
    const centerY = visualBodyY + (visualBodyH / 2);

    // 3. Calculate Dot Position
    // Logic: Push the dot to the edge, minus its own radius, minus a small padding (3px)
    const padding = 3;
    const maxOffset = (visualBodyW / 2) - radius - padding;
    
    // Safety: ensure offset is positive, otherwise fallback to 25% of width
    const offsetDistance = maxOffset > 0 ? maxOffset : (visualBodyW / 4);

    let dotX = centerX;
    let dotY = centerY;
    
    // console.log(typeof(dirUpper));
    const dirUpper = (typeof dir == "string") ? dir.toUpperCase() : dir.direction;

    if (dirUpper == "UP") {
        dotY = centerY - offsetDistance;
    } else if (dirUpper == "DOWN") {
        dotY = centerY + offsetDistance;
    } else if (dirUpper == "LEFT") {
        dotX = centerX - offsetDistance;
    } else if (dirUpper == "RIGHT") {
        dotX = centerX + offsetDistance;
    }

    // 4. Draw the Direction Dot
    drawCircle(app, {
        x: dotX,
        y: dotY,
        radius: radius,
        fillColor: "#fff",
        strokeColor: "#FFFFFF",
        strokeWidth: 0,
    });
}

function drawPlayers(app) {
    if (typeof visiblePlayers === 'undefined' || visiblePlayers.length === 0) return;

    // Calculate the size of a single grid block including borders/spacing
    // This formula matches the iteration logic in drawMaze
    const gridStep = cellSize + (strokeWidth * 2); 
    
    visiblePlayers.forEach((player) => {
        // console.log("Drawing player:", player);
        drawPlayer(app, {
            // Convert Grid Coordinates -> Pixel Coordinates
            x: player.x * gridStep,
            y: player.y * gridStep,
            dir: player.dir,
            fillColor: player.color,
        });
    });
}

function fireLaser(app, { xStart, yStart, xEnd, yEnd, lineWidth }) {
    if (!lineWidth || lineWidth <= 0) return;

    const laser = new PIXI.Graphics();

    // Glow (gold)
    laser.poly([xStart, yStart, xEnd, yEnd], false).stroke({
        width: lineWidth * 3,
        color: 0xffd966,
        alpha: 0.25,
        cap: "round",
    });

    // Core gold beam
    laser.poly([xStart, yStart, xEnd, yEnd], false).stroke({
        width: lineWidth,
        color: 0xffcc00,
        alpha: 1,
        cap: "round",
    });

    app.stage.addChild(laser);

    setTimeout(() => {
        if (laser.parent) {
            laser.parent.removeChild(laser);
            laser.destroy();
        }
    }, 200);

    return laser;
}

function updateMaze(app) {
    drawMaze(app);
    drawPlayers(app);
    // updateAmmoDisplay(myPlayer.bullets, 5);
}