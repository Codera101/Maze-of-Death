# 🎮 Maze of Death

<div align="center">

**A fast-paced, real-time multiplayer maze shooter built with Node.js, Socket.IO, and PIXI.js**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7.2-blue.svg)](https://socket.io/)
[![PIXI.js](https://img.shields.io/badge/PIXI.js-8-red.svg)](https://pixijs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Installation](#-installation) • [Gameplay](#-gameplay) • [Tech Stack](#-tech-stack) • [Development](#-development)

</div>

---

## 📖 Overview

**Maze of Death** is an intense multiplayer combat game set in a procedurally generated maze. Battle against human players and AI bots in real-time, where strategy and quick reflexes determine survival. With limited line-of-sight mechanics, every corner could hide an enemy or an opportunity.

## ✨ Features

### 🎯 Core Gameplay

- **Real-time Multiplayer**: Up to 8 simultaneous players (humans + AI bots)
- **Line-of-Sight Combat**: Only see and shoot enemies directly in your path
- **Smart AI Bots**: Adaptive difficulty levels (easy, medium, hard) fill empty slots
- **Dynamic Spawning**: Random spawn points ensure fair starts
- **Limited Resources**: Manage health (25 HP) and ammunition (5 bullets) strategically

### 🎨 Visual Effects

- **Particle Systems**: Blood splatters, explosions, and muzzle flashes
- **Laser Beam Shooting**: Golden laser beams with glow effects
- **Death Animations**: Explosive particle effects on player elimination
- **Hit Indicators**: Visual feedback for damage dealt and received
- **Player Highlighting**: Gold star and green glow mark your character

### 🏆 Game Mechanics

- **Scoring System**: +5 points per kill, -5 points on death
- **Respawn System**: 3-second respawn timer after elimination
- **Auto-Reload**: Automatic reload after shooting at least once
- **Player Limit**: Maximum total players maintained automatically

### 📊 UI Features

- **Live Leaderboard**: Real-time rankings updated every second
- **Player Statistics**: Track health, score, kills, and ammo
- **Kill Messages**: Broadcast notifications for eliminations
- **Damage Indicators**: Floating damage numbers on hit

## 🚀 Installation

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**

### Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/Codera101/Maze-of-Death.git
cd Maze-of-Death
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the server**

```bash
npm start
```

4. **Open your browser**

```
http://localhost:3000
```

### Development Mode

Run with auto-reload on file changes:

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

## 🎮 Gameplay

### Controls

| Key               | Action     |
| ----------------- | ---------- |
| **W / ↑**         | Move Up    |
| **S / ↓**         | Move Down  |
| **A / ←**         | Move Left  |
| **D / →**         | Move Right |
| **Space / Click** | Shoot      |

### How to Play

1. **Enter your username** on the home page
2. **Spawn randomly** in the maze with 25 health and 5 bullets
3. **Move strategically** - you can only see enemies in direct line-of-sight
4. **Shoot enemies** to gain +5 points per kill
5. **Avoid getting hit** - each hit costs -5 points and 5 damage
6. **Climb the leaderboard** by eliminating opponents

### Game Rules

#### Combat

- ✅ Shooting an enemy: **+5 points** to you, **-5 points** to victim
- ❌ Getting killed: **-5 points** and 3-second respawn
- 🎯 Each successful hit deals **5 damage**
- ⚰️ Death occurs at **0 health**

#### Resources

- 🩸 **Starting Health**: 25 HP
- 🔫 **Starting Ammo**: 5 bullets
- 🔄 **Reload Cost**: 5 points
- ⚡ **Auto-reload**: Triggered when out of ammo

#### Bot Management

- 🤖 AI bots automatically fill empty player slots
- 👤 Human players prioritized over bots
- 🔄 Bots removed when humans join
- 📊 Maximum 8 total players maintained

## 🛠️ Tech Stack

### Backend

- **Node.js** - Server runtime
- **Express 5.1.0** - Web framework
- **Socket.IO 4.7.2** - Real-time bidirectional communication

### Frontend

- **PIXI.js 8** - High-performance 2D rendering
- **Vanilla JavaScript** - No framework overhead
- **Socket.IO Client** - Real-time event handling

### Testing

- **Jest 30.2.0** - Unit and integration testing

### Development

- **Nodemon** - Auto-restart on file changes

## 📁 Project Structure

```
Maze-of-Death/
├── src/
│   ├── server.js              # Main server entry point
│   ├── controllers/
│   │   └── RoomController.js  # Game room logic
│   ├── models/
│   │   ├── Bot.js            # AI bot implementation
│   │   ├── Direction.js      # Movement directions
│   │   ├── Maze.js           # Maze generation
│   │   ├── Messages.js       # Action message types
│   │   ├── Player.js         # Player entity
│   │   └── Room.js           # Game room state
│   ├── services/
│   │   ├── BotService.js     # Bot lifecycle management
│   │   └── RoomServices.js   # Room management
│   ├── utils/
│   │   ├── Logger.js         # Logging utility
│   │   └── Messenger.js      # Socket message handler
│   └── public/
│       ├── index.html        # Login page
│       ├── main.html         # Game page
│       ├── css/              # Stylesheets
│       └── js/               # Client-side scripts
│           ├── maze.js       # PIXI.js initialization
│           ├── draw.js       # Rendering functions
│           ├── player_move.js      # Movement handling
│           ├── shoot.js            # Shooting mechanics
│           ├── refresh_player.js   # Player state updates
│           └── ...
├── tests/                    # Jest test suites
├── package.json
├── Dockerfile               # Docker containerization
├── docker-compose.yml       # Docker Compose config
└── README.md

```

## 🧪 Development

### Architecture

**Server-Side:**

- **Room-based system**: One global room for all players
- **Event-driven**: Socket.IO handles all real-time communication
- **Bot AI**: Decision-making every 200ms with pathfinding
- **Update loop**: Server broadcasts state every 100ms

**Client-Side:**

- **PIXI.js rendering**: Hardware-accelerated WebGL graphics
- **Object pooling**: Graphics cache prevents memory leaks
- **Animation loop**: RequestAnimationFrame for smooth 60fps
- **Event listeners**: Socket.IO receives server updates

### Key Features Implementation

#### Line-of-Sight System

- Ray-casting algorithm checks maze cells in shooting direction
- Detects first player or wall in line-of-sight
- Returns hit result: Player, Wall, or Nothing

#### AI Bot Behavior

```javascript
// Bot decision tree:
1. Scan surroundings for visible players
2. If player in sight → Shoot
3. Else → Move toward nearest player (pathfinding)
4. If no path → Random exploration
```

#### Memory Optimization

- Graphics object pooling and caching
- Automatic cleanup of animations
- Destroyed PIXI objects after removal

### Environment Variables

```bash
PORT=3000  # Server port (default: 3000)
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with ❤️ by [Codera101](https://github.com/Codera101)
- Inspired by classic maze shooters and battle royale games

## 📧 Contact

For questions, suggestions, or issues:

- **GitHub Issues**: [Report a bug](https://github.com/Codera101/Maze-of-Death/issues)
- **Repository**: [Maze-of-Death](https://github.com/Codera101/Maze-of-Death)

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ☕ and 🎮

</div>
