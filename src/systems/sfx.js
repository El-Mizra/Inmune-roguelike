import { Save } from './storage.js';

// Efectos de sonido sintetizados con WebAudio (sin archivos de audio).
let ctx = null;
let master = null;

function ac() {
  if (!Save.settings.sound) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone({ freq = 440, to = null, dur = 0.1, type = 'square', vol = 0.5, delay = 0 }) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.15, vol = 0.4, freq = 1200 }) {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start();
}

let lastShot = 0;
export const Sfx = {
  unlock() {
    ac();
  },
  shoot() {
    const now = performance.now();
    if (now - lastShot < 60) return;
    lastShot = now;
    tone({ freq: 880, to: 520, dur: 0.05, type: 'square', vol: 0.12 });
  },
  hit() {
    tone({ freq: 300, to: 160, dur: 0.06, type: 'triangle', vol: 0.25 });
  },
  kill() {
    noise({ dur: 0.18, vol: 0.35, freq: 900 });
    tone({ freq: 220, to: 80, dur: 0.15, type: 'sine', vol: 0.3 });
  },
  hurt() {
    tone({ freq: 160, to: 60, dur: 0.25, type: 'sawtooth', vol: 0.3 });
    noise({ dur: 0.12, vol: 0.25, freq: 600 });
  },
  pickup() {
    tone({ freq: 660, dur: 0.06, type: 'square', vol: 0.18 });
    tone({ freq: 990, dur: 0.08, type: 'square', vol: 0.18, delay: 0.06 });
  },
  swing() {
    noise({ dur: 0.08, vol: 0.18, freq: 1600 });
    tone({ freq: 240, to: 140, dur: 0.07, type: 'triangle', vol: 0.15 });
  },
  skill() {
    tone({ freq: 200, to: 900, dur: 0.3, type: 'sawtooth', vol: 0.2 });
    noise({ dur: 0.3, vol: 0.2, freq: 2400 });
  },
  door() {
    tone({ freq: 110, to: 70, dur: 0.25, type: 'square', vol: 0.2 });
  },
  clear() {
    [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.12, type: 'triangle', vol: 0.25, delay: i * 0.08 }));
  },
  enemyShot() {
    tone({ freq: 420, to: 260, dur: 0.07, type: 'triangle', vol: 0.1 });
  },
  boss() {
    tone({ freq: 90, to: 60, dur: 0.8, type: 'sawtooth', vol: 0.3 });
    tone({ freq: 135, to: 90, dur: 0.8, type: 'square', vol: 0.15 });
  },
  split() {
    tone({ freq: 500, to: 700, dur: 0.06, type: 'sine', vol: 0.12 });
  },
  ui() {
    tone({ freq: 740, dur: 0.04, type: 'square', vol: 0.12 });
  },
};
