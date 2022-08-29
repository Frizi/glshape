export type StaticBuffer = ReturnType<typeof createStaticBuffer>;
export type DynamicBuffer = ReturnType<typeof createDynamicBuffer>;
export type AnyBuffer = StaticBuffer | DynamicBuffer;

const buferBrand = Symbol("buffer");

export function createStaticBuffer<T extends BufferSource & ArrayLike<any>>(
  gl: WebGL2RenderingContext,
  data: T,
  target: number = gl.ARRAY_BUFFER
) {
  const buffer = gl.createBuffer();
  if (buffer == null) throw new Error("Failed to create buffer");
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);

  function bind() {
    gl.bindBuffer(target, buffer);
  }
  return { _buffer: buferBrand, buffer, bind, length: data.length };
}

export function createDynamicBuffer(
  gl: WebGL2RenderingContext,
  target: number = gl.UNIFORM_BUFFER
) {
  const buffer = gl.createBuffer();
  if (buffer == null) throw new Error("Failed to create buffer");
  let size = 0;

  function update(data: BufferSource) {
    gl.bindBuffer(target, buffer);
    let bufLen = data.byteLength;
    if (bufLen > size) {
      gl.bufferData(target, bufLen, gl.DYNAMIC_DRAW);
      size = bufLen;
    }
    gl.bufferSubData(target, 0, data);
  }
  function bind() {
    gl.bindBuffer(target, buffer);
  }

  return { _buffer: buferBrand, buffer, bind, update };
}

export function isAnyBuffer(x: any): x is AnyBuffer {
  return x != null && "_buffer" in x && x._buffer == buferBrand;
}
