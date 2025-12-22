const Player = require('./Player');

class Viewer extends Player {
    constructor(id) {
        super(0, 0, null, "Viewer", id);
        this._isViewer = true;
    }
    get isViewer() {
        return this._isViewer;
    }
}

module.exports = Viewer;