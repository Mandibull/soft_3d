'use strict';

class Vec3 {
    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    clone() {
        return new Vec3(this.x, this.y, this.z);
    }

    inv() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
    }

    sub(v) {
        this.x = -v.x;
        this.y = -v.y;
        this.z = -v.z;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
    }

    mult(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
    }

    div(s) {
        this.x /= s;
        this.y /= s;
        this.z /= s;
    }

    normalize() {
        this.div(this.norm());
    }

    norm() {
        return Math.sqrt(this.x * this.x +
                         this.y * this.y +
                         this.z * this.z);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x);
    }
}
