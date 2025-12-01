function updateHealth(newHealth) {
  healthValue.textContent = newHealth;
  const newWidth = (newHealth * 150) / 100;
  document
    .getElementById("health-progress")
    .style.setProperty("--health-percent", `${newWidth}px`);
}


function updatePlayerInfo(playerData) {
  myPlayer.x = playerData.x;
  myPlayer.y = playerData.y;
  myPlayer.dir = playerData.dir;
  myPlayer.health = playerData.health;
  myPlayer.score = playerData.score;
  myPlayer.kill_count = playerData.kill_count;
  myPlayer.bullets = playerData.bullets;
  updateHealth(playerData.health);
}


socket.on("refresh_player", (playerData) => {
  updatePlayerInfo(playerData);
});