/** @format */

const Player = require("./Player");
const { Directions, getNextPosition } = require("./Direction");
const Maze = require("./Maze");
const {
  ActionMessage,
  ActionMessageTypes,
  createActionMessage,
} = require("./Messages");

/**
 * @class Room
 * @brief Represents a game room containing the maze, players, and game logic
 */
class Room {
	/**
	 * @brief Constructor for the Room class
	 * @details Initializes a room with default dimensions (16x16), creates a maze,
	 * and sets up game parameters like damage, speed, and respawn settings
	 */
	constructor() {
		this._height = 15;
		this._width = 15;
		this._maze = new Maze(this._height, this._width);
		this._players = [];
		this._viewers = [];
		this._shootDamage = 5;
		this._respawnTime = 3000; // in ms
		this._shootGainPoints = 5;
		this._reloadTime = 1000; // in ms
		this._initPlayerHealth = 25;
		this._initBulltesNumber = 5;
		this._shootSpeed = 400; // in ms;
		this._moveSpeed = 250; // in ms;
		this._colorsPalet = [
				"#FF0000", // Electric Red
				"#FF6600", // Safety Orange
				"#FFFF00", // Sun Yellow
				"#00FF00", // Lime Green
				"#007FFF", // Cerulean Blue
				"#FF00FF", // Fuchsia/Magenta
				"#FF1493", // Hot Pink
				"#00FFFF", // Aqua/Cyan
				"#6600FF", // Electric Purple
				"#FFD700", // Bright Gold
				"#00FF7F", // Spring Green
				"#00BFFF",  // Deep Sky Blue
				"#FF4500",  // Orange Red
				"#8A2BE2",  // Blue Violet
				"#FF69B4",  // Hot Pink
				"#7FFF00",  // Chartreuse
				];
	}

	// ------------------ Getters / Setters ------------------

	/**
	 * @brief Get the height of the room
	 * @returns {number} The height of the maze in cells
	 */
	get height() {
		return this._height;
	}

	/**
	 * @brief Set the height of the room
	 * @param {number} h - The new height for the maze
	 */
	set height(h) {
		this._height = h;
	}

	/**
	 * @brief Get the width of the room
	 * @returns {number} The width of the maze in cells
	 */
	get width() {
		return this._width;
	}

	/**
	 * @brief Set the width of the room
	 * @param {number} w - The new width for the maze
	 */
	set width(w) {
		this._width = w;
	}

	/**
	 * @brief Get the maze instance
	 * @returns {Maze} The maze object for this room
	 */
	get maze() {
		return this._maze;
	}

	/**
	 * @brief Set the maze instance
	 * @param {Maze} m - The new maze object
	 */
	set maze(m) {
		this._maze = m;
	}

	/**
	 * @brief Get the array of players in the room
	 * @returns {Player[]} Array of all active players
	 */
	get players() {
		return this._players;
	}

	/**
	 * @brief Set the array of players
	 * @param {Player[]} p - New array of players
	 */
	set players(p) {
		this._players = p;
	}

	/**
	 * @brief Get the array of viewers (spectators)
	 * @returns {Array} Array of viewers watching the room
	 */
	get viewers() {
		return this._viewers;
	}

	/**
	 * @brief Set the array of viewers
	 * @param {Array} v - New array of viewers
	 */
	set viewers(v) {
		this._viewers = v;
	}

	/**
	 * @brief Get the damage dealt by a shot
	 * @returns {number} The amount of damage per shot
	 */
	get shootDamage() {
		return this._shootDamage;
	}

	/**
	 * @brief Set the damage dealt by a shot
	 * @param {number} d - The new damage value
	 */
	set shootDamage(d) {
		this._shootDamage = d;
	}

	/**
	 * @brief Get the respawn time for players
	 * @returns {number} Respawn time in milliseconds
	 */
	get respawnTime() {
		return this._respawnTime;
	}

	/**
	 * @brief Set the respawn time for players
	 * @param {number} t - The new respawn time in milliseconds
	 */
	set respawnTime(t) {
		this._respawnTime = t;
	}

	/**
	 * @brief Get the points gained per successful hit
	 * @returns {number} Points awarded for hitting another player
	 */
	get shootGainPoints() {
		return this._shootGainPoints;
	}

	/**
	 * @brief Set the points gained per successful hit
	 * @param {number} p - The new points value
	 */
	set shootGainPoints(p) {
		this._shootGainPoints = p;
	}

	/**
	 * @brief Get the reload time between shots
	 * @returns {number} Reload time in milliseconds
	 */
	get reloadTime() {
		return this._reloadTime;
	}

	/**
	 * @brief Set the reload time between shots
	 * @param {number} r - The new reload time in milliseconds
	 */
	set reloadTime(r) {
		this._reloadTime = r;
	}

	/**
	 * @brief Get the initial health for new players
	 * @returns {number} The starting health value
	 */
	get initPlayerHealth() {
		return this._initPlayerHealth;
	}

