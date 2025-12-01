// import { app } from "./maze.js"
// import { rows, cols, cellSize, strokeWidth, mazeLayout } from "./config.js"

// Socket setup
// const socket = io("http://localhost:3000");

// Graphics cache to reuse objects and prevent memory leaks
const graphicsCache = {
  maze: null,
  players: new Map(), // Map of player ID to graphics object
  lastMazeState: null,
};

if (typeof socket !== "undefined") {
  socket.on("connect", () => {
    const params = new URLSearchParams(window.location.search);
    const username_value = params.get("username");
    socket.emit("join_player", { username: username_value });
    // console.log("Joining as:", username_value);
  });

  socket.on("player_joined", (data) => {
    const player = data.current_player;
    // Initialize myPlayer with all properties from server
    myPlayer.id = player.id;
    myPlayer.username = player.userName;
    myPlayer.x = player.x;
    myPlayer.y = player.y;
    myPlayer.dir = player.dir;
    myPlayer.health = player.health;
    myPlayer.score = player.score;
    myPlayer.kill_count = player.kill_count;
    myPlayer.bullets = player.bullets;
    myPlayer.color = player.color;

    // Update UI with initial player state
    if (typeof updatePlayerInfo === "function") {
      updatePlayerInfo(player);
    }

    // console.log("Player joined and initialized:", myPlayer);
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
      alignment: 0.5,
    });
  }

  app.stage.addChild(g);
  return g;
}

function drawMaze(app) {
  // Check if variables are available (defensive coding)
  if (typeof rows === "undefined" || typeof cols === "undefined") return;

  // Use cached maze if layout hasn't changed
  const mazeStateKey = JSON.stringify(mazeLayout);
  if (graphicsCache.maze && graphicsCache.lastMazeState === mazeStateKey) {
    return; // Maze already drawn and unchanged
  }

  // Clear old maze graphics if exists
  if (graphicsCache.maze) {
    app.stage.removeChild(graphicsCache.maze);
    graphicsCache.maze.destroy({ children: true });
  }

  // Create a container for all maze graphics
  graphicsCache.maze = new PIXI.Container();
  graphicsCache.lastMazeState = mazeStateKey;

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
      if (!mazeLayout[rowIndex] || mazeLayout[rowIndex][colIndex] === undefined)
        continue;

      const g = new PIXI.Graphics();
      const visualX = col + strokeWidth;
      const visualY = row + strokeWidth;
      const visualWidth = cellSize - strokeWidth;
      const visualHeight = cellSize - strokeWidth;

      g.roundRect(visualX, visualY, visualWidth, visualHeight, 1);

      if (mazeLayout[rowIndex][colIndex] === 1) {
        // Wall
        g.fill({ color: 0x1a1a28 });
        if (strokeWidth > 0) {
          g.stroke({ color: 0xff2c47, width: strokeWidth, alignment: 0 });
        }
      } else {
        // Floor
        g.fill({ color: 0x0d0d16 });
        if (strokeWidth > 0) {
          g.stroke({ color: 0x10212a, width: strokeWidth, alignment: 0 });
        }
      }

      graphicsCache.maze.addChild(g);
    }
  }

  app.stage.addChild(graphicsCache.maze);
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

  const centerX = visualBodyX + visualBodyW / 2;
  const centerY = visualBodyY + visualBodyH / 2;

  // 3. Calculate Dot Position
  // Logic: Push the dot to the edge, minus its own radius, minus a small padding (3px)
  const padding = 3;
  const maxOffset = visualBodyW / 2 - radius - padding;

  // Safety: ensure offset is positive, otherwise fallback to 25% of width
  const offsetDistance = maxOffset > 0 ? maxOffset : visualBodyW / 4;

  let dotX = centerX;
  let dotY = centerY;

  // console.log(typeof(dirUpper));
  const dirUpper = typeof dir == "string" ? dir.toUpperCase() : dir;

  if (dirUpper == "U") {
    dotY = centerY - offsetDistance;
  } else if (dirUpper == "D") {
    dotY = centerY + offsetDistance;
  } else if (dirUpper == "L") {
    dotX = centerX - offsetDistance;
  } else if (dirUpper == "R") {
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
  // Safety check
  if (!Array.isArray(visiblePlayers) || visiblePlayers.length === 0) {
    // Clear all player graphics if no players
    graphicsCache.players.forEach((graphics, id) => {
      app.stage.removeChild(graphics);
      graphics.destroy({ children: true });
    });
    graphicsCache.players.clear();
    return;
  }

  const currentPlayerIds = new Set(visiblePlayers.map((p) => p.id));
  const gridStep = cellSize + strokeWidth * 2;

  // Remove graphics for players no longer visible
  graphicsCache.players.forEach((graphics, id) => {
    if (!currentPlayerIds.has(id)) {
      app.stage.removeChild(graphics);
      graphics.destroy({ children: true });
      graphicsCache.players.delete(id);
    }
  });

  visiblePlayers.forEach((player) => {
    // Reuse or create player graphics
    let playerContainer = graphicsCache.players.get(player.id);

    if (!playerContainer) {
      playerContainer = new PIXI.Container();
      graphicsCache.players.set(player.id, playerContainer);
      app.stage.addChild(playerContainer);
    }

    // Clear and redraw player
    playerContainer.removeChildren().forEach((child) => child.destroy());

    const gridX = player.y * gridStep;
    const gridY = player.x * gridStep;

    // Draw player body
    const body = new PIXI.Graphics();
    const visualX = gridX + strokeWidth;
    const visualY = gridY + strokeWidth;
    const visualWidth = cellSize - strokeWidth;
    const visualHeight = cellSize - strokeWidth;

    body.roundRect(visualX, visualY, visualWidth, visualHeight, 10);
    body.fill({ color: player.color });
    playerContainer.addChild(body);

    // Draw direction indicator
    const radius = 7;
    const centerX = visualX + visualWidth / 2;
    const centerY = visualY + visualHeight / 2;
    const padding = 3;
    const maxOffset = visualWidth / 2 - radius - padding;
    const offsetDistance = maxOffset > 0 ? maxOffset : visualWidth / 4;

    let dotX = centerX,
      dotY = centerY;
    const dirUpper =
      typeof player.dir == "string" ? player.dir.toUpperCase() : player.dir;

    if (dirUpper == "U") dotY = centerY - offsetDistance;
    else if (dirUpper == "D") dotY = centerY + offsetDistance;
    else if (dirUpper == "L") dotX = centerX - offsetDistance;
    else if (dirUpper == "R") dotX = centerX + offsetDistance;

    const dot = new PIXI.Graphics();
    dot.circle(dotX, dotY, radius);
    dot.fill({ color: 0xffffff });
    playerContainer.addChild(dot);
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
  // Only update what changed - maze is cached, players are pooled
  drawMaze(app); // Will skip if maze unchanged
  drawPlayers(app); // Will reuse/update player graphics
  // updateAmmoDisplay(myPlayer.bullets, 5);
}
