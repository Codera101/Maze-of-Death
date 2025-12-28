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

// route serving the viewer page
app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "viewer_main.html"));
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

// Configuration
const MAX_TOTAL_PLAYERS = 10; // Maximum players per room (as requested by user)

// Initialize RoomService (no default room - rooms created dynamically)
const roomService = new RoomService(MAX_TOTAL_PLAYERS);

// Initialize BotService
const botService = new BotService();

// Initialize Logger
const logger = new Logger("SERVER");

// Create a system messenger and controller for global tasks (like rankings)
const systemMessenger = new Messenger(io, null);
const systemRoomControler = new RoomControler(
  roomService,
  systemMessenger,
  logger,
  botService,
  MAX_TOTAL_PLAYERS
);

io.on("connection", (socket) => {
  // Initialize Messenger and RoomControler for this socket
  const messenger = new Messenger(io, socket);
  const roomControler = new RoomControler(
    roomService,
    messenger,
    logger,
    botService,
    MAX_TOTAL_PLAYERS
  );
  socket.isPlayer = false;
  socket.emit("message", "Hello from server — welcome!");

  socket.on("pong", (data) => {
    // console.log("Received pong from", socket.id, data);
  });

  socket.on("join_player", (data) => {
    socket.isPlayer = true;
    roomControler.handlePlayerJoin(socket.id, data);
  });

  socket.on("join_viewer", () => {
    roomControler.handleViewerJoin(socket.id);
  });

  socket.on("player_move", (data) => {
    const dir = data.direction;
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
  let refreshInterval = null;
  setTimeout(() => {
    if (socket.isPlayer) {
      refreshInterval = setInterval(() => {
        roomControler.refreshPlayerStats(socket.id);
        roomControler.refreshVisiblePlayers(socket.id);
      }, 50);
    }
  }, 1000);

  socket.on("disconnect", (reason) => {
    // Clear the interval to prevent memory leak
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    if (socket.isPlayer) {
      roomControler.handlePlayerDisconnect(socket.id);
    } else {
      roomControler.handleViewerDisconnect(socket.id);
    }
  });
});

// Update rankings for all rooms every 1 second
setInterval(() => {
  systemRoomControler.refreshRankings();
}, 1000);

// Refresh visible players for all viewers every 50ms
setInterval(() => {
  systemRoomControler.refreshVisiblePlayersForViewers();
}, 50);

// Log room stats every 30 seconds
setInterval(() => {
  const roomCount = roomService.getRoomCount();
  const allRooms = roomService.getAllRooms();
  const totalPlayers = allRooms.reduce((sum, room) => sum + room.getHumanCount(), 0);
  const totalBots = allRooms.reduce((sum, room) => sum + room.getBotCount(), 0);
  
  if (roomCount > 0) {
    console.log(`📊 Stats: ${roomCount} rooms, ${totalPlayers} humans, ${totalBots} bots`);
  }
}, 30000);

// Start server when run directly
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Server listening on http://localhost:${PORT}`);
  console.log(`📋 Multi-room mode enabled (max ${MAX_TOTAL_PLAYERS} players per room)`);
  console.log(`🏠 Rooms are created dynamically when players join`);
});

module.exports = { app, server, io, roomService, botService };
