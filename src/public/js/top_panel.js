
function initHealth() {
  healthValue.textContent = 100;
  healthProgress.style.width = "150px";
}

function updateHealthProgress(newHealth) {
    const newWidth = 150 - newHealth / 15;
    healthProgress.style.width = `${newWidth}+px`;
}

socket.on("refresh_player", (payload) => {
    // TODO
    const username = payload.username;
    const health = payload.score;
    const bullets = payload.bullets;
    const kill_count = payload.kill_count;
    
  healthValue.textContent = health;
  updateHealthProgress(health);
  killsValue.textContent = kill_count;
});

initHealth();
