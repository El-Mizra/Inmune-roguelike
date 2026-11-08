import { makeTexture, rng } from './painter.js';

// Paletas inspiradas en tinciones histológicas reales:
// - Giemsa/Wright para leucocitos (núcleo morado, citoplasma rosa pálido).
// - Gram: las Gram + se tiñen violeta, las Gram − rosa/rojo.
// - S. aureus forma colonias doradas; P. aeruginosa, pigmento verde-azulado.
export const PAL = {
  outline: '#1a0710',
  void: '#12060c',
  // Tejido (dermis)
  floorA: '#4a1c2a',
  floorB: '#52202f',
  floorC: '#5c2635',
  fleck: '#6e3343',
  fleck2: '#3e1622',
  wallTop: '#c7787f',
  wallTop2: '#e0a0a3',
  wallFace: '#8f3f4f',
  wallFace2: '#6e2c3b',
  // Neutrófilo
  neuCyto: ['#b98aa5', '#dcb4c8', '#f1d6e3', '#fff0f6'],
  neuNucleus: ['#3d1a5c', '#5a2a86', '#7b45ad', '#9b6bd0'],
  neuGranule: '#c76a9a',
};

// Paleta del intestino: mucosa anaranjada y vellosidades
export const GUT = {
  void: '#12060c',
  floorA: '#3d1c1a',
  floorB: '#45201d',
  floorC: '#55291f',
  fleck: '#6e3a2a',
  fleck2: '#2e1412',
  wallTop: '#c97a56',
  wallTop2: '#eaa880',
  wallFace: '#954c36',
  wallFace2: '#743828',
};

function wob(seed, amp = 0.08, freq = 5) {
  return (a) => 1 + Math.sin(a * freq + seed) * amp + Math.sin(a * (freq + 2) + seed * 2.3) * amp * 0.5;
}

// ---------- Células jugables ----------

function drawNeutrophil(p, f) {
  const R = rng(11);
  p.blob(8, 8.5, 6.6, PAL.neuCyto, wob(f * 1.7, 0.07, 4));
  // gránulos del citoplasma
  p.speckle(PAL.neuGranule, 9, R, [PAL.neuCyto[1], PAL.neuCyto[2]]);
  // núcleo multilobulado (3-4 lóbulos conectados)
  const N = PAL.neuNucleus;
  const lobes = f === 0 ? [[5.5, 7], [8.2, 5.8], [10.6, 7.6], [8.4, 10.2]] : [[5.8, 7.4], [8.2, 6.1], [10.4, 7.3], [8.1, 10.4]];
  for (let i = 0; i < lobes.length - 1; i++) p.line(lobes[i][0], lobes[i][1], lobes[i + 1][0], lobes[i + 1][1], N[0]);
  for (const [x, y] of lobes) p.blob(x, y, 1.7, N);
  p.outline(PAL.outline);
}

function drawMacrophage(p, f) {
  p.blob(10, 10, 8.2, ['#8a6a55', '#b48d70', '#d4b08e', '#ecd0ad'], wob(2 + f, 0.16, 3));
  const R = rng(5);
  p.speckle('#7a4f3f', 10, R);
  p.blob(9, 11, 3.2, ['#3f2a4e', '#5b3d72', '#7a5a94']);
  p.outline(PAL.outline);
}

function drawNK(p, f = 0) {
  // linfocito grande y granular: núcleo arriñonado y gránulos azurófilos (perforina)
  p.blob(8, 8.4, 6.2, ['#7d8fb0', '#a9b9d6', '#cfdaf0', '#eef3ff'], wob(f * 2.1, 0.06, 4));
  p.blob(7.2, 7.6, 3.6, ['#2c2a5c', '#433f86', '#5c57ac']);
  const g = f === 0 ? [[11, 10], [4, 11], [10, 4], [12, 7]] : [[11, 11], [5, 11], [11, 4], [12, 8]];
  for (const [x, y] of g) p.set(x, y, '#d0395b');
  p.outline(PAL.outline);
}

function drawTcell(p, f = 0) {
  // linfocito pequeño: casi todo núcleo, con microvellosidades (receptores TCR) en la superficie
  p.blob(7, 7, 5.6, ['#6aa087', '#93c7ad', '#bfe5d0', '#e6fff2'], wob(f * 1.9, 0.05, 6));
  p.blob(7, 7.3, 4.2, ['#24314f', '#34477a', '#4b62a3']);
  const tcr = f === 0 ? [[7, 0], [13, 6], [1, 9], [11, 12]] : [[8, 0], [13, 8], [1, 6], [10, 13]];
  for (const [x, y] of tcr) p.set(x, y, '#e6fff2');
  p.outline(PAL.outline);
}

