import { assert } from "./assert";

/**
 * A 4x4 3d transformation matrix.
 * Stored as a 1d array in column-major order.
 */
// prettier-ignore
export type Matrix4x4 = Float32Array & [
    number, number, number, number, // X axis
    number, number, number, number, // Y axis
    number, number, number, number, // Z axis
    number, number, number, number, // W axis (translation and perspective)
];

export const Matrix4x4 = {
  /**
   * Identity matrix - no transformation applied.
   */
  // prettier-ignore
  identity: new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1, 
    ]) as Matrix4x4,

  translate(v: Vec3): Matrix4x4 {
    // prettier-ignore
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      v.x, v.y, v.z, 1,
    ]) as Matrix4x4;
  },

  scale(factor: number): Matrix4x4 {
    return Matrix4x4.nonuniformScale(factor, factor, factor);
  },

  nonuniformScale(x: number, y: number, z: number): Matrix4x4 {
    // prettier-ignore
    return new Float32Array([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    ]) as Matrix4x4
  },

  rotateZ(angle: number): Matrix4x4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    // prettier-ignore
    return new Float32Array([
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 1,
    ]) as Matrix4x4;
  },

  rotateX(angle: number): Matrix4x4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    // prettier-ignore
    return new Float32Array([
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ]) as Matrix4x4;
  },

  // Ideally we'd use inf reverse depth, but webgl doesn't support clipControl.
  // perspectiveInfiniteReverseRh(
  //   yFovRadians: number,
  //   aspectRatio: number,
  //   zNear: number
  // ): Matrix4x4 {
  //   assert(zNear > 0, "zNear must be positive");
  //   const f = 1 / Math.tan(yFovRadians / 2);
  //   // prettier-ignore
  //   return new Float32Array([
  //     f / aspectRatio, 0, 0, 0,
  //     0, f, 0, 0,
  //     0, 0, 0, -1,
  //     0, 0, zNear, 0,
  //   ]) as Matrix4x4
  // },

  /** Create a right-handed perspecrive projection
   * with [-1, 1] depth range, as GL unfortunately requires.
   */
  perspectiveRhGl(
    yFovRadians: number,
    aspectRatio: number,
    zNear: number,
    zFar: number
  ) {
    const f = 1 / Math.tan(yFovRadians / 2);
    const invLength = 1 / (zFar - zNear);

    const a = f / aspectRatio;
    const b = (zNear + zFar) * invLength;
    const c = 2 * zNear * zFar * invLength;
    // prettier-ignore
    return new Float32Array([
      a, 0, 0, 0,
      0, f, 0, 0,
      0, 0, b, -1,
      0, 0, c, 0,
    ]) as Matrix4x4;
  },

  orthographicRh(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  ): Matrix4x4 {
    let a = 2 / (right - left);
    let b = 2 / (top - bottom);
    let c = -2 / (far - near);
    let tx = -(right + left) / (right - left);
    let ty = -(top + bottom) / (top - bottom);
    let tz = -(far + near) / (far - near);
    // prettier-ignore
    return new Float32Array([
        a, 0, 0, 0,
        0, b, 0, 0,
        0, 0, c, 0,
        tx, ty, tz, 1,
    ]) as Matrix4x4
  },

  /**
   * Create a view matrix from camera position, focus point and up unit vector.
   */
  lookAtRh(eye: Vec3, focus: Vec3, up: Vec3) {
    assert(Vec3.isNormalized(up), "up must be a unit vector");
    const f = Vec3.normalize(Vec3.sub(eye, focus));
    const s = Vec3.normalize(Vec3.cross(up, f));
    const u = Vec3.cross(f, s);

    // prettier-ignore
    return new Float32Array([
      s.x, u.x, f.x, 0,
      s.y, u.y, f.y, 0,
      s.z, u.z, f.z, 0,
      -Vec3.dot(s, eye), -Vec3.dot(u, eye), -Vec3.dot(f, eye), 1,
    ]) as Matrix4x4;
  },

  /**
   * Multiply two matrices together.
   */
  // prettier-ignore
  mul(lhs: Matrix4x4, rhs: Matrix4x4): Matrix4x4 {
    const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = lhs;
    const [b00, b01, b02, b03, b10, b11, b12, b13, b20, b21, b22, b23, b30, b31, b32, b33] = rhs;

    return new Float32Array([
      a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
      a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
      a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
      a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,

      a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
      a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
      a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
      a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,

      a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
      a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
      a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
      a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,

      a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
      a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
      a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
      a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33,

      // a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
      // a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
      // a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
      // a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,

      // a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
      // a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
      // a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
      // a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
      
      // a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
      // a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
      // a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
      // a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
      
      // a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
      // a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
      // a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
      // a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33,
    ]) as Matrix4x4;
  },

  mulMany(...matrices: Matrix4x4[]): Matrix4x4 {
    return matrices.reduce((acc, matrix) => {
      return Matrix4x4.mul(acc, matrix);
    });
  },

  inverse(matrix: Matrix4x4): Matrix4x4 {
    // prettier-ignore
    const [m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33] = matrix;

    const c00 = m22 * m33 - m32 * m23;
    const c02 = m12 * m33 - m32 * m13;
    const c03 = m12 * m23 - m22 * m13;

    const c04 = m21 * m33 - m31 * m23;
    const c06 = m11 * m33 - m31 * m13;
    const c07 = m11 * m23 - m21 * m13;

    const c08 = m21 * m32 - m31 * m22;
    const c10 = m11 * m32 - m31 * m12;
    const c11 = m11 * m22 - m21 * m12;

    const c12 = m20 * m33 - m30 * m23;
    const c14 = m10 * m33 - m30 * m13;
    const c15 = m10 * m23 - m20 * m13;

    const c16 = m20 * m32 - m30 * m22;
    const c18 = m10 * m32 - m30 * m12;
    const c19 = m10 * m22 - m20 * m12;

    const c20 = m20 * m31 - m30 * m21;
    const c22 = m10 * m31 - m30 * m11;
    const c23 = m10 * m21 - m20 * m11;

    const inv00 = +(m11 * c00 - m12 * c04 + m13 * c08);
    const inv01 = -(m01 * c00 - m02 * c04 + m03 * c08);
    const inv02 = +(m01 * c02 - m02 * c06 + m03 * c10);
    const inv03 = -(m01 * c03 - m02 * c07 + m03 * c11);

    const inv10 = -(m10 * c00 - m12 * c12 + m13 * c16);
    const inv11 = +(m00 * c00 - m02 * c12 + m03 * c16);
    const inv12 = -(m00 * c02 - m02 * c14 + m03 * c18);
    const inv13 = +(m00 * c03 - m02 * c15 + m03 * c19);

    const inv20 = +(m10 * c04 - m11 * c12 + m13 * c20);
    const inv21 = -(m00 * c04 - m01 * c12 + m03 * c20);
    const inv22 = +(m00 * c06 - m01 * c14 + m03 * c22);
    const inv23 = -(m00 * c07 - m01 * c15 + m03 * c23);

    const inv30 = -(m10 * c08 - m11 * c16 + m12 * c20);
    const inv31 = +(m00 * c08 - m01 * c16 + m02 * c20);
    const inv32 = -(m00 * c10 - m01 * c18 + m02 * c22);
    const inv33 = +(m00 * c11 - m01 * c19 + m02 * c23);

    const dotx = m00 * inv00;
    const doty = m01 * inv10;
    const dotz = m02 * inv20;
    const dotw = m03 * inv30;
    const dot = dotx + doty + dotz + dotw;

    assert(dot != 0, "Matrix is not invertible");
    const rcpDet = 1 / dot;

    return new Float32Array([
      inv00 * rcpDet,
      inv01 * rcpDet,
      inv02 * rcpDet,
      inv03 * rcpDet,

      inv10 * rcpDet,
      inv11 * rcpDet,
      inv12 * rcpDet,
      inv13 * rcpDet,

      inv20 * rcpDet,
      inv21 * rcpDet,
      inv22 * rcpDet,
      inv23 * rcpDet,

      inv30 * rcpDet,
      inv31 * rcpDet,
      inv32 * rcpDet,
      inv33 * rcpDet,
    ]) as Matrix4x4;
  },
};

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const Vec3 = {
  origin: { x: 0, y: 0, z: 0 },
  /** vector pointing in positive Y-axis direction */
  posY: { x: 0, y: 1, z: 0 } as Vec3,

  new(x: number, y: number, z: number): Vec3 {
    return { x, y, z };
  },

  add(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },

  sub(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },

  lengthSquared(a: Vec3): number {
    return a.x * a.x + a.y * a.y + a.z * a.z;
  },

  length(a: Vec3): number {
    return Math.sqrt(Vec3.lengthSquared(a));
  },

  isNormalized(a: Vec3): boolean {
    return Math.abs(Vec3.lengthSquared(a) - 1) < 0.00001;
  },

  normalize(v: Vec3): Vec3 {
    const length = Vec3.length(v);
    return {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length,
    };
  },

  dot(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },

  cross(a: Vec3, b: Vec3): Vec3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  },
};
