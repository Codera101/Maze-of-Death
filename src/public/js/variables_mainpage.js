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
const exitButton = document.querySelector("#exit-menu");

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

// Socket Connection
const socket = io();
// const socket = io("http://localhost:3000");
// const socket = io("https://maze-of-death-production.up.railway.app");

// Maze Variables
let rows = 15.1;
let cols = 15.1;
let cellSize = 32;
let strokeWidth = 2;
let mazeLayout = [];
for (let i = 0; i < rows; i++) {
  mazeLayout[i] = [];
  for (let j = 0; j < cols; j++) {
    mazeLayout[i][j] = 0;
  }
}
let visiblePlayers = [];

// let shooting = false;
let myPlayer = {
  id: null,
  username: null,
  roomId: null, // Track which room the player is in
  x: 0,
  y: 0,
  dir: "U",
  health: 10, // Match backend's initPlayerHealth
  score: 0,
  kill_count: 0, // Use consistent property name
  bullets: 5, // Match backend's initBulltesNumber
  color: "#FF5733",
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

let isViewer = true;

// let laserSound = new Audio("../sounds/laserShoot.wav");
// laserSound.play();