function drawBcell(p, f = 0) {
  p.blob(7, 7, 5.6, ['#a08a5a', '#c9b47e', '#e5d6a4', '#fff6d0'], wob(f * 1.7, 0.05, 5));
  p.blob(7, 7.3, 4, ['#3a2450', '#53357a', '#6e4ba0']);
  // anticuerpo en "Y"
  p.line(12, 2, 12, 4, '#ffe46b');
  p.set(11, 1, '#ffe46b');
  p.set(13, 1, '#ffe46b');
  p.outline(PAL.outline);
}

// ---------- Patógenos ----------

const GOLD = ['#8a5a12', '#c99227', '#efc24a', '#fff0a0'];

function drawSaureus(p, f) {
  const o = f === 0 ? 0 : 0.4;
  const cocci = [
    [4.5, 5],
    [8, 4.4 + o],
    [6.2, 8],
    [9.6, 7.6 - o],
  ];
  for (const [x, y] of cocci) p.blob(x, y, 2.6, GOLD);
  p.outline(PAL.outline);
}

function drawSpyogenes(p) {
  // Gram + → violeta
  p.blob(4, 4, 3, ['#3d1f6b', '#6436a3', '#8c5fd0', '#c2a3f0']);
  p.outline(PAL.outline);
}

function drawPaeruginosa(p, f) {
  // bacilo (bastón) Gram − con flagelo polar
  const body = ['#1f5d5a', '#2e8d84', '#4fc0ad', '#a5f0dc'];
  p.blob(9, 5, 5, body, null, 2.8);
  const fl = '#6fd9c4';
  const wave = f === 0 ? [0, 1, 1, 0, -1, -1] : [1, 0, -1, -1, 0, 1];
  for (let i = 0; i < 6; i++) p.set(3 - i * 0.5 - (i > 2 ? 1 : 0), 5 + wave[i], fl);
  p.set(2, 5 + wave[2], fl);
  p.set(1, 5 + wave[4], fl);
  p.set(0, 5 + wave[5], fl);
  p.outline(PAL.outline);
}

const CREAM = ['#a08d6c', '#cdb98f', '#ecdcb6', '#fffbe8'];

function drawCandida(p, f) {
  p.blob(6, 8, 4.6, CREAM, null, 5.4);
  // gemación (blastoconidio)
  p.blob(10, 3.6 + (f ? 0.5 : 0), 2.4, CREAM);
  p.set(6, 8, '#8e7b5a');
  p.outline(PAL.outline);
}

function drawHypha(p, f) {
  // hifas ramificadas con tabiques (septos)
  const c = '#ecdcb6';
  const d = '#a08d6c';
  const branches = [
    [12, 12, 2, 3],
    [12, 12, 22, 4],
    [12, 12, 3, 21],
    [12, 12, 21, 21],
    [12, 12, 12, 1],
    [7, 7, 4, 1],
    [17, 17, 23, 15],
  ];
  for (const [x0, y0, x1, y1] of branches) {
    p.line(x0, y0, x1, y1, c);
    p.line(x0 + 1, y0, x1 + 1, y1, c);
  }
  // tabiques
  for (const [x0, y0, x1, y1] of branches) {
    const mx = Math.round((x0 + x1) / 2);
    const my = Math.round((y0 + y1) / 2);
    p.set(mx, my, d);
  }
  p.blob(12, 12, 4.4 + (f ? 0.4 : 0), CREAM);
  p.outline(PAL.outline);
}

function drawHSV(p, f) {
  // envoltura lipídica con glicoproteínas (espículas) y cápside icosaédrica
  const env = ['#7a1d3c', '#a8325a', '#d0567c'];
  p.blob(4.5, 4.5, 3.4, env);
  const spikes = f === 0 ? [[4, 0], [8, 4], [4, 8], [0, 4]] : [[1, 1], [7, 1], [7, 7], [1, 7]];
  for (const [x, y] of spikes) p.set(x, y, '#ff8fb0');
  // cápside hexagonal
  p.rect(3, 3, 3, 3, '#ffd0de');
  p.set(4, 2, '#ffd0de');
  p.set(4, 6, '#ffd0de');
  p.set(4, 4, '#7a1d3c');
  p.outline(PAL.outline);
}

function drawKeratinocyte(p, infected, f) {
  const R = rng(infected ? 77 : 33);
  if (!infected) {
    p.blob(8, 8, 6.4, ['#a8746f', '#d49d93', '#efc4b8', '#ffe6dc'], wob(4.1, 0.12, 6));
    p.blob(8, 8, 2.4, ['#5a3348', '#7b4a66', '#9a6884']);
  } else {
    // célula hinchada, multinucleada, con inclusiones virales (típico del herpes)
    const r = 7 + (f ? 0.5 : 0);
    p.blob(8, 8, r, ['#6e2c55', '#9c4378', '#c56b9c', '#eaa0c8'], wob(1.3, 0.1, 5));
    p.blob(5.6, 7, 1.8, ['#2a1036', '#401a52', '#5a2a70']);
    p.blob(10, 6.4, 1.8, ['#2a1036', '#401a52', '#5a2a70']);
    p.blob(8.4, 10.6, 1.8, ['#2a1036', '#401a52', '#5a2a70']);
    p.speckle('#ff8fb0', 7, R);
  }
  p.outline(PAL.outline);
}

