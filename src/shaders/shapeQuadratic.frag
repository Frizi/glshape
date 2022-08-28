#version 300 es

precision mediump float; 

in mediump vec4 v_fillColor;
in mediump vec2 v_barycentric;

out mediump vec4 outputColor;

void main(void) {
    float f = v_barycentric.x * 0.5 + v_barycentric.y;
    if (f * f >= v_barycentric.y) {
        discard;
    }

    outputColor = v_fillColor;
}
