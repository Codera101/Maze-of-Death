/** @format */

const Player = require('../src/models/Player');
const Room = require('../src/models/Room');
const { Directions } = require('../src/models/Direction');

describe('Player', () => {
	let room, player;

	beforeEach(() => {
		room = new Room();
		room.maze.setEmptyMaze();
		player = room.addNewPlayerOnPosition({ x: 5, y: 5 }, 'TestPlayer', 'socket123');
	});

	test('should initialize correctly', () => {
		expect(player.x).toBe(5);
		expect(player.y).toBe(5);
		expect(player.userName).toBe('TestPlayer');
		expect(player.id).toBe('socket123');
		expect(player.direction).toBe(Directions.U);
		expect(player.health).toBe(room.getInitHealth());
		expect(player.bullets).toBe(room.getInitBulltes());
		expect(player.score).toBe(0);
		expect(player.killCount).toBe(0);
	});

	test('should get and set position', () => {
		expect(player.getPosition()).toEqual({ x: 5, y: 5 });
		
		player.setPosition({ x: 10, y: 12 });
		expect(player.getPosition()).toEqual({ x: 10, y: 12 });
	});

	test('should update score correctly', () => {
		player.updateScore(25);
		expect(player.score).toBe(25);
		
		player.updateScore(-10);
		expect(player.score).toBe(15);
	});

	test('should handle damage and prevent negative health', () => {
		player.health = 10;
		player.recieveDamage(3);
		expect(player.health).toBe(7);
		
		player.recieveDamage(100);
		expect(player.health).toBe(0);
	});

	test('should shoot and update bullets', () => {
		const initialBullets = player.bullets;
		player.shoot();
		
		expect(player.bullets).toBe(initialBullets - 1);
		expect(player.timeOfLastShoot).toBeGreaterThan(0);
	});

	test('should not shoot when out of bullets', () => {
		player.bullets = 0;
		player.shoot();
		expect(player.bullets).toBe(0);
	});

	test('should check if can shoot based on cooldown and bullets', () => {
		player.bullets = 3;
		player.timeOfLastShoot = Date.now() - (room.getShootSpeed() + 100);
		expect(player.canShoot()).toBe(true);
		
		player.timeOfLastShoot = Date.now();
		expect(player.canShoot()).toBe(false);
		
		player.bullets = 0;
		expect(player.canShoot()).toBe(false);
	});

	test('should check if can move based on cooldown', () => {
		player.timeOfLastMove = 0;
		expect(player.canMove()).toBe(true);
		
		player.timeOfLastMove = Date.now();
		expect(player.canMove()).toBe(false);
		
		player.timeOfLastMove = Date.now() - (room.getMoveSpeed() + 100);
		expect(player.canMove()).toBe(true);
	});

	test('should update timing properties', () => {
		const beforeMove = Date.now();
		player.updateTimeOfLastMove();
		expect(player.timeOfLastMove).toBeGreaterThanOrEqual(beforeMove);
		
		const beforeShoot = Date.now();
		player.updateTimeOfLastShoot();
		expect(player.timeOfLastShoot).toBeGreaterThanOrEqual(beforeShoot);
	});

	test('should reset all data for respawn', () => {
		player.health = 1;
		player.bullets = 0;
		player.direction = Directions.L;
		player.timeOfLastMove = 99999;
		player.timeOfLastShoot = 88888;
		
		player.resetPlayerDataForRespawn(15, 16);
		
		expect(player.health).toBe(room.getInitHealth());
		expect(player.bullets).toBe(room.getInitBulltes());
		expect(player.direction).toBe(Directions.U);
		expect(player.x).toBe(15);
		expect(player.y).toBe(16);
		expect(player.timeOfLastMove).toBe(0);
		expect(player.timeOfLastShoot).toBe(0);
	});

	test('should handle complete shooting workflow', () => {
		player.bullets = 5;
		player.timeOfLastShoot = 0;
		
		expect(player.canShoot()).toBe(true);
		player.shoot();
		expect(player.bullets).toBe(4);
		expect(player.canShoot()).toBe(false);
		
		player.timeOfLastShoot = Date.now() - (room.getShootSpeed() + 1);
		expect(player.canShoot()).toBe(true);
	});

	test('should handle damage, death, and respawn scenario', () => {
		player.health = 10;
		player.recieveDamage(3);
		expect(player.health).toBe(7);
		
		player.recieveDamage(10);
		expect(player.health).toBe(0);
		
		player.resetPlayerDataForRespawn(5, 5);
		expect(player.health).toBe(room.getInitHealth());
	});
});
