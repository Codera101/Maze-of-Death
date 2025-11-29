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

/**
 * @brief Refresh panel rankings
 * @return {void}
 */
function refreshRankings() {
	let rankings = Room.players ?? [];
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
  console.log("Updated rankings:", rankings);
  io.emit("refresh_rank", JSON.stringify({ rankings }));
}

/**
 * @brief Refresh player stats
 */
function refreshPlayerStats(playerID) {
  const player = Room.players.find((p) => p.id === playerID);
  if (!player) return;
  const stats = {
    score: player.score,
    killCount: player.killCount,
    color: player.color,
  };
  io.to(playerID).emit("refresh_player", JSON.stringify(stats));
}

io.on("connection", (socket) => {
	
	let player = new Player();

	console.log("Socket connected:", socket.id);
	socket.emit("message", "Hello from server — welcome!");

	socket.on("pong", (data) => {
		console.log("Received pong from", socket.id, data);
	});

  setInterval(() => {
    refreshPlayerStats(socket.id);
  }, 100);

	socket.on("disconnect", (reason) => {
		console.log("Socket disconnected:", socket.id, reason);
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

module.exports = { app, server, io, refreshRankings, refreshPlayerStats };
