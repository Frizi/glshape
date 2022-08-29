import { AnyBuffer, isAnyBuffer } from "./buffer";
import { getShaderSource as getShaderSourceInit } from "./shaderSources";
let getShaderSource = getShaderSourceInit;

interface AttributeKind {
  size: number;
  type: number;
}

function kindForTypename(
  gl: WebGL2RenderingContext,
  typename: string
): AttributeKind {
  switch (typename) {
    case "float":
      return { size: 1, type: gl.FLOAT };
    case "vec2":
      return { size: 2, type: gl.FLOAT };
    case "vec3":
      return { size: 3, type: gl.FLOAT };
    case "vec4":
      return { size: 4, type: gl.FLOAT };
    case "int":
      return { size: 1, type: gl.INT };
    case "ivec2":
      return { size: 2, type: gl.INT };
    case "ivec3":
      return { size: 3, type: gl.INT };
    case "ivec4":
      return { size: 4, type: gl.INT };
    default:
      throw new Error(`Unsupported attribute type ${typename}`);
  }
}

interface ShaderData {
  shader: WebGLShader;
  uniforms: Set<string>;
  inAttributes: Map<string, AttributeKind>;
  outAttributes: Map<string, AttributeKind>;
}

export interface AttributeData {
  index: number;
  size: number;
  type: number;
}

interface Attributes {
  [k: string]: AttributeData;
}

interface UniformBlocks {
  [k: string]: number;
}

interface ProgramData {
  program: WebGLProgram;
  attributes: Attributes;
  uniforms: UniformBlocks;
}

