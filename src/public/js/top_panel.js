// console.log(typeof(window.getComputedStyle(healthProgress).width));

function initHealth() {
  healthValue.textContent = 100;
  healthProgress.style.width = "150px";
}
initHealth();

function updateHealthProgress(newHealth) {
  const newWidth = 150 - newHealth / 15;
  healthProgress.style.width = `${newWidth}+px`;
}

function decreaseHealthProgress() {
  const currentWidthString = window.getComputedStyle(healthProgress).width;
  const currentWidthNumeric = parseFloat(currentWidthString);
  let newWidthNumeric = currentWidthNumeric - 15;
  if (newWidthNumeric < 0) {
    newWidthNumeric = 0;
  }
  healthProgress.style.width = newWidthNumeric + "px";
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
