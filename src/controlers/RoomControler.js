/** @format */


class RoomControler {
	constructor(roomService, messenger, logger) {
		this.roomService = roomService;
		this.messenger = messenger;
		this.logger = logger;
	}

  handlePlayerJoin(playerId, data) {
    const { username } = data;
    const player = this.roomService.playerJoinRoom(username, playerId);
    
    if (player) {
      this.messenger.notifyCurrentUser("player_joined", {
        current_player: {
          id: player.id,
          username: player.userName,
          score: player.score,
          health: player.health,
          kill_count: player.killCount
        }
      });
    }
  }

  handlePlayerMove(playerId, data) {
   const { dir } = data;  
   const result = this.roomService.playerMove(playerId, dir);
   this.messenger.notifyGivenUser(playerId, "player_moved", {status: result});
  }
  
  handlePlayerShoot(playerId) {
    const actionMessage = this.roomService.playerShoot(playerId);
    
    if (actionMessage) {
      const { ActionMessageTypes } = require('../models/Messages');
      
      // Determine status based on action message type
      const status = actionMessage.type !== ActionMessageTypes.INVALID;
      this.messenger.notifyGivenUser(playerId, "target_hit", { status });

      // Handle HIT or KILL events
      if (actionMessage.type === ActionMessageTypes.HIT || actionMessage.type === ActionMessageTypes.KILL) {
        // Get the victim player by username
        const victim = this.roomService.getPlayerByUsername(actionMessage.actionTarget);
        
        if (victim) {
          // Notify the victim they got hit
          this.messenger.notifyGivenUser(victim.id, "got_hit", {
            dir: actionMessage.actionDirection,
            shooter_name: actionMessage.actionSource
          });

          // If it was a kill, send death notification and broadcast kill message
          if (actionMessage.type === ActionMessageTypes.KILL) {
            const room = this.roomService.getRoom('global');
            const respawnTime = room ? room.respawnTime : 3000;
            
            this.messenger.notifyGivenUser(victim.id, "died", {
              killer_name: actionMessage.actionSource,
              respawn_time: respawnTime
            });

            // Broadcast kill message to all players in the room
            this.messenger.notifyAllUsersInRoom('global', "kill_message", {
              victim_name: actionMessage.actionTarget,
              killer_name: actionMessage.actionSource
            });
          }
        }
      }
    }
  }

  handlePlayerDisconnect(playerId) {
    this.roomService.playerLeaveRoom(playerId);
  }
}

module.exports = RoomControler;