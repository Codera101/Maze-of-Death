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

// Feature flag for WebRTC support (backward compatible)
const ENABLE_WEBRTC = process.env.ENABLE_WEBRTC === "true";
let geckosServer = null;

// Initialize geckos.io if enabled
if (ENABLE_WEBRTC) {
  try {
    const geckos = require("@geckos.io/server").default;
    geckosServer = geckos({
      cors: { allowAuthorization: true },
    });
    console.log("WebRTC support enabled via geckos.io");
  } catch (error) {
    console.warn("Failed to initialize geckos.io:", error.message);
    console.warn("Falling back to Socket.io only");
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

// Configuration
const MAX_TOTAL_PLAYERS = 10; // Maximum players per room (as requested by user)

// Initialize RoomService (no default room - rooms created dynamically)
const roomService = new RoomService(MAX_TOTAL_PLAYERS);

// Initialize BotService
const botService = new BotService();

// Initialize Logger
const logger = new Logger("SERVER");

// Store geckos channels by socket ID for WebRTC support
const geckosChannels = new Map();

// Store transport managers by socket ID for viewer WebRTC support
const transportManagers = new Map();

// Create a system messenger and controller for global tasks (like rankings)
// Note: This uses basic Messenger for broadcast operations. Individual user notifications
// will still work via the stored transportManagers when available.
const systemMessenger = new Messenger(io, null);

// Enhance systemMessenger to route through TransportManagers when available
const originalNotifyGivenUser =
  systemMessenger.notifyGivenUser.bind(systemMessenger);
systemMessenger.notifyGivenUser = function (userId, onEvent, payload) {
  // If we have a TransportManager for this user, use it (enables WebRTC)
  if (transportManagers.has(userId)) {
    transportManagers.get(userId).notifyGivenUser(userId, onEvent, payload);
  } else {
    // Fallback to Socket.io
    originalNotifyGivenUser(userId, onEvent, payload);
  }
};

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
    channel.on("handshake", (socketId) => {
      geckosChannels.set(socketId, channel);
      // WebRTC channel established quietly
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
  socket.on("client_capabilities", (capabilities) => {
    socket.capabilities = capabilities;
    const supportsWebRTC =
      capabilities.protocols?.geckos || capabilities.protocols?.webrtc;
    const protocol =
      supportsWebRTC && geckosServer ? "hybrid" : "socketio-only";

    // Protocol negotiation complete
    // console.log(`[Protocol] Client ${socket.id} capabilities:`, JSON.stringify(capabilities));
    // console.log(`[Protocol] Selected: ${protocol}`);

    // Notify client which protocol will be used
    socket.emit("protocol_selected", {
      protocol,
      webrtcEnabled: ENABLE_WEBRTC && geckosServer !== null,
    });
  });

  // Get geckos channel if available (will be null until handshake completes)
  const getGeckosChannel = () => geckosChannels.get(socket.id) || null;

  // Initialize TransportManager (backward compatible - works without geckos)
  const transportManager = new TransportManager(io, socket, getGeckosChannel());

  // Store TransportManager for system-level operations (like viewer updates)
  transportManagers.set(socket.id, transportManager);

  // Also keep Messenger for compatibility
  const messenger = new Messenger(io, socket);

  const roomControler = new RoomControler(
    roomService,
    transportManager, // Use TransportManager instead of Messenger
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
      }, 16); // ~60 FPS for fast UDP gameplay
    }
  }, 1000);

  socket.on("disconnect", (reason) => {
    // Clear the interval to prevent memory leak
    clearInterval(refreshInterval);

    // Cleanup geckos channel
    if (geckosChannels.has(socket.id)) {
      geckosChannels.delete(socket.id);
    }

    // Cleanup transport manager
    if (transportManagers.has(socket.id)) {
      transportManagers.delete(socket.id);
    }


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

// update every 16ms (~60 FPS) - fast updates for UDP
setInterval(() => {
  systemRoomControler.refreshVisiblePlayersForViewers();
}, 16);

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
const PORT = 3000;
const WEBRTC_PORT = 3001;
const HOST = "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);

  // Start geckos.io server if enabled
  if (geckosServer) {
    geckosServer.listen(WEBRTC_PORT);
    console.log(`WebRTC server (geckos.io) listening on port ${WEBRTC_PORT}`);
  }

  // Note: Bot initialization disabled - rooms now create bots dynamically when players join
  console.log(`🎮 Multi-room mode enabled (max ${MAX_TOTAL_PLAYERS} players per room)`);
  console.log(`🏠 Rooms are created dynamically when players join`);
});

module.exports = { app, server, io, roomService, botService };
