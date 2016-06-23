'use strict';

class Soft3D {
    constructor(canvasID, width, height) {
        this.width = width;
        this.height = height;

        // Canvas setup
        this.canvas = document.getElementById(canvasID);
        this.canvas.setAttribute('width', this.width);
        this.canvas.setAttribute('height', this.height);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        // Context & buffers setup
        this.ctx = this.canvas.getContext('2d');
        // FIXME: create a class for frame buffers?
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.data = new Uint32Array(this.buf);

        // Stats setup
        this.stats = new Stats();
        this.stats.showPanel(0);
        this.stats.domElement.style.display = 'inline-block';
        document.body.appendChild(this.stats.domElement);

        // GUI settings
        this.nbPoints = null;
        this.points = null;
        this.drawMethod = 'drawCanvasFilledStroke';
        this.aggressiveScheduler = false;

        // GUI setup
        this.gui = new dat.GUI({width: 300});
        this.gui.add(this, 'drawMethod', [
            'drawFilledTriangle',
            'drawFilledPoly',
            'drawPoly',
            'drawCanvasStroke',
            'drawCanvasFilledStroke',
        ]);
        this.gui.add(this, 'aggressiveScheduler');
    }

    init() {
        this.view = new Mat4();
        this.view.setView(new Vec3(0, 0, 3), 0, 0);
        this.projection = new Mat4();
        this.projection.setPerspective(
            Math.PI / 2, // 90 FOV
            this.width / this.height, // aspect ratio
            0.1, 1000 // z-near, z-far
        );
        this.triangle = [
            new Vec3(-1, -1, 0),
            new Vec3( 0,  1, 0),
            new Vec3( 1, -1, 0)
        ];
        this.rotation = new Mat4();
        this.rotation.setRotation(0, 0, 0);
    }

    update(elapsedTime, currentTime) {
        this.rotation.setRotation(0, currentTime / 700, currentTime / 1000);
    }

    render() {
        // Translation / rotation
        var v = [
            this.rotation.transformVec3(this.triangle[0]),
            this.rotation.transformVec3(this.triangle[1]),
            this.rotation.transformVec3(this.triangle[2])
        ];

        v[0] = this.view.transformVec3(v[0]);
        v[1] = this.view.transformVec3(v[1]);
        v[2] = this.view.transformVec3(v[2]);

        // Projection
        v[0] = this.projection.transformVec3(v[0]);
        v[1] = this.projection.transformVec3(v[1]);
        v[2] = this.projection.transformVec3(v[2]);

        // Drawing
        for (var i = 0; i < v.length; ++i) {
            v[i][0] = Math.round((1 + v[i].x) * this.width / 2);
            v[i][1] = Math.round((1 + v[i].y) * this.height / 2);
        }

        this[this.drawMethod](v, [255, 255, 255]);
    }

    run() {
        // This might alter the way the browser draw things using the
        // canvas methods.
        // this.ctx.translate(0.5, 0.5);
        this.init();
        this.lastTime = performance.now();
        this.stats.begin();
        this.loop();
    }

    loop() {
        var currentTime = performance.now();
        var elapsedTime = currentTime - this.lastTime;

        this.stats.end();
        this.stats.begin();

        this.update(elapsedTime, currentTime);

        if (this.drawMethod.indexOf('Canvas') < 0) {
            // FIXME: can this get faster?
            this.data.fill(0);
            this.render();
            // Blit
            this.imageData.data.set(this.buf8);
            this.ctx.putImageData(this.imageData, 0, 0);
        } else {
            this.ctx.clear();
            this.render();
        }

        this.lastTime = currentTime;
        var _this = this;
        if (this.aggressiveScheduler)
            setTimeout(function() { _this.loop(); }, 0);
        else
            requestAnimationFrame(function() { _this.loop(); });
    }

    drawFilledPoly(verts, rgb)
    {
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
                    nodeX[nodes++] = Math.round(
                        verts[i][0] +
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
                        this.plot(j - xMin, y - yMin, rgb);
                    }
                }
            }
        }
    }

    drawFilledTriangle(verts, rgb)
    {
        var verts00 = verts[0][0];
        var verts01 = verts[0][1];
        var verts10 = verts[1][0];
        var verts11 = verts[1][1];
        var verts20 = verts[2][0];
        var verts21 = verts[2][1];

        var yMax = this.height - 1;
        var xMax = this.width - 1;

        // Loop through the rows of the image
        for (var y = 0; y < yMax; ++y) {
            // Build a list of nodes
            var nodes = 0;
            var nodeX = [0, 0];
            if ((verts01 < y && verts21 >= y) || (verts21 < y && verts01 >= y)) {
                nodeX[nodes++] = Math.round(
                    verts00 + ((y - verts01) / (verts21 - verts01)) *
                        (verts20 - verts00));
            }
            if ((verts11 < y && verts01 >= y) || (verts01 < y && verts11 >= y)) {
                nodeX[nodes++] = Math.round(
                    verts10 + ((y - verts11) / (verts01 - verts11)) *
                        (verts00 - verts10));
            }
            if (nodes < 2) {
                if ((verts21 < y && verts11 >= y) || (verts11 < y && verts21 >= y)) {
                    nodeX[nodes++] = Math.round(
                        verts20 + ((y - verts21) / (verts11 - verts21)) *
                            (verts10 - verts20));
                }
            }
            if (nodes == 2) {
                nodeX.sort();  // FIXME: change this silly sort?
                for (var x = nodeX[0]; x < nodeX[1]; ++x)
                    this.plot(x, y, rgb);  // FIXME: better method to fill h-lines?
            }
        }
    }

    drawPoly(verts, rgb) {
        for (var i = 1; i < verts.length; ++i)
            this.drawLine(verts[i - 1], verts[i], rgb);
        this.drawLine(verts[i - 1], verts[0], rgb);
    }

    drawLine(v0, v1, rgb) {
        // FIXME: the algo doesnt's always draw the same line for wether it's A -> B and B -> A
        var x0 = v0[0];
        var y0 = v0[1];
        var x1 = v1[0];
        var y1 = v1[1];
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

    plot(x, y, rgb) {
        this.data[y * this.width + x] =
            (255    << 24) |  // alpha
            (rgb[2] << 16) |  // blue
            (rgb[1] <<  8) |  // green
            (rgb[0]      );   // red
    }

    drawCanvasStroke(verts, rgb) {
        var ctx = this.ctx;
        ctx.beginPath();
        for (var i = 0; i < verts.length; ++i)
            ctx.lineTo(verts[i][0], verts[i][1]);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(' + rgb.join() + ',255)';
        ctx.stroke();
    }

    drawCanvasFilledStroke(verts, rgb) {
        this.drawCanvasStroke(verts, rgb);
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.ctx.fill();
    }
}
