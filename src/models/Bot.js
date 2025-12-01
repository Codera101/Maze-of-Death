/** @format */

const Player = require("./Player");
const { Directions, getNextPosition } = require("./Direction");

/**
 * @class Bot
 * @extends Player
 * @brief Represents an AI-controlled bot player with intelligent behavior
 */
class Bot extends Player {
  /**
   * @brief Constructor for Bot class
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {Room} room - The room the bot belongs to
   * @param {string} botName - Name of the bot
   * @param {string} id - Unique identifier for the bot
   * @param {string} difficulty - Bot difficulty level ('easy', 'medium', 'hard')
   */
  constructor(x, y, room, botName, id, difficulty = "medium") {
    super(x, y, room, botName, id);
    this._isBot = true;
    this._difficulty = difficulty;
    this._targetPosition = null;
    this._lastDecisionTime = 0;
    this._decisionCooldown = this._getDecisionCooldown();
    this._explorationMode = true;
    this._stuckCounter = 0;
    this._lastPosition = { x, y };
  }

  // ------------------ Getters / Setters ------------------

  get isBot() {
    return this._isBot;
  }

  get difficulty() {
    return this._difficulty;
  }

  set difficulty(d) {
    this._difficulty = d;
    this._decisionCooldown = this._getDecisionCooldown();
  }

  get targetPosition() {
    return this._targetPosition;
  }

  set targetPosition(pos) {
    this._targetPosition = pos;
  }

  /**
   * @brief Get decision cooldown based on difficulty
   * @private
   * @returns {number} Cooldown in milliseconds
   */
  _getDecisionCooldown() {
    switch (this._difficulty) {
      case "easy":
        return 800; // Slower reaction
      case "hard":
        return 200; // Fast reaction
      case "medium":
      default:
        return 400; // Moderate reaction
    }
  }

  /**
   * @brief Get shooting accuracy based on difficulty
   * @private
   * @returns {number} Accuracy value (0.0 to 1.0)
   */
  _getAccuracy() {
    switch (this._difficulty) {
      case "easy":
        return 0.5; // 50% chance to shoot when enemy visible
      case "hard":
        return 0.95; // 95% chance to shoot when enemy visible
      case "medium":
      default:
        return 0.75; // 75% chance to shoot when enemy visible
    }
  }

  /**
   * @brief Check if bot can make a decision
   * @returns {boolean} True if decision cooldown has passed
   */
  canDecide() {
    return Date.now() - this._lastDecisionTime >= this._decisionCooldown;
  }

  /**
   * @brief Update the last decision time
   */
  updateDecisionTime() {
    this._lastDecisionTime = Date.now();
  }

  /**
   * @brief Main AI decision-making function
   * @returns {{action: string, data: any}} The action to take and associated data
   */
  makeDecision() {
    if (!this.canDecide()) {
      return { action: "wait", data: null };
    }

    this.updateDecisionTime();

    // Check if stuck in same position
    if (this._lastPosition.x === this.x && this._lastPosition.y === this.y) {
      this._stuckCounter++;
    } else {
      this._stuckCounter = 0;
    }
    this._lastPosition = { x: this.x, y: this.y };

    // Priority 1: Shoot at visible enemies
    const shootAction = this._considerShooting();
    if (shootAction) {
      return shootAction;
    }

    // Priority 2: Avoid danger (enemies in line of sight)
    const avoidAction = this._considerAvoiding();
    if (avoidAction) {
      return avoidAction;
    }

    // Priority 3: Move strategically
    return this._considerMoving();
  }

  /**
   * @brief Check if bot should shoot at visible enemies
   * @private
   * @returns {{action: string, data: any}|null} Shoot action or null
   */
  _considerShooting() {
    // Check if bot has bullets and can shoot (cooldown passed)
    if (this.bullets <= 0 || !this.canShoot()) {
      return null;
    }

    // Check for enemies in line of sight
    const visibleEnemy = this._detectEnemyInLineOfSight();
    if (visibleEnemy) {
      // Apply accuracy based on difficulty
      if (Math.random() < this._getAccuracy()) {
        return { action: "shoot", data: null };
      } else {
        // If accuracy check fails, don't shoot this time
        return null;
      }
    }

    return null;
  }

