import { app } from "./maze.js";

socket.on("refresh_players", ({ visible_player_list }) => {
  // TODO: Update visible players on the maze
  visiblePlayers = visible_player_list;
  updateMaze(app);
});
