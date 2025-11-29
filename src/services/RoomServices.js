/** @format */

// const { randomUUID } = require("crypto");
const { Room } = require("../models/Room");

class RoomService {
	constructor() {
		this.rooms = new Map();
		this.userRoomMap = new Map();
		this.rooms.set("global", new Room());
	}

	playerJoinRoom(playerId, roomId = "global") {
		if (this.isPlayerInRoom(playerId)) {
			return false;
		}

		let room = this.rooms.get(roomId);
		if (!room) {
			return false;
		}

		room.addPlayer(playerId);
		this.userRoomMap.set(playerId, roomId);
		return true;
	}

	playerLeaveRoom(playerId) {}

	playerMove(playerId, direction) {}

	playerShoot(playerId, target) {}

	getPlayerRoom(playerId) {
		return this.userRoomMap.get(playerId);
	}

	isPlayerInRoom(playerId) {
		return this.userRoomMap.has(playerId);
	}
}