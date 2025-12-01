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

  all_players.sort((a, b) => {
    if (b.score === a.score) {
      return b.kill_count - a.kill_count;
    }
    return b.score - a.score;
  });

  let limit = Math.min(all_players.length, 10);

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < limit; i++) {
    const player = all_players[i];

    const rank = document.createElement("span");
    rank.id = "player-rank";
    rank.textContent = `${i + 1}`;

    const name = document.createElement("span");
    name.id = "player-name";
    name.textContent = `${player.username}`;

    const scoreKills = document.createElement("span");
    scoreKills.id = "player-score-kills";
    scoreKills.textContent = `+${player.score}/${player.kill_count}`;

    const newPlayer = document.createElement("li");
    newPlayer.id = "player-row";

    newPlayer.appendChild(rank);
    newPlayer.appendChild(name);
    newPlayer.appendChild(scoreKills);

    fragment.appendChild(newPlayer);
  }

  rightPanelList.appendChild(fragment);
});
