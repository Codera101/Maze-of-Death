/**
 * game_draw.js
 * Consolidated rendering engine for Players and Viewers.
 */

// Graphics cache to reuse objects and prevent memory leaks
const graphicsCache = {
  maze: null,
  players: new Map(), // Map of player ID to graphics object
  lastMazeState: null,
};

/**
 * SOCKET SETUP
 * Distinguishes between Player and Viewer roles based on URL params or context.
 */
if (typeof socket !== "undefined") {
  socket.on("connect", () => {
    const params = new URLSearchParams(window.location.search);
    const username_value = params.get("username");

    if (username_value) {
      // Player Mode
      socket.emit("join_player", { username: username_value });
    } else {
      // Viewer Mode
      socket.emit("join_viewer", {});
    }
  });

  // Player-specific listener
  socket.on("player_joined", (data) => {
    if (typeof updatePlayerInfo === "function") {
      updatePlayerInfo(data.current_player);
    }
  });

  // Shared hit animation listener (visible to all)
  socket.on("player_hit_animation", ({ targetId, targetX, targetY }) => {
    if (typeof app !== "undefined" && typeof showHitMarker === "function") {
      if (window.isViewer) showHitMarker(app, targetX, targetY, false);
    }
  });
}

/**
 * CORE DRAWING UTILITIES (PIXI v8)
 */

