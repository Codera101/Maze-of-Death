/** @format */

// ============================================
// Client-Side Logger - Handles console logging with formatting
// ============================================
class Logger {
	constructor(context = "CLIENT") {
		this.context = context;
	}

	/**
	 * Get current timestamp in readable format
	 * @returns {string} Formatted timestamp
	 */
	getTimestamp() {
		const now = new Date();
		return now.toISOString();
	}

	/**
	 * Format log message with timestamp and context
	 * @param {string} level - Log level (INFO, ERROR, WARN, DEBUG)
	 * @param {string} message - The message to log
	 * @returns {string} Formatted log message
	 */
	formatMessage(level, message) {
		return `[${this.getTimestamp()}] [${level}] [${this.context}] ${message}`;
	}

	/**
	 * Log info message
	 * @param {string} message - The message to log
	 */
	info(message) {
		console.log(this.formatMessage("INFO", message));
	}

	/**
	 * Log error message
	 * @param {string} message - The message to log
	 * @param {Error} [error] - Optional error object
	 */
	error(message, error = null) {
		console.error(this.formatMessage("ERROR", message));
		if (error) {
			console.error(error);
		}
	}

	/**
	 * Log warning message
	 * @param {string} message - The message to log
	 */
	warn(message) {
		console.warn(this.formatMessage("WARN", message));
	}

	/**
	 * Log debug message
	 * @param {string} message - The message to log
	 */
	debug(message) {
		console.debug(this.formatMessage("DEBUG", message));
	}

	/**
	 * Log success message (using info level with success prefix)
	 * @param {string} message - The message to log
	 */
	success(message) {
		console.log(this.formatMessage("SUCCESS", message));
	}

	/**
	 * Create a child logger with a new context
	 * @param {string} childContext - The context for the child logger
	 * @returns {Logger} A new Logger instance with combined context
	 */
	child(childContext) {
		return new Logger(`${this.context}:${childContext}`);
	}
}

// Export for use in browser or Node.js
if (typeof module !== "undefined" && module.exports) {
	module.exports = Logger;
}