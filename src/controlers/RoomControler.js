/** @format */
const Viewer = require("../models/Viewer");
class RoomControler {
  constructor(
    roomService,
    messenger,
    logger,
    botService = null,
    maxTotalPlayers = 8
  ) {
    this.roomService = roomService;
    this.messenger = messenger;
    this.logger = logger;
    this.botService = botService;
    this.maxTotalPlayers = maxTotalPlayers;
  }

  /**
   * @brief Handle player join room - complete flow including maze drawing
   * @param {string} username - Player username
   * @param {string} playerId - Socket ID of the player
   */
  handlePlayerJoin(playerId, data) {
    const { username } = data;

    // Check for duplicate username
    const room = this.roomService.getRoom("global");
    const existingPlayer = room?.players?.find(
      (p) => p.userName.toLowerCase() === username.toLowerCase()
    );
    if (existingPlayer) {
      this.messenger.notifyCurrentUser("username_taken", {
        message: `Username "${username}" is already in use. Please choose a different name.`,
        username: username,
      });
      return;
    }

    // Check total player count limit
    const humanPlayerCount = room
      ? room.players.filter((p) => !p.isBot).length
      : 0;
    const botCount = this.botService ? this.botService.getBotCount() : 0;
    const totalPlayers = humanPlayerCount + botCount;

    // If room is full, remove a bot to make space for human player
    if (totalPlayers >= this.maxTotalPlayers && botCount > 0) {
      const removedBot = this.botService.removeOneBot(room);
      if (removedBot) {
        console.log(
          `Removed bot ${removedBot} to make space for player ${username}`
        );
      }
    } else if (totalPlayers >= this.maxTotalPlayers && botCount === 0) {
      // No bots to remove, room is full with only humans
      this.messenger.notifyCurrentUser("room_full", {
        message: `Room is full (${this.maxTotalPlayers} players maximum)`,
        maxPlayers: this.maxTotalPlayers,
      });
      return;
    }

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
      // console.log(`⚠️ [MOVE] Player ${playerId} not found`);
      this.messenger.notifyGivenUser(playerId, "player_moved", {
        status: false,
      });
    }
  }

  handlePlayerShoot(playerId) {
    // console.log(`🔫 [SHOOT] Player ${playerId} attempting to shoot`);
    try {
      const actionMessage = this.roomService.playerShoot(playerId);

      if (actionMessage) {
        const { ActionMessageTypes } = require("../models/Messages");

        // console.log(`📩 [SHOOT] Action message:`, actionMessage);

        // Determine status based on action message type
        const status = actionMessage.type !== ActionMessageTypes.INVALID;
        // Get the room and shooter
        const room = this.roomService.getRoom("global");
        const shooter = room.getPlayerById(playerId);

        // Send detailed shot result to shooter
        if (shooter && !shooter.isBot) {
          const shotData = {
            status,
            resultType: actionMessage.type,
            direction: actionMessage.actionDirection,
          };

          // Add target info if hit/kill
          if (
            actionMessage.type === ActionMessageTypes.HIT ||
            actionMessage.type === ActionMessageTypes.KILL
          ) {
            const victim = room.getPlayerById(actionMessage.actionTarget);
            if (victim) {
              shotData.targetId = victim.id;
              shotData.targetX = victim.x;
              shotData.targetY = victim.y;
              shotData.targetName = victim.userName;
            }
          }

          this.messenger.notifyGivenUser(playerId, "target_hit", shotData);
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
            // console.log(
            //   `💥 [HIT] ${shooterPlayer.userName} hit ${victim.userName}`
            // );
            // Notify the victim they got hit (only if not a bot)
            if (!victim.isBot) {
              this.messenger.notifyGivenUser(victim.id, "got_hit", {
                dir: actionMessage.actionDirection,
                shooter_name: shooterPlayer.userName,
              });
            }

            // Broadcast hit animation to all players for visual feedback
            this.messenger.broadcastToAll("player_hit_animation", {
              targetId: victim.id,
              targetX: victim.x,
              targetY: victim.y,
              shooterId: shooterPlayer.id,
              direction: actionMessage.actionDirection,
            });

            // If it was a kill, send death notification and broadcast kill message
            if (actionMessage.type === ActionMessageTypes.KILL) {
              // console.log(
              //   `☠️ [KILL] ${shooterPlayer.userName} killed ${victim.userName}`
              // );
              const respawnTime = room ? room.respawnTime : 3000;

              if (!victim.isBot) {
                this.messenger.notifyGivenUser(victim.id, "died", {
                  killer_name: shooterPlayer.userName,
                  respawn_time: respawnTime,
                });
              }

              // Broadcast death animation to all players
              this.messenger.broadcastToAll("player_death_animation", {
                targetId: victim.id,
                targetX: victim.x,
                targetY: victim.y,
                targetName: victim.userName,
                killerId: shooterPlayer.id,
                killerName: shooterPlayer.userName,
              });

              // Broadcast kill message to all players in the room
              // console.log(
              //   `📢 [KILL_MESSAGE] Broadcasting: ${shooterPlayer.userName} killed ${victim.userName}`
              // );
              this.messenger.broadcastToAll("kill_message", {
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
        // console.log(`⚠️ [SHOOT] No action message returned for ${playerId}`);
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

  handlePlayerDisconnect(playerId, roomService = null, minBotCount = 3) {
    // Check counts BEFORE removing the player
    const room = this.roomService.getRoom("global");
    const wasBot =
      room?.players?.find((p) => p.id === playerId)?.isBot || false;

    // Remove the player
    this.roomService.playerLeaveRoom(playerId);

    // Only add bot back if a human player left (not if a bot left)
    if (!wasBot && this.botService && room) {
      const humanPlayerCount = room.players.filter((p) => !p.isBot).length;
      const botCount = this.botService.getBotCount();
      const totalPlayers = humanPlayerCount + botCount;

      console.log(
        `Player left: ${totalPlayers}/${this.maxTotalPlayers} total, ${botCount} bots, ${humanPlayerCount} humans`
      );

      // If total is below max, add one bot to fill the space
      if (totalPlayers < this.maxTotalPlayers) {
        try {
          const difficulties = ["easy", "medium", "hard"];
          const difficulty =
            difficulties[Math.floor(Math.random() * difficulties.length)];
          const bot = this.botService.createBot(room, difficulty, roomService);
          this.botService.startBot(bot.id, this);
          console.log(
            `✅ Added bot ${bot.userName} after player left (now ${
              totalPlayers + 1
            }/${this.maxTotalPlayers})`
          );
        } catch (error) {
          console.error(
            `❌ Failed to add bot after player disconnect:`,
            error.message
          );
        }
      }
    }
  }

  /**
   * @brief Refresh panel rankings
   */
  refreshRankings() {
    const room = this.roomService.getRoom("global");
    let rankings = room.players ?? [];
    // console.log(`📊 [RANKINGS] Found ${rankings.length} players`);
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
    // console.log(`📢 [RANKINGS] Broadcasting to all:`, rankings);
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
   * @breif Check if a player is nearby on diag
   * @param {number} currentPlayerX - Current player's X position
   * @param {number} currentPlayerY - Current player's Y position
   * @param {number} checkX - X position to check
   * @param {number} checkY - Y position to check
   * @return {boolean} - True if a player is nearby diagonally, false otherwise
   */
  isPlayerNearbyOnDiag(currentPlayerX, currentPlayerY, checkX, checkY) {
    const deltaX = Math.abs(currentPlayerX - checkX);
    const deltaY = Math.abs(currentPlayerY - checkY);
    return deltaX + deltaY <= 3;
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
        (room.maze.isThereObstacle(player.x, player.y, p.x, p.y) === false || this.isPlayerNearbyOnDiag(player.x, player.y, p.x, p.y))
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

  refreshVisiblePlayersForViewers() {
    const room = this.roomService.getRoom("global");
    if (!room.players) {
      room._viewers.forEach((viewer) => {
        this.messenger.notifyGivenUser(viewer.id, "refresh_players", {
          visible_player_list: [],
        });
      });
      return;
    }

    room._viewers.forEach((viewer) => {
      const visiblePlayers = room.players.filter(
        (p) => p.health > 0
      );
      const visibleData = visiblePlayers.map((p) => ({
        id: p.id,
        username: p.userName,
        x: p.x,
        y: p.y,
        dir: p.direction,
        color: p.color,
      }));
      // console.log(`Refreshing visible players for viewer ${viewer.id}:`, visibleData);
      this.messenger.notifyGivenUser(viewer.id, "refresh_players", {
        visible_player_list: visibleData,
      });
    });
  }


  /**
   * @param {*} viewerID 
   */

  handleViewerJoin(viewerID) {
    const room = this.roomService.getRoom("global");
    const newViewer = new Viewer(viewerID);
    room.addViewer(newViewer);
    this.messenger.notifyGivenUser(viewerID, "viewer_joined", {status: true});
    this.drawMaze(viewerID);
  }

  /**
   * @param {*} viewerID
   */
  handleViewerDisconnect(viewerID) {
    const room = this.roomService.getRoom("global");
    room.removeViewer(viewerID);
  }
}

module.exports = RoomControler;