function parseInputs(gl: WebGL2RenderingContext, source: string) {
  const inAttributes = new Map<string, AttributeKind>();
  const outAttributes = new Map<string, AttributeKind>();
  const uniforms = new Set<string>();

  const attribPattern = /^\s*(in|out)\s+(\w+)\s+(\w+)\s+(\w+)\s*;$/gm;
  const uniformBlockPattern = /^\s*uniform\s+(\w+)\s+\{/gm;
  let match;
  while ((match = attribPattern.exec(source))) {
    const [_full, inout, _precision, typename, name] = match;
    const kind = kindForTypename(gl, typename);
    if (inout === "in") {
      inAttributes.set(name, kind);
    } else if (inout === "out") {
      outAttributes.set(name, kind);
    }
  }
  while ((match = uniformBlockPattern.exec(source))) {
    const [_full, _type, name] = match;
    uniforms.add(name);
  }

  return { inAttributes, outAttributes, uniforms };
}

function makeShaderManager(gl: WebGL2RenderingContext) {
  const shaderObjectCache = new Map<string, ShaderData>();
  const shaderProgramCache = new Map<string, ProgramData>();

  function updateSourceData(
    oldSrc: typeof getShaderSource,
    newSrc: typeof getShaderSource
  ) {
    for (const filename of shaderObjectCache.keys()) {
      if (oldSrc(filename) != newSrc(filename)) {
        invalidateShaderCache(filename);
      }
    }
  }

  function invalidateShaderCache(filename: string) {
    console.log(`Invalidate '${filename}'`);
    shaderObjectCache.delete(filename);
    for (const key of shaderProgramCache.keys()) {
      if (key.includes(filename)) {
        const cachedProgram = shaderProgramCache.get(key)!;
        gl.deleteProgram(cachedProgram.program);
        shaderProgramCache.delete(key);
      }
    }
    const cachedShader = shaderObjectCache.get(filename);
    if (cachedShader != null) {
      gl.deleteShader(cachedShader.shader);
      shaderObjectCache.delete(filename);
    }
  }

  function getShaderKindPostfix(kind: number) {
    switch (kind) {
      case gl.VERTEX_SHADER:
        return "vert";
      case gl.FRAGMENT_SHADER:
        return "frag";
      default:
        throw new Error(`Unknown shader kind '${kind}'`);
    }
  }

  function getShaderData(name: string, kind: number): ShaderData {
    const postfix = getShaderKindPostfix(kind);
    const filename = `${name}.${postfix}`;
    const cached = shaderObjectCache.get(filename);
    if (cached != null) return cached;

    const shaderSrc = getShaderSource(filename);
    const shaderObj = gl.createShader(kind);
    if (shaderObj == null) {
      throw new Error(
        `Failed to create shader object for '${name}.${postfix}'`
      );
    }
    gl.shaderSource(shaderObj, shaderSrc);
    gl.compileShader(shaderObj);
    if (!gl.getShaderParameter(shaderObj, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shaderObj);
      gl.deleteShader(shaderObj);
      throw new Error(`Failed to compile shader '${filename}': ${info}`);
    }

    const inputs = parseInputs(gl, shaderSrc);
    const shaderData = {
      shader: shaderObj,
      inAttributes: inputs.inAttributes,
      outAttributes: inputs.outAttributes,
      uniforms: inputs.uniforms,
    };

    shaderObjectCache.set(filename, shaderData);
    return shaderData;
  }

  function getProgramData(vert: string, frag: string): ProgramData {
    const cacheKey = `${vert}.vert\0${frag}.frag`;
    const cached = shaderProgramCache.get(cacheKey);
    if (cached) return cached;

    const vertShader = getShaderData(vert, gl.VERTEX_SHADER);
    let fragShader;

    try {
      fragShader = getShaderData(frag, gl.FRAGMENT_SHADER);
    } catch (e) {
      console.error(e);
      fragShader = getShaderData("fallback", gl.FRAGMENT_SHADER);

      // Fill cache with fallback shader to prevent repeated errors
      const postfix = getShaderKindPostfix(gl.FRAGMENT_SHADER);
      const filename = `${frag}.${postfix}`;
      shaderObjectCache.set(filename, fragShader);
    }

    const program = gl.createProgram();
    if (program == null) {
      throw new Error(`Failed to create shader program`);
    }

    gl.attachShader(program, vertShader.shader);
    gl.attachShader(program, fragShader.shader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(
        `Failed to link shader program for '${vert}' and '${frag}': ${info}`
      );
    }

    let attributes: Attributes = {};
    let uniforms: UniformBlocks = {};

    for (const [name, kind] of vertShader.inAttributes) {
      if (name in attributes) continue;
      const index = gl.getAttribLocation(program, name);
      if (index >= 0) {
        attributes[name] = {
          index,
          type: kind.type,
          size: kind.size,
        };
      }
    }

    for (const set of [vertShader.uniforms, fragShader.uniforms]) {
      for (const name of set) {
        if (name in uniforms) continue;
        const loc = gl.getUniformBlockIndex(program, name);
        if (loc >= 0) {
          uniforms[name] = loc;
        }
      }
    }

    const programData = {
      program,
      attributes,
      uniforms,
    };
    shaderProgramCache.set(cacheKey, programData);
    return programData;
  }

  return {
    use(
      [vert, frag]: [string, string],
      attributes: { [k: string]: AttribSettings | AnyBuffer },
      fn: (data: ProgramData) => void
    ) {
      const programData = getProgramData(vert, frag);
      gl.useProgram(programData.program);

      const settings: InternalAttribSettings[] = Object.entries(attributes).map(
        ([name, settings]) => {
          const attribData = programData.attributes[name];
          if (attribData == null)
            throw new Error(`Unknown attribute '${name}'`);
          return mapAttribSettings(settings, attribData);
        }
      );

      withAttributes(gl, settings, () => {
        fn(programData);
      });
    },
    updateSourceData,
  };
}

const managerPerContext = new Map<
  WebGL2RenderingContext,
  ReturnType<typeof makeShaderManager>
>();

export enum Rate {
  Vertex,
  Instance,
}

interface AttribSettings {
  buffer: AnyBuffer;
  rate?: Rate;
  normalized?: boolean;
  stride?: number;
  offset?: number;
}

interface InternalAttribSettings {
  index: number;
  buffer: AnyBuffer;
  size: number;
  type: number;
  rate: Rate;
  normalized: boolean;
  stride: number;
  offset: number;
}

function mapAttribSettings(
  settings: AttribSettings | AnyBuffer,
  attribData: AttributeData
): InternalAttribSettings {
  if (isAnyBuffer(settings)) {
    return {
      index: attribData.index,
      buffer: settings,
      size: attribData.size,
      type: attribData.type,
      rate: Rate.Vertex,
      normalized: false,
      stride: 0,
      offset: 0,
    };
  } else {
    return {
      index: attribData.index,
      buffer: settings.buffer,
      size: attribData.size,
      type: attribData.type,
      rate: settings.rate ?? Rate.Vertex,
      normalized: settings.normalized ?? false,
      stride: settings.stride ?? 0,
      offset: settings.offset ?? 0,
    };
  }
}

function withAttributes(
  gl: WebGL2RenderingContext,
  attribs: InternalAttribSettings[],
  fn: () => void
) {
  for (const attrib of attribs) {
    gl.enableVertexAttribArray(attrib.index);
    gl.vertexAttribDivisor(attrib.index, attrib.rate === Rate.Instance ? 1 : 0);
    attrib.buffer.bind();
    gl.vertexAttribPointer(
      attrib.index,
      attrib.size,
      attrib.type,
      attrib.normalized,
      attrib.stride,
      attrib.offset
    );
  }

  fn();

  for (const attrib of attribs) {
    gl.disableVertexAttribArray(attrib.index);
  }
}

export function shaderManager(gl: WebGL2RenderingContext) {
  if (!managerPerContext.has(gl)) {
    managerPerContext.set(gl, makeShaderManager(gl));
  }
  return managerPerContext.get(gl)!;
}

if (import.meta.hot) {
  import.meta.hot.accept("./shaderSources", (newSources) => {
    if (newSources == null) return;
    const prevShaderSource = getShaderSource;
    const newShaderSource = newSources.getShaderSource;
    getShaderSource = newSources.getShaderSource;
    for (const [context, manager] of managerPerContext.entries()) {
      if (context.isContextLost() || context.canvas == null) {
        managerPerContext.delete(context);
      } else {
        manager.updateSourceData(prevShaderSource, newShaderSource);
      }
    }
  });
}
