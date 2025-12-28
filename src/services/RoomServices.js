/** @format */

const { randomUUID } = require("crypto");
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
	 * @details Initializes the service with empty room and user-room mappings
	 */
	constructor(maxPlayersPerRoom = 10) {
		this.rooms = new Map();
		this.userRoomMap = new Map();
		this.maxPlayersPerRoom = maxPlayersPerRoom;
	}

	// ------------------ Room Management ------------------

	/**
	 * @brief Create a new room with a unique UUID
	 * @returns {Room} The newly created room
	 */
	createRoom() {
		const roomId = randomUUID();
		const room = new Room(roomId);
		this.rooms.set(roomId, room);
		console.log(`🏠 Created new room: ${roomId}`);
		return room;
	}

	/**
	 * @brief Delete a room and clean up all references
	 * @param {string} roomId - The ID of the room to delete
	 * @returns {boolean} True if room was deleted, false if not found
	 */
	deleteRoom(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) {
			return false;
		}

		// Remove all players from userRoomMap
		room.players.forEach((player) => {
			this.userRoomMap.delete(player.id);
		});

		// Delete the room
		this.rooms.delete(roomId);
		console.log(`🗑️ Deleted room: ${roomId}`);
		return true;
	}

	/**
	 * @brief Get an available room with space for a new player
	 * @details Finds first room with space for a human player (fewer than max humans,
	 * or has bots that can be removed to make space). Creates new room only when all
	 * existing rooms are full of humans.
	 * @returns {Room} A room with available space for a human
	 */
	getAvailableRoom() {
		// Find first room that can fit a human player
		// A room can fit a human if it has fewer than max HUMANS (bots can be removed)
		for (const [roomId, room] of this.rooms) {
			if (room.getHumanCount() < this.maxPlayersPerRoom) {
				return room;
			}
		}
		// All rooms are full of humans, create new one
		return this.createRoom();
	}

	/**
	 * @brief Get all rooms that have human players
	 * @returns {Room[]} Array of rooms with at least one human player
	 */
	getRoomsWithHumans() {
		const roomsWithHumans = [];
		for (const [roomId, room] of this.rooms) {
			if (room.hasHumanPlayers()) {
				roomsWithHumans.push(room);
			}
		}
		return roomsWithHumans;
	}

	/**
	 * @brief Get all active rooms
	 * @returns {Room[]} Array of all rooms
	 */
	getAllRooms() {
		return Array.from(this.rooms.values());
	}

	/**
	 * @brief Get a random room for viewers
	 * @returns {Room|null} A random room, or null if no rooms exist
	 */
	getRandomRoom() {
		const allRooms = this.getAllRooms();
		if (allRooms.length === 0) {
			return null;
		}
		const randomIndex = Math.floor(Math.random() * allRooms.length);
		return allRooms[randomIndex];
	}

	/**
	 * @brief Get room count
	 * @returns {number} Number of active rooms
	 */
	getRoomCount() {
		return this.rooms.size;
	}

	// ------------------ Player Management ------------------

	/**
	 * @brief Add a player to a room (auto-finds available room if not specified)
	 * @param {string} userName - The username of the player joining
	 * @param {string} playerId - The unique ID of the player (typically socket ID)
	 * @param {string} [roomId] - Optional specific room ID to join
	 * @returns {{player: Player, roomId: string}|null} The player and room ID, or null on failure
	 */
	playerJoinRoom(userName, playerId, roomId = null) {
		if (this.isPlayerInRoom(playerId)) {
			return null;
		}

		let room;
		if (roomId) {
			room = this.rooms.get(roomId);
			if (!room || room.getPlayerCount() >= this.maxPlayersPerRoom) {
				return null;
			}
		} else {
			room = this.getAvailableRoom();
		}

		const player = room.addNewPlayer(userName, playerId);
		this.userRoomMap.set(playerId, room.roomId);
		
		console.log(`👤 Player ${userName} joined room ${room.roomId} (${room.getPlayerCount()}/${this.maxPlayersPerRoom} players)`);
		
		return { player, roomId: room.roomId };
	}

	/**
	 * @brief Remove a player from their current room
	 * @param {string} playerId - The unique ID of the player to remove
	 * @returns {{removed: boolean, roomId: string, roomDeleted: boolean}} Result details
	 */
	playerLeaveRoom(playerId) {
		if (!this.isPlayerInRoom(playerId)) {
			return { removed: false, roomId: null, roomDeleted: false };
		}

		const roomId = this.userRoomMap.get(playerId);
		const room = this.rooms.get(roomId);

		if (room) {
			// Remove player from room's players array
			room.players = room.players.filter((player) => player.id !== playerId);
		}

		// Remove from userRoomMap
		this.userRoomMap.delete(playerId);

		console.log(`👋 Player left room ${roomId} (${room ? room.getPlayerCount() : 0} players remaining)`);

		return { removed: true, roomId, roomDeleted: false };
	}

	/**
	 * @brief Check if a room should be deleted (only bots or empty)
	 * @param {string} roomId - The room ID to check
	 * @returns {boolean} True if room should be deleted
	 */
	shouldDeleteRoom(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return false;
		return room.isOnlyBots();
	}

	/**
	 * @brief Handle a player movement request
	 * @param {string} playerId - The unique ID of the player attempting to move
	 * @param {Directions} direction - The direction the player wants to move
	 * @returns {boolean} True if the move was successful, false if move was invalid or player not found
	 */
	playerMove(playerId, direction) {
		const roomId = this.userRoomMap.get(playerId);
		if (!roomId) {
			return false;
		}

		const room = this.rooms.get(roomId);
		const player = room.getPlayerById(playerId);

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
		const roomId = this.userRoomMap.get(playerId);
		if (!roomId) {
			return null;
		}

		const room = this.rooms.get(roomId);
		const player = room.getPlayerById(playerId);

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
		const roomId = this.userRoomMap.get(playerId);
		if (!roomId) {
			return null;
		}

		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		return room.getPlayerById(playerId);
	}

	/**
	 * @brief Get a player object by their username within a specific room
	 * @param {string} userName - The username of the player to retrieve
	 * @param {string} roomId - The ID of the room to search in
	 * @returns {Player|null} The player object if found, null otherwise
	 */
	getPlayerByUsername(userName, roomId) {
		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}
		return room.getPlayerByUsername(userName);
	}

	/**
	 * @brief Check if username exists in a specific room
	 * @param {string} userName - The username to check
	 * @param {string} roomId - The room ID to check in
	 * @returns {boolean} True if username exists in the room
	 */
	isUsernameTakenInRoom(userName, roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return false;
		return room.players.some(
			(p) => p.userName.toLowerCase() === userName.toLowerCase()
		);
	}
}

module.exports = RoomService;