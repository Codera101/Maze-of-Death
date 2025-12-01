/** @format */

const Bot = require("../models/Bot");

/**
 * @class BotService
 * @brief Service for managing AI bots in the game
 */
class BotService {
  constructor() {
    this._bots = new Map(); // Map of botId -> Bot instance
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

    // Register bot in room service if provided
    if (roomService) {
      // Access the userRoomMap directly to register the bot
      roomService.userRoomMap.set(botId, "global");
    }

    // Store bot reference
    this._bots.set(botId, bot);

    console.log(
      `Bot created: ${botName} (${difficulty}) at position (${spawnPos.x}, ${spawnPos.y})`
    );

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
            // console.log(`🤖 [BOT] ${bot.userName} moving ${decision.data.direction}`);
            roomControler.handlePlayerMove(botId, {
              dir: decision.data.direction,
            });
          }
          break;

        case "shoot":
          // console.log(`🤖 [BOT] ${bot.userName} shooting`);
          roomControler.handlePlayerShoot(botId);
          break;

        case "wait":
          // Do nothing
          break;

        default:
          console.warn(`Unknown bot action: ${decision.action}`);
      }
    }, 100); // Bot thinks every 100ms

    this._botUpdateIntervals.set(botId, intervalId);
    console.log(`Bot AI started: ${bot.userName}`);
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
      const bot = this._bots.get(botId);
      if (bot) {
        console.log(`Bot AI stopped: ${bot.userName}`);
      }
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

      console.log(`Bot removed: ${bot.userName}`);
    }
  }

  /**
   * @brief Add multiple bots to a room
   * @param {Room} room - The room to add bots to
   * @param {number} count - Number of bots to add
   * @param {RoomControler} roomControler - Room controller for bot actions
   * @param {string} difficulty - Bot difficulty ('easy', 'medium', 'hard', 'mixed')
   * @param {RoomService} roomService - Room service to register bots
   */
  addBots(
    room,
    count,
    roomControler,
    difficulty = "mixed",
    roomService = null
  ) {
    const difficulties = ["easy", "medium", "hard"];
    const addedBots = [];

    for (let i = 0; i < count; i++) {
      try {
        let botDifficulty;
        if (difficulty === "mixed") {
          // Random difficulty for mixed mode
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

    console.log(`Added ${addedBots.length} bots to the game`);
    return addedBots;
  }

  /**
   * @brief Remove all bots from the game
   * @param {Room} room - The room containing the bots
   */
  removeAllBots(room) {
    const botIds = Array.from(this._bots.keys());
    botIds.forEach((botId) => this.removeBot(botId, room));
    console.log("All bots removed");
  }

  /**
   * @brief Get all active bots
   * @returns {Map<string, Bot>} Map of bot IDs to bot instances
   */
  getBots() {
    return this._bots;
  }

  /**
   * @brief Get count of active bots
   * @returns {number} Number of active bots
   */
  getBotCount() {
    return this._bots.size;
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
   * @brief Maintain a minimum number of bots in the room
   * @param {Room} room - The room to maintain bots in
   * @param {number} minBots - Minimum number of bots to maintain
   * @param {RoomControler} roomControler - Room controller for bot actions
   * @param {string} difficulty - Bot difficulty
   * @param {RoomService} roomService - Room service to register bots
   */
  maintainBotCount(
    room,
    minBots,
    roomControler,
    difficulty = "mixed",
    roomService = null
  ) {
    const currentBotCount = this.getBotCount();
    const botsToAdd = minBots - currentBotCount;

    if (botsToAdd > 0) {
      console.log(`Maintaining bot count: adding ${botsToAdd} bots`);
      this.addBots(room, botsToAdd, roomControler, difficulty, roomService);
    }
  }
}

module.exports = BotService;
