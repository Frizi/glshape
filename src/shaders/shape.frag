#version 300 es

precision mediump float; 

in mediump vec4 v_fillColor;
out mediump vec4 outputColor;

void main(void) {
    outputColor = v_fillColor;
}
