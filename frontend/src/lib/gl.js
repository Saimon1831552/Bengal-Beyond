export const VERT = `attribute vec2 p; varying vec2 v;
void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

export function compile(gl, vs, fs) {
  const make = (type, src) => {
    const s = gl.createShader(type);
    if (!s) {
      console.error("Unable to create WebGL shader; the context may be lost.");
      return null;
    }
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s) || "WebGL shader compilation failed without an info log.");
      gl.deleteShader(s);
      return null;
    }
    return s;
  };
  const a = make(gl.VERTEX_SHADER, vs);
  if (!a) return null;
  const b = make(gl.FRAGMENT_SHADER, fs);
  if (!b) {
    gl.deleteShader(a);
    return null;
  }
  const prog = gl.createProgram();
  if (!prog) {
    console.error("Unable to create WebGL program; the context may be lost.");
    gl.deleteShader(a);
    gl.deleteShader(b);
    return null;
  }
  gl.attachShader(prog, a);
  gl.attachShader(prog, b);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog) || "WebGL program linking failed without an info log.");
    gl.deleteProgram(prog);
    gl.deleteShader(a);
    gl.deleteShader(b);
    return null;
  }
  gl.detachShader(prog, a);
  gl.detachShader(prog, b);
  gl.deleteShader(a);
  gl.deleteShader(b);
  return prog;
}