function initHealth() {
  healthValue.textContent = 25; // Match backend's initPlayerHealth
  const percentage = (25 / 25) * 100;
  healthProgress.style.setProperty("--health-percent", `${percentage}%`);
}
if(!isViewer){
  initHealth();
}

exitButton.addEventListener("click", () => {
  isViewer = false; 
  socket.disconnect();
  window.location.href = "/";
  usernameInput.textContent = '';
});
