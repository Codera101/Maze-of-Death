/**
 * Binary Protocol Client-Side Decoder
 * Mirrors the server-side BinaryProtocol.js for decoding binary game state
 */

window.BinaryProtocol = (function() {
  'use strict';

  /**
   * Decode player state from binary ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer - Binary player data
   * @returns {Object} - Player object
   */
  function decodePlayerState(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    let offset = 0;

    // Skip message type
    offset += 1;

    const playerId = view.getUint32(offset, true); // little-endian
    offset += 4;

    const x = view.getFloat32(offset, true);
    offset += 4;

    const y = view.getFloat32(offset, true);
    offset += 4;

    const dirMap = ['N', 'E', 'S', 'W'];
    const dir = dirMap[view.getUint8(offset)];
    offset += 1;

    const health = view.getUint8(offset);
    offset += 1;

    const score = view.getUint16(offset, true);
    offset += 2;

    const kill_count = view.getUint16(offset, true);
    offset += 2;

    const bullets = view.getUint8(offset);
    offset += 1;

    const colorHash = view.getUint32(offset, true);
    offset += 4;

    const timestamp = view.getUint32(offset, true);

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
   * Decode visible players list from binary ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer - Binary players data
   * @returns {Array} - Array of player objects
   */
  function decodeVisiblePlayers(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    let offset = 0;

    // Skip message type
    offset += 1;

    const count = view.getUint8(offset);
    offset += 1;

    const players = [];
    const dirMap = ['N', 'E', 'S', 'W'];
    const decoder = new TextDecoder('utf-8');

    for (let i = 0; i < count; i++) {
      const playerId = view.getUint32(offset, true);
      offset += 4;

      const x = view.getFloat32(offset, true);
      offset += 4;

      const y = view.getFloat32(offset, true);
      offset += 4;

      const dir = dirMap[view.getUint8(offset)];
      offset += 1;

      const colorHash = view.getUint32(offset, true);
      offset += 4;

      const usernameLength = view.getUint8(offset);
      offset += 1;

      // Extract username bytes
      const usernameBytes = new Uint8Array(arrayBuffer, offset, usernameLength);
      const username = decoder.decode(usernameBytes);
      offset += 6; // Always advance 6 bytes for alignment

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
   * Determine message type from ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer - Binary message
   * @returns {number} - Message type (1=player state, 2=visible players)
   */
  function getMessageType(arrayBuffer) {
    if (arrayBuffer.byteLength < 1) return 0;
    const view = new DataView(arrayBuffer);
    return view.getUint8(0);
  }

  /**
   * Convert hash back to color (simple reverse mapping)
   * Note: This is lossy - we can't perfectly reconstruct the original color from hash
   * For production, consider sending RGB values instead
   * @param {number} hash - Color hash
   * @returns {string} - Approximated hex color
   */
  function hashToColor(hash) {
    // Simple reverse: use hash as RGB components
    const r = (hash >> 16) & 0xFF;
    const g = (hash >> 8) & 0xFF;
    const b = hash & 0xFF;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Public API
  return {
    decodePlayerState,
    decodeVisiblePlayers,
    getMessageType,
    hashToColor,
    
    // Message type constants
    MESSAGE_TYPE: {
      PLAYER_STATE: 1,
      VISIBLE_PLAYERS: 2
    }
  };
})();
