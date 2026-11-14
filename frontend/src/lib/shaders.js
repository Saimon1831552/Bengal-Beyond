const HEAD = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec3 u_trail[12];
uniform sampler2D u_tex;
uniform vec2 u_img;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){
  float a = .5, s = 0.;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.; a *= .5; }
  return s;
}
`;

/** Photo that flows like water and is pushed/swirled by the cursor trail */
export const FLUID = HEAD + `
vec2 cover(vec2 uv){
  float ra = u_res.x / u_res.y, ri = u_img.x / u_img.y;
  vec2 s = ra > ri ? vec2(1., ri / ra) : vec2(ra / ri, 1.);
  return (uv - .5) * s + .5;
}
void main(){
  float aspect = u_res.x / u_res.y;
  vec2 uv = v;
  vec2 q = vec2(fbm(uv * 3. + u_time * .06), fbm(uv * 3. + vec2(5.2, 1.3) - u_time * .05));
  vec2 disp = (q - .5) * .02;
  float energy = 0.;
  for (int i = 0; i < 12; i++) {
    vec3 t = u_trail[i];
    vec2 d = uv - t.xy; d.x *= aspect;
    float w = exp(-dot(d, d) * 55.) * t.z;
    vec2 dir = normalize(d + vec2(1e-4));
    vec2 sw = vec2(-dir.y, dir.x);
    vec2 push = (dir * .6 + sw * .8) * w * .05;
    push.x /= aspect;
    disp += push;
    energy += w;
  }
  vec2 tuv = cover(uv + disp);
  float ca = .004 + energy * .012;
  vec3 col = vec3(texture2D(u_tex, tuv + vec2(ca, 0.)).r,
                  texture2D(u_tex, tuv).g,
                  texture2D(u_tex, tuv - vec2(ca, 0.)).b);
  float c = fbm(uv * 8. + q * 3. + u_time * .15);
  col += smoothstep(.55, .9, c) * .06 + energy * .08;
  float vg = smoothstep(1.1, .3, length((uv - .5) * vec2(aspect * .8, 1.)));
  col *= mix(.65, 1., vg);
  gl_FragColor = vec4(col, 1.);
}`;

/** Procedural flowing aurora in the brand palette, glows toward the cursor */
export const AURORA = HEAD + `
void main(){
  float aspect = u_res.x / u_res.y;
  vec2 uv = v; uv.x *= aspect;
  float t = u_time * .12;
  vec2 q = vec2(fbm(uv * 1.6 + t), fbm(uv * 1.6 + vec2(3.1, 1.7) - t));
  vec2 r = vec2(fbm(uv * 2. + q * 2. + vec2(1.7, 9.2) + t * 1.3),
                fbm(uv * 2. + q * 2. + vec2(8.3, 2.8) - t));
  float f = fbm(uv * 2. + r * 2.);
  vec2 m = u_mouse * vec2(aspect, 1.);
  f += .3 * exp(-dot(uv - m, uv - m) * 6.);
  for (int i = 0; i < 12; i++) {
    vec2 p = u_trail[i].xy * vec2(aspect, 1.);
    f += u_trail[i].z * .18 * exp(-dot(uv - p, uv - p) * 30.);
  }
  vec3 deep = vec3(.03, .17, .13), jade = vec3(.106, .612, .482);
  vec3 gold = vec3(.91, .66, .24), sea = vec3(.11, .49, .71);
  vec3 col = mix(deep, jade, smoothstep(.2, .7, f));
  col = mix(col, sea, smoothstep(.45, .9, r.x) * .5);
  col = mix(col, gold, smoothstep(.72, 1., f) * .55);
  gl_FragColor = vec4(col, 1.);
}`;