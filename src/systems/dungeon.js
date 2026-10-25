import { rng } from '../gfx/painter.js';

// Generador de pisos estilo Soul Knight: salas en una cuadrícula unidas por
// pasillos. Se garantiza un árbol (sin ciclos) para que el jefe quede al final
// de una rama y la sala de mejora en otra hoja.

export const TILE = 16;
export const T = { VOID: 0, WALL: 1, FACE: 2, FLOOR: 3 };
export const SOLID = [0, 1, 2];

const GW = 5;
const GH = 5;
const SW = 27; // ancho de cada "ranura" de la cuadrícula, en tiles
const SH = 21;
const SIZES = {
  start: [13, 11],
  combat: [21, 15],
  treasure: [13, 11],
  boss: [25, 19],
};
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// Plantillas de obstáculos (pilares de colágeno) relativos al centro de la sala.
const COMBAT_LAYOUTS = [
  [],
  [
    [-6, -4, 2, 2],
    [5, -4, 2, 2],
    [-6, 3, 2, 2],
    [5, 3, 2, 2],
  ],
  [[-1, -1, 3, 3]],
  [
    [-7, -1, 3, 3],
    [5, -1, 3, 3],
  ],
  [
    [-4, -4, 2, 2],
    [3, 3, 2, 2],
    [-4, 3, 2, 2],
    [3, -4, 2, 2],
  ],
];
const BOSS_LAYOUT = [
  [-8, -5, 2, 2],
  [7, -5, 2, 2],
  [-8, 4, 2, 2],
  [7, 4, 2, 2],
];

