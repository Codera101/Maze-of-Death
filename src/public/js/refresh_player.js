function updateHealth(newHealth) {
  healthValue.textContent = newHealth;
  const percentage = (newHealth / 25) * 100;
  document
    .getElementById("health-progress")
    .style.setProperty("--health-percent", `${percentage}%`);
}

function updatePlayerInfo(playerData) {
  myPlayer = { ...playerData };
  updateHealth(playerData.health);
  scoreValue.textContent = playerData.score;
  killsValue.textContent = playerData.kill_count;

  // Update ammo display if the function exists
  if (typeof updateAmmoDisplay === "function") {
    updateAmmoDisplay(playerData.bullets, 5);
  }
}

socket.on("refresh_player", (playerData) => {
  updatePlayerInfo(playerData);
});
