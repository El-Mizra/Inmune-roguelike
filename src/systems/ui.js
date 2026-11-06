import Phaser from 'phaser';
import { Sfx } from './sfx.js';

export const FONT_TITLE = '"Press Start 2P", monospace';
export const FONT_BODY = '"VT323", monospace';

export const COLORS = {
  bg: 0x12060c,
  panel: 0x2a0f1c,
  panelLight: 0x3d1829,
  border: 0xc7787f,
  borderDim: 0x6e2c3b,
  accent: 0xffd166,
  text: '#f4d8e0',
  textDim: '#b88a98',
  gold: '#ffd166',
  pink: '#ff8fb0',
  green: '#8ee0b0',
  blue: '#9fc7ff',
  red: '#ff6b6b',
};

export function title(scene, x, y, text, size = 16, color = COLORS.text) {
  return scene.add
    .text(x, y, text, { fontFamily: FONT_TITLE, fontSize: `${size}px`, color, align: 'center' })
    .setOrigin(0.5)
    .setResolution(1);
}

export function body(scene, x, y, text, size = 22, color = COLORS.text, opts = {}) {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_BODY,
    fontSize: `${size}px`,
    color,
    lineSpacing: 0,
    ...opts,
  });
}

// Panel con borde "pixelado" (doble línea, esquinas recortadas).
export function panel(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  drawPanel(g, x, y, w, h, opts);
  return g;
}

export function drawPanel(g, x, y, w, h, { fill = COLORS.panel, border = COLORS.border, alpha = 0.96 } = {}) {
  g.fillStyle(fill, alpha);
  g.fillRect(x + 2, y, w - 4, h);
  g.fillRect(x, y + 2, w, h - 4);
  g.fillStyle(border, 1);
  g.fillRect(x + 2, y, w - 4, 2);
  g.fillRect(x + 2, y + h - 2, w - 4, 2);
  g.fillRect(x, y + 2, 2, h - 4);
  g.fillRect(x + w - 2, y + 2, 2, h - 4);
}

// Botón pixel-art. Devuelve un Container con .setLabel() y .setEnabled().
export function button(scene, x, y, w, h, label, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: opts.font || FONT_TITLE,
      fontSize: `${opts.size || 12}px`,
      color: opts.color || COLORS.text,
      align: 'center',
    })
    .setOrigin(0.5);
  c.add([g, txt]);
  let enabled = opts.enabled ?? true;
  let selected = !!opts.selected;
  let hover = false;
  const draw = () => {
    g.clear();
    const fill = !enabled ? 0x1d0a13 : selected ? 0x5a2236 : hover ? COLORS.panelLight : COLORS.panel;
    const border = !enabled ? COLORS.borderDim : selected ? COLORS.accent : hover ? 0xf0b0b8 : COLORS.border;
    drawPanel(g, -w / 2, -h / 2, w, h, { fill, border, alpha: 1 });
    txt.setColor(!enabled ? COLORS.textDim : selected ? COLORS.gold : opts.color || COLORS.text);
  };
  draw();
  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  c.add(zone);
  zone.on('pointerover', () => {
    hover = true;
    draw();
  });
  zone.on('pointerout', () => {
    hover = false;
    draw();
  });
  zone.on('pointerup', (pointer) => {
    if (!enabled) return;
    if (pointer && pointer.getDistance && pointer.getDistance() > 24) return;
    Sfx.ui();
    onClick?.();
  });
  c.setSize(w, h);
  c.setLabel = (s) => {
    txt.setText(s);
    return c;
  };
  c.setEnabled = (v) => {
    enabled = v;
    draw();
    return c;
  };
  c.setSelected = (v) => {
    selected = v;
    draw();
    return c;
  };
  c.label = txt;
  return c;
}

export function fadeIn(scene, ms = 250) {
  scene.cameras.main.fadeIn(ms, 18, 6, 12);
}

// Fondo animado con células y microbios flotando (para menús).
export function floatingBackdrop(scene, count = 18) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const keys = ['saureus', 'spyogenes', 'paeruginosa', 'calbicans', 'hsv1', 'neutrophil', 'kera', 'tcell', 'nkcell'];
  const items = [];
  for (let i = 0; i < count; i++) {
    const k = keys[i % keys.length];
    const s = scene.add
      .image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), k, 0)
      .setScale(Phaser.Math.Between(2, 4))
      .setAlpha(0.18)
      .setDepth(-5);
    s.vx = Phaser.Math.FloatBetween(-12, 12);
    s.vy = Phaser.Math.FloatBetween(-8, 8);
    s.vr = Phaser.Math.FloatBetween(-0.3, 0.3);
    items.push(s);
  }
  const onUpdate = (_t, dt) => {
    for (const s of items) {
      s.x += (s.vx * dt) / 1000;
      s.y += (s.vy * dt) / 1000;
      s.rotation += (s.vr * dt) / 1000;
      if (s.x < -40) s.x = W + 40;
      if (s.x > W + 40) s.x = -40;
      if (s.y < -40) s.y = H + 40;
      if (s.y > H + 40) s.y = -40;
    }
  };
  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', () => scene.events.off('update', onUpdate));
}

// Reinicia una escena de menú cuando cambia el tamaño de la ventana.
export function restartOnResize(scene, data) {
  const handler = () => {
    // si la pantalla ya está saliendo (fundido a negro), no la reinicies:
    // se perdería la navegación que el jugador acaba de pedir
    const cam = scene.cameras?.main;
    if (!scene.sys.isActive() || cam?.fadeEffect?.isRunning) return;
    scene.scene.restart(data);
  };
  let timer = null;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(handler, 120);
  };
  scene.scale.on('resize', debounced);
  scene.events.once('shutdown', () => {
    clearTimeout(timer);
    scene.scale.off('resize', debounced);
  });
}
