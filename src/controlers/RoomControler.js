/** @format */
const Viewer = require("../models/Viewer");

class RoomControler {
  constructor(
    roomService,
    messenger,
    logger,
    botService = null,
    maxTotalPlayers = 10
  ) {
    this.roomService = roomService;
    this.messenger = messenger;
    this.logger = logger;
    this.botService = botService;
    this.maxTotalPlayers = maxTotalPlayers;
  }

  /**
   * @brief Handle player join room - complete flow with multi-room support
   * @param {string} playerId - Socket ID of the player
   * @param {object} data - Join data containing username
   */
  handlePlayerJoin(playerId, data) {
    const { username } = data;

    // Check for duplicate username across ALL rooms
    const allRooms = this.roomService.getAllRooms();
    for (const existingRoom of allRooms) {
      const existingPlayer = existingRoom.players.find(
        (p) => p.userName.toLowerCase() === username.toLowerCase()
      );
      if (existingPlayer) {
        this.messenger.notifyCurrentUser("username_taken", {
          message: `Username "${username}" is already in use. Please choose a different name.`,
          username: username,
        });
        return;
      }
    }

    // Get or create an available room
    let room = this.roomService.getAvailableRoom();

    // If room has bots and is at capacity, remove one bot to make space
    const botCount = room.getBotCount();
    if (room.getPlayerCount() >= this.maxTotalPlayers && botCount > 0) {
      const removedBot = this.botService.removeOneBot(room);
      if (removedBot) {
        console.log(`🤖 Removed bot ${removedBot} to make space for player ${username}`);
      }
    } else if (room.getPlayerCount() >= this.maxTotalPlayers && botCount === 0) {
      // All humans, need new room
      room = this.roomService.createRoom();
    }

    // Join the player to the room
    const result = this.roomService.playerJoinRoom(username, playerId, room.roomId);

    if (result) {
      const { player, roomId } = result;
      
      // If this is a new room or room has few players, fill with bots
      if (this.botService && room.getPlayerCount() < this.maxTotalPlayers) {
        this.botService.fillRoomWithBots(room, this, this.roomService, this.maxTotalPlayers);
      }

      const stats = player.serialize();
      this.messenger.notifyCurrentUser("player_joined", {
        current_player: stats,
        roomId: roomId,
      });

      // Draw the maze for the new player
      this.drawMazeForPlayer(playerId, roomId);
      
      console.log(`👤 Player ${username} joined room ${roomId} (${room.getPlayerCount()}/${this.maxTotalPlayers})`);
    }
  }

