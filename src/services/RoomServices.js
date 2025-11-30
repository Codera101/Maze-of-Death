/** @format */

// const { randomUUID } = require("crypto");
const Room = require("../models/Room");

/**
 * @class RoomService
 * @brief Service layer for managing game rooms and player interactions
 * @details Handles room creation, player management, and coordinates game actions
 * across multiple rooms. Maintains mappings between players and rooms.
 */
class RoomService {
	/**
	 * @brief Constructor for the RoomService
	 * @details Initializes the service with empty room and user-room mappings,
	 * and creates a default "global" room
	 */
	constructor() {
		this.rooms = new Map();
		this.userRoomMap = new Map();
		this.rooms.set("global", new Room());
	}

	/**
	 * @brief Add a player to a room
	 * @param {string} userName - The username of the player joining
	 * @param {string} playerId - The unique ID of the player (typically socket ID)
	 * @param {string} [roomId="global"] - The ID of the room to join (defaults to "global")
	 * @returns {Player|null} The created player object if successful, null if player already in a room or room not found
	 */
	playerJoinRoom(userName, playerId, roomId = "global") {
		if (this.isPlayerInRoom(playerId)) {
			return null;
		}

		let room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		let player = room.addNewPlayer(userName, playerId);
		this.userRoomMap.set(playerId, roomId);
		return player;
	}

	/**
	 * @brief Remove a player from their current room
	 * @param {string} playerId - The unique ID of the player to remove
	 * @returns {boolean} True if player was successfully removed, false if player was not in any room
	 */
	playerLeaveRoom(playerId) {
		if (!this.isPlayerInRoom(playerId)) {
			return false;
		}

		let roomId = this.userRoomMap.get(playerId);
		let room = this.rooms.get(roomId);

		if (room) {
			// Remove player from room's players array
			room.players = room.players.filter(player => player.id !== playerId);
		}

		// Remove from userRoomMap
		this.userRoomMap.delete(playerId);
		return true;
	}

	/**
	 * @brief Handle a player movement request
	 * @param {string} playerId - The unique ID of the player attempting to move
	 * @param {Directions} direction - The direction the player wants to move
	 * @returns {boolean} True if the move was successful, false if move was invalid or player not found
	 */
	playerMove(playerId, direction) {
		let roomId = this.userRoomMap.get(playerId);
		if (!roomId) {
			return false;
		}

		let room = this.rooms.get(roomId);
		let player = room.getPlayerById(playerId);

		if (!player) {
			return false;
		}

		return room.handlePlayerMove(player, direction);
	}

	/**
	 * @brief Handle a player shoot request
	 * @param {string} playerId - The unique ID of the player attempting to shoot
	 * @returns {ActionMessage|null} Action message describing the result of the shot, or null if player not found
	 */
	playerShoot(playerId) {
		let roomId = this.userRoomMap.get(playerId);
		if (!roomId) {
			return null;
		}

		let room = this.rooms.get(roomId);
		let player = room.getPlayerById(playerId);

		if (!player) {
			return null;
		}

		return room.handlePlayerShoot(player);
	}

	/**
	 * @brief Get the room ID that a player is currently in
	 * @param {string} playerId - The unique ID of the player
	 * @returns {string|undefined} The room ID if player is in a room, undefined otherwise
	 */
	getPlayerRoom(playerId) {
		return this.userRoomMap.get(playerId);
	}

	/**
	 * @brief Check if a player is currently in any room
	 * @param {string} playerId - The unique ID of the player to check
	 * @returns {boolean} True if player is in a room, false otherwise
	 */
	isPlayerInRoom(playerId) {
		return this.userRoomMap.has(playerId);
	}

	/**
	 * @brief Get a room by its ID
	 * @param {string} roomId - The ID of the room to retrieve
	 * @returns {Room|undefined} The room object if found, undefined otherwise
	 */
	getRoom(roomId) {
		return this.rooms.get(roomId);
	}

	/**
	 * @brief Get a player object by their ID
	 * @param {string} playerId - The unique ID of the player to retrieve
	 * @returns {Player|null} The player object if found, null if player not in any room or room not found
	 */
	getPlayer(playerId) {
		let roomId = this.userRoomMap.get(playerId);
		if (!roomId) {
			return null;
		}

		let room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		return room.getPlayerById(playerId);
	}

	/**
	 * @brief Get a player object by their username
	 * @param {string} userName - The username of the player to retrieve
	 * @param {string} [roomId="global"] - The ID of the room to search in (defaults to "global")
	 * @returns {Player|null} The player object if found, null if player not in the room or room not found
	 */
	getPlayerByUsername(userName, roomId = "global") {
		let room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		return room.getPlayerByUsername(userName);
	}
}

module.exports = RoomService;