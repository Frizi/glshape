import "./style.css";
import { init, ctxOptions } from "./frame";

function getCanvas() {
  const canvas = document.querySelector<HTMLCanvasElement>("canvas");
  if (canvas == null || !canvas.getContext) throw new Error("Canvas not found");
  return canvas;
}

function openGlContext(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", ctxOptions);
  if (gl == null) throw new Error("WebGL not supported");
  return gl;
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const bufferWidth = Math.ceil(width * ratio);
  const bufferHeight = Math.ceil(height * ratio);
  if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
    canvas.style.setProperty("width", `${width}px`);
    canvas.style.setProperty("height", `${height}px`);
    return true;
  }
  return false;
}

const canvas = getCanvas();
resizeCanvas();
let gl = openGlContext(canvas);
let app = init(gl);

function tick(t: number) {
  let resized = resizeCanvas();
  if (gl.isContextLost()) {
    gl = openGlContext(canvas);
    app = init(gl);
  } else if (resized) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    app.resize();
  }
  app.draw(t);
  animFrame = requestAnimationFrame(tick);
}
let animFrame = requestAnimationFrame(tick);

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    cancelAnimationFrame(animFrame);
  });
}