function drawMRSA(p, f) {
  const R = rng(91);
  const dark = ['#5e360b', '#9a6418', '#d39b35', '#f7d778'];
  const pts = [];
  for (let i = 0; i < 26; i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R()) * 15;
    pts.push([24 + Math.cos(a) * d, 24 + Math.sin(a) * d * 0.92, 3.2 + R() * 1.4]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of pts) p.blob(x + (f ? Math.sin(y) * 0.6 : 0), y, r, R() > 0.3 ? GOLD : dark);
  // tinte rojo de toxinas en el centro
  p.speckle('#c2402a', 18, R, [GOLD[1], dark[1]]);
  p.outline(PAL.outline);
}

function drawBiofilm(p, f) {
  p.blob(5, 5, 4 + (f ? 0.3 : 0), ['#4d5a1e', '#7d8c32', '#a9b84e', '#d6e48a'], wob(f * 2, 0.15, 3));
  p.outline('#25300b');
}

function drawMelanoma(p, f) {
  // ABCDE del melanoma: Asimetría, Bordes irregulares, Color variado, Diámetro grande, Evolución.
  const R = rng(1234);
  const browns = [
    ['#1d0f0a', '#3a2016', '#5a3322', '#7a4a32'],
    ['#2a1208', '#4f2a14', '#77421f', '#9a6234'],
    ['#120a12', '#241426', '#3a2240', '#583560'],
  ];
  const w = (a) => 1 + Math.sin(a * 3 + 0.7) * 0.18 + Math.sin(a * 7 + f) * 0.07 + Math.cos(a * 2) * 0.1;
  p.blob(24, 24, 19, browns[0], w);
  for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2;
    const d = R() * 11;
    p.blob(24 + Math.cos(a) * d, 24 + Math.sin(a) * d, 3 + R() * 4, browns[1 + (i % 2)], wob(i, 0.2, 3));
  }
  p.speckle('#8a2a2a', 14, R);
  p.speckle('#a8774f', 10, R);
  p.outline('#0a0406');
}

function drawTumorNode(p, f) {
  p.blob(7, 7, 5.2 + (f ? 0.4 : 0), ['#2a1208', '#4f2a14', '#77421f', '#9a6234'], wob(3, 0.18, 4));
  p.set(6, 6, '#8a2a2a');
  p.outline('#0a0406');
}

// ---------- Zona 2: intestino ----------

// Gram − → rosa/rojo
const GNEG = ['#7a2238', '#b8405a', '#e57a90', '#ffd0da'];

function drawSalmonella(p, f) {
  p.blob(8, 5, 5, GNEG, null, 2.6);
  // flagelos perítricos (alrededor de todo el cuerpo)
  const w = f ? 1 : -1;
  for (const [x, y, dx, dy] of [[3, 3, -2, -2], [3, 7, -2, 2], [8, 1, w, -1], [8, 9, -w, 1], [13, 3, 2, -2], [13, 7, 2, 2]]) {
    p.set(x + dx, y + dy, '#f0a0b0');
  }
  p.outline(PAL.outline);
}

function drawEcoli(p, f) {
  p.blob(6, 4, 4, ['#7a3a22', '#b8653a', '#e59a6a', '#ffe0c8'], null, 2.3);
  // fimbrias (pili) para adherirse
  const pts = f ? [[1, 2], [11, 2], [3, 7], [9, 7]] : [[1, 4], [11, 4], [5, 0], [7, 7]];
  for (const [x, y] of pts) p.set(x, y, '#e59a6a');
  p.outline(PAL.outline);
}

function drawRotavirus(p, f) {
  // rueda: cápside de triple capa con "radios"
  p.disc(5.5, 5.5, 4.6, '#2a6a5e');
  p.disc(5.5, 5.5, 3.4, '#5ab0a0');
  p.disc(5.5, 5.5, 1.6, '#c8f0e8');
  const a0 = f ? 0.4 : 0;
  for (let i = 0; i < 6; i++) {
    const a = a0 + (i / 6) * Math.PI * 2;
    p.set(5.5 + Math.cos(a) * 4.6, 5.5 + Math.sin(a) * 4.6, '#c8f0e8');
  }
  p.outline(PAL.outline);
}

