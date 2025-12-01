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
      const stats = player.serialize();
      this.messenger.notifyCurrentUser("player_joined", {
        current_player: stats,
      });

      // Draw the maze for the new player
      this.drawMaze(playerId);
    }
  }

  handlePlayerMove(playerId, data) {
    const { dir } = data;
    const room = this.roomService.getRoom("global");
    const player = room?.players?.find((p) => p.id === playerId);

    if (player) {
      const oldPos = player.getPosition();
      console.log(
        `🎯 [MOVE] Player ${playerId} at (${oldPos.x},${oldPos.y}) wants to move ${dir}`
      );

      try {
        const result = this.roomService.playerMove(playerId, dir);
		let addX = 0, addY = 0;
		const moveDir = dir.direction;
        if(result && player.canMove()){
			// console.log(moveDir == 'UP');
			addX = (moveDir == 'RIGHT') ? 1 : (moveDir == 'LEFT') ? -1 : 0;
			addY = (moveDir == 'UP') ? -1 : (moveDir == 'DOWN') ? 1 : 0;
			
			if(moveDir == player.getDirection()){
				addX = 0,addY = 0;
			}
		}
		const newPos = player.getPosition();
		newPos.x = oldPos.x + addX;
		newPos.y = oldPos.y + addY;
		console.log(oldPos,newPos);
		player.setPosition(newPos);
        console.log(
          `✅ [MOVE] Result: ${result}, now at (${newPos.x},${newPos.y}), facing: ${player.direction}`
        );
        this.messenger.notifyGivenUser(playerId, "player_moved", {
          status: result,
        });
      } catch (error) {
        console.error(`❌ [MOVE ERROR] Player ${playerId}:`, error.message);
        this.messenger.notifyGivenUser(playerId, "player_moved", {
          status: false,
        });
      }
    } else {
      console.log(`⚠️ [MOVE] Player ${playerId} not found`);
      this.messenger.notifyGivenUser(playerId, "player_moved", {
        status: false,
      });
    }
  }

  handlePlayerShoot(playerId) {
    console.log(`🔫 [SHOOT] Player ${playerId} attempting to shoot`);
    try {
      const actionMessage = this.roomService.playerShoot(playerId);

      if (actionMessage) {
        const { ActionMessageTypes } = require("../models/Messages");

        console.log(`📩 [SHOOT] Action message:`, actionMessage);

        // Determine status based on action message type
        const status = actionMessage.type !== ActionMessageTypes.INVALID;
        this.messenger.notifyGivenUser(playerId, "target_hit", { status });

        // Handle HIT or KILL events
        if (
          actionMessage.type === ActionMessageTypes.HIT ||
          actionMessage.type === ActionMessageTypes.KILL
        ) {
          // Get the room and players
          const room = this.roomService.getRoom("global");
          const victim = room.getPlayerById(actionMessage.actionTarget);
          const shooter = room.getPlayerById(actionMessage.actionSource);

          if (victim && shooter) {
            console.log(`💥 [HIT] ${shooter.userName} hit ${victim.userName}`);
            // Notify the victim they got hit
            this.messenger.notifyGivenUser(victim.id, "got_hit", {
              dir: actionMessage.actionDirection,
              shooter_name: shooter.userName,
            });

            // If it was a kill, send death notification and broadcast kill message
            if (actionMessage.type === ActionMessageTypes.KILL) {
              console.log(
                `☠️ [KILL] ${shooter.userName} killed ${victim.userName}`
              );
              const respawnTime = room ? room.respawnTime : 3000;

              this.messenger.notifyGivenUser(victim.id, "died", {
                killer_name: shooter.userName,
                respawn_time: respawnTime,
              });

              // Broadcast kill message to all players in the room
              this.messenger.notifyAllUsersInRoom("global", "kill_message", {
                victim_name: victim.userName,
                killer_name: shooter.userName,
              });

              setTimeout(() => {
                let newPosition = room.generateValidPosition();
                victim.resetPlayerDataForRespawn(newPosition.x, newPosition.y);
                // Send respawn_done event to the player with all their data
                const stats = victim.serialize();
                this.messenger.notifyGivenUser(
                  victim.id,
                  "respawn_done",
                  stats
                );
              }, respawnTime);
            }
          }
        }
      } else {
        console.log(`⚠️ [SHOOT] No action message returned for ${playerId}`);
        this.messenger.notifyGivenUser(playerId, "target_hit", {
          status: false,
        });
      }
    } catch (error) {
      console.error(`❌ [SHOOT ERROR] Player ${playerId}:`, error.message);
      console.error(error.stack);
      this.messenger.notifyGivenUser(playerId, "target_hit", { status: false });
    }
  }

  handlePlayerDisconnect(playerId) {
    this.roomService.playerLeaveRoom(playerId);
  }

  /**
   * @brief Refresh panel rankings
   */
  refreshRankings() {
    const room = this.roomService.getRoom("global");
    let rankings = room.players ?? [];
    rankings = rankings
      .sort((a, b) => {
        if (a.score === b.score) return b.killCount - a.killCount;
        return b.score - a.score;
      })
      .map((player) => ({
        username: player.userName,
        score: player.score,
        kill_count: player.killCount,
        color: player.color,
      }));
    this.messenger.broadcastToAll("refresh_rank", { all_players: rankings });
  }

  /**
   * @brief Refresh player stats
   * @param {string} playerID - Socket ID of the player
   */
  refreshPlayerStats(playerID) {
    const room = this.roomService.getRoom("global");
    if (!room.players) {
      return;
    }
    const player = room.players.find((p) => p.id === playerID);
    if (!player) return;
    const stats = player.serialize();
    // console.log(`Refreshing stats for player ${playerID}:`, stats);
    this.messenger.notifyGivenUser(playerID, "refresh_player", stats);
  }

  /**
   * @brief Refresh visible players for each player
   * @param {string} playerID - Socket ID of the player
   * @return {void}
   */
  refreshVisiblePlayers(playerID) {
    const room = this.roomService.getRoom("global");
    if (!room.players) {
      this.messenger.notifyGivenUser(playerID, "refresh_players", {
        visible_player_list: [],
      });
      return;
    }

    const player = room.players.find((p) => p.id === playerID);

    if (!player) {
      this.messenger.notifyGivenUser(playerID, "refresh_players", {
        visible_player_list: [],
      });
      return;
    }

    // *** MODIFIED SECTION: Removed the check p.id !== playerID ***
    // Now, the filter includes the current player if they meet the visibility requirement (which they always will)
    const visiblePlayers = room.players.filter(
      (p) => room.maze.isThereObstacle(player.x, player.y, p.x, p.y) === false
    );
    // *** END OF MODIFIED SECTION ***

    const visibleData = visiblePlayers.map((p) => ({
      id: p.id,
      username: p.userName,
      x: p.x,
      y: p.y,
      dir: p.direction,
      color: p.color,
    }));
    // console.log(`Refreshing visible players for ${playerID}:`, visibleData);
    this.messenger.notifyGivenUser(playerID, "refresh_players", {
      visible_player_list: visibleData,
    });
  }

  /**
   * @brief Send the maze layout to the player at joining time.
   * @param {string} playerID - Socket ID of the player
   */
  drawMaze(playerID) {
    const room = this.roomService.getRoom("global");
    this.messenger.notifyGivenUser(playerID, "draw_maze", {
      maze: {
        row: room.height,
        col: room.width,
        layout: room.maze.maze, // room.maze is the Maze object, room.maze.maze is the 2D array
      },
    });
  }
}

module.exports = RoomControler;
