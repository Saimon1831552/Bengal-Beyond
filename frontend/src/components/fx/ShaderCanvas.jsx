"use client";
import { useEffect, useRef } from "react";
import { VERT, compile } from "@/lib/gl";
import { prefersReduced } from "@/lib/gsap";

const N = 12; // cursor-trail slots (slot 0 is an autonomous "ghost" swirl)

export default function ShaderCanvas({ frag, src, className = "", dprMax = 1.5 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return; // caller keeps a CSS/Image fallback underneath
    const prog = compile(gl, VERT, frag);
    if (!prog) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    if (!buf) {
      console.error("Unable to create WebGL buffer; the context may be lost.");
      gl.deleteProgram(prog);
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    const L = (n) => gl.getUniformLocation(prog, n);
    const uTime = L("u_time"), uRes = L("u_res"), uTrail = L("u_trail[0]");
    const uTex = L("u_tex"), uImg = L("u_img"), uMouse = L("u_mouse");

    const reduced = prefersReduced();
    const trail = new Float32Array(N * 3);
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let head = 1, last = [-1, -1];
    let texture = null, ready = !src, alive = true, visible = true, raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprMax);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };

    const draw = (now) => {
      const t = now / 1000;
      resize();
      trail[0] = 0.5 + 0.3 * Math.sin(t * 0.4);
      trail[1] = 0.5 + 0.2 * Math.cos(t * 0.33);
      trail[2] = 0.35;
      for (let i = 1; i < N; i++) trail[i * 3 + 2] *= 0.955;
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      gl.uniform1f(uTime, t);
      gl.uniform3fv(uTrail, trail);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.style.opacity = "1"; // fade in over the fallback
    };

    if (src) {
      const im = new Image();
      im.crossOrigin = "anonymous"; // Unsplash sends CORS headers; your own CDN must too
      im.onload = () => {
        if (!alive) return;
        texture = gl.createTexture();
        if (!texture) {
          console.error("Unable to create WebGL texture; the context may be lost.");
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(uTex, 0);
        gl.uniform2f(uImg, im.naturalWidth, im.naturalHeight);
        ready = true;
        if (reduced) draw(0);
      };
      im.src = src;
    }

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      mouse.tx = x; mouse.ty = y;
      if (Math.hypot(x - last[0], y - last[1]) > 0.006) {
        trail[head * 3] = x; trail[head * 3 + 1] = y; trail[head * 3 + 2] = 1;
        head = (head % (N - 1)) + 1;
        last = [x, y];
      }
    };

    const tick = (now) => {
      if (visible && !document.hidden && ready) draw(now);
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const onLost = (e) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost);

    if (reduced) { if (ready) draw(0); }
    else {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(tick);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (texture) gl.deleteTexture(texture);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [frag, src, dprMax]);

  return <canvas ref={ref} aria-hidden="true" className={`opacity-0 transition-opacity duration-1000 ${className}`} />;
}