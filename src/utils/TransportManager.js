/** @format */

const { isRealtimeEvent, isCriticalEvent } = require('./MessagePriority');
const { encodePlayerState, encodeVisiblePlayers } = require('./BinaryProtocol');
const Logger = require('./Logger');

/**
 * @class TransportManager
 * @brief Manages dual-protocol communication (Socket.io + geckos.io) with automatic fallback
 * 
 * This class abstracts the transport layer, routing messages through either:
 * - Socket.io (TCP) for critical events requiring guaranteed delivery
 * - geckos.io (WebRTC) for high-frequency realtime events with low latency
 * 
 * Maintains backward compatibility with Socket.io-only clients.
 */
class TransportManager {
	/**
	 * @brief Constructs a new TransportManager instance
	 * @param {SocketIO.Server} io - The Socket.IO server instance
	 * @param {SocketIO.Socket} socket - The Socket.IO socket connection
	 * @param {Object|null} geckosChannel - Optional geckos.io channel for WebRTC
	 */
	constructor(io, socket, geckosChannel = null) {
		this.io = io;
		this.socket = socket;
		this.geckosChannel = geckosChannel;
		
		// Determine client protocol capabilities
		this.capabilities = socket.capabilities || { socketio: true };
		this.protocol = this.capabilities.webrtc && geckosChannel ? 'hybrid' : 'socketio-only';
		
		// TransportManager initialized quietly
	}

	/**
	 * @brief Select appropriate transport based on event type and client capabilities
	 * @param {string} eventName - The event name
	 * @returns {string} - 'webrtc' or 'socketio'
	 */
	selectTransport(eventName) {
		// Critical events always use Socket.io
		if (isCriticalEvent(eventName)) {
			return 'socketio';
		}

		// Realtime events use WebRTC if available
		if (isRealtimeEvent(eventName) && this.protocol === 'hybrid') {
			return 'webrtc';
		}

		// Default to Socket.io
		return 'socketio';
	}

	/**
	 * @brief Notify a specific user by their socket ID
	 * @param {string} userId - The socket ID of the user
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	notifyGivenUser(userId, onEvent, payload) {
		const transport = this.selectTransport(onEvent);

		if (transport === 'webrtc' && this.geckosChannel) {
			this._sendViaWebRTC(onEvent, payload);
		} else {
			this.io.to(userId).emit(onEvent, payload);
		}
	}

	/**
	 * @brief Notify multiple specific users by their socket IDs
	 * @param {string[]} userIds - Array of socket IDs to notify
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	notifyGivenUsers(userIds, onEvent, payload) {
		userIds.forEach((userId) => {
			this.notifyGivenUser(userId, onEvent, payload);
		});
	}

	/**
	 * @brief Notify all users in a specific room (including the sender)
	 * @param {string} roomId - The room ID to broadcast to
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	notifyAllUsersInRoom(roomId, onEvent, payload) {
		// For room-wide messages, use Socket.io for guaranteed delivery
		this.io.to(roomId).emit(onEvent, payload);
	}

	/**
	 * @brief Broadcast to all users in a room EXCEPT the sender
	 * @param {string} roomId - The room ID to broadcast to
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	broadcastToRoomExceptSender(roomId, onEvent, payload) {
		this.socket.broadcast.to(roomId).emit(onEvent, payload);
	}

	/**
	 * @brief Broadcast to ALL connected users (across all rooms)
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	broadcastToAll(onEvent, payload) {
		this.io.emit(onEvent, payload);
	}

	/**
	 * @brief Notify only the current socket connection
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	notifyCurrentUser(onEvent, payload) {
		const transport = this.selectTransport(onEvent);

		if (transport === 'webrtc' && this.geckosChannel) {
			this._sendViaWebRTC(onEvent, payload);
		} else {
			this.socket.emit(onEvent, payload);
		}
	}

	/**
	 * @brief Send data via WebRTC channel with binary encoding
	 * @param {string} eventName - The event name
	 * @param {*} payload - The data to send
	 * @private
	 */
	_sendViaWebRTC(eventName, payload) {
		if (!this.geckosChannel) {
			// WebRTC fallback to Socket.io quietly
			this.socket.emit(eventName, payload);
			return;
		}

		try {
			let binaryData;

			// Encode based on event type
			if (eventName === 'refresh_player') {
				binaryData = encodePlayerState(payload);
			} else if (eventName === 'refresh_players') {
				binaryData = encodeVisiblePlayers(payload.visible_player_list || []);
			} else {
				// For other realtime events, send as JSON via WebRTC
				this.geckosChannel.emit(eventName, payload);
				return;
			}

			// Send raw binary data
			this.geckosChannel.raw.emit(binaryData);
			
		} catch (error) {
			console.error(`[TransportManager] WebRTC send error for ${eventName}:`, error.message);
			// Fallback to Socket.io on error
			this.socket.emit(eventName, payload);
		}
	}

	/**
	 * @brief Check if client supports WebRTC
	 * @returns {boolean}
	 */
	supportsWebRTC() {
		return this.protocol === 'hybrid';
	}

	/**
	 * @brief Get current protocol mode
	 * @returns {string} - 'hybrid' or 'socketio-only'
	 */
	getProtocol() {
		return this.protocol;
	}
}

module.exports = TransportManager;
