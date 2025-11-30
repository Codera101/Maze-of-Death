/** @format */

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();

// Serve static files from /src/public
app.use(express.static(path.join(__dirname, "public")));

// Simple route serving the HTML client
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server);

const Player = require("./models/Player");
const Room = require("./models/Room");
const RoomService = require("./services/RoomServices");
const RoomControler = require("./controlers/RoomControler");
const Messenger = require("./utils/Messenger");
const Logger = require("./utils/Logger");

// Initialize RoomService and get the global room
const roomService = new RoomService();
const GameRoom = roomService.getRoom('global');

// Initialize Logger
const logger = new Logger('SERVER');

// RoomControler will be initialized per socket connection with its own Messenger


/**
 * @brief Refresh panel rankings
 */
function refreshRankings() {
  let rankings = GameRoom.players ?? [];
  rankings = rankings
    .sort((a, b) => {
      if (a.score === b.score) return b.killCount - a.killCount;
      return b.score - a.score;
    })
    .map((player) => ({
      username: player.userName,
      score: player.score,
      killCount: player.killCount,
      color: player.color,
    }));
  io.emit("refresh_rank", JSON.stringify({ all_players: rankings }));
}

/**
 * @brief Refresh player stats
 */
function refreshPlayerStats(playerID) {
  if (!GameRoom.players) {
    return;
  }
  const player = GameRoom.players.find((p) => p.id === playerID);
  if (!player) return;
  const stats = {
    id: player.id,
    username: player.userName,
    health: player.health,
    score: player.score,
    bullets: player.bullets,
    killCount: player.killCount,
  };
  console.log(`Refreshing stats for player ${playerID}:`, stats);
  io.to(playerID).emit("refresh_player", JSON.stringify(stats));
}

/**
 * @brief Refresh Visiable Players for each player
 * @param {string} playerID
 * @return {void}
 */
function refreshVisiblePlayers(playerID) {
  if (!GameRoom.players) {
    io.to(playerID).emit(
      "refresh_players",
      JSON.stringify({ visible_player_list: [] })
    );
    return;
  }

  const player = GameRoom.players.find((p) => p.id === playerID);

  if (!player) {
    io.to(playerID).emit(
      "refresh_players",
      JSON.stringify({ visible_player_list: [] })
    );
    return;
  }
  const visiblePlayers = GameRoom.players.filter(
    (p) =>
      p.id !== playerID &&
      GameRoom.maze.isThereObstacle(player.x, player.y, p.x, p.y) === false
  );
  const visibleData = visiblePlayers.map((p) => ({
    id: p.id,
    username: p.userName,
    x: p.x,
    y: p.y,
    dir: p.direction,
    color: p.color,
  }));
  console.log(`Refreshing visible players for ${playerID}:`, visibleData);
  io.to(playerID).emit(
    "refresh_players",
    JSON.stringify({ visible_player_list: visibleData })
  );
}

/** 
 * @brief send the maze layout to the player at joinning time.
 * @param {int} playerID 
 */
function drowMaze(playerID){
	io.to(playerID).emit("draw_maze", {
		maze : {
			row: GameRoom.height,
            col: GameRoom.width,
            layout: GameRoom.maze
		}
	});
}

/** 
 * @brief handle player join room
 * @param {string, int} username, playerID 
 */
function joinPlayer(username, playerID){
	let newPlayer = GameRoom.addNewPlayer(username, playerID);
	io.to(playerID).emit("player_joined", {
		id : newPlayer.id,
		username: newPlayer.userName,
        score: newPlayer.score,
        health: newPlayer.health,
        kill_count: newPlayer.killCount
	});
	drowMaze(playerID);
}

/**
 * @brief Handle player movement
 * @param {RoomControler} roomControler - The room controller instance
 * @param {string} playerID - The socket ID of the player
 * @param {string} dir - The direction to move
 */
function movePlayer(roomControler, playerID, dir){
	roomControler.handlePlayerMove(playerID, { dir });
}

/**
 * @brief Handle player shooting
 * @param {RoomControler} roomControler - The room controller instance
 * @param {string} playerID - The socket ID of the player
 */
function shoot(roomControler, playerID){
	roomControler.handlePlayerShoot(playerID);
}

io.on("connection", (socket) => {
  // Initialize Messenger and RoomControler for this socket
  const messenger = new Messenger(io, socket);
  const roomControler = new RoomControler(roomService, messenger, logger);

  console.log("Socket connected:", socket.id);
  socket.emit("message", "Hello from server — welcome!");

  socket.on("pong", (data) => {
    console.log("Received pong from", socket.id, data);
  });

  socket.on("join_player", (username) => {
	  joinPlayer(username, socket.id);
  });

  socket.on("player_move", (dir) => {
	  movePlayer(roomControler, socket.id, dir);
  });

  socket.on("shoot", () => {
	  shoot(roomControler, socket.id);
  }); 

  setInterval(() => {
    refreshPlayerStats(socket.id);
    refreshVisiblePlayers(socket.id);
  }, 100);

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
    roomControler.handlePlayerDisconnect(socket.id);
  });
});

// update rankings every 1 second
setInterval(() => {
  refreshRankings();
}, 1000);

// Start server when run directly
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = { app, server, io, refreshRankings, refreshPlayerStats, refreshVisiblePlayers, GameRoom };
