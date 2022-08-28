#version 300 es

uniform viewData {
    mat4 MVPMatrix;
};

in mediump vec3 position;

void main(void) {
    gl_Position =  MVPMatrix * vec4(position, 1);
}