#version 300 es

uniform viewData {
    mat4 MVPMatrix;
};

in mediump vec3 position;
in mediump vec3 color;

out mediump vec3 vertexColor;

void main(void) {
    gl_Position =  MVPMatrix * vec4(position, 1);
    vertexColor = color;
}