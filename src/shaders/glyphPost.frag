#version 300 es

precision mediump float;
precision mediump sampler2D;

uniform sampler2D rawGlyphTexture;

out mediump vec4 outputColor;


void main(void) {
    vec4 glyphData = texelFetch(rawGlyphTexture, ivec2(gl_FragCoord.xy), 0);
    ivec4 iCoverage = ivec4(glyphData * 255.0);
    ivec4 coverageLow = iCoverage & 0x01;
    ivec4 coverageHigh = (iCoverage & 0x10) / 0x10;
    vec4 coverage = vec4(coverageLow + coverageHigh);
    float c = (coverage.x + coverage.y + coverage.z + coverage.w) / 6.0;
    outputColor = vec4(1.0,1.0,1.0, c);
} 
