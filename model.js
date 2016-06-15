'use strict';

class Model {
    constructor() {
        this.data = {};
    }

    loadFromURL(url) {
        this.data = getJSON(url);
    }
}
