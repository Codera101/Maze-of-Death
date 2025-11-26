/** @format */

const Directions = {
	/** @brief Up direction - decreases Y coordinate */
	U: "U",

	/** @brief Down direction - increases Y coordinate */
	D: "D",

	/** @brief Left direction - decreases X coordinate */
	L: "L",

	/** @brief Right direction - increases X coordinate */
	R: "R",
};

function getNextPosition(currentPosition, direction) {
	const { x, y } = currentPosition;
	switch (direction) {
		case Directions.U:
			return { x, y: y - 1 };
		case Directions.D:
			return { x, y: y + 1 };
		case Directions.L:
			return { x: x - 1, y };
		case Directions.R:
			return { x: x + 1, y };
		default:
			throw new Error(`Invalid direction: ${direction}`);
	}
}

// Freeze the object to prevent modifications
Object.freeze(Directions);

module.exports = { Directions, getNextPosition };
