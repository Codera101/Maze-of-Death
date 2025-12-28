// Health init
function initHealth() {
  if (!healthValue || !healthProgress) return;
  healthValue.textContent = 25; // Match backend's initPlayerHealth
  const percentage = (25 / 25) * 100;
  healthProgress.style.setProperty("--health-percent", `${percentage}%`);
}
if (!window.isViewer) {
  initHealth();
}

exitButton.addEventListener("click", () => {
  window.isViewer = false;
  socket.disconnect();
  window.location.href = "/";
  usernameInput.textContent = "";
});

// RANKING

let compare = (a, b) => {
  if (b.score === a.score) {
    return b.kill_count - a.kill_count;
  }
  return b.score - a.score;
};

socket.on("refresh_ranking", ({ all_players }) => {
  all_players.sort(compare);
  rightPanelList.innerHTML = "";
  let limit = Math.min(all_players.length, 5);
  const fragment = document.createDocumentFragment();

  let addPlayer = (player, order) => {
    const rank = document.createElement("span");
    rank.id = "player-rank";
    rank.textContent = `${order}`;
    rank.style.backgroundColor = player.color;
    rank.style.color = "#000000ff";
    rank.style.fontWeight = "bold";

    const name = document.createElement("span");
    name.id = "player-name";
    name.textContent = `${player.username}`;
    const scoreKills = document.createElement("span");
    scoreKills.id = "player-score-kills";
    scoreKills.textContent = `+${player.score}/${player.kill_count}`;

    const newPlayer = document.createElement("li");
    newPlayer.id = "player-row";
    newPlayer.style.borderColor = player.colorz;
    newPlayer.style.boxShadow = `-1px 1px 6px 0px ${player.color}`;

    for (let e of [rank, name, scoreKills]) {
      newPlayer.appendChild(e);
    }
    fragment.appendChild(newPlayer);
  };
  let selfAdded = false;
  for (let i = 0; i < limit; i++) {
    addPlayer(all_players[i], i + 1);
    if (all_players[i].username == myPlayer.userName) {
      selfAdded = true;
    }
  }
  for (let i = 0; i < all_players.length && !selfAdded; i++) {
    if (all_players[i].username == myPlayer.userName) {
      if (i >= limit) {
        addPlayer(all_players[i], i + 1);
        selfAdded = true;
      }
    }
  }
  rightPanelList.appendChild(fragment);
});

// RELOAD PROGRESS

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
