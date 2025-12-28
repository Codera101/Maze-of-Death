function updateHealth(newHealth) {
  healthValue.textContent = newHealth;
  const percentage = (newHealth / 25) * 100;
  document
    .getElementById("health-progress")
    .style.setProperty("--health-percent", `${percentage}%`);
}

function updatePlayerInfo(playerData) {
  myPlayer = { ...myPlayer, ...playerData };
  updateHealth(playerData.health);
  scoreValue.textContent = playerData.score;
  killsValue.textContent = playerData.kill_count;

  // Update ammo display if the function exists
  if (typeof updateAmmoDisplay === "function") {
    updateAmmoDisplay(playerData.bullets, 5);
  }
}

// Socket.io handler (JSON data - backward compatible)
socket.on("refresh_player", (playerData) => {
  updatePlayerInfo(playerData);
});

// WebRTC handler (binary data decoded in variables_mainpage.js)
window.addEventListener('webrtc_refresh_player', (event) => {
  // Binary data already decoded, just need to update UI
  // Note: colorHash needs to be converted back or we store original color separately
  updatePlayerInfo(event.detail);
});
