'use strict';

class Mat4 {
    constructor() {
        this._00 = 0; this._01 = 0; this._02 = 0; this._03 = 0;
        this._10 = 0; this._11 = 0; this._12 = 0; this._13 = 0;
        this._20 = 0; this._21 = 0; this._22 = 0; this._23 = 0;
        this._30 = 0; this._31 = 0; this._32 = 0; this._33 = 0;
    }

    clone(m) {
        var r = new Mat4();

        r._00 = this._00; r._01 = this._01; r._02 = this._02; r._03 = this._03;
        r._10 = this._10; r._11 = this._11; r._12 = this._12; r._03 = this._13;
        r._20 = this._20; r._21 = this._21; r._22 = this._22; r._03 = this._23;
        r._30 = this._30; r._31 = this._31; r._32 = this._32; r._03 = this._33;

        return r;
    }

    setIdentity() {
        this._00 = 1; this._01 = 0; this._02 = 0; this._03 = 0;
        this._10 = 0; this._11 = 1; this._12 = 0; this._13 = 0;
        this._20 = 0; this._21 = 0; this._22 = 1; this._23 = 0;
        this._30 = 0; this._31 = 0; this._32 = 0; this._33 = 1;
    }

    setView(position, pitch, yaw) {
        var cosPitch = Math.cos(pitch);
        var sinPitch = Math.sin(pitch);
        var cosYaw = Math.cos(yaw);
        var sinYaw = Math.sin(yaw);

        var xAxis = new Vec3(cosYaw, 0, -sinYaw);
        var yAxis = new Vec3(sinYaw * sinPitch, cosPitch, cosYaw * sinPitch);
        var zAxis = new Vec3(sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw);

        this._00 = xAxis.x;
        this._01 = yAxis.x;
        this._02 = zAxis.x;
        this._03 = 0;

        this._10 = xAxis.y;
        this._11 = yAxis.y;
        this._12 = zAxis.y;
        this._13 = 0;

        this._20 = xAxis.z;
        this._21 = yAxis.z;
        this._22 = zAxis.z;
        this._23 = 0;

        this._30 = -xAxis.dot(position);
        this._31 = -yAxis.dot(position);
        this._32 = -zAxis.dot(position);
        this._33 = 1;
    }

    setPerspective(fov, aspectRatio, zNear, zFar) {
        var tanHalfFOV = Math.tan(fov / 2);
	var zRange = zNear - zFar;
        this._00 = 1 / (tanHalfFOV * aspectRatio); this._01 = 0;               this._02 = 0;                        this._03 = 0;
	this._10 = 0;                              this._11 = 1 / tanHalfFOV;  this._12 = 0;                        this._13 = 0;
	this._20 = 0;                              this._21 = 0;               this._22 = (-zNear - zFar) / zRange; this._23 = 2 * zFar * zNear / zRange;
	this._30 = 0;                              this._31 = 0;               this._32 = 1;                        this._33 = 0;
    }

    setRotation(x, y, z) {
        var rx = new Mat4();
	var ry = new Mat4();
	var rz = new Mat4();

	rz._00 = Math.cos(z); rz._01 = -Math.sin(z); rz._02 = 0;            rz._03 = 0;
	rz._10 = Math.sin(z); rz._11 = Math.cos(z);  rz._12 = 0;            rz._13 = 0;
	rz._20 = 0;           rz._21 = 0;            rz._22 = 1;            rz._23 = 0;
	rz._30 = 0;           rz._31 = 0;            rz._32 = 0;            rz._33 = 1;

	rx._00 = 1;           rx._01 = 0;            rx._02 = 0;            rx._03 = 0;
	rx._10 = 0;           rx._11 = Math.cos(x);  rx._12 = -Math.sin(x); rx._13 = 0;
	rx._20 = 0;           rx._21 = Math.sin(x);  rx._22 = Math.cos(x);  rx._23 = 0;
	rx._30 = 0;           rx._31 = 0;            rx._32 = 0;            rx._33 = 1;

	ry._00 = Math.cos(y); ry._01 = 0;            ry._02 = -Math.sin(y); ry._03 = 0;
	ry._10 = 0;           ry._11 = 1;            ry._12 = 0;            ry._13 = 0;
	ry._20 = Math.sin(y); ry._21 = 0;            ry._22 = Math.cos(y);  ry._23 = 0;
	ry._30 = 0;           ry._31 = 0;            ry._32 = 0;            ry._33 = 1;

	var res = rz.mult(ry.mult(rx));
        this._00 = res._00; this._01 = res._01; this._02 = res._02; this._03 = res._03;
        this._10 = res._10; this._11 = res._11; this._12 = res._12; this._13 = res._13;
        this._20 = res._20; this._21 = res._21; this._22 = res._22; this._23 = res._23;
        this._30 = res._30; this._31 = res._31; this._32 = res._32; this._33 = res._33;
    }

    setRotationFUR(f, u, r) {
        // forward, up, right
        this._00 = r.x; this._01 = r.y; this._02 = r.z; this._03 = 0;
        this._10 = u.x; this._11 = u.y; this._12 = u.z; this._13 = 0;
        this._20 = f.x; this._21 = f.y; this._22 = f.z; this._23 = 0;
        this._30 = 0;   this._31 = 0;   this._32 = 0;   this._33 = 1;
    }

    transformVec3(v) {
        return new Vec3(
            this._00 * v.x + this._01 * v.y + this._02 * v.z + this._03,
            this._10 * v.x + this._11 * v.y + this._12 * v.z + this._13,
            this._20 * v.x + this._21 * v.y + this._22 * v.z + this._23);
    }

    mult(m) {
        var r = new Mat4();

        r._00 = this._00 * m._00 + this._01 * m._10 + this._02 * m._20 + this._03 * m._30;
        r._11 = this._10 * m._01 + this._01 * m._11 + this._12 * m._21 + this._03 * m._31;
        r._12 = this._10 * m._02 + this._01 * m._12 + this._12 * m._22 + this._03 * m._32;
        r._13 = this._10 * m._03 + this._01 * m._13 + this._12 * m._23 + this._03 * m._33;

        r._10 = this._10 * m._00 + this._11 * m._10 + this._12 * m._20 + this._13 * m._30;
        r._11 = this._10 * m._01 + this._11 * m._11 + this._12 * m._21 + this._13 * m._31;
        r._12 = this._10 * m._02 + this._11 * m._12 + this._12 * m._22 + this._13 * m._32;
        r._13 = this._10 * m._03 + this._11 * m._13 + this._12 * m._23 + this._13 * m._33;

        r._20 = this._20 * m._00 + this._21 * m._10 + this._22 * m._20 + this._23 * m._30;
        r._21 = this._20 * m._01 + this._21 * m._11 + this._22 * m._21 + this._23 * m._31;
        r._22 = this._20 * m._02 + this._21 * m._12 + this._22 * m._22 + this._23 * m._32;
        r._23 = this._20 * m._03 + this._21 * m._13 + this._22 * m._23 + this._23 * m._33;

        r._30 = this._30 * m._00 + this._31 * m._10 + this._32 * m._20 + this._33 * m._30;
        r._31 = this._30 * m._01 + this._31 * m._11 + this._32 * m._21 + this._33 * m._31;
        r._32 = this._30 * m._02 + this._31 * m._12 + this._32 * m._22 + this._33 * m._32;
        r._33 = this._30 * m._03 + this._31 * m._13 + this._32 * m._23 + this._33 * m._33;

        return r;
    }
}
