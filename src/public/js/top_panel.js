function initHealth() {
  healthValue.textContent = 25;  // Match backend's initPlayerHealth
  const initialWidth = (25 * 150) / 100;
  healthProgress.style.width = `${initialWidth}px`;
}

initHealth();
