import { app } from "./maze.js"

Socket.on("refresh_players", ({visible_player_list}) => {
    // TODO: Update visible players on the maze
    visiblePlayers = visible_player_list;
    visiblePlayers.array.forEach(ele => {
        ele.fillColor = ele.color;
    });
    updateMaze(app);
})