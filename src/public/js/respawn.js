import { app } from "./maze.js";
socket.on("respawn", (player) => {
  // Update myPlayer properties from server response
  myPlayer.id = player.id;
  myPlayer.username = player.userName;
  myPlayer.x = player.x;
  myPlayer.y = player.y;
  myPlayer.dir = player.dir;
  myPlayer.health = player.health;
  myPlayer.score = player.score;
  myPlayer.kill_count = player.kill_count;
  myPlayer.bullets = player.bullets;
  myPlayer.color = player.color;
  
  updatePlayerInfo(player);
  // console.log("Respawned player:", myPlayer);
});
