import { app } from "./maze.js";

let deadSound = new Audio("../sounds/dead.wav");
socket.on("died", ({ killer_name, respawn_time }) => {
  // Death animation is handled by the broadcast event 'player_death_animation'
  // which is sent to all players including the victim
  deadSound.play();
  // Create death overlay screen
  const deathOverlay = document.createElement("div");
  deathOverlay.id = "death-overlay";
  deathOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.5s ease-in;
    font-family: 'Exo 2', sans-serif;
  `;

  deathOverlay.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    </style>
    <div style="text-align: center;">
      <h1 style="
        color: #ff4444;
        font-size: 72px;
        margin: 0 0 20px 0;
        text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
        animation: pulse 2s infinite;
      ">YOU DIED</h1>
      <p style="
        color: #ffffff;
        font-size: 28px;
        margin: 20px 0;
      ">Killed by <span style="color: #ffd700; font-weight: bold;">${killer_name}</span></p>
      <p style="
        color: #aaaaaa;
        font-size: 20px;
        margin: 30px 0;
      ">Respawning in <span id="respawn-timer" style="color: #44ff44; font-weight: bold;">${Math.ceil(
        respawn_time / 1000
      )}</span>s</p>
    </div>
  `;

  document.body.appendChild(deathOverlay);

  // Countdown timer
  const timerElement = document.getElementById("respawn-timer");
  let remainingTime = respawn_time;
  const countdown = setInterval(() => {
    remainingTime -= 100;
    if (timerElement) {
      timerElement.textContent = Math.ceil(remainingTime / 1000);
    }
    if (remainingTime <= 0) {
      clearInterval(countdown);
    }
  }, 100);

  // Remove overlay after respawn time
  setTimeout(() => {
    if (deathOverlay.parentNode) {
      deathOverlay.remove();
    }
  }, respawn_time);
});
