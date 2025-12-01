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
