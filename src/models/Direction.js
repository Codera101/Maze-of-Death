const Directions = {
  /** @brief Up direction - decreases Y coordinate */
  U: 'U',
  
  /** @brief Down direction - increases Y coordinate */
  D: 'D',
  
  /** @brief Left direction - decreases X coordinate */
  L: 'L',
  
  /** @brief Right direction - increases X coordinate */
  R: 'R'
};

// Freeze the object to prevent modifications
Object.freeze(Directions);

module.exports = Directions;