	/**
	 * @brief Set the initial health for new players
	 * @param {number} h - The new initial health value
	 */
	set initPlayerHealth(h) {
		this._initPlayerHealth = h;
	}

	/**
	 * @brief Get the initial number of bullets for new players
	 * @returns {number} The starting bullet count
	 */
	get initBulltesNumber() {
		return this._initBulltesNumber;
	}

	/**
	 * @brief Set the initial number of bullets for new players
	 * @param {number} n - The new initial bullet count
	 */
	set initBulltesNumber(n) {
		this._initBulltesNumber = n;
	}

	/**
	 * @brief Get the minimum time between consecutive shots
	 * @returns {number} Shoot speed cooldown in milliseconds
	 */
	get shootSpeed() {
		return this._shootSpeed;
	}

	/**
	 * @brief Set the minimum time between consecutive shots
	 * @param {number} s - The new shoot speed cooldown in milliseconds
	 */
	set shootSpeed(s) {
		this._shootSpeed = s;
	}

	/**
	 * @brief Get the minimum time between consecutive moves
	 * @returns {number} Move speed cooldown in milliseconds
	 */
	get moveSpeed() {
		return this._moveSpeed;
	}

	/**
	 * @brief Set the minimum time between consecutive moves
	 * @param {number} s - The new move speed cooldown in milliseconds
	 */
	set moveSpeed(s) {
		this._moveSpeed = s;
	}

	// Compatibility helper methods (used elsewhere in the codebase)

	/**
	 * @brief Get the initial health for players (compatibility method)
	 * @returns {number} The initial health value
	 */
	getInitHealth() {
		return this.initPlayerHealth;
	}

	/**
	 * @brief Get the initial bullet count for players (compatibility method)
	 * @returns {number} The initial bullet count
	 */
	getInitBulltes() {
		return this.initBulltesNumber;
	}

	/**
	 * @brief Get the damage value per shot (compatibility method)
	 * @returns {number} The shoot damage value
	 */
	getRoomDamage() {
		return this.shootDamage;
	}

	/**
	 * @brief Get the score points awarded per hit (compatibility method)
	 * @returns {number} Points awarded per successful hit
	 */
	getScorePerHit() {
		return this.shootGainPoints;
	}

	/**
	 * @brief Get the move speed for players (compatibility method)
	 * @returns {number} The move speed cooldown in milliseconds
	 */
	getMoveSpeed() {
		return this.moveSpeed;
	}

	/**
	 * @brief Get the shoot speed for players (compatibility method)
	 * @returns {number} The shoot speed cooldown in milliseconds
	 */
	getShootSpeed() {
		return this.shootSpeed;
	}

	/**
	 * @brief Generate a valid position for a new player or respawn
	 * @details Uses a priority system to find the best spawn location:
	 * - 1st priority: empty cells with no adjacent players
	 * - 2nd priority: empty cells with no player on the cell itself
	 * - Fallback: returns {x: -1, y: -1} if no valid position found
	 * @returns {{x: number, y: number}} A valid position object with x and y coordinates
	 */
	generateValidPosition() {
		let emptyCells = this._maze.getEmptyCells();
		let cellsOf2ndLvlPriority = [];
		let cellsOf1stLvlPriority = [];
		let poschng = [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		];
		for (let cellInx = 0; cellInx < emptyCells.length; cellInx++) {
			let countBadPos = 0;
			poschng.forEach((changeP) => {
				let newX = emptyCells[cellInx][0] + changeP[0];
				let newY = emptyCells[cellInx][1] + changeP[1];
				countBadPos += this.checkPlayerOnPosition({ x: newX, y: newY });
			});
			if (
				!this.checkPlayerOnPosition({
					x: emptyCells[cellInx][0],
					y: emptyCells[cellInx][1],
				})
			) {
				cellsOf2ndLvlPriority.push(emptyCells[cellInx]);
			}
			if (countBadPos === 0) {
				cellsOf1stLvlPriority.push(emptyCells[cellInx]);
			}
		}
		function getRandom(l, r) {
			return Math.floor(Math.random() * (r - l + 1)) + l;
		}

		if (cellsOf1stLvlPriority.length > 0) {
			let p =
				cellsOf1stLvlPriority[getRandom(0, cellsOf1stLvlPriority.length - 1)];
			return { x: p[0], y: p[1] };
		} else if (cellsOf2ndLvlPriority.length > 0) {
			let p =
				cellsOf2ndLvlPriority[getRandom(0, cellsOf2ndLvlPriority.length - 1)];
			return { x: p[0], y: p[1] };
		} else {
			return { x: -1, y: -1 };
		}
	}
	getNewColor(){
		let color = this._colorsPalet[0];
		this._colorsPalet.shift();
		this._colorsPalet.push(color);
		return color;
	}
	/**
	 * @brief Add a new player to the room
	 * @param {string} userName - The username of the new player
	 * @param {string} socketId - The socket ID of the player's connection
	 * @returns {Player} The newly created player object
	 */
	addNewPlayer(userName, socketId) {
		let position = this.generateValidPosition();
		let newPlayer = new Player(
			position.x,
			position.y,
			this,
			userName,
			socketId
		);
		this._players.push(newPlayer);
		return newPlayer;
	}

