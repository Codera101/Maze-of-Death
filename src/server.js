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

io.on("connection", (socket) => {
	console.log("Socket connected:", socket.id);
	// Emit a hello message immediately on connect
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
