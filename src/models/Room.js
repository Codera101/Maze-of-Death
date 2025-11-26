/** @format */

const Player = require("./Player");
const Directions = require("./Direction");
class Room {
	constructor() {
		this.maze = [];
	}

  /**
   * @brief check if there is a player on the given position
   * @param {{number,number}} position 
   */
  checkPlayerOnPosition(position) {}


  // TODO : islam should implement these methods
	handlePlayerShoot() {}

	/**
	 * @brief Handle player movement within the room
	 * @param {Player} player - The player to move
	 * @param {Directions} direction - The direction to move the player
   * @returns {boolean} True if the move was successful, false otherwise
	 */
	handlePlayerMove(player, direction) {
		let pos = player.getPosition();
		let nextPos = getNextPosition(pos, direction);
		if (this.maze.isObstacleCell(nextPos.x, nextPos.y) || this.checkPlayerOnPosition(nextPos)) {
			return false;
		}
		player.move(direction);
		return true;
	}
}
