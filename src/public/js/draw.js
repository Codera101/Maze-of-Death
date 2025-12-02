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

  socket.on("room_full", (data) => {
    alert(data.message || "Room is full. Please try again later.");
    // Redirect back to home page
    window.location.href = "/";
  });

  // Show hit animation on any player (visible to all)
  socket.on("player_hit_animation", ({ targetId, targetX, targetY }) => {
    if (typeof app !== "undefined" && typeof showHitMarker === "function") {
      showHitMarker(app, targetX, targetY, false);
    }
  });

  // Show death animation on any player (visible to all)
  socket.on(
    "player_death_animation",
    ({ targetId, targetX, targetY, targetName }) => {
      console.log(
        `Death animation for ${targetName} at (${targetX}, ${targetY})`
      );
      if (typeof app !== "undefined") {
        // Use the visible death animation function
        animateDeathAtPosition(app, targetX, targetY);
      }
    }
  );
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

/**
 * Show hit marker at target location (visible to all players)
 */
function showHitMarker(app, targetX, targetY, isKill = false) {
  if (!app) return;

  const gridStep = cellSize + strokeWidth * 2;
  const gridX = targetY * gridStep; // Note: x/y swap in grid coordinates
  const gridY = targetX * gridStep;
  const visualX = gridX + strokeWidth;
  const visualY = gridY + strokeWidth;
  const visualWidth = cellSize - strokeWidth;
  const centerX = visualX + visualWidth / 2;
  const centerY = visualY + visualWidth / 2;

  // Create blood splatter effect
  const particleCount = isKill ? 15 : 10;
  const particles = [];

  // Main impact flash
  const flash = new PIXI.Graphics();
  flash.circle(centerX, centerY, isKill ? 20 : 12);
  flash.fill({ color: 0xff0000, alpha: 0.8 });
  app.stage.addChild(flash);

  // Blood particles
  for (let i = 0; i < particleCount; i++) {
    const angle =
      (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
    const speed = (isKill ? 2 : 1.5) + Math.random() * 2;
    const size = 2 + Math.random() * (isKill ? 4 : 3);

    const particle = new PIXI.Graphics();
    const red = 0xff0000 + Math.floor(Math.random() * 0x004400); // Slight color variation
    particle.circle(0, 0, size);
    particle.fill({ color: red });
    particle.x = centerX;
    particle.y = centerY;
    particle.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    particle.drag = 0.95; // Slow down over time
    app.stage.addChild(particle);
    particles.push(particle);
  }

  // Damage number indicator
  const damageText = new PIXI.Text(isKill ? "KILL!" : "-5", {
    fontFamily: "Arial",
    fontSize: isKill ? 24 : 18,
    fill: isKill ? 0xffff00 : 0xff6666,
    fontWeight: "bold",
    stroke: 0x000000,
    strokeThickness: 3,
  });
  damageText.anchor.set(0.5);
  damageText.x = centerX;
  damageText.y = centerY - 20;
  app.stage.addChild(damageText);

  // Animate everything
  let frame = 0;
  const interval = setInterval(() => {
    frame++;

    // Animate particles
    particles.forEach((particle, index) => {
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.velocity.x *= particle.drag;
      particle.velocity.y *= particle.drag;
      particle.alpha = 1 - frame / 12;

      if (particle.alpha <= 0 && particle.parent) {
        particle.parent.removeChild(particle);
        particle.destroy();
        particles.splice(index, 1);
      }
    });

    // Fade flash
    flash.alpha = Math.max(0, 0.8 - frame * 0.1);
    if (flash.alpha <= 0 && flash.parent) {
      flash.parent.removeChild(flash);
      flash.destroy();
    }

    // Float damage text up and fade
    damageText.y -= 2;
    damageText.alpha = 1 - frame / 12;
    if (damageText.alpha <= 0 && damageText.parent) {
      damageText.parent.removeChild(damageText);
      damageText.destroy();
    }

    if (frame >= 12 && particles.length === 0) {
      clearInterval(interval);
    }
  }, 50);
}

/**
 * Show wall impact effect when bullet hits wall
 */
function showWallImpact(app, shooterX, shooterY, direction) {
  if (!app) return;

  const gridStep = cellSize + strokeWidth * 2;
  const gridX = shooterY * gridStep;
  const gridY = shooterX * gridStep;
  const visualX = gridX + strokeWidth;
  const visualY = gridY + strokeWidth;
  const visualWidth = cellSize - strokeWidth;
  const centerX = visualX + visualWidth / 2;
  const centerY = visualY + visualWidth / 2;

  // Calculate impact position based on direction
  let impactX = centerX;
  let impactY = centerY;
  const offset = visualWidth / 2 + 10;

  const dir =
    typeof direction === "string" ? direction.toUpperCase() : direction;
  if (dir === "U") impactY -= offset;
  else if (dir === "D") impactY += offset;
  else if (dir === "L") impactX -= offset;
  else if (dir === "R") impactX += offset;

  // Create spark particles
  const particleCount = 8;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    const particle = new PIXI.Graphics();
    particle.circle(0, 0, 2);
    particle.fill({ color: 0xffaa00 });
    particle.x = impactX;
    particle.y = impactY;
    particle.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    app.stage.addChild(particle);
    particles.push(particle);
  }

  // Animate particles
  let frame = 0;
  const interval = setInterval(() => {
    frame++;
    particles.forEach((particle, index) => {
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.alpha = 1 - frame / 8;

      if (particle.alpha <= 0 && particle.parent) {
        particle.parent.removeChild(particle);
        particle.destroy();
        particles.splice(index, 1);
      }
    });

    if (frame >= 8) {
      clearInterval(interval);
    }
  }, 50);
}