const GIARDIA = ['#3e5e6e', '#6a92a4', '#a8cad8', '#e8f8ff'];
// Giardia vista de frente: "cara" con dos núcleos y disco adhesivo, flagelos hacia atrás
function drawGiardiaShape(p, f, s, cx, cy) {
  p.blob(cx, cy, 5.4 * s, GIARDIA, (a) => 1 + (Math.sin(a) > 0 ? -0.18 * Math.sin(a) : 0), 6.2 * s);
  p.disc(cx - 2 * s, cy - 1.5 * s, 1.3 * s, '#2a3a5a');
  p.disc(cx + 2 * s, cy - 1.5 * s, 1.3 * s, '#2a3a5a');
  p.ellipse(cx, cy - 3 * s, 3.5 * s, 1.4 * s, '#c8e4ee');
  const w = f ? 1 : -1;
  for (let i = 0; i < 4; i++) {
    const x0 = cx + (i - 1.5) * 1.6 * s;
    p.line(x0, cy + 5.5 * s, x0 + w * s * (i % 2 ? 1 : -1), cy + 8.5 * s, '#a8cad8');
  }
}

function drawGiardia(p, f) {
  drawGiardiaShape(p, f, 1, 7, 6.5);
  p.outline(PAL.outline);
}

function drawGiardiaBoss(p, f) {
  drawGiardiaShape(p, f, 3, 21, 18);
  p.outline(PAL.outline);
}

// Gram + → violeta; espora subterminal (forma de "palillo de tambor")
const CDIFF = ['#3d2a5c', '#5e4290', '#8a6ac0', '#c0a8f0'];
function drawCdiff(p, f) {
  const R = rng(321);
  const rods = [
    [14, 20, 0.5],
    [30, 16, -0.4],
    [24, 32, 0.2],
  ];
  for (const [x, y, a] of rods) {
    for (let i = -8; i <= 8; i++) p.disc(x + Math.cos(a) * i, y + Math.sin(a) * i + (f ? Math.sin(i) * 0.4 : 0), 3.6, CDIFF[1]);
    p.disc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 4.6, CDIFF[2]);
    p.disc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 2.4, '#e8e0c0');
  }
  p.speckle('#8ac04a', 16, R);
  p.outline(PAL.outline);
}

function drawCdiffSpore(p) {
  p.ellipse(20, 20, 16, 13, '#4a4030');
  p.ellipse(20, 20, 13.5, 10.5, '#7a6a48');
  p.ellipse(19, 18, 9, 6.5, '#b0a070');
  p.ellipse(17, 16, 4, 2.5, '#e0d8b0');
  p.outline(PAL.outline);
}

function drawEnterocyte(p, infected, f) {
  const R = rng(infected ? 88 : 44);
  if (!infected) {
    // célula columnar con "borde en cepillo" (microvellosidades) arriba
    p.rect(3, 3, 10, 11, '#d98a6a');
    p.rect(4, 4, 8, 9, '#f0b090');
    for (let x = 3; x < 13; x += 2) p.set(x, 2, '#ffd0b0');
    p.disc(8, 11, 1.8, '#5a3348');
  } else {
    const k = f ? 0.5 : 0;
    p.rect(2, 2 - k, 13, 13 + k, '#8a3a6a');
    p.rect(3, 3 - k, 11, 11 + k, '#b05a8a');
    p.speckle('#7ae0d0', 8, R);
    p.disc(8, 11, 1.8, '#2a1036');
  }
  p.outline(PAL.outline);
}

// ---------- Proyectiles, objetos y efectos ----------

function orb(pal, r = 2.2, size = 6) {
  return (p) => {
    p.blob(size / 2, size / 2, r, pal);
    p.outline(PAL.outline);
  };
}

function drawGlucose(p, f) {
  // anillo hexagonal de glucosa
  const c = f ? '#fff6b0' : '#ffe46b';
  const pts = [
    [4, 1],
    [7, 2],
    [7, 6],
    [4, 7],
    [1, 6],
    [1, 2],
  ];
  for (let i = 0; i < 6; i++) p.line(pts[i][0], pts[i][1], pts[(i + 1) % 6][0], pts[(i + 1) % 6][1], c);
  p.set(4, 4, '#ff9a3c');
  p.outline(PAL.outline);
}

function drawHeal(p, f) {
  const c = f ? '#ff9ab0' : '#ff5c7c';
  p.rect(3, 1, 3, 7, c);
  p.rect(1, 3, 7, 3, c);
  p.set(4, 2, '#ffe0e8');
  p.outline(PAL.outline);
}

function drawSpawn(p, f) {
  const r = 3 + f * 1.4;
  for (let a = 0; a < Math.PI * 2; a += 0.15) {
    p.set(7 + Math.cos(a) * r, 7 + Math.sin(a) * r, f % 2 ? '#ffd166' : '#ff6b8b');
  }
}

