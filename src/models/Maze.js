/** @format */

class Maze {
	constructor(height, width) {
		this.height = height;
		this.width = width;
		this.maze = [];
		this.generateMaze();
	}

	/**
	 * @brief initialize the maze all cells has obstacles
	 */
	initialize() {
		for (let i = 0; i < this.height; i++) {
			this.maze[i] = [];
			for (let j = 0; j < this.width; j++) {
				this.maze[i][j] = 1;
			}
		}
	}

	/**
	 * @brief generate the maze randomized dfs algorithm
	 */
	generateMaze() {
		this.initialize();
		this.maze[1][1] = 0;
		this.dfs(1, 1);
	}

	/**
	 * @brief Depth-First Search algorithm to generate the maze
	 * @param {number} x
	 * @param {number} y
	 */
	dfs(x, y) {
		const directions = [
			[0, 2],
			[2, 0],
			[0, -2],
			[-2, 0],
		];
		this.shuffleArray(directions);

		for (const [dx, dy] of directions) {
			const nx = x + dx;
			const ny = y + dy;

			if (this.isValidPosition(nx, ny) && this.maze[nx][ny] === 1) {
				this.maze[x + dx / 2][y + dy / 2] = 0;
				this.maze[nx][ny] = 0;
				this.dfs(nx, ny);
			}
		}
	}

	/**
	 * @brief Shuffle an array in place using Fisher-Yates algorithm
	 * @param {Array} array
	 */
	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	/**
	 * @brief Check if there is an obstacle between two points in the maze
	 * @param {number} startX
	 * @param {number} startY
	 * @param {number} endX
	 * @param {number} endY
	 * @note startX = endX or startY = endY otherwise return false
	 * @returns {boolean} True if there is an obstacle, false otherwise
	 */
	isThereObstacle(startX, startY, endX, endY) {
		if (startX !== endX && startY !== endY) {
			return false;
		}

		if (startX === endX) {
			const minY = Math.min(startY, endY);
			const maxY = Math.max(startY, endY);
			for (let y = minY; y <= maxY; y++) {
				if (this.maze[startX][y] === 1) {
					return true;
				}
			}
		} else {
			const minX = Math.min(startX, endX);
			const maxX = Math.max(startX, endX);
			for (let x = minX; x <= maxX; x++) {
				if (this.maze[x][startY] === 1) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * @brief Check if the cell at (x, y) is empty (no obstacles)
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean} True if the cell is empty, false otherwise
	 */
	isEmptyCell(x, y) {
		return this.maze[x][y] === 0;
	}

	/**
	 * @brief Check if the cell at (x, y) is an obstacle
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean} True if the cell is an obstacle, false otherwise
	 */
	isObstacleCell(x, y) {
		return this.maze[x][y] === 1;
	}

	/**	 * @brief Check if the position (x, y) is valid within the maze boundaries
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean} True if the position is valid, false otherwise
	 */
	isValidPosition(x, y) {
		return x > 0 && x < this.height && y > 0 && y < this.width;
	}

	/**
	 * @brief Check if the position (x, y) is valid for a player to occupy
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean} True if the position is valid and empty, false otherwise
	 */
	isValidForPlayer(x, y) {
		return this.isValidPosition(x, y) && this.isEmptyCell(x, y);
	}

	/**
	 * @breif return empty cells of the maze
	 * @returns {Array} array of empty cells
	 */
	getEmptyCells() {
		const emptyCells = [];
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j < this.width; j++) {
				if (this.maze[i][j] === 0) {
					emptyCells.push([i, j]);
				}
			}
		}
		return emptyCells;
	}

	/**
	 * @brief Print the maze to the console
	 */
	printMaze() {
		for (let i = 0; i < this.height; i++) {
			let row = "";
			for (let j = 0; j < this.width; j++) {
				row += this.maze[i][j] === 1 ? "█" : " ";
			}
			console.log(row);
		}
	}

	/**
	 * @brief Set all cells in the maze to empty (0)
	 * @note it is used for testing purposes
	 */
	setEmptyMaze() {
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j < this.width; j++) {
				this.maze[i][j] = 0;
			}
		}
	}
}

module.exports = Maze;

// Example usage:
// const maze = new Maze(31, 31);
// maze.printMaze();
