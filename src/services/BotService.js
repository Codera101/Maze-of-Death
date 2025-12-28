/** @format */

const Bot = require("../models/Bot");

/**
 * @class BotService
 * @brief Service for managing AI bots in the game
 * @details Now supports per-room bot tracking for multi-room architecture
 */
class BotService {
  constructor() {
    this._bots = new Map(); // Map of botId -> Bot instance
    this._botsByRoom = new Map(); // Map of roomId -> Set of botIds
    this._botUpdateIntervals = new Map(); // Map of botId -> interval ID
    this._botNames = [
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
      "Echo",
      "Foxtrot",
      "Golf",
      "Hotel",
      "India",
      "Juliet",
      "Kilo",
      "Lima",
      "Mike",
      "November",
      "Oscar",
      "Papa",
      "Quebec",
      "Romeo",
      "Sierra",
      "Tango",
      "Uniform",
      "Victor",
      "Whiskey",
      "X-ray",
      "Yankee",
      "Zulu",
    ];
    this._usedNames = new Set();
  }

  /**
   * @brief Generate a unique bot name
   * @private
   * @returns {string} Unique bot name
   */
  _generateBotName() {
    const availableNames = this._botNames.filter(
      (name) => !this._usedNames.has(name)
    );

    if (availableNames.length === 0) {
      // If all names used, add suffix
      const baseName =
        this._botNames[Math.floor(Math.random() * this._botNames.length)];
      const suffix = Math.floor(Math.random() * 1000);
      return `${baseName}-${suffix}`;
    }

    const name =
      availableNames[Math.floor(Math.random() * availableNames.length)];
    this._usedNames.add(name);
    return `Bot ${name}`;
  }

