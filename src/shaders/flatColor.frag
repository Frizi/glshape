#version 300 es


in mediump vec3 vertexColor;
out mediump vec4 outputColor;

void main(void) {
    outputColor = vec4(vertexColor, 1.0);
}
