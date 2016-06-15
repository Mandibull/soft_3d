'use strict';

class FPSCounter {
    constructor(fpsNodeID) {
        this.fpsNode = document.getElementById(fpsNodeID);
        this.lastTime = 0;
        this.samples = 30;
        this.counter = 0;
    }

    update(currentTime) {
        if (++this.counter <= this.samples)
            return;
        var elapsedTime = currentTime - this.lastTime;
        this.fpsNode.textContent = Math.round(this.samples * 1000 / elapsedTime);
        this.lastTime = currentTime;
        this.counter = 0;
    }
}

class Soft3D {
    constructor(canvasID, width, height) {
        this.width = width;
        this.height = height;

        this.canvas = document.getElementById(canvasID);
        this.canvas.setAttribute('width', this.width);
        this.canvas.setAttribute('height', this.height);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx = this.canvas.getContext('2d');
        // FIXME: create a class for frame buffers
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.data = new Uint32Array(this.buf);

        this.fpsCounter = new FPSCounter('fps_count');

        this.polygonEdges = 8;
        this.nbPoints = null;
        this.points = null;

        this.gui = new dat.GUI();
        this.gui.add(this, 'polygonEdges', 2, 40).step(1);
    }

    update(elapsedTime) {
        // FIXME: find how to disallow floats in dat.GUI
        var edges = Math.trunc(this.polygonEdges);
        if (edges != this.nbPoints) {
            this.nbPoints = edges;
            this.points = new Array(this.nbPoints * 4);
            var step = Math.PI * 2 / this.nbPoints;
            for (var i = 0; i < this.nbPoints; ++i) {
                this.points[i*2+0] = Math.round(
                    Math.cos(step * i) * 300 + this.width / 2);
                this.points[i*2+1] = Math.round(
                    Math.sin(step * i) * 300 + this.height / 2);;
            }
        }
    }

    run() {
        this.lastTime = performance.now();
        this.loop();
    }

    loop() {
        var currentTime = performance.now();
        var elapsedTime = currentTime - this.lastTime;

        this.fpsCounter.update(currentTime);
        this.update(elapsedTime);
        this.render();

        // blit
        this.imageData.data.set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);

        this.lastTime = currentTime;
        var _this = this;
        setTimeout(function() { _this.loop(); }, 0);
    }

    render() {
        // FIXME: fill is too slow
        this.data.fill(0);

        var hue = 0;
        var hueStep = Math.floor(360 / this.nbPoints);
        for (var i = 1; i < this.nbPoints; ++i) {
            this.draw2DLine(this.points[(i-1)*2+0], this.points[(i-1)*2+1],
                            this.points[(i-0)*2+0], this.points[(i-0)*2+1],
                            hueTable[hue]);
            hue += hueStep;
        }
        this.draw2DLine(this.points[(i-1)*2+0], this.points[(i-1)*2+1],
                        this.points[0], this.points[1], hueTable[hue]);
    }

    plot(x, y, rgb) {
        this.data[y * this.width + x] =
            (255    << 24) |  // alpha
            (rgb[2] << 16) |  // blue
            (rgb[1] <<  8) |  // green
            (rgb[0]      );   // red
    }

    draw2DLine(x0, y0, x1, y1, rgb) {
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;

        while(true) {
            this.plot(x0, y0, rgb);
            if ((x0 == x1) && (y0 == y1))
                break;
            var e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }
}

// FIXME: move this
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
