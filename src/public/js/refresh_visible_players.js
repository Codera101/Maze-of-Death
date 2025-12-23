import { app } from "./maze.js";

let lastUpdateTime = 0;
// Remove throttle for WebRTC since it doesn't have head-of-line blocking
// Keep it for Socket.io path for backward compatibility
const UPDATE_THROTTLE = 16; // Minimum time between redraws in ms (~60 FPS)
let pendingUpdate = false;

function handleVisiblePlayersUpdate(visible_player_list, isWebRTC = false) {
  visiblePlayers = visible_player_list;

  // WebRTC path: No throttling needed (UDP-like, no head-of-line blocking)
  if (isWebRTC) {
    updateMaze(app);
    return;
  }

  // Socket.io path: Keep throttling for backward compatibility
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
}

// Socket.io handler (JSON data - backward compatible)
socket.on("refresh_players", ({ visible_player_list }) => {
  handleVisiblePlayersUpdate(visible_player_list, false);
});

// WebRTC handler (binary data decoded in variables_mainpage.js)
window.addEventListener('webrtc_refresh_players', (event) => {
  handleVisiblePlayersUpdate(event.detail.visible_player_list, true);
});
