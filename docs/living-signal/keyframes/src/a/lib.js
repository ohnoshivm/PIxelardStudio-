// Direction A — "Every Piece Is Whole" — keyframe comp library (exploration code, not production).
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
export { THREE };

export const PALETTES = {
  proof:    { ground: '#161514', groundAlbedo: '#0e0d0c', paper: '#efeadf', ink: '#1a1917', proof: '#ff2e7e', edge: '#fbf7ee', light: '#fff5e8', blend: 'multiply' },
  board:    { ground: '#171615', groundAlbedo: '#171615', paper: '#b8ad9b', ink: '#141312', proof: '#ff5b1f', edge: '#d9d0bf', light: '#ffe9cf', blend: 'multiply' },
  nightrun: { ground: '#0e0e0d', groundAlbedo: '#0e0e0d', paper: '#2b2a28', ink: '#e8e1d2', proof: '#ffb22a', edge: '#4a4844', light: '#ffe6c4', blend: 'screen' },
};

// ---------- typesetting: the fit rule ----------
// A line fills its measure exactly. Width axis does the fitting; size only moves when wdth hits its limits.
export function fitLine(el, measure, size, { wght = 400, wMin = 50, wMax = 150 } = {}) {
  el.style.whiteSpace = 'nowrap';
  el.style.display = 'block';
  el.style.width = 'max-content';
  let s = size;
  const set = (w) => { el.style.fontSize = s + 'px'; el.style.fontVariationSettings = `"wdth" ${w}, "wght" ${wght}`; return el.getBoundingClientRect().width / currentScale(el); };
  for (let pass = 0; pass < 6; pass++) {
    let lo = wMin, hi = wMax, w = 100;
    const wLo = set(lo), wHi = set(hi);
    if (wLo > measure) { s *= measure / wLo * 0.995; continue; }       // too big even at narrowest: shrink
    if (wHi < measure) { s *= measure / wHi * 0.995; continue; }       // too small even at widest: grow
    for (let i = 0; i < 22; i++) { w = (lo + hi) / 2; if (set(w) > measure) hi = w; else lo = w; }
    set(lo);
    el.dataset.wdth = lo.toFixed(1);
    break;
  }
  el.style.width = measure + 'px';
  return el;
}
// getBoundingClientRect is affected by CSS3D transforms; we measure in an untransformed sandbox instead.
let sandbox;
function currentScale() { return 1; }
export function measureIn(el) {
  if (!sandbox) { sandbox = document.createElement('div'); sandbox.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden'; document.body.appendChild(sandbox); }
  sandbox.appendChild(el); return el;
}

// Build a piece's typeset content. spec: { w, h, lines:[{t, role}], name, back, seq, wght }
export function setPiece(spec, pal) {
  const { w, h } = spec;
  const short = Math.min(w, h);
  const m = Math.round(short / 12);
  const root = document.createElement('div');
  root.className = 'piece';
  root.style.cssText = `position:relative;width:${w}px;height:${h}px;font-family:Anybody;color:${pal.ink};`;
  const measure = w - 2 * m;
  let y = m;
  const blocks = spec.blocks || [];
  for (const b of blocks) {
    if (b.type === 'fit') {
      // each line fills the measure
      const lh = b.lh ?? 0.86;
      for (const t of b.lines) {
        const el = document.createElement('div'); el.textContent = t;
        el.style.lineHeight = lh; el.style.letterSpacing = '-0.01em';
        measureIn(el); fitLine(el, measure, b.size, { wght: b.wght ?? 500 });
        const hpx = parseFloat(el.style.fontSize) * lh;
        el.style.position = 'absolute'; el.style.left = m + 'px'; el.style.top = (b.at === 'bottom' ? 0 : y) + 'px';
        root.appendChild(el);
        if (b.at !== 'bottom') y += hpx;
        b._h = (b._h || 0) + hpx; b._els = (b._els || []).concat(el);
      }
      if (b.at === 'bottom') { // place from bottom
        let yy = h - m - b._h;
        for (const el of b._els) { el.style.top = yy + 'px'; yy += parseFloat(el.style.fontSize) * (b.lh ?? 0.86); }
      }
      y += b.gap ?? m * 0.5;
    } else if (b.type === 'text') {
      const el = document.createElement('div'); el.innerHTML = b.html;
      el.style.cssText = `position:absolute;left:${m}px;${b.at === 'bottom' ? `bottom:${b.bottom ?? m}px` : `top:${y}px`};width:${measure * (b.widthFrac ?? 1)}px;font-size:${b.size}px;line-height:${b.lh ?? 1.25};font-variation-settings:"wdth" ${b.wdth ?? 100}, "wght" ${b.wght ?? 400};`;
      root.appendChild(el);
      if (b.at !== 'bottom') y += b.size * (b.lh ?? 1.25) * (b.rows ?? 1) + (b.gap ?? m * 0.5);
    }
  }
  // the back mark: proof-coloured bar on the spine (left) edge, stepping down by sequence
  if (spec.back !== false) {
    const bw = Math.max(3, Math.round(short / 48)), bh = bw * 5;
    const seq = spec.seq ?? 0;
    const top = m + seq * bh * 0.9;
    const bar = document.createElement('div');
    bar.style.cssText = `position:absolute;left:0;top:${top}px;width:${bw}px;height:${bh}px;background:${pal.proof};`;
    root.appendChild(bar);
  }
  return root;
}

// ---------- paper ----------
function fibreNormalMap(size = 1024, seed = 3) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size);
  let s = seed; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hgt = new Float32Array(size * size);
  // low-frequency cloud
  const N = 32, grid = Array.from({ length: (N + 1) * (N + 1) }, R);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const gx = x / size * N, gy = y / size * N, ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy;
    const a = grid[iy * (N + 1) + ix], b = grid[iy * (N + 1) + ix + 1], c2 = grid[(iy + 1) * (N + 1) + ix], d = grid[(iy + 1) * (N + 1) + ix + 1];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    hgt[y * size + x] = 0.25 * ((a * (1 - sx) + b * sx) * (1 - sy) + (c2 * (1 - sx) + d * sx) * sy);
  }
  // fibres: short streaks along the grain (x)
  for (let k = 0; k < 9000; k++) {
    const x0 = R() * size, y0 = R() * size, len = 6 + R() * 30, amp = (R() - 0.5) * 0.9;
    for (let t = 0; t < len; t++) { const x = (x0 + t) % size | 0, y = (y0 + Math.sin(t * 0.2) * 0.6 + size) % size | 0; hgt[y * size + x] += amp * 0.18; }
  }
  for (let i = 0; i < size * size; i++) hgt[i] += (R() - 0.5) * 0.06;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const dx = hgt[y * size + (x + 1) % size] - hgt[y * size + (x - 1 + size) % size];
    const dy = hgt[((y + 1) % size) * size + x] - hgt[((y - 1 + size) % size) * size + x];
    const nx = -dx * 2.2, ny = -dy * 2.2, nz = 1; const l = Math.hypot(nx, ny, nz);
    img.data[i * 4] = (nx / l * 0.5 + 0.5) * 255; img.data[i * 4 + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i * 4 + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// ---------- stage ----------
export function stage({ palette = 'proof', W = 1600, H = 900, cam = {}, light = {}, groundSize = 8000, exposure = 1.0 } = {}) {
  const pal = PALETTES[palette];
  document.body.style.background = pal.ground;
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(pal.ground);
  const camera = new THREE.PerspectiveCamera(cam.fov ?? 20, W / H, 10, 40000);
  camera.position.set(...(cam.pos ?? [0, -500, 2400])); camera.up.set(0, 1, 0); camera.lookAt(new THREE.Vector3(...(cam.look ?? [0, 0, 0])));
  // light: one low raking key from the left, warm; almost no fill
  const key = new THREE.SpotLight(pal.light, light.intensity ?? 7.6, 0, light.angle ?? 0.55, 1.0, 0);
  key.position.set(...(light.pos ?? [-3200, 1400, 1100])); key.target.position.set(...(light.target ?? [300, -100, 0]));
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 500; key.shadow.camera.far = 12000; key.shadow.bias = -0.0004; key.shadow.radius = 6;
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight('#fff6ea', '#2a2622', light.fill ?? 0.42));
  const groundMat = new THREE.MeshStandardMaterial({ color: pal.groundAlbedo || pal.ground, roughness: 0.96, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), groundMat); ground.receiveShadow = true; scene.add(ground);
  const fibre = fibreNormalMap();
  const paperMat = (w, h) => {
    const n = fibre.clone(); n.needsUpdate = true; n.repeat.set(w / 700, h / 700);
    return new THREE.MeshStandardMaterial({ color: pal.paper, roughness: 0.88, metalness: 0, normalMap: n, normalScale: new THREE.Vector2(0.42, 0.42) });
  };
  const edgeMat = new THREE.MeshStandardMaterial({ color: pal.edge, roughness: 0.7, emissive: pal.edge, emissiveIntensity: 0.12 });
  // CSS3D layer for type
  const css = new CSS3DRenderer(); css.setSize(W, H);
  css.domElement.style.cssText = `position:absolute;left:0;top:0;mix-blend-mode:${pal.blend};pointer-events:none`;
  document.body.appendChild(css.domElement);
  const cssScene = new THREE.Scene();
  // labels on the ground get their own, unblended layer
  const cssLab = new CSS3DRenderer(); cssLab.setSize(W, H);
  cssLab.domElement.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none';
  document.body.appendChild(cssLab.domElement);
  const labScene = new THREE.Scene();

  const pieces = [];
  function addPiece({ x = 0, y = 0, w, h, z = 0, rot = 0, tiltX = 0, tiltY = 0, t = 2.2, content = null, opacity = 1, opaque = false }) {
    const g = new THREE.Group(); g.position.set(x, y, z + t / 2); g.rotation.set(tiltX, tiltY, rot);
    const mats = [edgeMat, edgeMat, edgeMat, edgeMat, paperMat(w, h), edgeMat];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), mats); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh);
    scene.add(g);
    let obj = null;
    if (content) {
      content.style.opacity = opacity; if (opaque) content.style.background = pal.blend === 'multiply' ? '#ffffff' : '#000000';
      obj = new CSS3DObject(content);
      const cg = new THREE.Group(); cg.position.copy(g.position); cg.rotation.copy(g.rotation);
      obj.position.set(0, 0, t / 2 + 0.3); cg.add(obj); cssScene.add(cg);
    }
    pieces.push({ g, mesh, obj });
    return { g, mesh, obj };
  }
  function addLabel(el, { x, y, z = 0.5, rot = 0 }) { // DOM label lying on the ground plane
    const o = new CSS3DObject(el); o.position.set(x, y, z); o.rotation.z = rot; labScene.add(o); return o;
  }
  function render() { renderer.render(scene, camera); css.render(cssScene, camera); cssLab.render(labScene, camera); }
  return { THREE, scene, camera, renderer, css, cssScene, pal, addPiece, addLabel, render, key };
}

export async function fontsReady() {
  await document.fonts.load('500 100px Anybody'); await document.fonts.load('italic 400 20px Anybody');
  await document.fonts.ready;
}
export async function done() { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); window.__done = true; }
