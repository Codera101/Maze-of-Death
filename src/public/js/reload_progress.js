const MAX_CLIP_SIZE = 5;
let state = {
  bullets: MAX_CLIP_SIZE,
  maxBullets: MAX_CLIP_SIZE,
};

function updateAmmoDisplay(newBullets, newMaxBullets = state.maxBullets) {
  state.bullets = Math.max(0, newBullets);
  state.maxBullets = Math.max(1, newMaxBullets);

  const container = document.getElementById("reload");
  if (!container) return;

  const indicatorsContainer = container.querySelector("#bullet-indicators");
  const bulletCountEl = container.querySelector(".bullet-count");

  if (indicatorsContainer) {
    indicatorsContainer.innerHTML = ""; // clear previous indicators

    for (let i = 0; i < state.maxBullets; i++) {
      const isActive = i < state.bullets;
      const bar = document.createElement("div");
      bar.className = "bullet-bar";
      bar.style.backgroundColor = isActive
        ? "var(--color-ammo)"
        : "var(--bg-base)";
      bar.style.boxShadow = isActive
        ? "0 0 8px rgba(255, 184, 44, 0.5)"
        : "none";
      bar.style.transform = `scaleY(${isActive ? 1 : 0.8})`;
      bar.style.transitionDelay = `${i * 0.05}s`;
      indicatorsContainer.appendChild(bar);
    }
  }

  if (bulletCountEl) {
    bulletCountEl.textContent = `${state.bullets}/${state.maxBullets}`;
  }
}

window.onload = () => {
  updateAmmoDisplay(state.bullets, state.maxBullets);
};