function drawDoor(p, f) {
  // barrera de células endoteliales / fibrina que cierra la sala
  p.rect(0, 0, 16, 16, f ? '#7a2538' : '#8c2c42');
  for (let y = 1; y < 16; y += 4) for (let x = (y % 8 === 1 ? 0 : 2); x < 16; x += 4) p.rect(x, y, 3, 2, '#b84a63');
  p.rect(0, 0, 16, 1, '#e07a90');
}

function drawPortal(p, f) {
  for (let r = 11; r > 0; r -= 1) {
    const cols = ['#1e3b5a', '#2e6a8a', '#4aa3b8', '#8ee0e0'];
    p.disc(12, 12, r, cols[(r + f) % 4]);
  }
  p.outline(PAL.outline);
}

function drawPixel(p) {
  p.rect(0, 0, 2, 2, '#ffffff');
}

function drawIconHeart(p) {
  p.rect(1, 2, 2, 3, '#ff5c7c');
  p.rect(5, 2, 2, 3, '#ff5c7c');
  p.rect(2, 1, 1, 1, '#ff5c7c');
  p.rect(5, 1, 1, 1, '#ff5c7c');
  p.rect(2, 4, 4, 2, '#ff5c7c');
  p.rect(3, 6, 2, 1, '#ff5c7c');
  p.set(2, 2, '#ffd0da');
  p.outline(PAL.outline);
}

function drawIconArmor(p) {
  for (let a = 0; a < Math.PI * 2; a += 0.2) p.set(4 + Math.cos(a) * 3, 4 + Math.sin(a) * 3, '#b8c6e8');
  p.set(4, 4, '#b8c6e8');
  p.outline(PAL.outline);
}

function drawIconAtp(p) {
  p.line(5, 0, 2, 4, '#ffe46b');
  p.line(2, 4, 6, 4, '#ffe46b');
  p.line(6, 4, 3, 8, '#ffe46b');
  p.outline(PAL.outline);
}

// ---------- Tileset del tejido ----------
// 0 vacío · 1 muro (parte superior) · 2 muro (cara frontal) · 3-6 suelo
function drawTiles(scene, key, P, style) {
  const T = 16;
  const n = 7;
  const canvas = document.createElement('canvas');
  canvas.width = T * n;
  canvas.height = T;
  const ctx = canvas.getContext('2d');
  const R = rng(42);
  const paint = (i, fn) => {
    ctx.save();
    ctx.translate(i * T, 0);
    fn(ctx);
    ctx.restore();
  };
  const px = (c, x, y, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  paint(0, () => px(P.void, 0, 0, T, T));
  // muro visto desde arriba: fibras de colágeno (piel) o vellosidades (intestino)
  paint(1, () => {
    px(P.wallTop, 0, 0, T, T);
    if (style === 'gut') {
      for (let x = 1; x < T; x += 5) {
        px(P.wallTop2, x, 2, 3, 11);
        px(P.wallTop2, x + 1, 1, 1, 1);
        px(P.wallFace2, x + 1, 4, 1, 7);
      }
    } else {
      for (let y = 1; y < T; y += 3) {
        const off = Math.floor(R() * 4);
        px(P.wallTop2, off, y, T - off - 2, 1);
      }
    }
    px(P.wallFace, 0, T - 1, T, 1);
  });
  // cara frontal del muro
  paint(2, () => {
    px(P.wallFace, 0, 0, T, T);
    px(P.wallTop, 0, 0, T, 3);
    px(P.wallTop2, 0, 0, T, 1);
    for (let x = 1; x < T; x += 4) px(P.wallFace2, x, 5, 2, 9);
    px(style === 'gut' ? '#3a1810' : '#3a1220', 0, T - 2, T, 2);
  });
  const floor = (base, specks) => () => {
    px(base, 0, 0, T, T);
    for (let i = 0; i < specks; i++) px(R() > 0.5 ? P.fleck : P.fleck2, Math.floor(R() * T), Math.floor(R() * T));
  };
  paint(3, floor(P.floorA, 5));
  paint(4, floor(P.floorB, 7));
  // suelo con un detalle: fibroblasto (piel) o bacteria de la microbiota (intestino)
  paint(5, () => {
    floor(P.floorA, 3)();
    if (style === 'gut') {
      px('#4f7a5a', 4, 7, 5, 2);
      px('#6aa078', 5, 7, 3, 1);
      px('#4f6a8a', 10, 10, 2, 2);
    } else {
      px(P.floorC, 3, 7, 9, 2);
      px(P.fleck, 5, 7, 3, 2);
      px('#7b4060', 6, 7, 2, 1);
    }
  });
  // suelo con una mancha de matriz extracelular más densa
  paint(6, () => {
    floor(P.floorB, 3)();
    px(P.floorC, 4, 5, 7, 5);
    px(P.floorC, 5, 4, 5, 7);
    px(P.fleck, 6, 6, 1, 1);
    px(P.fleck, 9, 8, 1, 1);
  });
  // Extrusión: cada baldosa lleva 1px de borde repetido alrededor (margen 1,
  // separación 2). Evita las líneas finas entre baldosas ("sangrado") que
  // aparecen al escalar a tamaños no enteros, sobre todo en celulares.
  const E = T + 2;
  const ext = document.createElement('canvas');
  ext.width = E * n;
  ext.height = E;
  const x2 = ext.getContext('2d');
  x2.imageSmoothingEnabled = false;
  for (let i = 0; i < n; i++) {
    const ox = i * E;
    x2.drawImage(canvas, i * T, 0, T, T, ox + 1, 1, T, T);
    x2.drawImage(canvas, i * T, 0, T, 1, ox + 1, 0, T, 1);
    x2.drawImage(canvas, i * T, T - 1, T, 1, ox + 1, T + 1, T, 1);
    x2.drawImage(ext, ox + 1, 0, 1, E, ox, 0, 1, E);
    x2.drawImage(ext, ox + T, 0, 1, E, ox + T + 1, 0, 1, E);
  }
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, ext);
}

