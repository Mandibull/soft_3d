'use strict';

function getJSON(url) {
    var request = new window.XMLHttpRequest();
    request.open('GET', url, false);
    request.send();
    if (request.readyState === 4 && request.status === 200)
        return JSON.parse(request.responseText);
}

function computeHueTable() {
    var res = new Array(360);
    for (var t = 0; t < 360; t++) {
        var tm = t % 60;
        if (t < 60) {
            res[t] = [255, Math.round(4.25 * tm), 0];
        } else if (t < 120) {
            res[t] = [Math.round(255 - 4.25 * tm), 255, 0];
        } else if (t < 180) {
            res[t] = [0, 255, Math.round(4.25 * tm)];
        } else if (t < 240) {
            res[t] = [0, Math.round(255 - 4.25 * tm), 255];
        } else if (t < 300) {
            res[t] = [Math.round(4.25 * tm), 0, 255];
        } else {
            res[t] = [255, 0, Math.round(255 - 4.25 * tm)];
        }
    }
    return res;
}
var hueTable = computeHueTable();
