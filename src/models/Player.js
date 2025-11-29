/** @format */

//import Directions, { getNextPosition } from "./Direction.js";
const Directions = require("./Direction.js");

class Player {
	constructor(x, y, room, userName, id) {
		this._id = id;
		this._x = x;
		this._y = y;
		this._room = room;
		this._userName = userName;
		this._direction = Directions.U;
		this._health = room ? room.getInitHealth() : 0;
		this._score = 0;
		this._killCount = 0;
		this._bullets = room ? room.getInitBulltes() : 0;
		this._timeOfLastMove = 0;
		this._timeOfLastShoot = 0;
	}

	// ------------------ Getters / Setters ------------------
	get id() {
		return this._id;
	}

	set id(newId) {
		this._id = newId;
	}

	get x() {
		return this._x;
	}

	set x(val) {
		this._x = val;
	}

	get y() {
		return this._y;
	}

	set y(val) {
		this._y = val;
	}

	get room() {
		return this._room;
	}

	set room(r) {
		this._room = r;
	}

	get userName() {
		return this._userName;
	}

	set userName(name) {
		this._userName = name;
	}

	get direction() {
		return this._direction;
	}

	set direction(d) {
		this._direction = d;
	}

	get health() {
		return this._health;
	}

	set health(h) {
		this._health = h;
	}

	get score() {
		return this._score;
	}

	set score(s) {
		this._score = s;
	}

	get killCount() {
		return this._killCount;
	}

	set killCount(k) {
		this._killCount = k;
	}

	get bullets() {
		return this._bullets;
	}

	set bullets(b) {
		this._bullets = b;
	}

	get timeOfLastMove() {
		return this._timeOfLastMove;
	}

	set timeOfLastMove(t) {
		this._timeOfLastMove = t;
	}

	get timeOfLastShoot() {
		return this._timeOfLastShoot;
	}

	set timeOfLastShoot(t) {
		this._timeOfLastShoot = t;
	}
	/**
		@brief reset player data to be respawn again
		@param {number, number} x, y 
	*/
	resetPlayerDataForRespawn(x, y) {
		this._bullets = this.room.getInitBulltes();
		this._health = this.room.getInitHealth();
		(this._x = x), (this._y = y);
		this._direction = Directions.U;
		this.timeOfLastMove = 0;
		this.timeOfLastShoot = 0;
	}

	/** 
		@brief update the last time of Move (helps in Move speed).
	*/
	updateTimeOfLastMove() {
		this._timeOfLastMove = Date.now();
	}

	/** 
		@brief update the last time of Shoot (helps in Shoot speed).
	*/
	updateTimeOfLastShoot() {
		this._timeOfLastShoot = Date.now();
	}

	/**
		@brief check if player can shoot according to the last time they moved (move speed) and their number of bullets
		@returns {bool} 1 - if can, 0 if not.
	*/
	canShoot() {
		return (
			Date.now() - this.timeOfLastShoot >= this.room.getShootSpeed() &&
			this.bullets > 0
		);
	}

	/**
		@brief check if player can move according to the last time they moved (move speed)
		@returns {bool} 1 - if can, 0 if not.
	*/
	canMove() {
		return Date.now() - this.timeOfLastMove >= this.room.getMoveSpeed();
	}

	/**
	  @brief Apply damage to the player (reducing health)
	  @param {number} amount - The amount of damage to apply
	 */
	recieveDamage(amount) {
		this._health = Math.max(0, this.health - amount);
	}

	/**
	 * @brief Get the current position of the player
	 * @returns {{x: number, y: number}} The current (x, y) position of the player
	 */
	getPosition() {
		return { x: this.x, y: this.y };
	}

	/**
	 * @brief Set the player's position
	 * @param {{x: number, y: number}} pos - The new position of the player
	 */
	setPosition(pos) {
		this._x = pos.x;
		this._y = pos.y;
	}

	/**
    @brief Get the current direction the player is facing
    @returns {Direction} The current direction the player is facing
   */
	getDirection() {
		return this.direction;
	}

	/**
	 * @brief Update the player's score by a given amount
	 * @param {number} amount - The amount to add (or subtract) from the score
	 */
	updateScore(amount) {
		this.score = this.score + amount;
	}

	/**
	 * @brief Make the player shoot in the current direction
	 * just update the bullets and other stuff
	 */
	shoot() {
		if (this.bullets > 0) {
			this._bullets -= 1;
			this.updateTimeOfLastShoot();
			const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
			async function reloadBullets(){
				await sleep(this.room.reloadTime);
				this._bullets += 1;
			} 
			reloadBullets();
		}
	}
}

module.exports = Player;
