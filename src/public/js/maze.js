window.app = new PIXI.Application();

await window.app.init({
  width: cols * cellSize + (cols - 1) * strokeWidth * 2,
  height: rows * cellSize + (rows - 1) * strokeWidth * 2,
  background: "#0D0D16",
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});

mazeContent.appendChild(window.app.canvas);
socket.on("draw_maze", ({ maze: { row, col, layout } }) => {
  rows = row;
  cols = col;
  mazeLayout = layout;
  drawMaze(app);
});

let lastUpdateTime = 0;
const UPDATE_THROTTLE = 100; // Minimum time between redraws in ms (matches server interval/4)
let pendingUpdate = false;

socket.on("refresh_players", ({ visible_player_list }) => {
  visiblePlayers = visible_player_list;

  // Throttle redraws to reduce performance impact
  const now = Date.now();
  if (now - lastUpdateTime >= UPDATE_THROTTLE) {
    lastUpdateTime = now;
    pendingUpdate = false;
    updateMaze(app);
  } else if (!pendingUpdate) {
    // Schedule an update for later if we're throttling
    pendingUpdate = true;
    setTimeout(() => {
      if (pendingUpdate) {
        lastUpdateTime = Date.now();
        pendingUpdate = false;
        updateMaze(app);
      }
    }, UPDATE_THROTTLE - (now - lastUpdateTime));
  }
});

// Cleanup resources on page unload to prevent memory leaks
window.addEventListener("beforeunload", () => {
  // Destroy PIXI app if it exists
  if (typeof app !== "undefined" && app && app.destroy) {
    app.destroy(true, { children: true, texture: true, baseTexture: true });
  }

  // Clear graphics cache
  if (typeof graphicsCache !== "undefined" && graphicsCache) {
    if (graphicsCache.maze) {
      graphicsCache.maze.destroy({ children: true });
    }
    if (graphicsCache.players) {
      graphicsCache.players.forEach((graphics) => {
        graphics.destroy({ children: true });
      });
      graphicsCache.players.clear();
    }
  }

  // Disconnect socket
  if (typeof socket !== "undefined" && socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
});
