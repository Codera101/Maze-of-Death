socket.on("refresh_ranking", ({ all_players }) => {
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

    // added
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

    newPlayer.appendChild(rank);
    newPlayer.appendChild(name);
    newPlayer.appendChild(scoreKills);

    // added
    newPlayer.style.borderColor = player.color;
    newPlayer.style.boxShadow = `-1px 1px 6px 0px ${player.color}`;


    fragment.appendChild(newPlayer);
  }

  rightPanelList.appendChild(fragment);
});
