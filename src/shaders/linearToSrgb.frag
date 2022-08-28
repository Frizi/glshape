#version 300 es

precision mediump float;
precision mediump sampler2D;

uniform sampler2D linear;

out mediump vec4 srgbOutput;


vec4 fromLinear(vec4 linearRGB)
{
    bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
    vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
    vec3 lower = linearRGB.rgb * vec3(12.92);

    return vec4(mix(higher, lower, cutoff), linearRGB.a);
}

void main(void) {
    vec4 linearData = texelFetch(linear, ivec2(gl_FragCoord.xy), 0);
    srgbOutput = fromLinear(linearData);
} 
