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
const pauseMenu = document.querySelector("#pause-menu");

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

// Socket Connection
// const socket = io("http://localhost:3000");

// Maze Variables
const rows = 16;
const cols = 16;
const cellSize = 50;