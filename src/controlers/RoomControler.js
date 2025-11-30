/** @format */


class RoomControler {
	constructor(roomService, messenger, logger) {
		this.roomService = roomService;
		this.messenger = messenger;
		this.logger = logger;
	}

  /**
   * @brief Handle player join room - complete flow including maze drawing
   * @param {string} username - Player username
   * @param {string} playerId - Socket ID of the player
   */
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
      
      // Draw the maze for the new player
      this.drowMaze(playerId);
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

  /**
   * @brief Refresh panel rankings
   */
  refreshRankings() {
    const room = this.roomService.getRoom('global');
    let rankings = room.players ?? [];
    rankings = rankings
      .sort((a, b) => {
        if (a.score === b.score) return b.killCount - a.killCount;
        return b.score - a.score;
      })
      .map((player) => ({
        username: player.userName,
        score: player.score,
        killCount: player.killCount,
        color: player.color,
      }));
    this.messenger.broadcastToAll("refresh_rank", JSON.stringify({ all_players: rankings }));
  }

  /**
   * @brief Refresh player stats
   * @param {string} playerID - Socket ID of the player
   */
  refreshPlayerStats(playerID) {
    const room = this.roomService.getRoom('global');
    if (!room.players) {
      return;
    }
    const player = room.players.find((p) => p.id === playerID);
    if (!player) return;
    const stats = {
      id: player.id,
      username: player.userName,
      health: player.health,
      score: player.score,
      bullets: player.bullets,
      killCount: player.killCount,
    };
    console.log(`Refreshing stats for player ${playerID}:`, stats);
    this.messenger.notifyGivenUser(playerID, "refresh_player", JSON.stringify(stats));
  }

  /**
   * @brief Refresh visible players for each player
   * @param {string} playerID - Socket ID of the player
   * @return {void}
   */
  refreshVisiblePlayers(playerID) {
    const room = this.roomService.getRoom('global');
    if (!room.players) {
      this.messenger.notifyGivenUser(
        playerID,
        "refresh_players",
        JSON.stringify({ visible_player_list: [] })
      );
      return;
    }

    const player = room.players.find((p) => p.id === playerID);

    if (!player) {
      this.messenger.notifyGivenUser(
        playerID,
        "refresh_players",
        JSON.stringify({ visible_player_list: [] })
      );
      return;
    }
    const visiblePlayers = room.players.filter(
      (p) =>
        p.id !== playerID &&
        room.maze.isThereObstacle(player.x, player.y, p.x, p.y) === false
    );
    const visibleData = visiblePlayers.map((p) => ({
      id: p.id,
      username: p.userName,
      x: p.x,
      y: p.y,
      dir: p.direction,
      color: p.color,
    }));
    console.log(`Refreshing visible players for ${playerID}:`, visibleData);
    this.messenger.notifyGivenUser(
      playerID,
      "refresh_players",
      JSON.stringify({ visible_player_list: visibleData })
    );
  }

  /**
   * @brief Send the maze layout to the player at joining time.
   * @param {string} playerID - Socket ID of the player
   */
  drowMaze(playerID) {
    const room = this.roomService.getRoom('global');
    this.messenger.notifyGivenUser(playerID, "draw_maze", {
      maze: {
        row: room.height,
        col: room.width,
        layout: room.maze
      }
    });
  }
}

module.exports = RoomControler;