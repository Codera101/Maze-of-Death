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
        { id: "player1", score: 50, killCount: 5, color: "#FF0000" },
        { id: "player2", score: 100, killCount: 10, color: "#00FF00" },
        { id: "player3", score: 75, killCount: 7, color: "#0000FF" },
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
        score: 100,
        killCount: 10,
        color: "#00FF00",
      });
    });

    test("should not emit if player id is not found", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", score: 50, killCount: 5, color: "#FF0000" },
        { id: "player2", score: 100, killCount: 10, color: "#00FF00" },
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
    test("should emit only score, killCount, and color", () => {
      // Arrange
      const mockPlayers = [
        {
          id: "player1",
          score: 50,
          killCount: 5,
          color: "#FF0000",
          userName: "TestUser",
          health: 100,
          extraField: "should not be included",
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
        score: 50,
        killCount: 5,
        color: "#FF0000",
      });
      expect(emittedData.userName).toBeUndefined();
      expect(emittedData.health).toBeUndefined();
      expect(emittedData.extraField).toBeUndefined();
    });

    test("should handle player with zero stats", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", score: 0, killCount: 0, color: "#000000" },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        score: 0,
        killCount: 0,
        color: "#000000",
      });
    });

    test("should handle player with negative values", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", score: -10, killCount: -5, color: "#FF0000" },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        score: -10,
        killCount: -5,
        color: "#FF0000",
      });
    });

    test("should handle player with large numbers", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", score: 999999, killCount: 88888, color: "#ABCDEF" },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        score: 999999,
        killCount: 88888,
        color: "#ABCDEF",
      });
    });
  });

  describe("socket emission", () => {
    test("should emit to the correct player socket", () => {
      // Arrange
      const mockPlayers = [
        { id: "socket123", score: 75, killCount: 8, color: "#0000FF" },
        { id: "socket456", score: 50, killCount: 3, color: "#00FF00" },
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
        { id: "player1", score: 100, killCount: 10, color: "#FF0000" },
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
        { id: "player1", score: 85, killCount: 9, color: "#AABBCC" },
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

      // Act & Assert
      expect(() => refreshPlayerStats("player1")).toThrow();
    });

    test("should handle player with missing color field", () => {
      // Arrange
      const mockPlayers = [{ id: "player1", score: 50, killCount: 5 }];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("player1");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        score: 50,
        killCount: 5,
        color: undefined,
      });
    });

    test("should handle first player in list", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", score: 10, killCount: 1, color: "#111111" },
        { id: "player2", score: 20, killCount: 2, color: "#222222" },
        { id: "player3", score: 30, killCount: 3, color: "#333333" },
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
        { id: "player1", score: 10, killCount: 1, color: "#111111" },
        { id: "player2", score: 20, killCount: 2, color: "#222222" },
        { id: "player3", score: 30, killCount: 3, color: "#333333" },
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
          score: 50,
          killCount: 5,
          color: "#FF0000",
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
        { id: "onlyplayer", score: 42, killCount: 4, color: "#FFFFFF" },
      ];
      Room.players = mockPlayers;

      const mockToEmit = jest.fn();
      io.to = jest.fn(() => ({ emit: mockToEmit }));

      // Act
      refreshPlayerStats("onlyplayer");

      // Assert
      const emittedData = JSON.parse(mockToEmit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        score: 42,
        killCount: 4,
        color: "#FFFFFF",
      });
    });
  });

  describe("multiple calls", () => {
    test("should handle multiple calls for different players", () => {
      // Arrange
      const mockPlayers = [
        { id: "player1", score: 10, killCount: 1, color: "#AA0000" },
        { id: "player2", score: 20, killCount: 2, color: "#00AA00" },
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
        { id: "player1", score: 50, killCount: 5, color: "#FF0000" },
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
