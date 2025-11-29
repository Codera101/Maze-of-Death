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

io.on("connection", (socket) => {
	
	let player = new Player();

	console.log("Socket connected:", socket.id);
	socket.emit("message", "Hello from server — welcome!");

	socket.on("pong", (data) => {
		console.log("Received pong from", socket.id, data);
	});

	// Room - Join Player
	socket.on("join_player", (data) => {
		const { username } = data;
		console.log("join_player received:", username);
		
		socket.emit("player_joined");
	});

	// Player - Move
	socket.on("player_move", (data) => {
		const { dir } = data;
		console.log("player_move received:", dir);
		
		socket.emit("player_moved");
	});

	// Player - Shoot
	socket.on("shoot", (data) => {
		console.log("shoot received");
		
		socket.emit("target_hit");
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
