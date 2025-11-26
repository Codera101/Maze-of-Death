/** @format */

import Directions from "./Direction.js";
class Player {
	constructor() {}

	/**
	  @brief Apply damage to the player (reducing health)
	  @param {number} amount - The amount of damage to apply
	 */
	recieveDamage(amount) {}

	/**
	 * @brief Get the current position of the player
	 * @returns {{x: number, y: number}} The current (x, y) position of the player
	 */
	getPosition() {}

	/**
    @brief Get the current direction the player is facing
    @returns {Direction} The current direction the player is facing
   */
	getDirection() {}

	/**
	 * @brief Update the player's score by a given amount
	 * @param {number} amount - The amount to add (or subtract) from the score
	 */
	updateScore(amount) {}

	/**
	 * @brief Move the player in a given direction
	 * @param {Direction} direction - The direction to move the player
	 */
	move(direction) {}

	/**
	 * @brief Make the player shoot in the current direction
	 * just update the bullets and other stuff
	 */
	shoot() {}

	/**
	 * @brief Check if the player can shoot
	 * @returns {boolean} True if the player can shoot, false otherwise
	 */
	canShoot() {}
}
