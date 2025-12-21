/**
 * Message Priority Classification
 * Defines which events should use which transport protocol
 */

const MessagePriority = {
  /**
   * CRITICAL events - MUST use Socket.io (TCP) for guaranteed delivery
   * These events affect game state, scoring, or player lifecycle
   */
  CRITICAL: [
    'join_player',           // Player join request
    'player_joined',         // Join confirmation with initial state
    'disconnect',            // Player disconnect
    'shoot',                 // Shooting action (affects score)
    'target_hit',            // Hit confirmation with score update
    'got_hit',               // Notification of being hit
    'died',                  // Death notification with respawn time
    'respawn',               // Respawn request
    'respawn_done',          // Respawn completion with new position
    'kill_message',          // Kill event broadcast (affects leaderboard)
    'player_death_animation',// Death animation broadcast
    'refresh_ranking',       // Global leaderboard update (1Hz)
    'room_full',             // Room capacity error
    'draw_maze',             // Initial maze layout
    'welcome',               // Welcome message on connect
    'pong'                   // Connection test
  ],

  /**
   * REALTIME events - Should use WebRTC (UDP-like) for low latency
   * These are high-frequency updates that can tolerate packet loss
   * Loss is acceptable because next update arrives in ~50ms
   */
  REALTIME: [
    'player_move',           // Movement input (20-60Hz)
    'player_moved',          // Movement confirmation
    'refresh_player',        // Player stats update (20Hz - every 50ms)
    'refresh_players',       // Visible players update (20Hz - every 50ms)
    'player_hit_animation'   // Hit animation (visual feedback only)
  ]
};

/**
 * Check if an event should use WebRTC
 * @param {string} eventName - The event name
 * @returns {boolean} - True if event should use WebRTC when available
 */
function isRealtimeEvent(eventName) {
  return MessagePriority.REALTIME.includes(eventName);
}

/**
 * Check if an event requires TCP reliability
 * @param {string} eventName - The event name
 * @returns {boolean} - True if event must use Socket.io
 */
function isCriticalEvent(eventName) {
  return MessagePriority.CRITICAL.includes(eventName);
}

module.exports = {
  MessagePriority,
  isRealtimeEvent,
  isCriticalEvent
};
