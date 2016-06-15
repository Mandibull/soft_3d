'use strict';

// https://github.com/mrdoob/three.js/wiki/JSON-Model-format-3

class Model {
    constructor() {
        this.data = {};
    }

    loadFromURL(url) {
        // try https://gist.githubusercontent.com/fraguada/8ea243744961d72d61de/raw/a6e62ae64fa0645832943a7f6c00f73d29d715d8/test.js
        this.data = getJSON(url);
    }
}
