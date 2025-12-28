// import { app } from "./maze.js"; // global app

let lastUpdateTime = 0;
const UPDATE_THROTTLE = 100; // Minimum time between redraws in ms (matches server interval/4)
let pendingUpdate = false;

socket.on("refresh_players", ({ visible_player_list }) => {
  visiblePlayers = visible_player_list;

  // Throttle redraws to reduce performance impact
  const now = Date.now();
  if (now - lastUpdateTime >= UPDATE_THROTTLE) {
    lastUpdateTime = now;
    pendingUpdate = false;
    updateMaze(app);
  } else if (!pendingUpdate) {
    // Schedule an update for later if we're throttling
    pendingUpdate = true;
    setTimeout(() => {
      if (pendingUpdate) {
        lastUpdateTime = Date.now();
        pendingUpdate = false;
        updateMaze(app);
      }
    }, UPDATE_THROTTLE - (now - lastUpdateTime));
  }
});
