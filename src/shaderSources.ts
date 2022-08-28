const shaderSources = import.meta.glob("./shaders/*", {
  as: "raw",
  eager: true,
});

export function getShaderSource(filename: string): string {
  const source = shaderSources[`./shaders/${filename}`] as string | undefined;
  if (source == null) {
    throw new Error(`Shader source for '${filename}' not found`);
  }
  return source;
}