  /**
   * @brief Detect if there's an enemy in the bot's line of sight
   * @private
   * @returns {Player|null} The detected enemy or null
   */
  _detectEnemyInLineOfSight() {
    const room = this.room;
    const players = room.players;
    let checkPos = { x: this.x, y: this.y };

    // Check in current direction
    while (true) {
      checkPos = getNextPosition(checkPos, this.direction);

      // Check if out of bounds or hit a wall
      if (
        checkPos.x < 0 ||
        checkPos.x >= room.height ||
        checkPos.y < 0 ||
        checkPos.y >= room.width ||
        room.maze.maze[checkPos.x][checkPos.y]
      ) {
        break;
      }

      // Check if there's a player at this position
      const playerAtPos = players.find(
        (p) =>
          p.id !== this.id &&
          p.x === checkPos.x &&
          p.y === checkPos.y &&
          p.health > 0
      );

      if (playerAtPos) {
        return playerAtPos;
      }
    }

    return null;
  }

  /**
   * @brief Check if bot should avoid danger
   * @private
   * @returns {{action: string, data: any}|null} Move action to avoid danger or null
   */
  _considerAvoiding() {
    // Check if any enemy is facing the bot
    const threatDirection = this._detectThreat();
    if (threatDirection) {
      // Try to move perpendicular to the threat
      const escapeDirection = this._getEscapeDirection(threatDirection);
      if (escapeDirection) {
        return { action: "move", data: { direction: escapeDirection } };
      }
    }

    return null;
  }

  /**
   * @brief Detect if there's a threat (enemy facing the bot)
   * @private
   * @returns {string|null} Direction of threat or null
   */
  _detectThreat() {
    const room = this.room;
    const players = room.players;

    // Check all four directions for enemies facing us
    const directionsToCheck = [
      Directions.U,
      Directions.D,
      Directions.L,
      Directions.R,
    ];

    for (const dir of directionsToCheck) {
      let checkPos = { x: this.x, y: this.y };
      const oppositeDir = this._getOppositeDirection(dir);

      while (true) {
        checkPos = getNextPosition(checkPos, dir);

        // Check bounds and walls
        if (
          checkPos.x < 0 ||
          checkPos.x >= room.height ||
          checkPos.y < 0 ||
          checkPos.y >= room.width ||
          room.maze.maze[checkPos.x][checkPos.y]
        ) {
          break;
        }

        // Check for enemy facing us
        const enemy = players.find(
          (p) =>
            p.id !== this.id &&
            p.x === checkPos.x &&
            p.y === checkPos.y &&
            p.health > 0 &&
            p.direction === oppositeDir &&
            p.bullets > 0
        );

        if (enemy) {
          return dir;
        }
      }
    }

    return null;
  }

  /**
   * @brief Get escape direction perpendicular to threat
   * @private
   * @param {string} threatDir - Direction of the threat
   * @returns {string|null} Safe escape direction or null
   */
  _getEscapeDirection(threatDir) {
    let perpDirections = [];

    if (threatDir === Directions.U || threatDir === Directions.D) {
      perpDirections = [Directions.L, Directions.R];
    } else {
      perpDirections = [Directions.U, Directions.D];
    }

    // Shuffle for randomness
    perpDirections.sort(() => Math.random() - 0.5);

    // Find first valid perpendicular direction
    for (const dir of perpDirections) {
      if (this._isValidMove(dir)) {
        return dir;
      }
    }

    return null;
  }

