/** @format */

// Mock the server module to avoid actually starting a server
jest.mock("express", () => {
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
  }));
  mockExpress.static = jest.fn();
  return mockExpress;
});

jest.mock("http", () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn(),
  })),
}));

jest.mock("socket.io", () => {
  return {
    Server: jest.fn(() => ({
      emit: jest.fn(),
      on: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    })),
  };
});

describe("refreshVisiblePlayers", () => {
  let io;
  let refreshVisiblePlayers;
  let Room;
  let consoleLogSpy;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Re-require the server module to get a fresh instance
    jest.resetModules();
    Room = require("../src/models/Room");
    const server = require("../src/server");
    io = server.io;

    refreshVisiblePlayers = server.refreshVisiblePlayers;
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player1");
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(String)
      );

      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("nonexistent");

      // Assert
      expect(io.to).toHaveBeenCalledWith("nonexistent");
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(String)
      );

      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData.visible_player_list).toEqual([]);
    });

    test("should handle undefined Room.players", () => {
      // Arrange
      Room.players = undefined;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player1");
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(String)
      );

      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData.visible_player_list).toEqual([]);
    });

    test("should handle empty players list", () => {
      // Arrange
      Room.players = [];

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn((x1, y1, x2, y2) => {
          // Obstacle between player1 and player2
          if (
            (x1 === 1 && y1 === 1 && x2 === 1 && y2 === 5) ||
            (x1 === 1 && y1 === 5 && x2 === 1 && y2 === 1)
          ) {
            return true;
          }
          return false;
        }),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      const isThereObstacleMock = jest.fn(() => false);
      Room.maze = {
        isThereObstacle: isThereObstacleMock,
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      expect(isThereObstacleMock).toHaveBeenCalledWith(2, 3, 5, 7);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player1");
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_players",
        expect.any(String)
      );
    });

    test("should emit valid JSON string", () => {
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
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = mockToEmit.mock.calls[0][1];
      expect(() => JSON.parse(emittedData)).not.toThrow();

      const parsed = JSON.parse(emittedData);
      expect(parsed).toHaveProperty("visible_player_list");
      expect(Array.isArray(parsed.visible_player_list)).toBe(true);
    });

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
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("onlyPlayer");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player-1_test@123");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player-1_test@123");
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => true), // All blocked
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      const directions = emittedData.visible_player_list.map((p) => p.dir);
      expect(directions).toEqual(expect.arrayContaining(["S", "E", "W"]));
    });
  });

  describe("multiple calls", () => {
    test("should handle multiple calls for different players", () => {
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
      Room.players = mockPlayers;
      Room.maze = {
        isThereObstacle: jest.fn(() => false),
      };

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");
      refreshVisiblePlayers("player2");

      // Assert
      expect(io.to).toHaveBeenCalledTimes(2);
      expect(io.to).toHaveBeenCalledWith("player1");
      expect(io.to).toHaveBeenCalledWith("player2");
      expect(mockToEmit).toHaveBeenCalledTimes(2);
    });

    test("should handle multiple calls for the same player", () => {
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
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshVisiblePlayers("player1");
      refreshVisiblePlayers("player1");
      refreshVisiblePlayers("player1");

      // Assert
      expect(io.to).toHaveBeenCalledTimes(3);
      expect(mockToEmit).toHaveBeenCalledTimes(3);
    });
  });
});
