/** @format */

class Maze {
	constructor() {}

	/**
	 * @brief Check if there is an obstacle between two points in the maze
	 * @param {number} startX
	 * @param {number} startY
	 * @param {number} endX
	 * @param {number} endY
	 * @note startX = endX or startY = endY otherwise return false
	 * @returns {boolean} True if there is an obstacle, false otherwise
	 */
	isThereObstacle(startX, startY, endX, endY) {}

	/**
	 * @brief Check if the cell at (x, y) is empty (no obstacles)
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean} True if the cell is empty, false otherwise
	 */
	isEmptyCell(x, y) {}

	/**
	 * @brief Check if the cell at (x, y) is an obstacle
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean} True if the cell is an obstacle, false otherwise
	 */
	isObstacleCell(x, y) {}
}
