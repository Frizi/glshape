#version 300 es

vec2 vertices[3] = vec2[3](vec2(-1,-1), vec2(1,-1), vec2(-1, 1));

in mediump vec3 position;
in mediump vec2 texcoords;

out mediump vec2 uv;

void main(void) {
    gl_Position = vec4(position, 1);
    uv = texcoords;
}