export function generateFloor(seed, floorIndex) {
  const R = rng(seed);
  const target = 7 + floorIndex; // salas totales
  const grid = new Map();
  const key = (x, y) => `${x},${y}`;
  const rooms = [];

  const addRoom = (gx, gy, parent) => {
    const room = { id: rooms.length, gx, gy, parent, links: [], type: 'combat' };
    rooms.push(room);
    grid.set(key(gx, gy), room);
    if (parent) {
      parent.links.push(room.id);
      room.links.push(parent.id);
    }
    return room;
  };

  addRoom(2, 2, null).type = 'start';
  let guard = 0;
  while (rooms.length < target && guard++ < 2000) {
    // sesgo hacia salas recientes para pisos más "lineales"
    const idx = Math.floor(Math.pow(R(), 0.6) * rooms.length);
    const base = rooms[rooms.length - 1 - idx];
    const [dx, dy] = DIRS[Math.floor(R() * 4)];
    const nx = base.gx + dx;
    const ny = base.gy + dy;
    if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || grid.has(key(nx, ny))) continue;
    let neighbors = 0;
    for (const [ox, oy] of DIRS) if (grid.has(key(nx + ox, ny + oy))) neighbors++;
    if (neighbors > 1 && R() < 0.8) continue;
    if (base.type === 'start' && base.links.length >= 2) continue;
    addRoom(nx, ny, base);
  }

  // distancias desde el inicio
  const dist = new Array(rooms.length).fill(-1);
  dist[0] = 0;
  const q = [0];
  while (q.length) {
    const r = q.shift();
    for (const n of rooms[r].links) {
      if (dist[n] < 0) {
        dist[n] = dist[r] + 1;
        q.push(n);
      }
    }
  }
  const leaves = rooms.filter((r) => r.id !== 0 && r.links.length === 1).sort((a, b) => dist[b.id] - dist[a.id]);
  const boss = leaves[0];
  boss.type = 'boss';
  const treasure = leaves[1] || rooms.filter((r) => r.type === 'combat').sort((a, b) => dist[b.id] - dist[a.id])[0];
  if (treasure) treasure.type = 'treasure';
  for (const r of rooms) r.depth = dist[r.id];

  // --- tiles ---
  const width = GW * SW;
  const height = GH * SH;
  const tiles = [];
  for (let y = 0; y < height; y++) tiles.push(new Array(width).fill(T.VOID));
  const setT = (x, y, v) => {
    if (x >= 0 && y >= 0 && x < width && y < height) tiles[y][x] = v;
  };

  for (const r of rooms) {
    const [w, h] = SIZES[r.type];
    r.w = w;
    r.h = h;
    r.x = r.gx * SW + Math.floor((SW - w) / 2);
    r.y = r.gy * SH + Math.floor((SH - h) / 2);
    r.cx = r.x + Math.floor(w / 2);
    r.cy = r.y + Math.floor(h / 2);
    r.doors = [];
    for (let y = r.y; y < r.y + h; y++) {
      for (let x = r.x; x < r.x + w; x++) {
        const edge = x === r.x || y === r.y || x === r.x + w - 1 || y === r.y + h - 1;
        setT(x, y, edge ? T.WALL : T.FLOOR);
      }
    }
  }

  // pasillos de 3 tiles de ancho
  const carved = new Set();
  for (const a of rooms) {
    for (const bid of a.links) {
      const b = rooms[bid];
      const pairKey = [a.id, b.id].sort().join('-');
      if (carved.has(pairKey)) continue;
      carved.add(pairKey);
      if (a.gy === b.gy) {
        const [L, Rr] = a.gx < b.gx ? [a, b] : [b, a];
        const cy = L.cy;
        const x0 = L.x + L.w - 1;
        const x1 = Rr.x;
        for (let x = x0; x <= x1; x++) {
          for (let dy = -1; dy <= 1; dy++) setT(x, cy + dy, T.FLOOR);
          for (const dy of [-2, 2]) if (tiles[cy + dy][x] === T.VOID) setT(x, cy + dy, T.WALL);
        }
        for (let dy = -1; dy <= 1; dy++) {
          L.doors.push({ x: x0, y: cy + dy });
          Rr.doors.push({ x: x1, y: cy + dy });
        }
      } else {
        const [U, D] = a.gy < b.gy ? [a, b] : [b, a];
        const cx = U.cx;
        const y0 = U.y + U.h - 1;
        const y1 = D.y;
        for (let y = y0; y <= y1; y++) {
          for (let dx = -1; dx <= 1; dx++) setT(cx + dx, y, T.FLOOR);
          for (const dx of [-2, 2]) if (tiles[y][cx + dx] === T.VOID) setT(cx + dx, y, T.WALL);
        }
        for (let dx = -1; dx <= 1; dx++) {
          U.doors.push({ x: cx + dx, y: y0 });
          D.doors.push({ x: cx + dx, y: y1 });
        }
      }
    }
  }

  // obstáculos
  for (const r of rooms) {
    let layout = [];
    if (r.type === 'combat') layout = COMBAT_LAYOUTS[Math.floor(R() * COMBAT_LAYOUTS.length)];
    if (r.type === 'boss') layout = BOSS_LAYOUT;
    for (const [ox, oy, w, h] of layout) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) setT(r.cx + ox + x, r.cy + oy + y, T.WALL);
    }
  }

  // cara frontal de los muros y variantes de suelo
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = tiles[y][x];
      if (v === T.WALL && y + 1 < height && tiles[y + 1][x] === T.FLOOR) tiles[y][x] = T.FACE;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] !== T.FLOOR) continue;
      const roll = R();
      tiles[y][x] = roll < 0.56 ? 3 : roll < 0.94 ? 4 : roll < 0.985 ? 5 : 6;
    }
  }

  return {
    width,
    height,
    tiles,
    rooms,
    start: rooms[0],
    boss,
    treasure,
    isFloor: (tx, ty) => tx >= 0 && ty >= 0 && tx < width && ty < height && tiles[ty][tx] >= T.FLOOR,
    // Sala cuyo interior (sin muros) contiene el tile, con margen opcional.
    roomAt(tx, ty, margin = 0) {
      for (const r of rooms) {
        if (tx >= r.x + 1 + margin && tx <= r.x + r.w - 2 - margin && ty >= r.y + 1 + margin && ty <= r.y + r.h - 2 - margin) return r;
      }
      return null;
    },
  };
}