	/**
	 * @brief Add a new player to the room
	 * @param {{number,number}} position - The position of the new player
	 * @param {string} userName - The username of the new player
	 * @param {string} socketId - The socket ID of the player's connection
	 * @returns {Player} The newly created player object
	 * @note it is used for testing purposes
	 */
	addNewPlayerOnPosition(position, userName, socketId) {
		let newPlayer = new Player(
			position.x,
			position.y,
			this,
			userName,
			socketId
		);
		this._players.push(newPlayer);
		return newPlayer;
	}

	/**
	 * @brief Get a player by their ID
	 * @param {string} id - The ID of the player to retrieve
	 * @returns {Player | null} The player object if found, null otherwise
	 */
	getPlayerById(id) {
		return this._players.find((player) => player.id === id);
	}

	/**
	 * @brief Get a player by their username
	 * @param {string} userName - The username of the player to retrieve
	 * @returns {Player | null} The player object if found, null otherwise
	 */
	getPlayerByUsername(userName) {
		return this._players.find((player) => player.userName === userName) || null;
	}

	/**
	 * @brief check if there is a player on the given position
	 * @param {{number,number}} position
	 * @returns {boolean} true if there is a player on the position, false otherwise
	 */
	checkPlayerOnPosition(position) {
		for (let player_inx = 0; player_inx < this.players.length; player_inx++) {
			const playerPos = this._players[player_inx].getPosition();
			if (playerPos.x === position.x && playerPos.y === position.y && this._players[player_inx].health > 0) {
				return 1;
			}
		}
		return 0;
	}

	/**
	 * @brief get the player on the given position
	 * @param {{number,number}} position
	 * @returns {Player | null} the player on the position or null if there is no player
	 */
	getPlayerOnPosition(position) {
		for (let player_inx = 0; player_inx < this.players.length; player_inx++) {
			const playerPos = this._players[player_inx].getPosition();
			if (this._players[player_inx].health <= 0) continue;
			if (playerPos.x === position.x && playerPos.y === position.y) {
				return this._players[player_inx];
			}
		}
		return null;
	}

	/**
	 * @brief Handle a player shooting action
	 * @details Processes the shoot action by:
	 * - Checking if the player can shoot (has bullets and cooldown expired)
	 * - Tracing the bullet path in the player's direction
	 * - Detecting if another player is hit
	 * - Applying damage and updating scores
	 * - Creating appropriate action messages (KILL, HIT, NOTHING, or INVALID)
	 * @param {Player} player - The player attempting to shoot
	 * @returns {ActionMessage} Message indicating the result of the shoot action
	 */
	handlePlayerShoot(player) {
		if (!player.canShoot()) {
			return createActionMessage(
				ActionMessageTypes.INVALID,
				player.id,
				"",
				player.direction
			);
		}
		player.shoot();
		let pos = player.getPosition();
		while (true) {
			let nextPos = getNextPosition(pos, player.direction);
			if (!this.maze.isValidForPlayer(nextPos.x, nextPos.y)) {
				break;
			}
			let targetPlayer = this.getPlayerOnPosition(nextPos);
			if (targetPlayer) {
				targetPlayer.recieveDamage(this.getRoomDamage());
				player.updateScore(this.getScorePerHit());
				if (targetPlayer.health <= 0) {
					player.increaseKills();
					return createActionMessage(
						ActionMessageTypes.KILL,
						player.id,
						targetPlayer.id,
						player.direction
					);
				} else {
					return createActionMessage(
						ActionMessageTypes.HIT,
						player.id,
						targetPlayer.id,
						player.direction
					);
				}
			}
			pos = nextPos;
		}
		return createActionMessage(
			ActionMessageTypes.NOTHING,
			player.id,
			"",
			player.direction
		);
	}

	/**
	 * @brief Handle player movement within the room
	 * @param {Player} player - The player to move
	 * @param {Directions} direction - The direction to move the player
	 * @returns {boolean} True if the move was successful, false otherwise
	 */
	handlePlayerMove(player, direction) {
		if (player.direction != direction) {
			// Just change facing direction without moving
			player.direction = direction;
			return true;
		}
		
		if (!player.canMove()) {
			// console.log("Player cannot move yet (cooldown)");
			return false;
		}
		
		let pos = player.getPosition();
		let nextPos = getNextPosition(pos, direction);
		
		if (!this.maze.isValidForPlayer(nextPos.x, nextPos.y)) {
			// console.log("Invalid move: position not valid for player");
			return false;
		}
		// check if there is a player on the next position
		if (this.checkPlayerOnPosition(nextPos)) {
			// console.log("Invalid move: another player is on the target position");
			return false;
		}

		player.setPosition(nextPos);
		player.direction = direction; // Update facing direction
		player.updateTimeOfLastMove(); // Update movement cooldown
		return true;
	}
}

module.exports = Room;
