import { getShaderSource as getShaderSourceInit } from "./shaderSources";
let getShaderSource = getShaderSourceInit;

interface ShaderData {
  shader: WebGLShader;
  uniforms: Set<string>;
  inAttributes: Set<string>;
  outAttributes: Set<string>;
}

interface AttributeLocations {
  [k: string]: number;
}

interface UniformBlocks {
  [k: string]: number;
}

interface ProgramData {
  program: WebGLProgram;
  attributes: AttributeLocations;
  uniforms: UniformBlocks;
}

function parseInputs(source: string) {
  const inAttributes = new Set<string>();
  const outAttributes = new Set<string>();
  const uniforms = new Set<string>();

  const attribPattern = /^\s*(in|out)\s+(\w+)\s+(\w+)\s+(\w+)\s*;$/gm;
  const uniformBlockPattern = /^\s*uniform\s+(\w+)\s+\{/gm;
  let match;
  while ((match = attribPattern.exec(source))) {
    const [_full, inout, _precision, _type, name] = match;
    if (inout === "in") {
      inAttributes.add(name);
    } else if (inout === "out") {
      outAttributes.add(name);
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

    const inputs = parseInputs(shaderSrc);
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

    let attributes: AttributeLocations = {};
    let uniforms: UniformBlocks = {};

    for (const name of vertShader.inAttributes) {
      if (name in attributes) continue;
      const loc = gl.getAttribLocation(program, name);
      if (loc >= 0) {
        attributes[name] = loc;
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
    use(vert: string, frag: string): ProgramData {
      const programData = getProgramData(vert, frag);
      gl.useProgram(programData.program);
      return programData;
    },
    updateSourceData,
  };
}

const managerPerContext = new Map<
  WebGL2RenderingContext,
  ReturnType<typeof makeShaderManager>
>();

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
