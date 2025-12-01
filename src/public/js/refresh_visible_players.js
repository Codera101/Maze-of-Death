import { app } from "./maze.js";

let lastUpdateTime = 0;
const UPDATE_THROTTLE = 100; // Minimum time between redraws in ms (matches server interval/4)

socket.on("refresh_players", ({ visible_player_list }) => {
  visiblePlayers = visible_player_list;
  
  // Throttle redraws to reduce performance impact
  const now = Date.now();
  if (now - lastUpdateTime >= UPDATE_THROTTLE) {
    lastUpdateTime = now;
    updateMaze(app);
  }
});