  /**
   * @brief Handle player movement with multi-room support
   */
  handlePlayerMove(playerId, data) {
    const { dir } = data;
    const roomId = this.roomService.getPlayerRoom(playerId);
    if (!roomId) return;
    
    const room = this.roomService.getRoom(roomId);
    const player = room?.players?.find((p) => p.id === playerId);

    if (player) {
      try {
        const result = this.roomService.playerMove(playerId, dir);
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
      this.messenger.notifyGivenUser(playerId, "player_moved", {
        status: false,
      });
    }
  }

  /**
   * @brief Handle player shooting with multi-room support
   */
  handlePlayerShoot(playerId) {
    try {
      const actionMessage = this.roomService.playerShoot(playerId);

      if (actionMessage) {
        const { ActionMessageTypes } = require("../models/Messages");
        const status = actionMessage.type !== ActionMessageTypes.INVALID;
        const room = this.roomService.getRoom("global");

        const shooterPlayer = room.getPlayerById(playerId);
        if (!shooterPlayer) return;

        if (!shooterPlayer.isBot) {
          const shotData = {
            status,
            resultType: actionMessage.type,
            direction: actionMessage.actionDirection,
          };

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

        const victim = actionMessage.actionTarget
          ? room.getPlayerById(actionMessage.actionTarget)
          : null;

        this.messenger.broadcastToAll("spectator:shot", {
          shooterId: shooterPlayer.id,
          shooterName: shooterPlayer.userName,
          targetId: victim ? victim.id : null,
          targetName: victim ? victim.userName : "Wall",
          from: { x: shooterPlayer.x, y: shooterPlayer.y },
          to: victim
            ? { x: victim.x, y: victim.y }
            : actionMessage.wallHitCoords || {
                x: shooterPlayer.x,
                y: shooterPlayer.y,
              },
          isKill: actionMessage.type === ActionMessageTypes.KILL,
          type: victim ? "player" : "wall",
        });

        if (victim) {
          if (!victim.isBot) {
            this.messenger.notifyGivenUser(victim.id, "got_hit", {
              dir: actionMessage.actionDirection,
              shooter_name: shooterPlayer.userName,
            });
          }

          this.messenger.broadcastToAll("player_hit_animation", {
            targetId: victim.id,
            targetX: victim.x,
            targetY: victim.y,
            shooterId: shooterPlayer.id,
            direction: actionMessage.actionDirection,
          });

          if (actionMessage.type === ActionMessageTypes.KILL) {
            const respawnTime = room.respawnTime || 3000;

            if (!victim.isBot) {
              this.messenger.notifyGivenUser(victim.id, "died", {
                killer_name: shooterPlayer.userName,
                respawn_time: respawnTime,
              });
            }

            this.messenger.broadcastToAll("player_death_animation", {
              targetId: victim.id,
              targetX: victim.x,
              targetY: victim.y,
              targetName: victim.userName,
              killerId: shooterPlayer.id,
              killerName: shooterPlayer.userName,
            });

            this.messenger.broadcastToAll("kill_message", {
              victim_name: victim.userName,
              killer_name: shooterPlayer.userName,
            });

            setTimeout(() => {
              let newPosition = room.generateValidPosition();
              victim.resetPlayerDataForRespawn(newPosition.x, newPosition.y);
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
    } catch (error) {
      console.error(`❌ [SHOOT ERROR] Player ${playerId}:`, error.message);
      const room = this.roomService.getRoom("global");
      const shooter = room?.getPlayerById(playerId);
      if (shooter && !shooter.isBot) {
        this.messenger.notifyGivenUser(playerId, "target_hit", {
          status: false,
        });
      }
    }
  }

  /**
   * @brief Handle player disconnect with multi-room support
   */
  handlePlayerDisconnect(playerId) {
    // Get room info BEFORE removing the player
    const roomId = this.roomService.getPlayerRoom(playerId);
    if (!roomId) return;

    const room = this.roomService.getRoom(roomId);
    if (!room) return;

    const wasBot = room.players.find((p) => p.id === playerId)?.isBot || false;

    // Remove the player
    this.roomService.playerLeaveRoom(playerId);

    // If a human player left, add a bot to replace them
    if (!wasBot && this.botService && room.getPlayerCount() < this.maxTotalPlayers) {
      this.botService.addOneBot(room, this, this.roomService, this.maxTotalPlayers);
    }

    // Check if room should be deleted (only bots remain)
    if (room.isOnlyBots()) {
      console.log(`🗑️ Room ${roomId} has only bots, deleting...`);
      // Remove all bots from this room
      this.botService.removeAllBotsFromRoom(room);
      // Delete the room
      this.roomService.deleteRoom(roomId);
    } else {
      console.log(`👋 Player left room ${roomId} (${room.getHumanCount()} humans, ${room.getBotCount()} bots)`);
    }
  }

  /**
   * @brief Broadcast a message to all players and viewers in a specific room
   */
  broadcastToRoom(room, event, data) {
    // Send to all human players in the room
    room.players.forEach((player) => {
      if (!player.isBot) {
        this.messenger.notifyGivenUser(player.id, event, data);
      }
    });
    // Send to all viewers in the room
    room._viewers.forEach((viewer) => {
      this.messenger.notifyGivenUser(viewer.id, event, data);
    });
  }

  /**
   * @brief Refresh rankings for all rooms
   */
  refreshRankings() {
    const allRooms = this.roomService.getAllRooms();
    
    allRooms.forEach((room) => {
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

      this.broadcastToRoom(room, "refresh_ranking", { all_players: rankings });
    });
  }

  /**
   * @brief Refresh player stats for a specific player
   */
  refreshPlayerStats(playerID) {
    const roomId = this.roomService.getPlayerRoom(playerID);
    if (!roomId) return;

    const room = this.roomService.getRoom(roomId);
    if (!room || !room.players) return;

    const player = room.players.find((p) => p.id === playerID);
    if (!player) return;

    const stats = player.serialize();
    this.messenger.notifyGivenUser(playerID, "refresh_player", stats);
  }

  /**
   * @brief Check if a player is nearby on diagonal
   */
  isPlayerNearbyOnDiag(currentPlayerX, currentPlayerY, checkX, checkY) {
    const deltaX = Math.abs(currentPlayerX - checkX);
    const deltaY = Math.abs(currentPlayerY - checkY);
    return deltaX + deltaY <= 3;
  }

  /**
   * @brief Refresh visible players for a specific player
   */
  refreshVisiblePlayers(playerID) {
    const roomId = this.roomService.getPlayerRoom(playerID);
    if (!roomId) {
      this.messenger.notifyGivenUser(playerID, "refresh_players", {
        visible_player_list: [],
      });
      return;
    }

    const room = this.roomService.getRoom(roomId);
    if (!room || !room.players) {
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
        (room.maze.isThereObstacle(player.x, player.y, p.x, p.y) === false ||
          this.isPlayerNearbyOnDiag(player.x, player.y, p.x, p.y))
    );

    const visibleData = visiblePlayers.map((p) => ({
      id: p.id,
      username: p.userName,
      x: p.x,
      y: p.y,
      dir: p.direction,
      color: p.color,
    }));

    this.messenger.notifyGivenUser(playerID, "refresh_players", {
      visible_player_list: visibleData,
    });
  }

  /**
   * @brief Send the maze layout to a player
   */
  drawMazeForPlayer(playerID, roomId) {
    const room = this.roomService.getRoom(roomId);
    if (!room) return;

    this.messenger.notifyGivenUser(playerID, "draw_maze", {
      maze: {
        row: room.height,
        col: room.width,
        layout: room.maze.maze,
      },
      roomId: roomId,
    });
  }

  /**
   * @brief Refresh visible players for all viewers in all rooms
   */
  refreshVisiblePlayersForViewers() {
    const allRooms = this.roomService.getAllRooms();

    allRooms.forEach((room) => {
      if (!room.players) return;

      room._viewers.forEach((viewer) => {
        this.messenger.notifyGivenUser(viewer.id, "refresh_players", {
          visible_player_list: [],
        });
      });
      return;
    }

    room._viewers.forEach((viewer) => {
      const visiblePlayers = room.players.filter((p) => p.health > 0);
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
    // Get a random room for the viewer
    let room = this.roomService.getRandomRoom();
    
    // If no rooms exist, create one
    if (!room) {
      room = this.roomService.createRoom();
      // Fill with bots
      if (this.botService) {
        this.botService.fillRoomWithBots(room, this, this.roomService, this.maxTotalPlayers);
      }
    }

    const newViewer = new Viewer(viewerID);
    newViewer.roomId = room.roomId; // Track which room viewer is watching
    room.addViewer(newViewer);
    this.messenger.notifyGivenUser(viewerID, "viewer_joined", { status: true });
    this.drawMaze(viewerID);
  }

  /**
   * @brief Handle viewer disconnect
   */
  handleViewerDisconnect(viewerID) {
    // Find which room the viewer is in
    const allRooms = this.roomService.getAllRooms();
    for (const room of allRooms) {
      const viewerIndex = room._viewers.findIndex((v) => v.id === viewerID);
      if (viewerIndex !== -1) {
        room.removeViewer(viewerID);
        console.log(`👁️ Viewer left room ${room.roomId}`);
        break;
      }
    }
  }
}

module.exports = RoomControler;