function drawRoundedRect(
  app,
  {
    x,
    y,
    width = 100,
    height = 100,
    radius = 5,
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
  g.fill({ color: fillColor });

  if (strokeWidth > 0) {
    g.stroke({
      color: strokeColor,
      width: strokeWidth,
      alignment: 0, // Inside border
    });
  }
  app.stage.addChild(g);
  return g;
}

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
  const r = radius - strokeWidth / 2; // Reduce radius by half stroke

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

/**
 * MAZE RENDERING
 */
function drawMaze(app) {
  if (typeof rows === "undefined" || typeof cols === "undefined") return;

  // Use cached maze if layout hasn't changed
  const mazeStateKey = JSON.stringify(mazeLayout);
  if (graphicsCache.maze && graphicsCache.lastMazeState === mazeStateKey) {
    return;
  }

  if (graphicsCache.maze) {
    app.stage.removeChild(graphicsCache.maze);
    graphicsCache.maze.destroy({ children: true });
  }

  graphicsCache.maze = new PIXI.Container();
  graphicsCache.lastMazeState = mazeStateKey;

  const gridStep = cellSize + strokeWidth * 2;

  for (let rIdx = 0; rIdx < rows; rIdx++) {
    for (let cIdx = 0; cIdx < cols; cIdx++) {
      if (!mazeLayout[rIdx] || mazeLayout[rIdx][cIdx] === undefined) continue;

      const g = new PIXI.Graphics();
      const visualX = cIdx * gridStep + strokeWidth;
      const visualY = rIdx * gridStep + strokeWidth;
      const visualSize = cellSize - strokeWidth;

      g.roundRect(visualX, visualY, visualSize, visualSize, 1);

      if (mazeLayout[rIdx][cIdx] === 1) {
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
 * PLAYER RENDERING
 */
function drawPlayers(app) {
  if (!Array.isArray(visiblePlayers) || visiblePlayers.length === 0) {
    graphicsCache.players.forEach((graphics) => {
      app.stage.removeChild(graphics);
      graphics.destroy({ children: true });
    });
    graphicsCache.players.clear();
    return;
  }

  const currentPlayerIds = new Set(visiblePlayers.map((p) => p.id));
  const gridStep = cellSize + strokeWidth * 2;

  // Remove players no longer visible
  graphicsCache.players.forEach((graphics, id) => {
    if (!currentPlayerIds.has(id)) {
      app.stage.removeChild(graphics);
      graphics.destroy({ children: true });
      graphicsCache.players.delete(id);
    }
  });

  visiblePlayers.forEach((player) => {
    let playerContainer = graphicsCache.players.get(player.id);

    if (!playerContainer) {
      playerContainer = new PIXI.Container();
      graphicsCache.players.set(player.id, playerContainer);
      app.stage.addChild(playerContainer);
    }

    // Clear and redraw container
    playerContainer.removeChildren().forEach((child) => {
      child.destroy({ children: true, texture: false, baseTexture: false });
    });

    const gridX = player.y * gridStep;
    const gridY = player.x * gridStep;
    const visualX = gridX + strokeWidth;
    const visualY = gridY + strokeWidth;
    const visualWidth = cellSize - strokeWidth;
    const visualHeight = cellSize - strokeWidth;

    const body = new PIXI.Graphics();
    const isMyPlayer =
      typeof myPlayer !== "undefined" && player.id === myPlayer.id;

    // Glowing border for current player
    if (isMyPlayer) {
      body.roundRect(
        visualX - 3,
        visualY - 3,
        visualWidth + 8,
        visualHeight + 8,
        12
      );
      body.fill({ color: 0xffffff, alpha: 0.5 });
    }

    body.roundRect(visualX, visualY, visualWidth, visualHeight, 10);
    body.fill({ color: player.color });
    playerContainer.addChild(body);

    // Direction Indicator Dot
    const dotRadius = 7;
    const centerX = visualX + visualWidth / 2;
    const centerY = visualY + visualHeight / 2;
    const padding = 3;
    const maxOffset = visualWidth / 2 - dotRadius - padding;
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
    dot.circle(dotX, dotY, dotRadius);
    dot.fill({ color: 0xffffff });
    playerContainer.addChild(dot);
  });
}

/**
 * EFFECTS & ANIMATIONS
 */

function fireLaser(app, { xStart, yStart, xEnd, yEnd, lineWidth }) {
  if (!lineWidth || lineWidth <= 0) return;
  const laser = new PIXI.Graphics();

  // Glow
  laser.poly([xStart, yStart, xEnd, yEnd], false).stroke({
    width: lineWidth * 3,
    color: 0xffd966,
    alpha: 0.25,
    cap: "round",
  });

  // Core
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
}

function showHitMarker(app, targetX, targetY, isKill = false) {
  if (!app || !app.stage) return;

  const gridStep = cellSize + strokeWidth * 2;
  const centerX = targetY * gridStep + strokeWidth + cellSize / 2;
  const centerY = targetX * gridStep + strokeWidth + cellSize / 2;

  const particles = [];
  const particleCount = isKill ? 15 : 10;

  // Flash Effect
  const flash = new PIXI.Graphics();
  flash.circle(centerX, centerY, isKill ? 20 : 12);
  flash.fill({ color: 0xff0000, alpha: 0.8 });
  app.stage.addChild(flash);

  for (let i = 0; i < particleCount; i++) {
    const p = new PIXI.Graphics();
    p.circle(0, 0, 2 + Math.random() * 3);
    p.fill({ color: 0xff0000 });
    p.x = centerX;
    p.y = centerY;
    p.velocity = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 };
    app.stage.addChild(p);
    particles.push(p);
  }

  let frame = 0;
  const interval = setInterval(() => {
    frame++;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p && !p.destroyed && p.parent) {
        p.x += p.velocity.x;
        p.y += p.velocity.y;
        p.alpha = 1 - frame / 20;
        if (p.alpha <= 0) {
          p.destroy();
          particles.splice(i, 1);
        }
      }
    }
    flash.alpha = Math.max(0, 0.8 - frame * 0.05);
    if (frame >= 20) {
      clearInterval(interval);
      if (flash.parent) flash.destroy();
    }
  }, 30);
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

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.alpha = 1 - frame / 8;

      if (particle.alpha <= 0) {
        if (particle.parent) {
          particle.parent.removeChild(particle);
        }
        particle.destroy();
        particles.splice(i, 1);
      }
    }

    // Clear interval when animation is done
    if (frame >= 8 || particles.length === 0) {
      clearInterval(interval);
      // Clean up any remaining particles
      particles.forEach((p) => {
        if (p.parent) {
          p.parent.removeChild(p);
        }
        p.destroy();
      });
      particles.length = 0;
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
  drawMaze(app); // Will skip if maze unchanged
  drawPlayers(app);
}
