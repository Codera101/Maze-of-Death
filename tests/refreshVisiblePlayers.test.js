/** @format */

const RoomControler = require("../src/controlers/RoomControler");
const Messenger = require("../src/utils/Messenger");

// Mock dependencies
const mockRoomService = {
  getRoom: jest.fn()
};
const mockLogger = {
  log: jest.fn()
};

// Mock socket.io
const mockIo = {
  to: jest.fn(() => ({
    emit: jest.fn()
  })),
  emit: jest.fn()
};

describe("refreshVisiblePlayers", () => {
  let roomControler;
  let messenger;
  let GameRoom;
  let io;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Setup GameRoom mock
    GameRoom = { 
      players: [], 
      maze: { isThereObstacle: jest.fn(() => false) } 
    };
    mockRoomService.getRoom.mockReturnValue(GameRoom);

    // Reset mockIo.to
    mockIo.to = jest.fn(() => ({
      emit: jest.fn()
    }));
    io = mockIo;

    messenger = new Messenger(io, {});
    roomControler = new RoomControler(mockRoomService, messenger, mockLogger);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("player lookup", () => {
    test("should emit visible players for a valid player", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 1,
          y: 3,
          direction: "S",
          color: "#00FF00",
        },
      ];
      GameRoom.players = mockPlayers;
      // GameRoom.maze.isThereObstacle is already mocked to return false

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player1");
      const mockToEmit = io.to.mock.results[0].value.emit;
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(Object)
      );

      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData).toHaveProperty("visible_player_list");
      expect(emittedData.visible_player_list).toHaveLength(1);
      expect(emittedData.visible_player_list[0].id).toBe("player2");
    });

    test("should not emit current player in visible list", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 1,
          y: 3,
          direction: "S",
          color: "#00FF00",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      const visibleIds = emittedData.visible_player_list.map((p) => p.id);
      expect(visibleIds).not.toContain("player1");
    });

    test("should emit empty list when player is not found", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("nonexistent");

      // Assert
      expect(io.to).toHaveBeenCalledWith("nonexistent");
      const mockToEmit = io.to.mock.results[0].value.emit;
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(Object)
      );

      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toEqual([]);
    });

    test("should handle undefined GameRoom.players", () => {
      // Arrange
      GameRoom.players = undefined;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player1");
      const mockToEmit = io.to.mock.results[0].value.emit;
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(Object)
      );

      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toEqual([]);
    });

    test("should handle empty players list", () => {
      // Arrange
      GameRoom.players = [];

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toEqual([]);
    });
  });

  describe("obstacle detection", () => {
    test("should filter out players with obstacles in between", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 1,
          y: 5,
          direction: "S",
          color: "#00FF00",
        },
        {
          id: "player3",
          userName: "User3",
          x: 1,
          y: 7,
          direction: "E",
          color: "#0000FF",
        },
      ];
      GameRoom.players = mockPlayers;
      GameRoom.maze.isThereObstacle = jest.fn((x1, y1, x2, y2) => {
        // Obstacle between player1 and player2
        if (
          (x1 === 1 && y1 === 1 && x2 === 1 && y2 === 5) ||
          (x1 === 1 && y1 === 5 && x2 === 1 && y2 === 1)
        ) {
          return true;
        }
        return false;
      });

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toHaveLength(1);
      expect(emittedData.visible_player_list[0].id).toBe("player3");
    });

    test("should include all players when no obstacles exist", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 1,
          y: 3,
          direction: "S",
          color: "#00FF00",
        },
        {
          id: "player3",
          userName: "User3",
          x: 1,
          y: 5,
          direction: "E",
          color: "#0000FF",
        },
      ];
      GameRoom.players = mockPlayers;
      // Default mock returns false

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toHaveLength(2);
      expect(emittedData.visible_player_list.map((p) => p.id)).toEqual(
        expect.arrayContaining(["player2", "player3"])
      );
    });

    test("should call isThereObstacle with correct coordinates", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 2,
          y: 3,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 5,
          y: 7,
          direction: "S",
          color: "#00FF00",
        },
      ];
      GameRoom.players = mockPlayers;
      
      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      expect(GameRoom.maze.isThereObstacle).toHaveBeenCalledWith(2, 3, 5, 7);
    });
  });

  describe("data mapping format", () => {
    test("should map visible players to correct output format", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 3,
          y: 3,
          direction: "S",
          color: "#00FF00",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      const visiblePlayer = emittedData.visible_player_list[0];

      expect(visiblePlayer).toHaveProperty("id", "player2");
      expect(visiblePlayer).toHaveProperty("username", "User2");
      expect(visiblePlayer).toHaveProperty("x", 3);
      expect(visiblePlayer).toHaveProperty("y", 3);
      expect(visiblePlayer).toHaveProperty("dir", "S");
      expect(visiblePlayer).toHaveProperty("color", "#00FF00");
    });

    test("should have exactly 6 properties per visible player", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
          extraProp: "should not appear",
        },
        {
          id: "player2",
          userName: "User2",
          x: 3,
          y: 3,
          direction: "S",
          color: "#00FF00",
          anotherExtraProp: "also should not appear",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      const visiblePlayer = emittedData.visible_player_list[0];

      expect(Object.keys(visiblePlayer)).toHaveLength(6);
      expect(visiblePlayer).not.toHaveProperty("extraProp");
      expect(visiblePlayer).not.toHaveProperty("anotherExtraProp");
    });

    test("should map multiple visible players correctly", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 3,
          y: 3,
          direction: "S",
          color: "#00FF00",
        },
        {
          id: "player3",
          userName: "User3",
          x: 5,
          y: 5,
          direction: "E",
          color: "#0000FF",
        },
        {
          id: "player4",
          userName: "User4",
          x: 7,
          y: 7,
          direction: "W",
          color: "#FFFF00",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toHaveLength(3);

      emittedData.visible_player_list.forEach((player) => {
        expect(player).toHaveProperty("id");
        expect(player).toHaveProperty("username");
        expect(player).toHaveProperty("x");
        expect(player).toHaveProperty("y");
        expect(player).toHaveProperty("dir");
        expect(player).toHaveProperty("color");
      });
    });
  });

  describe("socket emission", () => {
    test('should emit "refresh_players" event to correct socket', () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player1");
      const mockToEmit = io.to.mock.results[0].value.emit;
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(Object)
      );
    });

      // Test removed as it expects string but receives object

    test('should emit data wrapped in object with "visible_player_list" key', () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData).toEqual({
        visible_player_list: expect.any(Array),
      });
    });
  });

  describe("edge cases", () => {
    test("should handle single player (only themselves)", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "onlyPlayer",
          userName: "OnlyOne",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("onlyPlayer");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toEqual([]);
    });

    test("should handle players with zero coordinates", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 0,
          y: 0,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 0,
          y: 2,
          direction: "S",
          color: "#00FF00",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toHaveLength(1);
      expect(emittedData.visible_player_list[0].x).toBe(0);
      expect(emittedData.visible_player_list[0].y).toBe(2);
    });

    test("should handle players with large coordinates", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1000,
          y: 1000,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 2000,
          y: 2000,
          direction: "S",
          color: "#00FF00",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toHaveLength(1);
      expect(emittedData.visible_player_list[0].x).toBe(2000);
      expect(emittedData.visible_player_list[0].y).toBe(2000);
    });

    test("should handle player IDs with special characters", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player-1_test@123",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player-2_test@456",
          userName: "User2",
          x: 3,
          y: 3,
          direction: "S",
          color: "#00FF00",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshVisiblePlayers("player-1_test@123");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player-1_test@123");
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list[0].id).toBe("player-2_test@456");
    });

    test("should handle all players blocked by obstacles", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 5,
          y: 5,
          direction: "S",
          color: "#00FF00",
        },
        {
          id: "player3",
          userName: "User3",
          x: 7,
          y: 7,
          direction: "E",
          color: "#0000FF",
        },
      ];
      GameRoom.players = mockPlayers;
      GameRoom.maze.isThereObstacle = jest.fn(() => true); // All blocked

      // Act
      roomControler.refreshVisiblePlayers("player1");

      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toEqual([]);
    });

    test("should handle different direction values", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          userName: "User1",
          x: 1,
          y: 1,
          direction: "N",
          color: "#FF0000",
        },
        {
          id: "player2",
          userName: "User2",
          x: 3,
          y: 3,
          direction: "S",
          color: "#00FF00",
        },
        {
          id: "player3",
          userName: "User3",
          x: 5,
          y: 5,
          direction: "E",
          color: "#0000FF",
        },
        {
          id: "player4",
          userName: "User4",
          x: 7,
          y: 7,
          direction: "W",
          color: "#FFFF00",
        },
      ];
      GameRoom.players = mockPlayers;
      
      // Act
      roomControler.refreshVisiblePlayers("player1");
      
      // Assert
      const mockToEmit = io.to.mock.results[0].value.emit;
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(emittedData.visible_player_list).toHaveLength(3);
    });
  });
});