  /**
   * @brief Consider strategic movement
   * @private
   * @returns {{action: string, data: any}} Move action
   */
  _considerMoving() {
    if (!this.canMove()) {
      return { action: "wait", data: null };
    }

    // If stuck, try random direction
    if (this._stuckCounter > 3) {
      const randomDir = this._getRandomValidDirection();
      if (randomDir) {
        this._stuckCounter = 0;
        return { action: "move", data: { direction: randomDir } };
      }
    }

    // Try to move to a strategic position
    const bestDirection = this._findBestDirection();
    if (bestDirection) {
      return { action: "move", data: { direction: bestDirection } };
    }

    return { action: "wait", data: null };
  }

  /**
   * @brief Find the best direction to move
   * @private
   * @returns {string|null} Best direction or null
   */
  _findBestDirection() {
    const directions = [Directions.U, Directions.D, Directions.L, Directions.R];
    const validMoves = [];

    // Evaluate each direction
    for (const dir of directions) {
      if (this._isValidMove(dir)) {
        const score = this._evaluateDirection(dir);
        validMoves.push({ direction: dir, score });
      }
    }

    if (validMoves.length === 0) {
      return null;
    }

    // Sort by score and return best
    validMoves.sort((a, b) => b.score - a.score);
    return validMoves[0].direction;
  }

  /**
   * @brief Check if move in direction is valid
   * @private
   * @param {string} direction - Direction to check
   * @returns {boolean} True if move is valid
   */
  _isValidMove(direction) {
    const nextPos = getNextPosition({ x: this.x, y: this.y }, direction);
    const room = this.room;

    // Check bounds
    if (
      nextPos.x < 0 ||
      nextPos.x >= room.height ||
      nextPos.y < 0 ||
      nextPos.y >= room.width
    ) {
      return false;
    }

    // Check walls
    if (room.maze.maze[nextPos.x][nextPos.y]) {
      return false;
    }

    return true;
  }

  /**
   * @brief Evaluate a direction for strategic value
   * @private
   * @param {string} direction - Direction to evaluate
   * @returns {number} Score for the direction
   */
  _evaluateDirection(direction) {
    let score = 50; // Base score
    const nextPos = getNextPosition({ x: this.x, y: this.y }, direction);

    // Prefer open spaces
    const openness = this._countOpenNeighbors(nextPos);
    score += openness * 10;

    // Avoid corners/dead ends for medium/hard bots
    if (this._difficulty !== "easy" && openness < 2) {
      score -= 30;
    }

    // Add some randomness
    score += Math.random() * 20;

    // Prefer continuing in same direction (momentum)
    if (direction === this.direction) {
      score += 15;
    }

    return score;
  }

  /**
   * @brief Count open neighboring cells
   * @private
   * @param {{x: number, y: number}} pos - Position to check
   * @returns {number} Number of open neighbors
   */
  _countOpenNeighbors(pos) {
    const room = this.room;
    const directions = [Directions.U, Directions.D, Directions.L, Directions.R];
    let count = 0;

    for (const dir of directions) {
      const neighborPos = getNextPosition(pos, dir);
      if (
        neighborPos.x >= 0 &&
        neighborPos.x < room.height &&
        neighborPos.y >= 0 &&
        neighborPos.y < room.width &&
        !room.maze.maze[neighborPos.x][neighborPos.y]
      ) {
        count++;
      }
    }

    return count;
  }

  /**
   * @brief Get a random valid direction
   * @private
   * @returns {string|null} Random valid direction or null
   */
  _getRandomValidDirection() {
    const directions = [Directions.U, Directions.D, Directions.L, Directions.R];
    const validDirs = directions.filter((dir) => this._isValidMove(dir));

    if (validDirs.length === 0) {
      return null;
    }

    return validDirs[Math.floor(Math.random() * validDirs.length)];
  }

  /**
   * @brief Get opposite direction
   * @private
   * @param {string} direction - Input direction
   * @returns {string} Opposite direction
   */
  _getOppositeDirection(direction) {
    switch (direction) {
      case Directions.U:
        return Directions.D;
      case Directions.D:
        return Directions.U;
      case Directions.L:
        return Directions.R;
      case Directions.R:
        return Directions.L;
      default:
        return Directions.U;
    }
  }
}

module.exports = Bot;
