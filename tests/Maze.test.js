/** @format */

const Maze = require('../src/models/Maze');

describe('Maze', () => {
	describe('Constructor', () => {
		test('should correctly initialize dimensions', () => {
			const height = 10;
			const width = 15;
			const maze = new Maze(height, width);

			expect(maze.height).toBe(height);
			expect(maze.width).toBe(width);
		});

		test('should initialize maze array', () => {
			const maze = new Maze(10, 15);
			
			expect(maze.maze).toBeDefined();
			expect(Array.isArray(maze.maze)).toBe(true);
		});

		test('should call generateMaze during construction', () => {
			const generateMazeSpy = jest.spyOn(Maze.prototype, 'generateMaze');
			const maze = new Maze(10, 15);

			expect(generateMazeSpy).toHaveBeenCalledTimes(1);
			
			generateMazeSpy.mockRestore();
		});

		test('should have a maze with correct dimensions after construction', () => {
			const height = 11;
			const width = 13;
			const maze = new Maze(height, width);

			expect(maze.maze.length).toBe(height);
			for (let i = 0; i < height; i++) {
				expect(maze.maze[i].length).toBe(width);
			}
		});
	});

	describe('initialize', () => {
		test('should fill maze with obstacles (1s)', () => {
			const maze = new Maze(5, 5);
			
			// Mock generateMaze to only call initialize
			maze.generateMaze = jest.fn();
			maze.initialize();

			for (let i = 0; i < maze.height; i++) {
				for (let j = 0; j < maze.width; j++) {
					expect(maze.maze[i][j]).toBe(1);
				}
			}
		});

		test('should create maze array with correct dimensions', () => {
			const height = 7;
			const width = 9;
			const maze = new Maze(height, width);
			
			maze.generateMaze = jest.fn();
			maze.initialize();

			expect(maze.maze.length).toBe(height);
			for (let i = 0; i < height; i++) {
				expect(maze.maze[i].length).toBe(width);
			}
		});

		test('should overwrite existing maze data', () => {
			const maze = new Maze(5, 5);
			
			// Set some cells to 0
			maze.maze[2][2] = 0;
			maze.maze[3][3] = 0;

			maze.initialize();

			// All cells should be obstacles now
			for (let i = 0; i < maze.height; i++) {
				for (let j = 0; j < maze.width; j++) {
					expect(maze.maze[i][j]).toBe(1);
				}
			}
		});
	});

	describe('isValidPosition', () => {
		let maze;

		beforeEach(() => {
			maze = new Maze(10, 10);
		});

		test('should return true for valid coordinates inside boundaries', () => {
			expect(maze.isValidPosition(1, 1)).toBe(true);
			expect(maze.isValidPosition(5, 5)).toBe(true);
			expect(maze.isValidPosition(8, 8)).toBe(true);
		});

		test('should return false for coordinates at or below 0', () => {
			expect(maze.isValidPosition(0, 5)).toBe(false);
			expect(maze.isValidPosition(5, 0)).toBe(false);
			expect(maze.isValidPosition(0, 0)).toBe(false);
			expect(maze.isValidPosition(-1, 5)).toBe(false);
			expect(maze.isValidPosition(5, -1)).toBe(false);
		});

		test('should return false for coordinates at or beyond height/width', () => {
			expect(maze.isValidPosition(10, 5)).toBe(false);
			expect(maze.isValidPosition(5, 10)).toBe(false);
			expect(maze.isValidPosition(10, 10)).toBe(false);
			expect(maze.isValidPosition(11, 5)).toBe(false);
			expect(maze.isValidPosition(5, 11)).toBe(false);
		});

		test('should return true for edge valid positions', () => {
			expect(maze.isValidPosition(1, 1)).toBe(true);
			expect(maze.isValidPosition(9, 9)).toBe(true);
			expect(maze.isValidPosition(1, 9)).toBe(true);
			expect(maze.isValidPosition(9, 1)).toBe(true);
		});
	});

	describe('isThereObstacle', () => {
		let maze;

		beforeEach(() => {
			// Create a maze and manually set up obstacles for testing
			maze = new Maze(10, 10);
			maze.generateMaze = jest.fn();
			maze.initialize();
			
			// Create a clear horizontal path at row 3
			for (let j = 1; j < 9; j++) {
				maze.maze[3][j] = 0;
			}
			
			// Create a clear vertical path at column 3
			for (let i = 1; i < 9; i++) {
				maze.maze[i][3] = 0;
			}
			
			// Add an obstacle in the middle of horizontal path
			maze.maze[3][5] = 1;
			
			// Add an obstacle in the middle of vertical path
			maze.maze[5][3] = 1;
		});

		describe('aligned cases (horizontal)', () => {
			test('should return false when no obstacles on horizontal path', () => {
				// Clear path from (3,1) to (3,4)
				expect(maze.isThereObstacle(3, 1, 3, 4)).toBe(false);
			});

			test('should return true when obstacle exists on horizontal path', () => {
				// Path from (3,4) to (3,6) contains obstacle at (3,5)
				expect(maze.isThereObstacle(3, 4, 3, 6)).toBe(true);
			});

			test('should work with reversed start and end coordinates', () => {
				expect(maze.isThereObstacle(3, 6, 3, 4)).toBe(true);
			});
		});

		describe('aligned cases (vertical)', () => {
			test('should return false when no obstacles on vertical path', () => {
				// Clear path from (1,3) to (4,3)
				expect(maze.isThereObstacle(1, 3, 4, 3)).toBe(false);
			});

			test('should return true when obstacle exists on vertical path', () => {
				// Path from (4,3) to (6,3) contains obstacle at (5,3)
				expect(maze.isThereObstacle(4, 3, 6, 3)).toBe(true);
			});

			test('should work with reversed start and end coordinates', () => {
				expect(maze.isThereObstacle(6, 3, 4, 3)).toBe(true);
			});
		});

		describe('non-aligned cases', () => {
			let consoleErrorSpy;

			beforeEach(() => {
				consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
			});

			afterEach(() => {
				consoleErrorSpy.mockRestore();
			});

			test('should return false for non-aligned diagonal points', () => {
				const result = maze.isThereObstacle(1, 1, 5, 5);
				
				expect(result).toBe(false);
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					"Invalid input: start and end points must be aligned either horizontally or vertically."
				);
			});

			test('should return false for any non-aligned points', () => {
				const result = maze.isThereObstacle(2, 3, 7, 8);
				
				expect(result).toBe(false);
				expect(consoleErrorSpy).toHaveBeenCalled();
			});
		});

		describe('edge cases', () => {
			test('should handle single cell (start equals end)', () => {
				maze.maze[5][5] = 0;
				expect(maze.isThereObstacle(5, 5, 5, 5)).toBe(false);
				
				maze.maze[6][6] = 1;
				expect(maze.isThereObstacle(6, 6, 6, 6)).toBe(true);
			});

			test('should handle adjacent cells', () => {
				maze.maze[2][2] = 0;
				maze.maze[2][3] = 0;
				expect(maze.isThereObstacle(2, 2, 2, 3)).toBe(false);
				
				maze.maze[2][3] = 1;
				expect(maze.isThereObstacle(2, 2, 2, 3)).toBe(true);
			});
		});
	});

	describe('isEmptyCell', () => {
		let maze;

		beforeEach(() => {
			maze = new Maze(10, 10);
			maze.generateMaze = jest.fn();
			maze.initialize();
		});

		test('should return true when cell value is 0', () => {
			maze.maze[3][3] = 0;
			expect(maze.isEmptyCell(3, 3)).toBe(true);
		});

		test('should return false when cell value is 1', () => {
			maze.maze[3][3] = 1;
			expect(maze.isEmptyCell(3, 3)).toBe(false);
		});

		test('should correctly identify multiple empty cells', () => {
			maze.maze[1][1] = 0;
			maze.maze[2][2] = 0;
			maze.maze[3][3] = 0;

			expect(maze.isEmptyCell(1, 1)).toBe(true);
			expect(maze.isEmptyCell(2, 2)).toBe(true);
			expect(maze.isEmptyCell(3, 3)).toBe(true);
		});

		test('should correctly identify multiple obstacle cells', () => {
			maze.maze[4][4] = 1;
			maze.maze[5][5] = 1;
			maze.maze[6][6] = 1;

			expect(maze.isEmptyCell(4, 4)).toBe(false);
			expect(maze.isEmptyCell(5, 5)).toBe(false);
			expect(maze.isEmptyCell(6, 6)).toBe(false);
		});
	});

	describe('isObstacleCell', () => {
		let maze;

		beforeEach(() => {
			maze = new Maze(10, 10);
			maze.generateMaze = jest.fn();
			maze.initialize();
		});

		test('should return true when cell value is 1', () => {
			maze.maze[3][3] = 1;
			expect(maze.isObstacleCell(3, 3)).toBe(true);
		});

		test('should return false when cell value is 0', () => {
			maze.maze[3][3] = 0;
			expect(maze.isObstacleCell(3, 3)).toBe(false);
		});

		test('should correctly identify multiple obstacle cells', () => {
			maze.maze[1][1] = 1;
			maze.maze[2][2] = 1;
			maze.maze[3][3] = 1;

			expect(maze.isObstacleCell(1, 1)).toBe(true);
			expect(maze.isObstacleCell(2, 2)).toBe(true);
			expect(maze.isObstacleCell(3, 3)).toBe(true);
		});

		test('should correctly identify multiple empty cells', () => {
			maze.maze[4][4] = 0;
			maze.maze[5][5] = 0;
			maze.maze[6][6] = 0;

			expect(maze.isObstacleCell(4, 4)).toBe(false);
			expect(maze.isObstacleCell(5, 5)).toBe(false);
			expect(maze.isObstacleCell(6, 6)).toBe(false);
		});

		test('should be inverse of isEmptyCell', () => {
			maze.maze[7][7] = 0;
			expect(maze.isEmptyCell(7, 7)).toBe(!maze.isObstacleCell(7, 7));

			maze.maze[8][8] = 1;
			expect(maze.isEmptyCell(8, 8)).toBe(!maze.isObstacleCell(8, 8));
		});
	});
});
