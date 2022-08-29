import { assert, assertNever } from "./assert";
import { Rate, shaderManager } from "./shaderManager";
import { Matrix4x4, Vec3 } from "./algebra";
import { PathSegmentDef, glyphE, PathSeg, glyphA } from "./glyphData";
import { AnyBuffer, createDynamicBuffer, createStaticBuffer } from "./buffer";

export const ctxOptions: WebGLContextAttributes = {
  preserveDrawingBuffer: false,
  antialias: false,
  powerPreference: "low-power",
  premultipliedAlpha: true,
  depth: false,
};

type PathBuffers = ReturnType<typeof pathToArrays>;
function pathToArrays(gl: WebGL2RenderingContext, path: PathSegmentDef[]) {
  const vertices: number[] = [];
  const polysIdx: number[] = [];
  const quadraticVertices: number[] = [];
  let current: number | null = null;
  let pathStart: number | null = null;

  function addVertex(x: number, y: number): number {
    let idx = vertices.length / 3;
    vertices.push(x, y, 0);
    return idx;
  }

  const mid = addVertex(0, 0);
  for (const seg of path) {
    switch (seg[0]) {
      case PathSeg.Move: {
        current = addVertex(seg[1], seg[2]);
        if (pathStart == null) pathStart = current;
        break;
      }
      case PathSeg.Line: {
        const a = addVertex(seg[1], seg[2]);
        if (current != null) {
          polysIdx.push(mid, current, a);
        }
        if (pathStart == null) pathStart = a;
        current = a;
        break;
      }
      case PathSeg.Quad: {
        const a = addVertex(seg[1], seg[2]);
        const b = addVertex(seg[3], seg[4]);
        if (current == null) {
          polysIdx.push(mid, a, b);
        } else {
          polysIdx.push(mid, current, b);

          // push 3 vertex positions for drawArrays, as we need to
          // have separate vertices for the quadratic curve,
          // so we can calculate barycentric coordinates
          // prettier-ignore
          quadraticVertices.push(
            vertices[current * 3], vertices[current * 3 + 1], vertices[current * 3 + 2],
            seg[1], seg[2], 0,
            seg[3], seg[4], 0,
          );

          current = b;
        }
        current = b;
        if (pathStart == null) pathStart = a;
        break;
      }
      case PathSeg.Close: {
        if (current != null && pathStart != null) {
          polysIdx.push(mid, current, pathStart);
          current = null;
          pathStart = null;
        }
        break;
      }
      default:
        return assertNever(seg);
    }
  }
  const use16Bit = vertices.length < 0xff;
  let idxType = use16Bit ? Uint16Array : Uint8Array;
  return {
    vertices: createStaticBuffer(gl, new Float32Array(vertices)),
    polysIdx: createStaticBuffer(
      gl,
      new idxType(polysIdx),
      gl.ELEMENT_ARRAY_BUFFER
    ),
    quadraticVertices: createStaticBuffer(
      gl,
      new Float32Array(quadraticVertices)
    ),
    pathIdxType: use16Bit ? gl.UNSIGNED_SHORT : gl.UNSIGNED_BYTE,
  };
}

