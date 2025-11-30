/** @format */

const Room = require('../src/models/Room');
const { Directions } = require('../src/models/Direction');
const { ActionMessageTypes } = require('../src/models/Messages');

describe('Room', () => {
	let room;

	beforeEach(() => {
		room = new Room();
		room.maze.setEmptyMaze();
	});

	describe('handlePlayerMove', () => {
		test('should move player successfully in empty space', () => {
			const player = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Alice', 'socket1');
			
			const result = room.handlePlayerMove(player, Directions.R);
			
			expect(result).toBe(true);
			expect(player.getPosition()).toEqual({ x: 5, y: 6 });
		});

		test('should prevent move into obstacle', () => {
			const player = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Bob', 'socket2');
			room.maze.maze[5][6] = 1; // Add obstacle to the right (y+1)
			
			const result = room.handlePlayerMove(player, Directions.R);
			
			expect(result).toBe(false);
			expect(player.getPosition()).toEqual({ x: 5, y: 5 });
		});

		test('should prevent move into another player', () => {
			const player1 = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Charlie', 'socket3');
			const player2 = room.addNewPlayerOnPosition({ x: 5, y: 6 }, 'Dave', 'socket4');
			
			const result = room.handlePlayerMove(player1, Directions.R);
			
			expect(result).toBe(false);
			expect(player1.getPosition()).toEqual({ x: 5, y: 5 });
		});

		test('should move in all directions', () => {
			const player = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Eve', 'socket5');
			
			room.handlePlayerMove(player, Directions.U);
			expect(player.getPosition()).toEqual({ x: 4, y: 5 });
			
			room.handlePlayerMove(player, Directions.R);
			expect(player.getPosition()).toEqual({ x: 4, y: 6 });
			
			room.handlePlayerMove(player, Directions.D);
			expect(player.getPosition()).toEqual({ x: 5, y: 6 });
			
			room.handlePlayerMove(player, Directions.L);
			expect(player.getPosition()).toEqual({ x: 5, y: 5 });
		});
	});

	describe('handlePlayerShoot', () => {
		test('should return INVALID when player cannot shoot', () => {
			const shooter = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Frank', 'socket6');
			shooter.bullets = 0;
			
			const result = room.handlePlayerShoot(shooter);
			
			expect(result.type).toBe(ActionMessageTypes.INVALID);
		});

		test('should return NOTHING when bullet hits wall', () => {
			const shooter = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Grace', 'socket7');
			shooter.direction = Directions.R;
			room.maze.maze[5][6] = 1; // Add wall to the right
			
			const result = room.handlePlayerShoot(shooter);
			
			expect(result.type).toBe(ActionMessageTypes.NOTHING);
		});

		test('should return HIT when bullet hits player', () => {
			const shooter = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Henry', 'socket8');
			const target = room.addNewPlayerOnPosition({ x: 5, y: 7 }, 'Ivy', 'socket9');
			shooter.direction = Directions.R;
			target.health = 10;
			
			const result = room.handlePlayerShoot(shooter);
			
			expect(result.type).toBe(ActionMessageTypes.HIT);
			expect(result.actionSource).toBe('socket8');
			expect(result.actionTarget).toBe('socket9');
			expect(target.health).toBe(10 - room.getRoomDamage());
		});

		test('should return KILL when bullet kills player', () => {
			const shooter = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Jack', 'socket10');
			const target = room.addNewPlayerOnPosition({ x: 5, y: 7 }, 'Kate', 'socket11');
			shooter.direction = Directions.R;
			target.health = room.getRoomDamage(); // Just enough to kill
			
			const result = room.handlePlayerShoot(shooter);
			
			expect(result.type).toBe(ActionMessageTypes.KILL);
			expect(result.actionSource).toBe('socket10');
			expect(result.actionTarget).toBe('socket11');
			expect(target.health).toBe(0);
		});

		test('should decrement shooter bullets', () => {
			const shooter = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Noah', 'socket14');
			const initialBullets = shooter.bullets;
			shooter.direction = Directions.R;
			
			room.handlePlayerShoot(shooter);
			
			expect(shooter.bullets).toBe(initialBullets - 1);
		});

		test('should shoot through empty cells and hit distant target', () => {
			const shooter = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Olivia', 'socket15');
			const target = room.addNewPlayerOnPosition({ x: 5, y: 10 }, 'Paul', 'socket16');
			shooter.direction = Directions.R;
			target.health = 10;
			
			const result = room.handlePlayerShoot(shooter);
			
			expect(result.type).toBe(ActionMessageTypes.HIT);
			expect(result.actionTarget).toBe('socket16');
			expect(target.health).toBe(10 - room.getRoomDamage());
		});
	});

	describe('getPlayerById', () => {
		test('should find player by id', () => {
			const player1 = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'Quinn', 'socket17');
			const player2 = room.addNewPlayerOnPosition({ x: 6, y: 6 }, 'Rose', 'socket18');
			
			expect(room.getPlayerById('socket17')).toBe(player1);
			expect(room.getPlayerById('socket18')).toBe(player2);
		});

		test('should return undefined for non-existent player', () => {
			expect(room.getPlayerById('nonexistent')).toBeUndefined();
		});
	});
});
