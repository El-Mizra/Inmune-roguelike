// Pequeño "pintor" de píxeles para generar sprites por código.
// Cada sprite se dibuja píxel a píxel (sin antialiasing) y luego se sube a
// Phaser como textura con varios frames. Así el prototipo tiene pixel art
// propio sin depender de archivos externos; más adelante se puede sustituir
// por sprites dibujados a mano con el mismo nombre de textura.

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Generador pseudoaleatorio determinista (mulberry32).
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (this.inside(x, y)) this.px[y * this.w + x] = c;
  }

  get(x, y) {
    if (!this.inside(x, y)) return null;
    return this.px[y * this.w + x];
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  disc(cx, cy, r, c) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.set(x, y, c);
      }
    }
  }

  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
  }

  line(x0, y0, x1, y1, c) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      this.set(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), c);
    }
  }

  // Esfera sombreada con luz desde arriba a la izquierda.
  // pal = [oscuro, medio, claro, brillo]. wobble(angle) -> factor de radio.
  blob(cx, cy, r, pal, wobble = null, ry = null) {
    const rY = ry ?? r;
    const lx = -0.6;
    const ly = -0.75;
    for (let y = Math.floor(cy - rY - 2); y <= cy + rY + 2; y++) {
      for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
        const dx = (x + 0.5 - cx) / r;
        const dy = (y + 0.5 - cy) / rY;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (wobble) d /= wobble(Math.atan2(dy, dx));
        if (d > 1) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d * d));
        const light = (dx * lx + dy * ly) * 0.8 + nz * 0.6;
        let c = pal[1];
        if (light < 0.25) c = pal[0];
        else if (light > 0.82 && pal[3]) c = pal[3];
        else if (light > 0.62) c = pal[2];
        this.set(x, y, c);
      }
    }
  }

  // Contorno de 1px alrededor de todo lo dibujado.
  outline(c, diagonal = false) {
    const copy = this.px.slice();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (copy[y * this.w + x]) continue;
        const n = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        if (diagonal) n.push([1, 1], [-1, -1], [1, -1], [-1, 1]);
        for (const [ox, oy] of n) {
          const xx = x + ox;
          const yy = y + oy;
          if (xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && copy[yy * this.w + xx]) {
            this.px[y * this.w + x] = c;
            break;
          }
        }
      }
    }
  }

  // Dispersa píxeles de un color dentro de lo ya pintado.
  speckle(color, count, rand, onlyOn = null) {
    let tries = 0;
    let placed = 0;
    while (placed < count && tries < count * 40) {
      tries++;
      const x = Math.floor(rand() * this.w);
      const y = Math.floor(rand() * this.h);
      const cur = this.get(x, y);
      if (!cur) continue;
      if (onlyOn && !onlyOn.includes(cur)) continue;
      this.set(x, y, color);
      placed++;
    }
  }

  writeTo(ctx, ox, oy) {
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      if (!c) continue;
      const [r, g, b] = hexToRgb(c);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, ox, oy);
  }
}

// Crea una textura de Phaser con `frames` cuadros de w×h dibujados por drawFn(p, frame).
export function makeTexture(scene, key, w, h, frames, drawFn) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = document.createElement('canvas');
  canvas.width = w * frames;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let f = 0; f < frames; f++) {
    const p = new Painter(w, h);
    drawFn(p, f);
    p.writeTo(ctx, f * w, 0);
  }
  const tex = scene.textures.addCanvas(key, canvas);
  for (let f = 0; f < frames; f++) tex.add(f, 0, f * w, 0, w, h);
  return tex;
}
