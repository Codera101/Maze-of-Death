function initHealth() {
  healthValue.textContent = 25; // Match backend's initPlayerHealth
  const percentage = (25 / 25) * 100;
  healthProgress.style.setProperty("--health-percent", `${percentage}%`);
}

initHealth();

exitButton.addEventListener("click",()=>{
    socket.emit("handle_exit");
    window.location.href = '/';  
});