/**
 * Animate hit effect on player - red flash and shake
 */
function animateHit(app, playerId) {
  if (!app || typeof myPlayer === "undefined") return;

  const gridStep = cellSize + strokeWidth * 2;
  const gridX = myPlayer.y * gridStep;
  const gridY = myPlayer.x * gridStep;
  const visualX = gridX + strokeWidth;
  const visualY = gridY + strokeWidth;
  const visualWidth = cellSize - strokeWidth;
  const visualHeight = cellSize - strokeWidth;
  const centerX = visualX + visualWidth / 2;
  const centerY = visualY + visualHeight / 2;

  // Create red damage flash overlay
  const damageFlash = new PIXI.Graphics();
  damageFlash.roundRect(
    visualX - 5,
    visualY - 5,
    visualWidth + 10,
    visualHeight + 10,
    12
  );
  damageFlash.fill({ color: 0xff0000, alpha: 0.6 });
  app.stage.addChild(damageFlash);

  // Create blood particle effect
  const particleCount = 8;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const particle = new PIXI.Graphics();
    particle.circle(0, 0, 3);
    particle.fill({ color: 0xff0000 });
    particle.x = centerX;
    particle.y = centerY;
    particle.velocity = {
      x: Math.cos(angle) * 3,
      y: Math.sin(angle) * 3,
    };
    app.stage.addChild(particle);
    particles.push(particle);
  }

  // Animate particles
  let particleFrame = 0;
  const particleInterval = setInterval(() => {
    particleFrame++;
    particles.forEach((particle) => {
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.alpha = 1 - particleFrame / 10;
    });

    if (particleFrame >= 10) {
      clearInterval(particleInterval);
      particles.forEach((particle) => {
        if (particle.parent) {
          particle.parent.removeChild(particle);
          particle.destroy();
        }
      });
    }
  }, 30);

  // Fade out damage flash
  let flashAlpha = 0.6;
  const flashInterval = setInterval(() => {
    flashAlpha -= 0.1;
    damageFlash.alpha = flashAlpha;
    if (flashAlpha <= 0) {
      clearInterval(flashInterval);
      if (damageFlash.parent) {
        damageFlash.parent.removeChild(damageFlash);
        damageFlash.destroy();
      }
    }
  }, 50);

  // Screen shake effect
  if (typeof mazeContent !== "undefined" && mazeContent) {
    let shakeCount = 0;
    const originalTransform = mazeContent.style.transform;
    const shakeInterval = setInterval(() => {
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      mazeContent.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      shakeCount++;
      if (shakeCount >= 6) {
        clearInterval(shakeInterval);
        mazeContent.style.transform = originalTransform || "";
      }
    }, 50);
  }
}

/**
 * Animate death effect - explosion and fade out
 */
function animateDeath(app, playerId) {
  if (!app || typeof myPlayer === "undefined") return;

  const gridStep = cellSize + strokeWidth * 2;
  const gridX = myPlayer.y * gridStep;
  const gridY = myPlayer.x * gridStep;
  const visualX = gridX + strokeWidth;
  const visualY = gridY + strokeWidth;
  const visualWidth = cellSize - strokeWidth;
  const visualHeight = cellSize - strokeWidth;
  const centerX = visualX + visualWidth / 2;
  const centerY = visualY + visualHeight / 2;

  // Create explosion particles
  const particleCount = 20;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const angle =
      (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    const size = 3 + Math.random() * 5;
    const particle = new PIXI.Graphics();

    // Mix of red and orange particles
    const colors = [0xff0000, 0xff4400, 0xff6600, 0xff8800];
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.circle(0, 0, size);
    particle.fill({ color });
    particle.x = centerX;
    particle.y = centerY;
    particle.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    particle.life = 1;
    app.stage.addChild(particle);
    particles.push(particle);
  }

  // Explosion flash
  const flash = new PIXI.Graphics();
  flash.circle(centerX, centerY, visualWidth);
  flash.fill({ color: 0xffffff, alpha: 0.8 });
  app.stage.addChild(flash);

  // Animate explosion
  let frame = 0;
  const animationInterval = setInterval(() => {
    frame++;

    // Update particles
    particles.forEach((particle, index) => {
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.velocity.y += 0.2; // Gravity
      particle.life -= 0.05;
      particle.alpha = Math.max(0, particle.life);

      if (particle.life <= 0 && particle.parent) {
        particle.parent.removeChild(particle);
        particle.destroy();
        particles.splice(index, 1);
      }
    });

    // Fade flash
    flash.alpha = Math.max(0, 0.8 - frame * 0.1);
    if (flash.alpha <= 0 && flash.parent) {
      flash.parent.removeChild(flash);
      flash.destroy();
    }

    if (frame >= 20 && particles.length === 0) {
      clearInterval(animationInterval);
    }
  }, 50);

  // Heavy screen shake for death
  if (typeof mazeContent !== "undefined" && mazeContent) {
    let shakeCount = 0;
    const originalTransform = mazeContent.style.transform;
    const shakeInterval = setInterval(() => {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      mazeContent.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      shakeCount++;
      if (shakeCount >= 10) {
        clearInterval(shakeInterval);
        mazeContent.style.transform = originalTransform || "";
      }
    }, 50);
  }
}

function updateMaze(app) {
  // Only update what changed - maze is cached, players are pooled
  drawMaze(app); // Will skip if maze unchanged
  drawPlayers(app); // Will reuse/update player graphics
  // updateAmmoDisplay(myPlayer.bullets, 5);
}