export function init(gl: WebGL2RenderingContext) {
  const shaderMgr = shaderManager(gl);

  const pathDataA = pathToArrays(gl, glyphA);
  const pathDataE = pathToArrays(gl, glyphE);

  const triangleCoords = createStaticBuffer(
    gl,
    // prettier-ignore
    new Float32Array([
      -0.5, -0.5, 0.0,
      0.5, -0.5, 0.0,
      0.0, 0.5, 0.0,
    ])
  );
  const triangleColors = createStaticBuffer(
    gl,
    // prettier-ignore
    new Float32Array([
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0
    ])
  );

  let modelViewProjection = createDynamicBuffer(gl);

  function updateMVPmatrix(mvp: Matrix4x4) {
    modelViewProjection.update(mvp);
  }

  function setupFramebuffer() {
    const linearFb = gl.createFramebuffer();
    const linearColor = gl.createTexture();
    const depth = gl.createRenderbuffer();

    const glyphFb = gl.createFramebuffer();
    const glyphColor = gl.createTexture();

    if (
      linearFb == null ||
      linearColor == null ||
      depth == null ||
      glyphFb == null ||
      glyphColor == null
    ) {
      throw new Error("Failed to create framebuffer");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, linearFb);
    gl.bindTexture(gl.TEXTURE_2D, linearColor);
    gl.texStorage2D(
      gl.TEXTURE_2D,
      1,
      gl.RGBA8,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      linearColor,
      0
    );

    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      depth
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, glyphFb);
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      depth
    );

    gl.bindTexture(gl.TEXTURE_2D, glyphColor);
    gl.texStorage2D(
      gl.TEXTURE_2D,
      1,
      gl.RGBA8,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      glyphColor,
      0
    );
    return { linearFb, linearColor, depth, glyphFb, glyphColor };
  }

  const SMOOTHING = 1;
  function setupOffsetBuffer() {
    const xUnit = SMOOTHING / gl.canvas.width;
    const yUnit = SMOOTHING / gl.canvas.height;

    // -----x
    // -x----
    // ---x--
    // ----x-
    // x-----
    // --x---

    // prettier-ignore
    const buf = createStaticBuffer(gl, new Float32Array([
      xUnit *  2.5, yUnit * -2.5, 0,
      xUnit * -1.5, yUnit * -1.5, 0,
      xUnit *  0.5, yUnit * -0.5, 0,
      xUnit *  1.5, yUnit *  0.5, 0,
      xUnit * -2.5, yUnit *  1.5, 0,
      xUnit * -0.5, yUnit *  2.5, 0,
    ]));
    return buf;
  }

  // prettier-ignore
  const sampleColorBuffer = createStaticBuffer(gl, new Float32Array([
    1/255,0,0,0,
    16/255,0,0,0,
    0,1/255,0,0,
    0,16/255,0,0,
    0,0,1/255,0,
    0,0,16/255,0,
  ]));
  let sampleOffsetBuffer = setupOffsetBuffer();
  let { linearFb, linearColor, glyphFb, glyphColor, depth } =
    setupFramebuffer();

  function resize() {
    gl.deleteFramebuffer(linearFb);
    gl.deleteFramebuffer(glyphFb);
    gl.deleteTexture(linearColor);
    gl.deleteTexture(glyphColor);
    gl.deleteRenderbuffer(depth);
    gl.deleteBuffer(sampleOffsetBuffer.buffer);

    ({ linearFb, linearColor, glyphFb, glyphColor, depth } =
      setupFramebuffer());
    sampleOffsetBuffer = setupOffsetBuffer();
  }

  let projAspectRatio = 0;
  let projection = Matrix4x4.identity;
  let view = Matrix4x4.identity;
  // let viewInverse = Matrix4x4.identity;
  let worldToClip = Matrix4x4.identity;

  // let lastFov = 0;
  function updateCamera(t: number) {
    const aspectRatio = gl.canvas.width / gl.canvas.height;
    if (aspectRatio !== projAspectRatio) {
      projAspectRatio = aspectRatio;
      projection = Matrix4x4.perspectiveRhGl(
        Math.PI / 2, // 90deg
        projAspectRatio,
        0.1,
        1000
      );
      // projection = Matrix4x4.orthographicRh(-1, 1, -1, 1, 0.1, 1000);
    }

    const orbitRadius = 3.0;
    // const orbitAngle = Math.PI / 2;
    const orbitAngle = t / 2500;

    let cameraPos = {
      x: Math.cos(orbitAngle) * orbitRadius,
      y: 1,
      z: Math.sin(orbitAngle) * orbitRadius,
    };

    view = Matrix4x4.lookAtRh(cameraPos, Vec3.origin, Vec3.posY);
    // viewInverse = Matrix4x4.inverse(view);
    worldToClip = Matrix4x4.mul(projection, view);
  }

  function setModelMatrix(model: Matrix4x4) {
    const mvpMatrix = Matrix4x4.mul(worldToClip, model);
    // prettier-ignore
    updateMVPmatrix(mvpMatrix);
  }

  function drawTriangles() {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GEQUAL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    assert(triangleCoords.length == triangleColors.length);
    shaderMgr.use(
      ["posColor", "flatColor"],
      {
        position: triangleCoords,
        color: triangleColors,
      },
      (shader) => {
        gl.uniformBlockBinding(shader.program, shader.uniforms.viewData, 0);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, modelViewProjection.buffer);
        setModelMatrix(Matrix4x4.translate(Vec3.new(0, 0, 0)));
        gl.drawArrays(gl.TRIANGLES, 0, triangleColors.length / 3);

        setModelMatrix(
          Matrix4x4.mulMany(
            Matrix4x4.translate(Vec3.new(0, 0, -0.1)),
            Matrix4x4.scale(1.2)
          )
        );
        gl.drawArrays(gl.TRIANGLES, 0, triangleColors.length / 3);

        setModelMatrix(
          Matrix4x4.mulMany(
            Matrix4x4.translate(Vec3.new(0, 0, -0.2)),
            Matrix4x4.scale(1.5)
          )
        );
        gl.drawArrays(gl.TRIANGLES, 0, triangleColors.length / 3);
      }
    );
  }

  // Shape drawing based on article
  // https://medium.com/@evanwallace/easy-scalable-text-rendering-on-the-gpu-c3f4d782c5ac
  function drawShape(pathBufs: PathBuffers, tx: Matrix4x4) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, glyphFb);
    // depth test without depth write
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GEQUAL);
    gl.depthMask(false);

    // additive blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.blendEquation(gl.FUNC_ADD);

    setModelMatrix(tx);

    shaderMgr.use(
      ["shape", "shape"],
      {
        position: pathBufs.vertices,
        offset: {
          buffer: sampleOffsetBuffer,
          rate: Rate.Instance,
        },
        fillColor: {
          buffer: sampleColorBuffer,
          rate: Rate.Instance,
        },
      },
      (shader) => {
        gl.uniformBlockBinding(shader.program, shader.uniforms.viewData, 0);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, modelViewProjection.buffer);
        pathBufs.polysIdx.bind();
        gl.drawElementsInstanced(
          gl.TRIANGLES,
          pathBufs.polysIdx.length,
          pathBufs.pathIdxType,
          0,
          sampleOffsetBuffer.length / 3
        );
      }
    );

    shaderMgr.use(
      ["shape", "shapeQuadratic"],
      {
        position: pathBufs.quadraticVertices,
        offset: {
          buffer: sampleOffsetBuffer,
          rate: Rate.Instance,
        },
        fillColor: {
          buffer: sampleColorBuffer,
          rate: Rate.Instance,
        },
      },
      (shader) => {
        gl.uniformBlockBinding(shader.program, shader.uniforms.viewData, 0);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, modelViewProjection.buffer);
        gl.drawArraysInstanced(
          gl.TRIANGLES,
          0,
          pathBufs.quadraticVertices.length / 3,
          sampleOffsetBuffer.length / 3
        );
      }
    );
  }

  function initShapeFb() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, glyphFb);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
  }

  function flushShapeFb() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, linearFb);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    );
    gl.blendEquation(gl.FUNC_ADD);

    shaderMgr.use(["fullscreenTriangle", "glyphPost"], {}, () => {
      gl.bindTexture(gl.TEXTURE_2D, glyphColor);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindTexture(gl.TEXTURE_2D, null);
    });
  }

  function draw(t: number) {
    updateCamera(t);

    gl.bindFramebuffer(gl.FRAMEBUFFER, linearFb);
    gl.clearBufferfv(gl.COLOR, 0, [0.05, 0.1, 0.1, 1]);
    gl.clearBufferfv(gl.DEPTH, 0, [0.0], 0);

    // Draw triangles
    drawTriangles();

    const separation = 0.3 + Math.cos(t / 7770) * 0.2;

    const txA = Matrix4x4.mulMany(
      Matrix4x4.translate(Vec3.new(separation, 0.0, 0.4)),
      Matrix4x4.rotateX(t / 2100),
      Matrix4x4.rotateZ((Math.PI * t) / 8000),
      Matrix4x4.translate(Vec3.new(-0.25, 0.25, 0.0))
    );

    const txE = Matrix4x4.mulMany(
      Matrix4x4.translate(Vec3.new(-separation, 0.0, 0.4)),
      Matrix4x4.rotateX(t / 2300 + 1.5),
      Matrix4x4.rotateZ((Math.PI * t) / 7000 + 1.2),
      Matrix4x4.translate(Vec3.new(-0.25, 0.25, 0.0))
    );

    initShapeFb();
    drawShape(pathDataA, txA);
    drawShape(pathDataE, txE);
    flushShapeFb();

    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(true); // not sure why this is necessary
    shaderMgr.use(["fullscreenTriangle", "linearToSrgb"], {}, () => {
      gl.bindTexture(gl.TEXTURE_2D, linearColor);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindTexture(gl.TEXTURE_2D, null);
    });
  }

  return { draw: catchallDedupe(draw), resize: catchallDedupe(resize) };
}

export function catchallDedupe<Args extends any[]>(
  fn: (...args: Args) => void
): (...args: Args) => void {
  let lastError: any = null;
  return function catchall(...args: Args) {
    try {
      fn(...args);
    } catch (e) {
      if (lastError == null || `${e}` !== `${lastError}`) {
        lastError = e;
        console.error(e);
      }
    }
  };
}
