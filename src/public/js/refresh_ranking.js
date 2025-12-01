// function populateListExample() {
//   const maxPlayers = Math.random() * 5+ 1;
//   for (let i = 1; i <= maxPlayers; i++) {
//     const rank = document.createElement("span");
//     rank.id = "player-rank";
//     rank.textContent = `${i}`;

//     const name = document.createElement("span");
//     name.id = "player-name";
//     name.textContent = `username_${i}`;

//     const scoreKills = document.createElement("span");
//     scoreKills.id = "player-score-kills";

//     const score = Math.round(Math.random() * 100, 0);
//     const killCount = Math.round(Math.random() * 10, 0) + 1;
//     scoreKills.textContent = `${score}/${killCount}`;

//     const playerData = [rank, name, scoreKills];
//     const newPlayer = document.createElement("li");

//     playerData.forEach((entry) => {
//       newPlayer.appendChild(entry);
//     });
//     newPlayer.id = "player-row";
//     rightPanelList.appendChild(newPlayer);
//   }
// }

socket.on("refresh_ranking", ({ all_players }) => {
  console.log("[FRONTEND] Received refresh_ranking:", all_players);
  rightPanelList.innerHTML = "";

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