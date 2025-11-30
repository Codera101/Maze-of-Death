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
  emit: jest.fn(),
  to: jest.fn(() => ({
    emit: jest.fn()
  }))
};

describe("refreshRankings", () => {
  let roomControler;
  let messenger;
  let GameRoom;
  let io;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Setup GameRoom mock
    GameRoom = { players: [] };
    mockRoomService.getRoom.mockReturnValue(GameRoom);

    io = mockIo;
    messenger = new Messenger(io, {});
    roomControler = new RoomControler(mockRoomService, messenger, mockLogger);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("sorting by score", () => {
    test("should sort players correctly by score in descending order", () => {
      // Arrange: Create mock players with different scores
      const mockPlayers = [
        { userName: "player1", score: 50, killCount: 5, color: "#FF0000" },
        { userName: "player2", score: 100, killCount: 10, color: "#00FF00" },
        { userName: "player3", score: 75, killCount: 7, color: "#0000FF" },
      ];
      GameRoom.players = mockPlayers;

      // Act: Call refreshRankings
      roomControler.refreshRankings();

      // Assert: Verify io.emit was called with correctly sorted rankings
      expect(io.emit).toHaveBeenCalledTimes(1);
      expect(io.emit).toHaveBeenCalledWith("refresh_rank", expect.any(String));

      // Parse the emitted data to verify sorting
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players).toHaveLength(3);
      expect(emittedData.all_players[0].username).toBe("player2"); // score 100
      expect(emittedData.all_players[1].username).toBe("player3"); // score 75
      expect(emittedData.all_players[2].username).toBe("player1"); // score 50
    });

    test("should handle players with same high score at the top", () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 100, killCount: 5, color: "#FF0000" },
        { userName: "player2", score: 100, killCount: 10, color: "#00FF00" },
        { userName: "player3", score: 50, killCount: 7, color: "#0000FF" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players[0].score).toBe(100);
      expect(emittedData.all_players[1].score).toBe(100);
      expect(emittedData.all_players[2].score).toBe(50);
    });

    test("should handle all players with same score", () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 75, killCount: 3, color: "#FF0000" },
        { userName: "player2", score: 75, killCount: 8, color: "#00FF00" },
        { userName: "player3", score: 75, killCount: 5, color: "#0000FF" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players.every((r) => r.score === 75)).toBe(true);
    });
  });

  describe("sorting by killCount when scores are equal", () => {
    test("should sort players correctly by kill count in descending order when scores are equal", () => {
      // Arrange: Create mock players with equal scores but different kill counts
      const mockPlayers = [
        { userName: "player1", score: 100, killCount: 5, color: "#FF0000" },
        { userName: "player2", score: 100, killCount: 10, color: "#00FF00" },
        { userName: "player3", score: 100, killCount: 3, color: "#0000FF" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players).toHaveLength(3);
      expect(emittedData.all_players[0].username).toBe("player2"); // killCount 10
      expect(emittedData.all_players[0].killCount).toBe(10);
      expect(emittedData.all_players[1].username).toBe("player1"); // killCount 5
      expect(emittedData.all_players[1].killCount).toBe(5);
      expect(emittedData.all_players[2].username).toBe("player3"); // killCount 3
      expect(emittedData.all_players[2].killCount).toBe(3);
    });

    test("should prioritize score over kill count", () => {
      // Arrange: Higher killCount but lower score should rank lower
      const mockPlayers = [
        { userName: "player1", score: 50, killCount: 20, color: "#FF0000" },
        { userName: "player2", score: 100, killCount: 5, color: "#00FF00" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players[0].username).toBe("player2"); // score 100
      expect(emittedData.all_players[1].username).toBe("player1"); // score 50
    });

    test("should handle mixed scores with some equal", () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 100, killCount: 5, color: "#FF0000" },
        { userName: "player2", score: 100, killCount: 10, color: "#00FF00" },
        { userName: "player3", score: 75, killCount: 15, color: "#0000FF" },
        { userName: "player4", score: 75, killCount: 8, color: "#FFFF00" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players[0].username).toBe("player2"); // score 100, killCount 10
      expect(emittedData.all_players[1].username).toBe("player1"); // score 100, killCount 5
      expect(emittedData.all_players[2].username).toBe("player3"); // score 75, killCount 15
      expect(emittedData.all_players[3].username).toBe("player4"); // score 75, killCount 8
    });
  });

  describe("data mapping format", () => {
    test("should map player data to the correct output format", () => {
      // Arrange
      const mockPlayers = [
        {
          userName: "testUser1",
          score: 100,
          killCount: 10,
          color: "#FF0000",
          // Additional properties that should NOT be in output
          x: 5,
          y: 10,
          health: 100,
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      const ranking = emittedData.all_players[0];

      // Should have exactly these 4 properties
      expect(Object.keys(ranking)).toEqual([
        "username",
        "score",
        "killCount",
        "color",
      ]);

      // Should map correctly
      expect(ranking.username).toBe("testUser1");
      expect(ranking.score).toBe(100);
      expect(ranking.killCount).toBe(10);
      expect(ranking.color).toBe("#FF0000");

      // Should not include other properties
      expect(ranking.x).toBeUndefined();
      expect(ranking.y).toBeUndefined();
      expect(ranking.health).toBeUndefined();
    });

    test("should handle different data types correctly", () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 0, killCount: 0, color: "#000000" },
        {
          userName: "player2",
          score: 999999,
          killCount: 99999,
          color: "#FFFFFF",
        },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);

      // Verify data types
      expect(typeof emittedData.all_players[0].username).toBe("string");
      expect(typeof emittedData.all_players[0].score).toBe("number");
      expect(typeof emittedData.all_players[0].killCount).toBe("number");
      expect(typeof emittedData.all_players[0].color).toBe("string");
    });

    test("should map multiple players correctly", () => {
      // Arrange
      const mockPlayers = [
        { userName: "alice", score: 150, killCount: 12, color: "#AA0000" },
        { userName: "bob", score: 120, killCount: 8, color: "#00BB00" },
        { userName: "charlie", score: 90, killCount: 5, color: "#0000CC" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players).toHaveLength(3);

      // Verify each player is mapped correctly
      emittedData.all_players.forEach((ranking, index) => {
        expect(ranking).toHaveProperty("username");
        expect(ranking).toHaveProperty("score");
        expect(ranking).toHaveProperty("killCount");
        expect(ranking).toHaveProperty("color");
      });
    });
  });

  describe("socket emission", () => {
    test('should emit the "refresh_rank" event with correctly formatted rankings', () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 100, killCount: 10, color: "#FF0000" },
        { userName: "player2", score: 75, killCount: 5, color: "#00FF00" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      expect(io.emit).toHaveBeenCalledTimes(1);
      expect(io.emit).toHaveBeenCalledWith("refresh_rank", expect.any(String));
    });

    test("should emit valid JSON string", () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 100, killCount: 10, color: "#FF0000" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = io.emit.mock.calls[0][1];
      expect(() => JSON.parse(emittedData)).not.toThrow();

      const parsed = JSON.parse(emittedData);
      expect(parsed).toHaveProperty("all_players");
      expect(Array.isArray(parsed.all_players)).toBe(true);
    });

    test('should emit rankings wrapped in an object with "rankings" key', () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 100, killCount: 10, color: "#FF0000" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData).toEqual({
        all_players: expect.any(Array),
      });
    });

    test("should emit correctly with empty players list", () => {
      // Arrange
      GameRoom.players = [];

      // Act
      roomControler.refreshRankings();

      // Assert
      expect(io.emit).toHaveBeenCalledTimes(1);
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players).toEqual([]);
    });
  });

  describe("edge cases", () => {
    test("should handle single player", () => {
      // Arrange
      const mockPlayers = [
        { userName: "onlyPlayer", score: 50, killCount: 3, color: "#123456" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players).toHaveLength(1);
      expect(emittedData.all_players[0].username).toBe("onlyPlayer");
    });

    test("should handle players with zero scores and kill counts", () => {
      // Arrange
      const mockPlayers = [
        { userName: "player1", score: 0, killCount: 0, color: "#FF0000" },
        { userName: "player2", score: 0, killCount: 0, color: "#00FF00" },
      ];
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players).toHaveLength(2);
      expect(emittedData.all_players.every((r) => r.score === 0)).toBe(true);
      expect(emittedData.all_players.every((r) => r.killCount === 0)).toBe(
        true
      );
    });

    test("should handle large number of players", () => {
      // Arrange
      const mockPlayers = Array.from({ length: 100 }, (_, i) => ({
        userName: `player${i}`,
        score: Math.floor(Math.random() * 1000),
        killCount: Math.floor(Math.random() * 50),
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      }));
      GameRoom.players = mockPlayers;

      // Act
      roomControler.refreshRankings();

      // Assert
      const emittedData = JSON.parse(io.emit.mock.calls[0][1]);
      expect(emittedData.all_players).toHaveLength(100);

      // Verify sorting is still correct
      for (let i = 0; i < emittedData.all_players.length - 1; i++) {
        const current = emittedData.all_players[i];
        const next = emittedData.all_players[i + 1];

        if (current.score === next.score) {
          // If scores are equal, killCount should be in descending order
          expect(current.killCount).toBeGreaterThanOrEqual(next.killCount);
        } else {
          // Scores should be in descending order
          expect(current.score).toBeGreaterThan(next.score);
        }
      }
    });
  });
});
