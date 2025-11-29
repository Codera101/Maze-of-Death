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

describe("refreshPlayerStats", () => {
  let io;
  let refreshPlayerStats;
  let Room;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Re-require the server module to get a fresh instance
    jest.resetModules();
    Room = require("../src/models/Room");
    const server = require("../src/server");
    io = server.io;

    refreshPlayerStats = server.refreshPlayerStats;
  });

  describe("player lookup", () => {
    test("should find player by id and emit their stats", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "User1", score: 50, killCount: 5, health: 80, bullets: 10 },
        { id: "player2", userName: "User2", score: 100, killCount: 10, health: 100, bullets: 15 },
        { id: "player3", userName: "User3", score: 75, killCount: 7, health: 60, bullets: 8 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player2");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player2");
      expect(mockToEmit).toHaveBeenCalledTimes(1);
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_player",
        expect.any(String)
      );

      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        id: "player2",
        username: "User2",
        score: 100,
        killCount: 10,
        health: 100,
        bullets: 15,
      });
    });

    test("should not emit if player id is not found", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "User1", score: 50, killCount: 5, health: 80, bullets: 10 },
        { id: "player2", userName: "User2", score: 100, killCount: 10, health: 100, bullets: 15 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("nonexistent_player");

      // Assert
      expect(io.to).not.toHaveBeenCalled();
      expect(mockToEmit).not.toHaveBeenCalled();
    });

    test("should handle empty players list", () => {
      // Arrange
      Room.players = [];

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      expect(io.to).not.toHaveBeenCalled();
      expect(mockToEmit).not.toHaveBeenCalled();
    });
  });

  describe("data mapping", () => {
    test("should emit id, username, health, score, bullets, and killCount", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          score: 50,
          killCount: 5,
          userName: "TestUser",
          health: 100,
          bullets: 20,
          extraField: "should not be included",
          color: "#FF0000",
        },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        id: "player1",
        username: "TestUser",
        health: 100,
        score: 50,
        bullets: 20,
        killCount: 5,
      });
      expect(emittedData.extraField).toBeUndefined();
      expect(emittedData.color).toBeUndefined();
    });

    test("should handle player with zero stats", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "ZeroPlayer", score: 0, killCount: 0, health: 0, bullets: 0 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        id: "player1",
        username: "ZeroPlayer",
        health: 0,
        score: 0,
        bullets: 0,
        killCount: 0,
      });
    });

    test("should handle player with negative values", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "NegPlayer", score: -10, killCount: -5, health: -20, bullets: -3 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        id: "player1",
        username: "NegPlayer",
        health: -20,
        score: -10,
        bullets: -3,
        killCount: -5,
      });
    });

    test("should handle player with large numbers", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "BigPlayer", score: 999999, killCount: 88888, health: 777777, bullets: 66666 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        id: "player1",
        username: "BigPlayer",
        health: 777777,
        score: 999999,
        bullets: 66666,
        killCount: 88888,
      });
    });
  });

  describe("socket emission", () => {
    test("should emit to the correct player socket", () => {
      // Arrange
      const mockPlayers = [
        { id: "socket123", userName: "Socket123User", score: 75, killCount: 8, health: 90, bullets: 12 },
        { id: "socket456", userName: "Socket456User", score: 50, killCount: 3, health: 70, bullets: 9 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("socket123");

      // Assert
      expect(io.to).toHaveBeenCalledWith("socket123");
      expect(io.to).not.toHaveBeenCalledWith("socket456");
    });

    test("should emit with the correct event name", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "EventPlayer", score: 100, killCount: 10, health: 95, bullets: 14 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      expect(mockToEmit).toHaveBeenCalledWith(
        "refresh_player",
        expect.any(String)
      );
    });

    test("should emit valid JSON string", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "JSONPlayer", score: 85, killCount: 9, health: 88, bullets: 11 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedString = mockToEmit.mock.calls[0][1];
      expect(typeof emittedString).toBe("string");
      expect(() => JSON.parse(emittedString)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    test("should handle undefined Room.players", () => {
      // Arrange
      Room.players = undefined;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      expect(io.to).not.toHaveBeenCalled();
      expect(mockToEmit).not.toHaveBeenCalled();
    });

    test("should handle player with missing optional fields", () => {
      // Arrange
      const mockPlayers = [{ id: "player1", userName: "Incomplete", score: 50, killCount: 5 }];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        id: "player1",
        username: "Incomplete",
        health: undefined,
        score: 50,
        bullets: undefined,
        killCount: 5,
      });
    });

    test("should handle first player in list", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "First", score: 10, killCount: 1, health: 50, bullets: 5 },
        { id: "player2", userName: "Second", score: 20, killCount: 2, health: 60, bullets: 6 },
        { id: "player3", userName: "Third", score: 30, killCount: 3, health: 70, bullets: 7 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player1");
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData.score).toBe(10);
    });

    test("should handle last player in list", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "First", score: 10, killCount: 1, health: 50, bullets: 5 },
        { id: "player2", userName: "Second", score: 20, killCount: 2, health: 60, bullets: 6 },
        { id: "player3", userName: "Third", score: 30, killCount: 3, health: 70, bullets: 7 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player3");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player3");
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData.score).toBe(30);
    });

    test("should handle special characters in player id", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player-with-dashes_123",
          userName: "SpecialPlayer",
          score: 50,
          killCount: 5,
          health: 75,
          bullets: 10,
        },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player-with-dashes_123");

      // Assert
      expect(io.to).toHaveBeenCalledWith("player-with-dashes_123");
      expect(mockToEmit).toHaveBeenCalledTimes(1);
    });

    test("should handle single player in list", () => {
      // Arrange
      const mockPlayers = [
        { id: "onlyplayer", userName: "OnlyOne", score: 42, killCount: 4, health: 65, bullets: 8 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("onlyplayer");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        id: "onlyplayer",
        username: "OnlyOne",
        health: 65,
        score: 42,
        bullets: 8,
        killCount: 4,
      });
    });
  });

  describe("multiple calls", () => {
    test("should handle multiple calls for different players", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "Multi1", score: 10, killCount: 1, health: 55, bullets: 7 },
        { id: "player2", userName: "Multi2", score: 20, killCount: 2, health: 65, bullets: 8 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");
      refreshPlayerStats("player2");

      // Assert
      expect(io.to).toHaveBeenCalledTimes(2);
      expect(io.to).toHaveBeenCalledWith("player1");
      expect(io.to).toHaveBeenCalledWith("player2");
      expect(mockToEmit).toHaveBeenCalledTimes(2);
    });

    test("should handle multiple calls for the same player", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", userName: "Repeater", score: 50, killCount: 5, health: 80, bullets: 10 },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");
      refreshPlayerStats("player1");
      refreshPlayerStats("player1");

      // Assert
      expect(io.to).toHaveBeenCalledTimes(3);
      expect(mockToEmit).toHaveBeenCalledTimes(3);
    });
  });
});
