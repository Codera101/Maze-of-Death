/** @format */

const Player = require("./Player");
const Directions = require("./Direction");
const Maze = require("./Maze");

class Room {
	constructor() {
		this._height = 16;
		this._width = 16;
		this._maze = new Maze(this._height, this._width);
		this._players = [];
		this._viewers = [];
		this._shootDamage = 5;
		this._respawnTime = 3000; // in ms
		this._shootGainPoints = 5;
		this._reloadTime = 500; // in ms
		this._initPlayerHealth = 5;
		this._initBulltesNumber = 5;
		this._shootSpeed = 400; // in ms;
		this._moveSpeed = 400; // in ms;
	}

	// ------------------ Getters / Setters ------------------

	get height() {
		return this._height;
	}

	set height(h) {
		this._height = h;
	}

	get width() {
		return this._width;
	}

	set width(w) {
		this._width = w;
	}

	get maze() {
		return this._maze;
	}

	set maze(m) {
		this._maze = m;
	}

	get players() {
		return this._players;
	}

	set players(p) {
		this._players = p;
	}

	get viewers() {
		return this._viewers;
	}

	set viewers(v) {
		this._viewers = v;
	}

	get shootDamage() {
		return this._shootDamage;
	}

	set shootDamage(d) {
		this._shootDamage = d;
	}

	get respawnTime() {
		return this._respawnTime;
	}

	set respawnTime(t) {
		this._respawnTime = t;
	}

	get shootGainPoints() {
		return this._shootGainPoints;
	}

	set shootGainPoints(p) {
		this._shootGainPoints = p;
	}

	get reloadTime() {
		return this._reloadTime;
	}

	set reloadTime(r) {
		this._reloadTime = r;
	}

	get initPlayerHealth() {
		return this._initPlayerHealth;
	}

	set initPlayerHealth(h) {
		this._initPlayerHealth = h;
	}

	get initBulltesNumber() {
		return this._initBulltesNumber;
	}

	set initBulltesNumber(n) {
		this._initBulltesNumber = n;
	}

	get shootSpeed() {
		return this._shootSpeed;
	}

	set shootSpeed(s) {
		this._shootSpeed = s;
	}

	get moveSpeed() {
		return this._moveSpeed;
	}

	set moveSpeed(s) {
		this._moveSpeed = s;
	}

	// Compatibility helper methods (used elsewhere in the codebase)

	getInitHealth() {
		return this.initPlayerHealth;
	}

	getInitBulltes() {
		return this.initBulltesNumber;
	}

	getRoomDamage() {
		return this.shootDamage;
	}

	getScorePerHit() {
		return this.shootGainPoints;
	}

	genrateValidPotion(){
		let emptyCells = this._maze.getEmptyCells();
		let cellsOf2ndLvlPriority = [];
		let cellsOf1stLvlPriority = [];
		let poschng = [[1, 0], [-1, 0], [0, 1], [0, -1]];
		for(let cellInx = 0; cellInx < emptyCells.length; cellInx++){
			let countBadPos = 0;
			poschng.forEach((changeP) => {
				let newX = emptyCells[cellInx][0] + changeP[0];
				let newY = emptyCells[cellInx][1] + changeP[1];
				countBadPos += this.checkPlayerOnPosition({x : newX, y : newY});
			});
			if(!this.checkPlayerOnPosition({x : emptyCells[cellInx][0], y :  emptyCells[cellInx][1]})){
				cellsOf2ndLvlPriority.push(emptyCells[cellInx]);
			}
			if(countBadPos === 0){
				cellsOf1stLvlPriority.push(emptyCells[cellInx]);
			}
		}
		function getRandom(l, r) {
			return Math.floor(Math.random() * (r - l + 1)) + l;
		}

		if(cellsOf1stLvlPriority.length > 0){
			let p = cellsOf1stLvlPriority[getRandom(0, cellsOf1stLvlPriority.length - 1)];
			return {x : p[0], y : [1]};
		}else if(cellsOf2ndLvlPriority.length > 0){
			let p = cellsOf2ndLvlPriority[getRandom(0, cellsOf2ndLvlPriority.length - 1)];
			return {x : p[0], y : [1]};
		}else{
			return {x : -1, y : -1};
		}
	}

	addNewPlayer(userName, socketId){
		let position = this.genrateValidPotion();
		let newPlayer = new Player(position.x, position.y, this, userName, socketId);
		this._players.push(newPlayer);
		return newPlayer;
	}
	
	/**
	 * @brief check if there is a player on the given position
	 * @param {{number,number}} position
	 * @returns {boolean} true if there is a player on the position, false otherwise
	 */
	checkPlayerOnPosition(position) {
		for(let player_inx = 0; player_inx < this.players().length; player_inx++){
			if(this._players[player_inx].getPosition() === position) {
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
		for(let player_inx = 0; player_inx < this.players().length; player_inx++){
			if(this._players[player_inx].getPosition() === position) {
				return this._players[player_inx];
			}
		}
		return null;
	}

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
		player.setPosition(nextPos);
		return true;
	}
}


module.exports = Room;
