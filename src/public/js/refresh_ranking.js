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
