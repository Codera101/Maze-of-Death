// DOM Elements - Main Container
const container = document.querySelector("#container");

// Header Elements
const header = document.querySelector("#header");
const health = document.querySelector("#health");
const healthProgress = document.querySelector("#health-progress");
const healthValue = document.querySelector("#health-value");
const stats = document.querySelector("#stats");
const score = document.querySelector("#score");
const scoreValue = document.querySelector("#score-value");
const kills = document.querySelector("#kills");
const killsValue = document.querySelector("#kills-value");
const pauseMenu = document.querySelector("#exit-menu");

// Maze Container Elements
const mazeContainer = document.querySelector("#maze-container");
const mazeContent = document.querySelector("#maze-content");
const maze = document.querySelector("#maze");

const rightPanel = document.querySelector("#right-panel");
const rightPanelList = document.querySelector("#right-panel-list");

// Footer Elements
const footer = document.querySelector("#footer");
const reload = document.querySelector("#reload");
const howToPlay = document.querySelector("#how-to-play");
const reloadCost = document.querySelector("#reload-cost");

const killMessage = document.querySelector("#kill-message");

// ============================================================================
// DUAL PROTOCOL SETUP (Socket.io + WebRTC with backward compatibility)
// ============================================================================

// Socket.io Connection (always available - fallback)
const socket = io("http://localhost:3000");
// const socket = io("http://localhost:8080");
// const socket = io("https://maze-of-death-production.up.railway.app");

// Client capabilities and protocol state (will be updated when geckos loads)
let clientCapabilities = {
  version: "2.0.0",
  protocols: {
    socketio: true,
    webrtc: typeof RTCPeerConnection !== 'undefined',
    geckos: false  // Will be set to true when geckos loads
  }
};

let geckosChannel = null;
let useWebRTC = false;
let protocolMode = 'socketio-only'; // 'socketio-only' or 'hybrid'
let capabilitiesSent = false;

// Function to initialize geckos.io
function initializeGeckos() {
  if (typeof window.geckos === 'undefined') {
    console.log('[WebRTC] geckos.io not available');
    return;
  }

  console.log('[WebRTC] Initializing geckos.io...');
  try {
    geckosChannel = window.geckos({ 
      url: 'http://localhost:3001',
      authorization: ''  // Will be set after socket connects
    });
    
    geckosChannel.onConnect((error) => {
      if (error) {
        console.warn('WebRTC connection failed:', error.message);
        console.warn('Falling back to Socket.io only');
        geckosChannel = null;
      } else {
        console.log('WebRTC connection established via geckos.io');
        // Send handshake to associate with socket ID
        geckosChannel.emit('handshake', socket.id);
      }
    });

    // Handle raw binary data from WebRTC
    geckosChannel.onRaw((data) => {
      if (!window.BinaryProtocol) {
        console.error('BinaryProtocol not loaded');
        return;
      }
      
      const messageType = BinaryProtocol.getMessageType(data);
      
      if (messageType === BinaryProtocol.MESSAGE_TYPE.PLAYER_STATE) {
        const playerData = BinaryProtocol.decodePlayerState(data);
        // Trigger refresh_player event with decoded data
        window.dispatchEvent(new CustomEvent('webrtc_refresh_player', { detail: playerData }));
      } else if (messageType === BinaryProtocol.MESSAGE_TYPE.VISIBLE_PLAYERS) {
        const playersData = BinaryProtocol.decodeVisiblePlayers(data);
        // Trigger refresh_players event with decoded data
        window.dispatchEvent(new CustomEvent('webrtc_refresh_players', { 
          detail: { visible_player_list: playersData } 
        }));
      }
    });
    geckosChannel.onDisconnect(() => {
      console.warn('[WebRTC] Disconnected');
    });
  } catch (error) {
    console.warn('[WebRTC] Failed to initialize geckos.io:', error.message);
    geckosChannel = null;
  }
}

// Listen for geckos-loaded event (fired when ES module loads)
window.addEventListener('geckos-loaded', () => {
  console.log('[WebRTC] geckos-loaded event received');
  clientCapabilities.protocols.geckos = true;
  initializeGeckos();
  
  // If socket already connected, send updated capabilities
  if (socket.connected && !capabilitiesSent) {
    socket.emit('client_capabilities', clientCapabilities);
    capabilitiesSent = true;
  }
});

// Send capabilities to server on connect
socket.on('connect', () => {
  console.log('Socket.io connected:', socket.id);
  
  // Wait a bit for geckos to load if not loaded yet
  setTimeout(() => {
    if (!capabilitiesSent) {
      // Update geckos status one final time
      clientCapabilities.protocols.geckos = typeof window.geckos !== 'undefined';
      
      if (clientCapabilities.protocols.geckos && !geckosChannel) {
        initializeGeckos();
      }
      
      console.log('[Protocol] Sending capabilities:', clientCapabilities);
      socket.emit('client_capabilities', clientCapabilities);
      capabilitiesSent = true;
      
      // Update geckos authorization if channel exists
      if (geckosChannel && socket.id) {
        geckosChannel.emit('handshake', socket.id);
      }
    }
  }, 100);  // Small delay to allow geckos ES module to load
});

// Receive protocol selection from server
socket.on('protocol_selected', (data) => {
  protocolMode = data.protocol;
  useWebRTC = (protocolMode === 'hybrid' && geckosChannel !== null);
  console.log(`Protocol mode: ${protocolMode}, WebRTC enabled: ${useWebRTC}`);
  
  // Update geckos authorization if needed
  if (geckosChannel && !geckosChannel.id) {
    geckosChannel.emit('handshake', socket.id);
  }
});

// ============================================================================
// END DUAL PROTOCOL SETUP
// ============================================================================

// Maze Variables
let rows = 16;
let cols = 16;
let cellSize = 50;
let strokeWidth = 2;
let mazeLayout = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
let visiblePlayers = [];

let myPlayer;
// let shooting = false;

myPlayer = {
    id: null,
    username: null,
    x: 0,
    y: 0,
    dir: "U",
    health: 10,  // Match backend's initPlayerHealth
    score: 0,
    kill_count: 0,  // Use consistent property name
    bullets: 5,  // Match backend's initBulltesNumber
    color: "#FF5733"
};


function displayKillMessage(victim_name, killer_name) {
  if (killMessage.children.length >= 3) {
    killMessage.removeChild(killMessage.firstChild);
  }
  let message = document.createElement("div");

  if (killer_name === myPlayer.username || victim_name === myPlayer.username) {
    message.style.border = "3px solid red";
  }

  message.innerHTML = `<span style="color: red;">${killer_name}</span>&nbsp;&nbsp;killed&nbsp;&nbsp;<span style="color: blue;">${victim_name}</span>`;
  killMessage.appendChild(message);
}
