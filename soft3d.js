'use strict';

class FPSCounter {
    constructor(fpsNodeID) {
        this.fpsNode = document.getElementById(fpsNodeID);
        this.lastTime = 0;
        this.samples = 20;
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
        this.drawMesh = false;
        this.drawMethod = null;

        this.gui = new dat.GUI();
        this.gui.add(this, 'polygonEdges', 3, 40).step(1);
        this.gui.add(this, 'drawMesh');
    }

    update(elapsedTime) {
        this.drawMethod = this.drawMesh ? this.drawPoly : this.drawFilledPoly;
        // FIXME: find how to disallow floats in dat.GUI
        var edges = Math.trunc(this.polygonEdges);
        if (edges != this.nbPoints) {
            this.nbPoints = edges;
            this.points = new Array(this.nbPoints * 4);
            // FIXME: there is something wrong for certain values of nbPoints (19, 33, etc.)
            var step = Math.PI * 2 / this.nbPoints;
            for (var i = 0; i < this.nbPoints; ++i) {
                this.points[i*2+0] = Math.round(
                    Math.cos(step * i) * 250 + this.width / 2);
                this.points[i*2+1] = Math.round(
                    Math.sin(step * i) * 250 + this.height / 2);;
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

        // Blit
        this.imageData.data.set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);

        this.lastTime = currentTime;
        var _this = this;
        setTimeout(function() { _this.loop(); }, 0);
    }

    render() {
        // FIXME: can this get faster?
        this.data.fill(0);

        var hue = 0;
        var hueStep = Math.floor(360 / this.nbPoints);
        for (var i = 1; i < this.nbPoints; ++i) {
            this.drawMethod([
                [this.points[(i-1)*2+0], this.points[(i-1)*2+1]],
                [this.points[(i-0)*2+0], this.points[(i-0)*2+1]],
                [Math.round(this.width / 2), Math.round(this.height / 2)]],
                hueTable[hue]);
            hue += hueStep;
        }
        this.drawMethod([
            [this.points[(i-1)*2+0], this.points[(i-1)*2+1]],
            [this.points[0], this.points[1]],
            [Math.round(this.width / 2), Math.round(this.height / 2)]],
            hueTable[hue]);

    }

    drawFilledPoly(verts, rgb)
    {
        // FIXME: write optimized version for triangles?
        // FIXME: can we tighten those boundaries?
        var yMin = 0;
        var yMax = this.height - 1;
        var xMin = 0;
        var xMax = this.width - 1;

        var nr = verts.length;
        var nodeX = new Array(nr + 1);
        var nodes = 0;
        var i = 0;
        var j = 0;
        var y = 0;

        // Loop through the rows of the image
        for (y = yMin; y < yMax; ++y) {
            // Build a list of nodes
            nodes = 0;
            j = nr - 1;
            for (i = 0; i < nr; ++i) {
                if ((verts[i][1] < y && verts[j][1] >= y) ||
                    (verts[j][1] < y && verts[i][1] >= y)) {
                    nodeX[nodes++] = Math.round(verts[i][0] +
                                                 ((y - verts[i][1]) / (verts[j][1] - verts[i][1])) *
                                                 (verts[j][0] - verts[i][0]));
                }
                j = i;
            }

            // Sort the nodes
            nodeX.sort();

            // Fill the pixels between node pairs
            for (i = 0; i < nodes; i += 2) {
                if (nodeX[i] >= xMax) break;
                if (nodeX[i + 1] >  xMin) {
                    if (nodeX[i    ] < xMin) nodeX[i    ] = xMin;
                    if (nodeX[i + 1] > xMax) nodeX[i + 1] = xMax;
                    for (j = nodeX[i]; j < nodeX[i + 1]; j++) {
                        this.plot(j - xMin, y - yMin, rgb, 255);
                    }
                }
            }
        }
    }

    drawPoly(verts, rgb) {
        for (var i = 1; i < verts.length; ++i)
            this.drawLine(verts[i - 1], verts[i], rgb);
        this.drawLine(verts[i - 1], verts[0], rgb);
    }

    drawLine(v0, v1, rgb) {
        var x0 = v0[0];
        var y0 = v0[1];
        var x1 = v1[0];
        var y1 = v1[1];
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;  // FIXME: try "(x0 < x1) * 2 - 1" and see if it's faster
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

    plot(x, y, rgb) {
        this.data[y * this.width + x] =
            (255    << 24) |  // alpha
            (rgb[2] << 16) |  // blue
            (rgb[1] <<  8) |  // green
            (rgb[0]      );   // red
    }
}
