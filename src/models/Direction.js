/** @format */

const Directions = {
  /** @brief Up direction - decreases X coordinate (moves to lower row) */
  U: "U",

  /** @brief Down direction - increases X coordinate (moves to higher row) */
  D: "D",

  /** @brief Left direction - decreases Y coordinate (moves to lower column) */
  L: "L",

  /** @brief Right direction - increases Y coordinate (moves to higher column) */
  R: "R",
};

function getNextPosition(currentPosition, direction) {
  const { x, y } = currentPosition;
  switch (direction) {
    case Directions.U:
      return { x: x - 1, y: y }; // UP decreases row (x)
    case Directions.D:
      return { x: x + 1, y: y }; // DOWN increases row (x)
    case Directions.L:
      return { x: x, y: y - 1 }; // LEFT decreases column (y)
    case Directions.R:
      return { x: x, y: y + 1 }; // RIGHT increases column (y)
    default:
      throw new Error(`Invalid direction: ${direction}`);
  }
}

// Freeze the object to prevent modifications
Object.freeze(Directions);

module.exports = { Directions, getNextPosition };
