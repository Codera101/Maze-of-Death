function updateHealth(newHealth) {
  healthValue.textContent = newHealth;
  const newWidth = (newHealth * 150) / 100;
  document
    .getElementById("health-progress")
    .style.setProperty("--health-percent", `${newWidth}px`);
}
socket.on("refresh_player", ({ player }) => {
  updatePlayerInfo(player);
});

function updatePlayerInfo(player) {
  myPlayer = player;
  myPlayer.x = 0 + (cellSize + strokeWidth * 2) * 3;
  myPlayer.y = 0 + (cellSize + strokeWidth * 2) * 2;

  const health = player.health;
  const bullets = player.bullets;
  const kill_count = player.kill_count;

  updateHealth(health);
  killsValue.textContent = kill_count;
  scoreValue.textContent = player.score;
}
