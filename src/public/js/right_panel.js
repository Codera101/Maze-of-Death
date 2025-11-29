function populateListExample() {
  const maxPlayers = Math.random() * 10 + 1;
  for (let i = 1; i <= maxPlayers; i++) {
    const rank = document.createElement("span");
    rank.id = "player-rank";
    rank.textContent = `${i}`;

    const name = document.createElement("span");
    name.id = "player-name";
    name.textContent = `username_${i}`;

    const scoreKills = document.createElement("span");
    scoreKills.id = "player-score-kills";

    const score = Math.round(Math.random() * 100, 0);
    const killCount = Math.round(Math.random() * 10, 0) + 1;
    scoreKills.textContent = `${score}/${killCount}`;

    const playerData = [rank, name, scoreKills];
    const newPlayer = document.createElement("li");

    playerData.forEach((entry) => {
      newPlayer.appendChild(entry);
    });
    newPlayer.id = "player-row";
    rightPanelList.appendChild(newPlayer);
  }
}

populateListExample();

function updateList(players) {
  // TODO
}