// Decoración de la dermis (sin colisión): 0 fibroblasto, 1 adipocito,
// 2 fibras de colágeno, 3 eritrocitos en un capilar, 4 mastocito, 5 terminación nerviosa
function drawDecor(p, f) {
  const R = rng(500 + f);
  if (f === 0) {
    // fibroblasto: célula fusiforme que fabrica colágeno
    p.ellipse(8, 8, 6.5, 2, '#7b4a5c');
    p.ellipse(8, 8, 2.2, 1.2, '#4e2a44');
    p.line(1, 9, 3, 8, '#6a3c4e');
    p.line(13, 7, 15, 6, '#6a3c4e');
  } else if (f === 1) {
    // adipocito: gota de grasa grande con el núcleo aplastado al borde
    p.disc(8, 8, 6.5, '#8a5a52');
    p.disc(8, 8, 5.5, '#c99a82');
    p.disc(7, 7, 2.5, '#e2bea4');
    p.ellipse(13.2, 9, 1, 1.8, '#4e2a44');
  } else if (f === 2) {
    // fibras de colágeno onduladas
    for (let k = 0; k < 3; k++) {
      for (let x = 0; x < 16; x++) p.set(x, 5 + k * 3 + Math.round(Math.sin(x * 0.7 + k) * 1), k === 1 ? '#a8606c' : '#8c4c5a');
    }
  } else if (f === 3) {
    // eritrocitos (discos bicóncavos) en fila, como dentro de un capilar
    p.rect(0, 5, 16, 6, '#5a1a28');
    for (const x of [3, 8, 13]) {
      p.disc(x, 8, 2.4, '#b8303e');
      p.set(x, 8, '#8a1f2c');
    }
  } else if (f === 4) {
    // mastocito: lleno de gránulos de histamina
    p.disc(8, 8, 4.5, '#7a4a8a');
    p.speckle('#c48ad6', 10, R);
    p.disc(8, 8, 1.5, '#3e2050');
  } else if (f === 6) {
    // punta de una vellosidad intestinal, con su capilar
    p.disc(8, 8, 5.5, '#b86a4e');
    p.disc(8, 8, 4.2, '#d98a66');
    p.line(8, 4, 8, 12, '#8a2a2a');
  } else if (f === 7) {
    // célula caliciforme: copa llena de moco
    p.ellipse(8, 9, 4, 5.5, '#8a6a7a');
    p.ellipse(8, 7, 3, 3.5, '#d8d0e8');
    p.disc(8, 13, 1.4, '#4e2a44');
  } else if (f === 8) {
    // microbiota "amiga": bacterias beneficiosas (no se atacan)
    p.ellipse(5, 6, 3, 1.4, '#5a9a6a');
    p.ellipse(10, 10, 3, 1.4, '#4a7a9a');
    p.ellipse(11, 4, 2.4, 1.2, '#6aa078');
  } else if (f === 9) {
    // gota de moco
    p.disc(8, 9, 5, '#7a5a5a');
    p.disc(7, 8, 3.5, '#a08080');
    p.set(6, 6, '#e0d0d0');
  } else if (f === 10) {
    // célula de Paneth: gránulos con péptidos antimicrobianos
    p.disc(8, 8, 4.5, '#8a4a3a');
    p.speckle('#ff6a5a', 7, R);
    p.disc(8, 10, 1.4, '#3e2050');
  } else if (f === 11) {
    // placa de Peyer: grupo de linfocitos de la pared intestinal
    for (const [x, y] of [[5, 6], [9, 5], [7, 9], [11, 9], [5, 11]]) p.disc(x, y, 1.8, '#4b62a3');
  } else {
    // terminación nerviosa libre
    p.line(0, 12, 6, 8, '#d0a070');
    p.line(6, 8, 10, 3, '#d0a070');
    p.line(6, 8, 13, 9, '#d0a070');
    p.line(10, 3, 12, 1, '#d0a070');
    p.set(13, 9, '#f0d0a0');
    p.set(12, 1, '#f0d0a0');
  }
}

