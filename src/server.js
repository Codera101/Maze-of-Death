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

// Feature flag for WebRTC support (backward compatible)
const ENABLE_WEBRTC = process.env.ENABLE_WEBRTC === 'true';
let geckosServer = null;

// Initialize geckos.io if enabled
if (ENABLE_WEBRTC) {
  try {
    const geckos = require('@geckos.io/server').default;
    geckosServer = geckos({
      cors: { allowAuthorization: true }
    });
    console.log('WebRTC support enabled via geckos.io');
  } catch (error) {
    console.warn('Failed to initialize geckos.io:', error.message);
    console.warn('Falling back to Socket.io only');
  }
}

const Player = require("./models/Player");
const Room = require("./models/Room");
const RoomService = require("./services/RoomServices");
const RoomControler = require("./controlers/RoomControler");
const BotService = require("./services/BotService");
const Messenger = require("./utils/Messenger");
const TransportManager = require("./utils/TransportManager");
const Logger = require("./utils/Logger");

// Initialize RoomService and get the global room
const roomService = new RoomService();
const GameRoom = roomService.getRoom("global");
const MAX_TOTAL_PLAYERS = 11; // Maximum players + bots allowed
const INITIAL_BOT_COUNT = 8; // Number of bots to start with
const MIN_BOT_COUNT = 0; // Minimum bots to maintain

// Initialize BotService
const botService = new BotService();

// Initialize Logger
const logger = new Logger("SERVER");

// Store geckos channels by socket ID for WebRTC support
const geckosChannels = new Map();

// Create a system messenger and controller for global tasks (like rankings)
const systemMessenger = new Messenger(io, null);
const systemRoomControler = new RoomControler(
  roomService,
  systemMessenger,
  logger,
  botService,
  MAX_TOTAL_PLAYERS
);

// Setup geckos.io connection handling if enabled
if (geckosServer) {
  geckosServer.onConnection((channel) => {
    // Associate geckos channel with socket ID once handshake completes
    channel.on('handshake', (socketId) => {
      geckosChannels.set(socketId, channel);
      console.log(`[WebRTC] Channel established for socket ${socketId}`);
    });

    channel.onDisconnect(() => {
      // Cleanup handled by Socket.io disconnect event
    });
  });
}

io.on("connection", (socket) => {
  // Initialize client capabilities (default to Socket.io only)
  socket.capabilities = { socketio: true, webrtc: false };
  
  // Protocol negotiation: Wait for client to send capabilities
  socket.on('client_capabilities', (capabilities) => {
    socket.capabilities = capabilities;
    const supportsWebRTC = capabilities.protocols?.geckos || capabilities.protocols?.webrtc;
    const protocol = (supportsWebRTC && geckosServer) ? 'hybrid' : 'socketio-only';
    
    console.log(`[Protocol] Client ${socket.id} capabilities:`, JSON.stringify(capabilities));
    console.log(`[Protocol] Selected: ${protocol}`);
    
    // Notify client which protocol will be used
    socket.emit('protocol_selected', { 
      protocol, 
      webrtcEnabled: ENABLE_WEBRTC && geckosServer !== null 
    });
  });

  // Get geckos channel if available (will be null until handshake completes)
  const getGeckosChannel = () => geckosChannels.get(socket.id) || null;

  // Initialize TransportManager (backward compatible - works without geckos)
  const transportManager = new TransportManager(io, socket, getGeckosChannel());
  
  // Also keep Messenger for compatibility
  const messenger = new Messenger(io, socket);
  
  const roomControler = new RoomControler(
    roomService, 
    transportManager, // Use TransportManager instead of Messenger
    logger, 
    botService, 
    MAX_TOTAL_PLAYERS
  );

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
  }, 50);

  socket.on("disconnect", (reason) => {
    // console.log("Socket disconnected:", socket.id, reason);
    // Clear the interval to prevent memory leak
    clearInterval(refreshInterval);
    
    // Cleanup geckos channel
    if (geckosChannels.has(socket.id)) {
      geckosChannels.delete(socket.id);
    }
    
    roomControler.handlePlayerDisconnect(socket.id, roomService, MIN_BOT_COUNT);
  });
});

// update rankings every 1 second
setInterval(() => {
  systemRoomControler.refreshRankings();
}, 1000);

// Add initial bots to the game

// Start server when run directly
const PORT = process.env.PORT || 3000;
const WEBRTC_PORT = process.env.WEBRTC_PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  
  // Start geckos.io server if enabled
  if (geckosServer) {
    geckosServer.listen(WEBRTC_PORT);
    console.log(`WebRTC server (geckos.io) listening on port ${WEBRTC_PORT}`);
  }

  // Add initial bots after a short delay to ensure everything is initialized
  setTimeout(() => {
    // console.log(`Adding ${INITIAL_BOT_COUNT} initial bots to the game...`);
    botService.addBots(
      GameRoom,
      INITIAL_BOT_COUNT,
      systemRoomControler,
      "mixed", // Use mixed difficulty
      roomService, // Pass room service for registration
      MAX_TOTAL_PLAYERS
    );
  }, 1000);

  // Maintain minimum bot count (check every 30 seconds)
  setInterval(() => {
    botService.maintainBotCount(
      GameRoom,
      MIN_BOT_COUNT,
      systemRoomControler,
      "mixed",
      roomService, // Pass room service for registration
      MAX_TOTAL_PLAYERS
    );
  }, 30000);
});

module.exports = { app, server, io, GameRoom, botService };