  /**
   * @brief Create and add a bot to a room
   * @param {Room} room - The room to add the bot to
   * @param {string} difficulty - Bot difficulty ('easy', 'medium', 'hard')
   * @param {RoomService} roomService - Room service to register bot in userRoomMap
   * @returns {Bot} The created bot instance
   */
  createBot(room, difficulty = "medium", roomService = null) {
    const botName = this._generateBotName();
    const botId = `bot_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Get spawn position from room
    const spawnPos = room.generateValidPosition();
    if (!spawnPos || spawnPos.x === -1 || spawnPos.y === -1) {
      throw new Error("No available spawn position for bot");
    }

    // Create bot
    const bot = new Bot(
      spawnPos.x,
      spawnPos.y,
      room,
      botName,
      botId,
      difficulty
    );

    // Add bot to room's player list
    room.players.push(bot);

    // Register bot in room service if provided (use actual room ID)
    if (roomService) {
      roomService.userRoomMap.set(botId, room.roomId);
    }

    // Store bot reference globally
    this._bots.set(botId, bot);

    // Track bot by room
    if (!this._botsByRoom.has(room.roomId)) {
      this._botsByRoom.set(room.roomId, new Set());
    }
    this._botsByRoom.get(room.roomId).add(botId);

    // console.log(`🤖 Bot created: ${botName} (${difficulty}) in room ${room.roomId}`);

    return bot;
  }

  /**
   * @brief Start bot AI updates
   * @param {string} botId - ID of the bot to start
   * @param {RoomControler} roomControler - Room controller to handle bot actions
   */
  startBot(botId, roomControler) {
    const bot = this._bots.get(botId);
    if (!bot) {
      console.error(`Bot not found: ${botId}`);
      return;
    }

    // Clear existing interval if any
    this.stopBot(botId);

    // Start bot AI loop
    const intervalId = setInterval(() => {
      if (bot.health <= 0) {
        // Bot is dead, wait for respawn
        return;
      }

      const decision = bot.makeDecision();

      switch (decision.action) {
        case "move":
          if (decision.data && decision.data.direction) {
            roomControler.handlePlayerMove(botId, {
              dir: decision.data.direction,
            });
          }
          break;

        case "shoot":
          roomControler.handlePlayerShoot(botId);
          break;

        case "wait":
          // Do nothing
          break;

        default:
          console.warn(`Unknown bot action: ${decision.action}`);
      }
    }, 300); // Bot thinks every 300ms

    this._botUpdateIntervals.set(botId, intervalId);
  }

  /**
   * @brief Stop bot AI updates
   * @param {string} botId - ID of the bot to stop
   */
  stopBot(botId) {
    const intervalId = this._botUpdateIntervals.get(botId);
    if (intervalId) {
      clearInterval(intervalId);
      this._botUpdateIntervals.delete(botId);
    }
  }

  /**
   * @brief Remove a bot from the game
   * @param {string} botId - ID of the bot to remove
   * @param {Room} room - The room containing the bot
   */
  removeBot(botId, room) {
    // Stop bot AI
    this.stopBot(botId);

    // Get bot reference
    const bot = this._bots.get(botId);
    if (bot) {
      // Free up the name
      this._usedNames.delete(bot.userName.replace("Bot ", ""));

      // Remove from room
      const index = room.players.findIndex((p) => p.id === botId);
      if (index !== -1) {
        room.players.splice(index, 1);
      }

      // Remove from bots map
      this._bots.delete(botId);

      // Remove from room tracking
      const roomBots = this._botsByRoom.get(room.roomId);
      if (roomBots) {
        roomBots.delete(botId);
        if (roomBots.size === 0) {
          this._botsByRoom.delete(room.roomId);
        }
      }

      // console.log(`🤖 Bot removed: ${bot.userName} from room ${room.roomId}`);
    }
  }

  /**
   * @brief Add multiple bots to a room
   * @param {Room} room - The room to add bots to
   * @param {number} count - Number of bots to add
   * @param {RoomControler} roomControler - Room controller for bot actions
   * @param {string} difficulty - Bot difficulty ('easy', 'medium', 'hard', 'mixed')
   * @param {RoomService} roomService - Room service to register bots
   * @param {number} maxTotalPlayers - Maximum players per room
   */
  addBots(
    room,
    count,
    roomControler,
    difficulty = "mixed",
    roomService = null,
    maxTotalPlayers = null
  ) {
    const difficulties = ["easy", "medium", "hard"];
    const addedBots = [];

    for (let i = 0; i < count; i++) {
      // Check total player limit for this room
      if (maxTotalPlayers !== null) {
        const currentCount = room.getPlayerCount();
        
        if (currentCount >= maxTotalPlayers) {
          console.log(`Cannot add more bots: room ${room.roomId} at capacity (${currentCount}/${maxTotalPlayers})`);
          break;
        }
      }
      
      try {
        let botDifficulty;
        if (difficulty === "mixed") {
          botDifficulty =
            difficulties[Math.floor(Math.random() * difficulties.length)];
        } else {
          botDifficulty = difficulty;
        }

        const bot = this.createBot(room, botDifficulty, roomService);
        this.startBot(bot.id, roomControler);
        addedBots.push(bot);
      } catch (error) {
        console.error(`Failed to add bot ${i + 1}:`, error.message);
        break;
      }
    }

    console.log(`🤖 Added ${addedBots.length} bots to room ${room.roomId}`);
    return addedBots;
  }

  /**
   * @brief Remove all bots from a specific room
   * @param {Room} room - The room to remove bots from
   */
  removeAllBotsFromRoom(room) {
    const roomBots = this._botsByRoom.get(room.roomId);
    if (!roomBots) return;

    const botIds = Array.from(roomBots);
    botIds.forEach((botId) => this.removeBot(botId, room));
    console.log(`🤖 Removed all bots from room ${room.roomId}`);
  }

  /**
   * @brief Get all active bots
   * @returns {Map<string, Bot>} Map of bot IDs to bot instances
   */
  getBots() {
    return this._bots;
  }

  /**
   * @brief Get count of active bots (global)
   * @returns {number} Number of active bots across all rooms
   */
  getBotCount() {
    return this._bots.size;
  }

  /**
   * @brief Get count of bots in a specific room
   * @param {string} roomId - The room ID
   * @returns {number} Number of bots in the room
   */
  getBotCountForRoom(roomId) {
    const roomBots = this._botsByRoom.get(roomId);
    return roomBots ? roomBots.size : 0;
  }

  /**
   * @brief Check if a player ID belongs to a bot
   * @param {string} playerId - Player ID to check
   * @returns {boolean} True if player is a bot
   */
  isBot(playerId) {
    return this._bots.has(playerId);
  }

  /**
   * @brief Remove one bot from a specific room
   * @param {Room} room - The room containing bots
   * @returns {string|null} The name of the removed bot, or null if no bots available
   */
  removeOneBot(room) {
    const roomBots = this._botsByRoom.get(room.roomId);
    if (!roomBots || roomBots.size === 0) {
      return null;
    }

    // Get a random bot to remove from this room
    const botIds = Array.from(roomBots);
    const randomBotId = botIds[Math.floor(Math.random() * botIds.length)];
    const bot = this._bots.get(randomBotId);
    const botName = bot ? bot.userName : null;

    // Remove the bot
    this.removeBot(randomBotId, room);

    return botName;
  }

  /**
   * @brief Add one bot to a room (opposite of removeOneBot)
   * @param {Room} room - The room to add bot to
   * @param {RoomControler} roomControler - Room controller for bot actions
   * @param {RoomService} roomService - Room service to register bot
   * @param {number} maxTotalPlayers - Maximum players per room
   * @returns {Bot|null} The added bot, or null if room is full
   */
  addOneBot(room, roomControler, roomService = null, maxTotalPlayers = null) {
    if (maxTotalPlayers !== null && room.getPlayerCount() >= maxTotalPlayers) {
      return null;
    }

    const difficulties = ["easy", "medium", "hard"];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    try {
      const bot = this.createBot(room, difficulty, roomService);
      this.startBot(bot.id, roomControler);
      console.log(`🤖 Added bot ${bot.userName} to room ${room.roomId}`);
      return bot;
    } catch (error) {
      console.error(`Failed to add bot:`, error.message);
      return null;
    }
  }

  /**
   * @brief Fill a room with bots up to the max player count
   * @param {Room} room - The room to fill
   * @param {RoomControler} roomControler - Room controller for bot actions
   * @param {RoomService} roomService - Room service to register bots
   * @param {number} maxTotalPlayers - Maximum players per room
   */
  fillRoomWithBots(room, roomControler, roomService = null, maxTotalPlayers = 10) {
    const currentCount = room.getPlayerCount();
    const botsNeeded = maxTotalPlayers - currentCount;
    
    if (botsNeeded > 0) {
      this.addBots(room, botsNeeded, roomControler, "mixed", roomService, maxTotalPlayers);
    }
  }

  /**
   * @brief Maintain a minimum number of bots in a room
   * @param {Room} room - The room to maintain bots in
   * @param {number} minBots - Minimum number of bots to maintain
   * @param {RoomControler} roomControler - Room controller for bot actions
   * @param {string} difficulty - Bot difficulty
   * @param {RoomService} roomService - Room service to register bots
   * @param {number} maxTotalPlayers - Maximum players per room
   */
  maintainBotCount(
    room,
    minBots,
    roomControler,
    difficulty = "mixed",
    roomService = null,
    maxTotalPlayers = null
  ) {
    const currentBotCount = this.getBotCountForRoom(room.roomId);
    const totalPlayers = room.getPlayerCount();
    
    // Calculate how many bots we can add
    let botsToAdd = minBots - currentBotCount;
    
    if (maxTotalPlayers !== null) {
      const availableSlots = maxTotalPlayers - totalPlayers;
      botsToAdd = Math.min(botsToAdd, availableSlots);
    }

    if (botsToAdd > 0) {
      this.addBots(room, botsToAdd, roomControler, difficulty, roomService, maxTotalPlayers);
    }
  }
}

module.exports = BotService;
