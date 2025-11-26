/** @format */

/**
 * @class Messenger
 * @brief Handles real-time messaging between server and clients using Socket.IO
 * 
 * This class provides a comprehensive messaging interface for communicating with clients
 * in various patterns: individual users, multiple users, room-based messaging, and broadcasts.
 * It wraps Socket.IO functionality to provide a clean API for server-client communication.
 */
class Messenger {
	/**
	 * @brief Constructs a new Messenger instance
	 * @param {SocketIO.Server} io - The Socket.IO server instance
	 * @param {SocketIO.Socket} socket - The individual socket connection
	 */
	constructor(io, socket) {
		this.io = io;
		this.socket = socket;
	}

	/**
	 * @brief Notify a specific user by their socket ID
	 * @param {string} userId - The socket ID of the user
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	notifyGivenUser(userId, onEvent, payload) {
		this.io.to(userId).emit(onEvent, payload);
	}

	/**
	 * @brief Notify multiple specific users by their socket IDs
	 * @param {string[]} userIds - Array of socket IDs to notify
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	notifyGivenUsers(userIds, onEvent, payload) {
		userIds.forEach((userId) => {
			this.io.to(userId).emit(onEvent, payload);
		});
	}

	/**
	 * @brief Notify all users in a specific room (including the sender)
	 * @param {string} roomId - The room ID to broadcast to
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	notifyAllUsersInRoom(roomId, onEvent, payload) {
		this.io.to(roomId).emit(onEvent, payload);
	}

	/**
	 * @brief Broadcast to all users in a room EXCEPT the sender
	 * 
	 * This is useful for propagating changes made by one user to all other
	 * users in the same room without echoing back to the originator.
	 * 
	 * @param {string} roomId - The room ID to broadcast to
	 * @param {string} onEvent - The event name to emit
	 * @param {*} payload - The data to send with the event
	 */
	broadcastToRoomExceptSender(roomId, onEvent, payload) {
		this.socket.broadcast.to(roomId).emit(onEvent, payload);
	}

	/**
	 * @brief Broadcast to ALL connected users (across all rooms)
	 * 
	 * Use with caution as this sends the message to every connected client
	 * regardless of which room they are in.
	 * 
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
		this.socket.emit(onEvent, payload);
	}
}

module.exports = Messenger;