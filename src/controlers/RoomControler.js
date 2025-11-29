/** @format */

class RoomControler {
	constructor(roomService, messenger, logger) {
		this.roomService = roomService;
		this.messenger = messenger;
		this.logger = logger;
	}

  handlePlayerJoin(playerId, data) {
    const { username } = data;

  }

  handlePlayerMove(playerId) {

  }
  
  handlePlayerShoot(playerId) {

  }

  handlePlayerDisconnect(playerId) {
    this.roomService.playerLeaveRoom(playerId);
  }
}