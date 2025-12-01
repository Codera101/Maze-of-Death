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
      // Disabled for performance - too frequent
      // console.log(
      // 	`🎯 [MOVE] Player ${playerId} at (${oldPos.x},${oldPos.y}) wants to move ${dir}`
      // );

      try {
        const result = this.roomService.playerMove(playerId, dir);
        const newPos = player.getPosition();
        // Disabled for performance - too frequent
        // console.log(
        // 	`✅ [MOVE] Result: ${result}, old (${oldPos.x},${oldPos.y}) now at (${newPos.x},${newPos.y}), facing: ${player.direction}`
        // );
        // Only send socket message if not a bot
        if (!player.isBot) {
          this.messenger.notifyGivenUser(playerId, "player_moved", {
            status: result,
          });
        }
      } catch (error) {
        console.error(`❌ [MOVE ERROR] Player ${playerId}:`, error.message);
        if (!player.isBot) {
          this.messenger.notifyGivenUser(playerId, "player_moved", {
            status: false,
          });
        }
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
        // Get the room and shooter
        const room = this.roomService.getRoom("global");
        const shooter = room.getPlayerById(playerId);
        // Only send socket message if not a bot
        if (shooter && !shooter.isBot) {
          this.messenger.notifyGivenUser(playerId, "target_hit", { status });
        }

        // Handle HIT or KILL events
        if (
          actionMessage.type === ActionMessageTypes.HIT ||
          actionMessage.type === ActionMessageTypes.KILL
        ) {
          // Get the victim (room and shooter already retrieved above)
          const victim = room.getPlayerById(actionMessage.actionTarget);
          const shooterPlayer = room.getPlayerById(actionMessage.actionSource);

          if (victim && shooterPlayer) {
            console.log(
              `💥 [HIT] ${shooterPlayer.userName} hit ${victim.userName}`
            );
            // Notify the victim they got hit (only if not a bot)
            if (!victim.isBot) {
              this.messenger.notifyGivenUser(victim.id, "got_hit", {
                dir: actionMessage.actionDirection,
                shooter_name: shooterPlayer.userName,
              });
            }

            // If it was a kill, send death notification and broadcast kill message
            if (actionMessage.type === ActionMessageTypes.KILL) {
              console.log(
                `☠️ [KILL] ${shooterPlayer.userName} killed ${victim.userName}`
              );
              const respawnTime = room ? room.respawnTime : 3000;

              if (!victim.isBot) {
                this.messenger.notifyGivenUser(victim.id, "died", {
                  killer_name: shooterPlayer.userName,
                  respawn_time: respawnTime,
                });
              }

              // Broadcast kill message to all players in the room
              console.log(
                `📢 [KILL_MESSAGE] Broadcasting: ${shooterPlayer.userName} killed ${victim.userName}`
              );
              this.messenger.notifyAllUsersInRoom("global", "kill_message", {
                victim_name: victim.userName,
                killer_name: shooterPlayer.userName,
              });

              setTimeout(() => {
                let newPosition = room.generateValidPosition();
                victim.resetPlayerDataForRespawn(newPosition.x, newPosition.y);
                // Send respawn_done event to the player with all their data (only if not a bot)
                if (!victim.isBot) {
                  const stats = victim.serialize();
                  this.messenger.notifyGivenUser(
                    victim.id,
                    "respawn_done",
                    stats
                  );
                }
              }, respawnTime);
            }
          }
        }
      } else {
        console.log(`⚠️ [SHOOT] No action message returned for ${playerId}`);
        const room = this.roomService.getRoom("global");
        const shooter = room?.getPlayerById(playerId);
        if (shooter && !shooter.isBot) {
          this.messenger.notifyGivenUser(playerId, "target_hit", {
            status: false,
          });
        }
      }
    } catch (error) {
      console.error(`❌ [SHOOT ERROR] Player ${playerId}:`, error.message);
      console.error(error.stack);
      const room = this.roomService.getRoom("global");
      const shooter = room?.getPlayerById(playerId);
      if (shooter && !shooter.isBot) {
        this.messenger.notifyGivenUser(playerId, "target_hit", {
          status: false,
        });
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
    const room = this.roomService.getRoom("global");
    let rankings = room.players ?? [];
    console.log(`📊 [RANKINGS] Found ${rankings.length} players`);
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
    console.log(`📢 [RANKINGS] Broadcasting to all:`, rankings);
    this.messenger.broadcastToAll("refresh_ranking", { all_players: rankings });
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

    if (!player || player.health <= 0) {
      this.messenger.notifyGivenUser(playerID, "refresh_players", {
        visible_player_list: [],
      });
      return;
    }
    const visiblePlayers = room.players.filter(
      (p) =>
        p.health > 0 &&
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