// Viñeta suave (bordes oscuros) para dar profundidad.
function drawVignette(scene) {
  if (scene.textures.exists('vignette')) return;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 60, 128, 128, 182);
  g.addColorStop(0, 'rgba(18,6,12,0)');
  g.addColorStop(1, 'rgba(18,6,12,0.75)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  scene.textures.addCanvas('vignette', c);
}

export function generateTextures(scene) {
  makeTexture(scene, 'decor', 16, 16, 12, drawDecor);
  makeTexture(scene, 'shadow', 12, 5, 1, (p) => p.ellipse(6, 2.5, 6, 2.5, '#000000'));
  drawVignette(scene);
  makeTexture(scene, 'neutrophil', 16, 16, 2, drawNeutrophil);
  makeTexture(scene, 'macrophage', 20, 20, 2, drawMacrophage);
  makeTexture(scene, 'nkcell', 16, 16, 2, drawNK);
  makeTexture(scene, 'tcell', 14, 14, 2, drawTcell);
  makeTexture(scene, 'bcell', 14, 14, 2, drawBcell);
  // anticuerpo IgG en forma de "Y"
  makeTexture(scene, 'antibody', 7, 8, 1, (p) => {
    const c = '#ffe46b';
    p.line(3, 4, 3, 7, c);
    p.line(3, 4, 1, 1, c);
    p.line(3, 4, 5, 1, c);
    p.set(0, 0, '#fff6d0');
    p.set(6, 0, '#fff6d0');
    p.outline(PAL.outline);
  });

  makeTexture(scene, 'saureus', 13, 12, 2, drawSaureus);
  makeTexture(scene, 'spyogenes', 8, 8, 1, drawSpyogenes);
  makeTexture(scene, 'paeruginosa', 16, 10, 2, drawPaeruginosa);
  makeTexture(scene, 'calbicans', 14, 14, 2, drawCandida);
  makeTexture(scene, 'hypha', 25, 25, 2, drawHypha);
  makeTexture(scene, 'hsv1', 9, 9, 2, drawHSV);
  makeTexture(scene, 'kera', 16, 16, 1, (p) => drawKeratinocyte(p, false, 0));
  makeTexture(scene, 'kera_infected', 17, 17, 2, (p, f) => drawKeratinocyte(p, true, f));
  makeTexture(scene, 'mrsa', 48, 48, 2, drawMRSA);
  makeTexture(scene, 'salmonella', 17, 11, 2, drawSalmonella);
  makeTexture(scene, 'ecoli', 13, 9, 2, drawEcoli);
  makeTexture(scene, 'rotavirus', 11, 11, 2, drawRotavirus);
  makeTexture(scene, 'giardia', 14, 16, 2, drawGiardia);
  makeTexture(scene, 'giardiaboss', 42, 46, 2, drawGiardiaBoss);
  makeTexture(scene, 'cdiff', 48, 48, 2, drawCdiff);
  makeTexture(scene, 'cdiff_spore', 40, 40, 1, drawCdiffSpore);
  makeTexture(scene, 'entero', 16, 16, 1, (p) => drawEnterocyte(p, false, 0));
  makeTexture(scene, 'entero_infected', 17, 17, 2, (p, f) => drawEnterocyte(p, true, f));
  makeTexture(scene, 'toxinb', 7, 7, 1, orb(['#3a5a14', '#6a9a2a', '#a8d85a', '#e8ffc0'], 2.6, 7));
  makeTexture(scene, 'flagshot', 6, 6, 1, orb(['#2a4a5a', '#5a8aa0', '#a8d8e8', '#ffffff'], 2.2));
  makeTexture(scene, 'biofilm', 10, 10, 2, drawBiofilm);
  makeTexture(scene, 'melanoma', 48, 48, 2, drawMelanoma);
  makeTexture(scene, 'tumornode', 14, 14, 2, drawTumorNode);

  makeTexture(scene, 'granule', 6, 6, 1, orb(['#b04a86', '#e58cc0', '#ffd0ea', '#ffffff'], 2.2));
  makeTexture(scene, 'granzyme', 6, 6, 1, orb(['#1f5a44', '#3a9a74', '#8ee0b0', '#e6fff2'], 2.2));
  makeTexture(scene, 'perforin', 6, 6, 1, orb(['#5a1a5c', '#a0368f', '#e070c0', '#ffe0f4'], 2.2));
  makeTexture(scene, 'toxin', 7, 7, 1, orb(['#7a1010', '#c42a2a', '#ff6a5a', '#ffd0c0'], 2.6, 7));
  makeTexture(scene, 'pyocyanin', 7, 7, 1, orb(['#124a5a', '#1f8aa0', '#5fd6e0', '#d0ffff'], 2.6, 7));
  makeTexture(scene, 'spore', 5, 5, 1, orb(CREAM, 1.7, 5));
  makeTexture(scene, 'darkshot', 7, 7, 1, orb(['#1a0a1a', '#3a1a3e', '#6a3a70', '#b080b8'], 2.6, 7));
  makeTexture(scene, 'seed', 8, 8, 1, orb(['#2a1208', '#4f2a14', '#77421f', '#c08050'], 3, 8));

  makeTexture(scene, 'glucose', 9, 9, 2, drawGlucose);
  makeTexture(scene, 'heal', 9, 9, 2, drawHeal);
  makeTexture(scene, 'spawn', 14, 14, 4, drawSpawn);
  makeTexture(scene, 'door', 16, 16, 2, drawDoor);
  makeTexture(scene, 'portal', 24, 24, 4, drawPortal);
  // pedestal con una vesícula de citocinas flotando (se recoge para elegir mejora)
  makeTexture(scene, 'vesicle', 20, 26, 2, (p, f) => {
    p.rect(4, 20, 12, 5, PAL.wallFace);
    p.rect(3, 19, 14, 2, PAL.wallTop);
    p.rect(6, 17, 8, 2, PAL.wallTop2);
    const y = f ? 8 : 9;
    p.blob(10, y, 6, ['#a0368f', '#e070c0', '#ffd0ea', '#ffffff']);
    p.set(8, y - 1, '#ffd166');
    p.set(12, y + 2, '#ffd166');
    p.set(11, y - 3, '#ffd166');
    p.outline(PAL.outline);
  });
  makeTexture(scene, 'pixel', 2, 2, 1, drawPixel);
  makeTexture(scene, 'icon_heart', 8, 8, 1, drawIconHeart);
  makeTexture(scene, 'icon_armor', 8, 8, 1, drawIconArmor);
  makeTexture(scene, 'icon_atp', 8, 9, 1, drawIconAtp);
  drawTiles(scene, 'tiles_skin', PAL, 'skin');
  drawTiles(scene, 'tiles_gut', GUT, 'gut');
}

