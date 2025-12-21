/**
 * Binary Protocol for WebRTC Data Channels
 * Encodes game state updates into compact binary format
 * Reduces bandwidth from ~200 bytes (JSON) to ~20-30 bytes (Buffer)
 */

/**
 * Encode player state update to binary
 * Format: [type:1][id:4][x:4][y:4][dir:1][health:1][score:2][kills:2][bullets:1][color:4][timestamp:4] = 28 bytes
 * @param {Object} player - Player object
 * @returns {Buffer} - Binary encoded player data
 */
function encodePlayerState(player) {
  const buffer = Buffer.allocUnsafe(28);
  let offset = 0;

  // Message type (1 = player state)
  buffer.writeUInt8(1, offset);
  offset += 1;

  // Player ID (hash to 4 bytes)
  const playerId = hashStringToInt(player.id);
  buffer.writeUInt32LE(playerId, offset);
  offset += 4;

  // Position (x, y as floats)
  buffer.writeFloatLE(player.x || 0, offset);
  offset += 4;
  buffer.writeFloatLE(player.y || 0, offset);
  offset += 4;

  // Direction (0-3 for N, E, S, W)
  const dirMap = { 'N': 0, 'E': 1, 'S': 2, 'W': 3 };
  buffer.writeUInt8(dirMap[player.dir] || 0, offset);
  offset += 1;

  // Health (0-255)
  buffer.writeUInt8(player.health || 0, offset);
  offset += 1;

  // Score (0-65535)
  buffer.writeUInt16LE(player.score || 0, offset);
  offset += 2;

  // Kill count (0-65535)
  buffer.writeUInt16LE(player.kill_count || 0, offset);
  offset += 2;

  // Bullets (0-255)
  buffer.writeUInt8(player.bullets || 0, offset);
  offset += 1;

  // Color (RGBA or hash to 4 bytes)
  const colorHash = hashStringToInt(player.color || '#000000');
  buffer.writeUInt32LE(colorHash, offset);
  offset += 4;

  // Timestamp (4 bytes for sync)
  buffer.writeUInt32LE(Date.now() & 0xFFFFFFFF, offset);

  return buffer;
}

/**
 * Decode player state from binary
 * @param {Buffer} buffer - Binary player data
 * @returns {Object} - Player object
 */
function decodePlayerState(buffer) {
  let offset = 0;

  // Skip message type
  offset += 1;

  const playerId = buffer.readUInt32LE(offset);
  offset += 4;

  const x = buffer.readFloatLE(offset);
  offset += 4;

  const y = buffer.readFloatLE(offset);
  offset += 4;

  const dirMap = ['N', 'E', 'S', 'W'];
  const dir = dirMap[buffer.readUInt8(offset)];
  offset += 1;

  const health = buffer.readUInt8(offset);
  offset += 1;

  const score = buffer.readUInt16LE(offset);
  offset += 2;

  const kill_count = buffer.readUInt16LE(offset);
  offset += 2;

  const bullets = buffer.readUInt8(offset);
  offset += 1;

  const colorHash = buffer.readUInt32LE(offset);
  offset += 4;

  const timestamp = buffer.readUInt32LE(offset);

  return {
    id: playerId,
    x,
    y,
    dir,
    health,
    score,
    kill_count,
    bullets,
    colorHash,
    timestamp
  };
}

/**
 * Encode visible players list to binary
 * Format: [type:1][count:1][playerData1][playerData2]... where each player is 24 bytes
 * @param {Array} players - Array of visible player objects
 * @returns {Buffer} - Binary encoded players list
 */
function encodeVisiblePlayers(players) {
  const playerSize = 24; // id:4 + x:4 + y:4 + dir:1 + color:4 + username_length:1 + username:up to 6 bytes
  const maxPlayers = Math.min(players.length, 255);
  const buffer = Buffer.allocUnsafe(2 + (maxPlayers * playerSize));
  
  let offset = 0;

  // Message type (2 = visible players)
  buffer.writeUInt8(2, offset);
  offset += 1;

  // Player count
  buffer.writeUInt8(maxPlayers, offset);
  offset += 1;

  // Each player
  for (let i = 0; i < maxPlayers; i++) {
    const player = players[i];
    
    // Player ID (hash)
    const playerId = hashStringToInt(player.id);
    buffer.writeUInt32LE(playerId, offset);
    offset += 4;

    // Position
    buffer.writeFloatLE(player.x || 0, offset);
    offset += 4;
    buffer.writeFloatLE(player.y || 0, offset);
    offset += 4;

    // Direction
    const dirMap = { 'N': 0, 'E': 1, 'S': 2, 'W': 3 };
    buffer.writeUInt8(dirMap[player.dir] || 0, offset);
    offset += 1;

    // Color hash
    const colorHash = hashStringToInt(player.color || '#000000');
    buffer.writeUInt32LE(colorHash, offset);
    offset += 4;

    // Username (first 6 chars, length-prefixed)
    const username = (player.username || '').substring(0, 6);
    buffer.writeUInt8(username.length, offset);
    offset += 1;
    buffer.write(username, offset, username.length, 'utf8');
    offset += 6; // Always advance 6 bytes for alignment
  }

  return buffer.slice(0, offset);
}

/**
 * Decode visible players from binary
 * @param {Buffer} buffer - Binary players data
 * @returns {Array} - Array of player objects
 */
function decodeVisiblePlayers(buffer) {
  let offset = 0;

  // Skip message type
  offset += 1;

  const count = buffer.readUInt8(offset);
  offset += 1;

  const players = [];
  const dirMap = ['N', 'E', 'S', 'W'];

  for (let i = 0; i < count; i++) {
    const playerId = buffer.readUInt32LE(offset);
    offset += 4;

    const x = buffer.readFloatLE(offset);
    offset += 4;

    const y = buffer.readFloatLE(offset);
    offset += 4;

    const dir = dirMap[buffer.readUInt8(offset)];
    offset += 1;

    const colorHash = buffer.readUInt32LE(offset);
    offset += 4;

    const usernameLength = buffer.readUInt8(offset);
    offset += 1;

    const username = buffer.toString('utf8', offset, offset + usernameLength);
    offset += 6; // Always advance 6 bytes

    players.push({
      id: playerId,
      x,
      y,
      dir,
      colorHash,
      username
    });
  }

  return players;
}

/**
 * Hash a string to a 32-bit integer
 * @param {string} str - String to hash
 * @returns {number} - 32-bit hash
 */
function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0xFFFFFFFF; // Convert to 32-bit integer
  }
  return hash >>> 0; // Convert to unsigned
}

/**
 * Determine message type from buffer
 * @param {Buffer} buffer - Binary message
 * @returns {number} - Message type (1=player state, 2=visible players)
 */
function getMessageType(buffer) {
  if (buffer.length < 1) return 0;
  return buffer.readUInt8(0);
}

module.exports = {
  encodePlayerState,
  decodePlayerState,
  encodeVisiblePlayers,
  decodeVisiblePlayers,
  getMessageType,
  hashStringToInt
};
