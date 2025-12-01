const MAX_ROWS = 10;
const rowCache = [];

function initLeaderboard() {
  const list = document.getElementById("right-panel-list"); 
  list.innerHTML = "";

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < MAX_ROWS; i++) {
    
    //  <!-- <li id="player-row">
    //                 <span id="player-rank">10</span>
    //                 <span id="player-name">Abo_WahbaZ</span>
    //                 <span id="player-score-kills">1999/30</span>
    //             </li> -->

    const li = document.createElement("li");
    li.id = 'player-row';
    li.className = "hidden";

    const rankSpan = document.createElement("span");
    rankSpan.id = "player-rank";

    const nameSpan = document.createElement("span");
    nameSpan.id = "player-name";

    const scoreSpan = document.createElement("span");
    scoreSpan.id = "player-score-kills";

    li.appendChild(rankSpan);
    li.appendChild(nameSpan);
    li.appendChild(scoreSpan);
    fragment.appendChild(li);

    rowCache.push({
      li: li,
      rank: rankSpan,
      name: nameSpan,
      score: scoreSpan
    });
  }

  list.appendChild(fragment);
}

initLeaderboard();


socket.on("refresh_rank", ({ all_players }) => {
  console.log("all-players",all_players);
  all_players.sort((a, b) => {
    if (b.score === a.score) {
      return b.kill_count - a.kill_count;
    }
    return b.score - a.score;
  });

  for (let i = 0; i < MAX_ROWS; i++) {
    const cachedRow = rowCache[i];
    const playerData = all_players[i];

    if (playerData) {
      console.log(playerData);
      cachedRow.rank.textContent = i + 1;
      cachedRow.name.textContent = playerData.username.username;
      cachedRow.score.textContent = `+${playerData.score}/${playerData.kill_count}`;
      
      if (cachedRow.li.classList.contains("hidden")) {
        cachedRow.li.classList.remove("hidden");
      }

    } else {
      if (!cachedRow.li.classList.contains("hidden")) {
        cachedRow.li.classList.add("hidden");
      }
    }
  }
});