export function createAnimations(scene) {
  const anim = (key, texture, frames, rate, repeat = -1) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: frames.map((f) => ({ key: texture, frame: f })),
      frameRate: rate,
      repeat,
    });
  };
  anim('neutrophil_idle', 'neutrophil', [0, 1], 3);
  anim('macrophage_idle', 'macrophage', [0, 1], 2);
  anim('nkcell_idle', 'nkcell', [0, 1], 3);
  anim('tcell_idle', 'tcell', [0, 1], 3);
  anim('bcell_idle', 'bcell', [0, 1], 3);
  anim('saureus_idle', 'saureus', [0, 1], 3);
  anim('paeruginosa_swim', 'paeruginosa', [0, 1], 8);
  anim('calbicans_idle', 'calbicans', [0, 1], 2);
  anim('hypha_idle', 'hypha', [0, 1], 2);
  anim('hsv1_idle', 'hsv1', [0, 1], 4);
  anim('kera_infected_idle', 'kera_infected', [0, 1], 4);
  anim('mrsa_idle', 'mrsa', [0, 1], 2);
  anim('salmonella_swim', 'salmonella', [0, 1], 8);
  anim('ecoli_idle', 'ecoli', [0, 1], 5);
  anim('rotavirus_spin', 'rotavirus', [0, 1], 6);
  anim('giardia_swim', 'giardia', [0, 1], 8);
  anim('giardiaboss_idle', 'giardiaboss', [0, 1], 6);
  anim('cdiff_idle', 'cdiff', [0, 1], 3);
  anim('entero_infected_idle', 'entero_infected', [0, 1], 4);
  anim('biofilm_idle', 'biofilm', [0, 1], 3);
  anim('melanoma_idle', 'melanoma', [0, 1], 2);
  anim('tumornode_idle', 'tumornode', [0, 1], 3);
  anim('glucose_idle', 'glucose', [0, 1], 3);
  anim('heal_idle', 'heal', [0, 1], 3);
  anim('spawn_blink', 'spawn', [0, 1, 2, 3], 10);
  anim('portal_spin', 'portal', [0, 1, 2, 3], 8);
  anim('vesicle_float', 'vesicle', [0, 1], 2);
}
