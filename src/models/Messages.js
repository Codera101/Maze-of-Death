/** @format */

const ActionMessageTypes = {
	KILL: "kill",
	HIT: "Hit",
	NOTHING: "Nothing",
	INVALID: "Invalid",
};

class ActionMessage {
	constructor() {
		this._type = ""; // ActionMessageTypes
		this._actionSource = ""; // player ID that send messages
		this._actionTarget = ""; // player ID that recieve messages
		this._actionDirection = ""; // direction of action
	}

	get type() {
		return this._type;
	}

	set type(type) {
		this._type = type;
	}

	get actionSource() {
		return this._actionSource;
	}

	set actionSource(actionSource) {
		this._actionSource = actionSource;
	}

	get actionTarget() {
		return this._actionTarget;
	}

	set actionTarget(actionTarget) {
		this._actionTarget = actionTarget;
	}

	get actionDirection() {
		return this._actionDirection;
	}

	set actionDirection(actionDirection) {
		this._actionDirection = actionDirection;
	}
}

function createActionMessage(
	type,
	actionSource,
	actionTarget,
	actionDirection
) {
	let actionMessage = new ActionMessage();
	actionMessage.type = type;
	actionMessage.actionSource = actionSource;
	actionMessage.actionTarget = actionTarget;
	actionMessage.actionDirection = actionDirection;
	return actionMessage;
}

module.exports = { ActionMessage, ActionMessageTypes, createActionMessage };
