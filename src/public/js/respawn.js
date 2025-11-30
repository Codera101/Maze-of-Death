import { app } from "./maze.js";
socket.on("respawn", (player) => {
  myPlayer = {
    id: player.id,
    username: player.username,
    health: player.health,
    score: player.score,
    bullets: player.bullets,
    kill_count: player.kill_count,
    x: player.x,
    y: player.y,
    dir: player.dir,
    color: player.color,
  };
  // TODO : refresh player
  updatePlayerInfo(myPlayer);
  console.log("Respawned player:", myPlayer);
});
