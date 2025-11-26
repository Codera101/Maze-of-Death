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
	 * @returns {boolean} true if there is a player on the position, false otherwise
	 */
	checkPlayerOnPosition(position) {}

	/**   * @brief get the player on the given position
	 * @param {{number,number}} position
	 * @returns {Player | null} the player on the position or null if there is no player
	 */
	getPlayerOnPosition(position) {}

	// TODO : islam should implement these methods

  handlePlayerShoot(player) {
		if (!player.canShoot()) {
			return false;
		}
		pos = player.getPosition();
		while (true) {
			let nextPos = getNextPosition(pos, player.getDirection());
			if (
				this.maze.isObstacleCell(nextPos.x, nextPos.y) ||
				!this.maze.isValidPosition(nextPos.x, nextPos.y)
			) {
				break;
			}
			let targetPlayer = this.getPlayerOnPosition(nextPos);
			if (targetPlayer) {
				targetPlayer.recieveDamage(this.getRoomDamage()); // example damage value
				player.updateScore(this.getScorePerHit()); // example score value
				break;
			}
			pos = nextPos;
		}
    return true;
	}

	/**
	 * @brief Handle player movement within the room
	 * @param {Player} player - The player to move
	 * @param {Directions} direction - The direction to move the player
	 * @returns {boolean} True if the move was successful, false otherwise
	 */
	handlePlayerMove(player, direction) {
		let pos = player.getPosition();
		let nextPos = getNextPosition(pos, direction);
		if (
			this.maze.isObstacleCell(nextPos.x, nextPos.y) ||
			this.checkPlayerOnPosition(nextPos)
		) {
			return false;
		}
		player.move(direction);
		return true;
	}
}
