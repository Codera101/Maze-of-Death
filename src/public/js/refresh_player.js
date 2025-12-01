function updateHealth(newHealth) {
  healthValue.textContent = newHealth;
  const newWidth = (newHealth * 150) / 25;
  document
    .getElementById("health-progress")
    .style.setProperty("--health-percent", `${newWidth}px`);
}


function updatePlayerInfo(playerData) {
  // Update myPlayer state
  myPlayer.x = playerData.x;
  myPlayer.y = playerData.y;
  myPlayer.dir = playerData.dir;
  myPlayer.health = playerData.health;
  myPlayer.score = playerData.score;
  myPlayer.kill_count = playerData.kill_count;
  myPlayer.bullets = playerData.bullets;
  
  // Update UI elements
  updateHealth(playerData.health);
  scoreValue.textContent = playerData.score;
  killsValue.textContent = playerData.kill_count;
  
  // Update ammo display if the function exists
  if (typeof updateAmmoDisplay === 'function') {
    updateAmmoDisplay(playerData.bullets, 5);
  }
}


socket.on("refresh_player", (playerData) => {
  updatePlayerInfo(playerData);
});