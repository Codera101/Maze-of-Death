/** @format */

const RoomService = require('../src/services/RoomServices');
const Room = require('../src/models/Room');
const { Directions } = require('../src/models/Direction');

describe('RoomService', () => {
	let roomService;

	beforeEach(() => {
		roomService = new RoomService();
	});

	describe('Player Join/Leave', () => {
		test('should add a player to the global room successfully', () => {
			const player = roomService.playerJoinRoom('TestPlayer', 'socket123');
			
			expect(player).not.toBeNull();
			expect(player.userName).toBe('TestPlayer');
			expect(player.id).toBe('socket123');
			expect(roomService.isPlayerInRoom('socket123')).toBe(true);
		});

		test('should not allow a player to join twice', () => {
			roomService.playerJoinRoom('TestPlayer', 'socket123');
			const secondAttempt = roomService.playerJoinRoom('TestPlayer', 'socket123');
			
			expect(secondAttempt).toBeNull();
		});

		test('should return null when joining non-existent room', () => {
			const player = roomService.playerJoinRoom('TestPlayer', 'socket123', 'non-existent');
			
			expect(player).toBeNull();
		});

		test('should remove a player from a room', () => {
			roomService.playerJoinRoom('TestPlayer', 'socket123');
			expect(roomService.isPlayerInRoom('socket123')).toBe(true);
			
			const removed = roomService.playerLeaveRoom('socket123');
			
			expect(removed).toBe(true);
			expect(roomService.isPlayerInRoom('socket123')).toBe(false);
		});

		test('should return false when removing non-existent player', () => {
			const removed = roomService.playerLeaveRoom('non-existent');
			
			expect(removed).toBe(false);
		});
	});

	describe('Player Movement', () => {
		beforeEach(() => {
			roomService.playerJoinRoom('TestPlayer', 'socket123');
			const room = roomService.getRoom('global');
			room.maze.setEmptyMaze();
		});

		test('should move player in valid direction', () => {
			const player = roomService.getPlayer('socket123');
			player.timeOfLastMove = 0; // Reset cooldown
			
			const result = roomService.playerMove('socket123', Directions.R);
			
			expect(result).toBe(true);
		});

		test('should return false for non-existent player', () => {
			const result = roomService.playerMove('non-existent', Directions.R);
			
			expect(result).toBe(false);
		});
	});

	describe('Player Shooting', () => {
		beforeEach(() => {
			roomService.playerJoinRoom('Shooter', 'shooter123');
			roomService.playerJoinRoom('Target', 'target456');
			const room = roomService.getRoom('global');
			room.maze.setEmptyMaze();
		});

		test('should return action message when player shoots', () => {
			const shooter = roomService.getPlayer('shooter123');
			shooter.bullets = 5;
			shooter.timeOfLastShoot = 0; // Reset cooldown
			shooter.direction = Directions.R; // Set direction explicitly to avoid undefined
			
			const actionMessage = roomService.playerShoot('shooter123');
			
			expect(actionMessage).not.toBeNull();
			expect(actionMessage).toHaveProperty('type');
		});

		test('should return null for non-existent player', () => {
			const actionMessage = roomService.playerShoot('non-existent');
			
			expect(actionMessage).toBeNull();
		});
	});

	describe('Room and Player Queries', () => {
		test('should get player room', () => {
			roomService.playerJoinRoom('TestPlayer', 'socket123');
			const roomId = roomService.getPlayerRoom('socket123');
			
			expect(roomId).toBe('global');
		});

		test('should return undefined for non-existent player room', () => {
			const roomId = roomService.getPlayerRoom('non-existent');
			
			expect(roomId).toBeUndefined();
		});

		test('should get room by ID', () => {
			const room = roomService.getRoom('global');
			
			expect(room).toBeInstanceOf(Room);
		});

		test('should get player by ID', () => {
			roomService.playerJoinRoom('TestPlayer', 'socket123');
			const player = roomService.getPlayer('socket123');
			
			expect(player).not.toBeNull();
			expect(player.userName).toBe('TestPlayer');
		});

		test('should return null for non-existent player', () => {
			const player = roomService.getPlayer('non-existent');
			
			expect(player).toBeNull();
		});
	});

	describe('Multiple Players', () => {
		test('should handle multiple players in the same room', () => {
			const player1 = roomService.playerJoinRoom('Player1', 'socket1');
			const player2 = roomService.playerJoinRoom('Player2', 'socket2');
			const player3 = roomService.playerJoinRoom('Player3', 'socket3');
			
			expect(player1).not.toBeNull();
			expect(player2).not.toBeNull();
			expect(player3).not.toBeNull();
			expect(roomService.isPlayerInRoom('socket1')).toBe(true);
			expect(roomService.isPlayerInRoom('socket2')).toBe(true);
			expect(roomService.isPlayerInRoom('socket3')).toBe(true);
			
			const room = roomService.getRoom('global');
			expect(room.players.length).toBe(3);
		});

		test('should remove specific player without affecting others', () => {
			roomService.playerJoinRoom('Player1', 'socket1');
			roomService.playerJoinRoom('Player2', 'socket2');
			roomService.playerJoinRoom('Player3', 'socket3');
			
			roomService.playerLeaveRoom('socket2');
			
			expect(roomService.isPlayerInRoom('socket1')).toBe(true);
			expect(roomService.isPlayerInRoom('socket2')).toBe(false);
			expect(roomService.isPlayerInRoom('socket3')).toBe(true);
			
			const room = roomService.getRoom('global');
			expect(room.players.length).toBe(2);
		});
	});
});
