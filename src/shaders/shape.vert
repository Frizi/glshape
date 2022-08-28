#version 300 es

uniform viewData {
    mat4 MVPMatrix;
};

vec2 barycentric[3] = vec2[](vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(0.0, 0.0));

// vertex rate
in mediump vec3 position;

// instance rate
in mediump vec3 offset;
in mediump vec4 fillColor;

out mediump vec2 v_barycentric;
out mediump vec4 v_fillColor;

void main(void) {
    gl_Position =  MVPMatrix * vec4(position, 1) + vec4(offset, 0.0);
    v_barycentric = barycentric[gl_VertexID % 3];
    v_fillColor = fillColor;
}