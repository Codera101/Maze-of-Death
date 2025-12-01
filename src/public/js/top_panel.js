function initHealth() {
  healthValue.textContent = 10;  // Match backend's initPlayerHealth
  const initialWidth = (10 * 150) / 100;
  healthProgress.style.width = `${initialWidth}px`;
}

initHealth();
