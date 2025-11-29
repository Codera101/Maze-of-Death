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
	const rankings = Room.players().sort((a, b) => {
		if (a.score() === b.score()) return a.killCount() - b.killCount();
		return b.score() - a.score();
	}).map((player) => ({
		username: player.userName(),
		score: player.score(),
		killCount: player.killCount(),
		color: player.color()
	}));
	console.log("Updated rankings:", rankings);
	io.emit("refresh_rank", JSON.stringify({ rankings }));
}

io.on("connection", (socket) => {
	
	let player = new Player();

	console.log("Socket connected:", socket.id);
	socket.emit("message", "Hello from server — welcome!");

	socket.on("pong", (data) => {
		console.log("Received pong from", socket.id, data);
	});

	socket.on("disconnect", (reason) => {
		console.log("Socket disconnected:", socket.id, reason);
	});
});

// Start server when run directly
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
