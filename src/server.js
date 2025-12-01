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
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// route serving the game
app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

// Test client route
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "test-client.html"));
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server);

const Player = require("./models/Player");
const Room = require("./models/Room");
const RoomService = require("./services/RoomServices");
const RoomControler = require("./controlers/RoomControler");
const BotService = require("./services/BotService");
const Messenger = require("./utils/Messenger");
const Logger = require("./utils/Logger");

// Initialize RoomService and get the global room
const roomService = new RoomService();
const GameRoom = roomService.getRoom("global");

// Initialize BotService
const botService = new BotService();

// Initialize Logger
const logger = new Logger("SERVER");

// Create a system messenger and controller for global tasks (like rankings)
const systemMessenger = new Messenger(io, null);
const systemRoomControler = new RoomControler(
  roomService,
  systemMessenger,
  logger
);

io.on("connection", (socket) => {
  // Initialize Messenger and RoomControler for this socket
  const messenger = new Messenger(io, socket);
  const roomControler = new RoomControler(roomService, messenger, logger);

  // console.log("Socket connected:", socket.id);
  socket.emit("message", "Hello from server — welcome!");

  socket.on("pong", (data) => {
    // console.log("Received pong from", socket.id, data);
  });

  socket.on("join_player", (username) => {
    // console.log("join_player listener:", username);
    roomControler.handlePlayerJoin(socket.id, username);
  });

  socket.on("player_move", (data) => {
    const dir = data.direction;
    // Normalize direction input (support both "up"/"U", "down"/"D", etc.)
    // console.log("player_move listener:", dir); // Disabled for performance
    let normalized = dir;
    if (typeof dir === "string") {
      const dirMap = {
        up: "U",
        u: "U",
        down: "D",
        d: "D",
        left: "L",
        l: "L",
        right: "R",
        r: "R",
      };
      normalized = dirMap[dir] || dir.toUpperCase();
    }
    roomControler.handlePlayerMove(socket.id, { dir: normalized });
  });

  socket.on("shoot", () => {
    roomControler.handlePlayerShoot(socket.id);
  });

  // Store interval ID so we can clear it on disconnect
  const refreshInterval = setInterval(() => {
    roomControler.refreshPlayerStats(socket.id);
    roomControler.refreshVisiblePlayers(socket.id);
  }, 400);

  socket.on("disconnect", (reason) => {
    // console.log("Socket disconnected:", socket.id, reason);
    // Clear the interval to prevent memory leak
    clearInterval(refreshInterval);
    roomControler.handlePlayerDisconnect(socket.id);
  });
});

// update rankings every 1 second
setInterval(() => {
  systemRoomControler.refreshRankings();
}, 1000);

// Add initial bots to the game
const INITIAL_BOT_COUNT = 5; // Number of bots to start with
const MIN_BOT_COUNT = 3; // Minimum bots to maintain

// Start server when run directly
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  // console.log(`Server listening on http://localhost:${PORT}`);

  // Add initial bots after a short delay to ensure everything is initialized
  setTimeout(() => {
    // console.log(`Adding ${INITIAL_BOT_COUNT} initial bots to the game...`);
    botService.addBots(
      GameRoom,
      INITIAL_BOT_COUNT,
      systemRoomControler,
      "mixed", // Use mixed difficulty
      roomService // Pass room service for registration
    );
  }, 1000);

  // Maintain minimum bot count (check every 30 seconds)
  setInterval(() => {
    botService.maintainBotCount(
      GameRoom,
      MIN_BOT_COUNT,
      systemRoomControler,
      "mixed",
      roomService // Pass room service for registration
    );
  }, 30000);
});

module.exports = { app, server, io, GameRoom, botService };
