// Persistencia local: ajustes, enciclopedia desbloqueada y memoria inmunológica.
// Todo acceso a localStorage va envuelto en try/catch (modo privado, webviews, etc.).

const KEY = 'inmune.save.v1';

const isTouch =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);

function defaults() {
  return {
    settings: {
      lang: (typeof navigator !== 'undefined' && navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en',
      // 'manual' | 'assist' | 'auto'
      aim: isTouch ? 'auto' : 'manual',
      sound: true,
      // controles táctiles: 'float' (aparece donde tocas) | 'fixed'; tamaño 'normal' | 'large'
      stickMode: 'float',
      stickSize: 'normal',
    },
    codex: {}, // id -> true cuando se ha descubierto
    kills: {}, // id de especie -> muertes acumuladas entre partidas
    runs: 0,
    wins: 0,
  };
}

let data = load();

function load() {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      codex: { ...(parsed.codex || {}) },
      kills: { ...(parsed.kills || {}) },
    };
  } catch {
    return base;
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* sin almacenamiento disponible: el juego sigue funcionando */
  }
}

export const Save = {
  get settings() {
    return data.settings;
  },
  get codex() {
    return data.codex;
  },
  get kills() {
    return data.kills;
  },
  get stats() {
    return { runs: data.runs, wins: data.wins };
  },
  setSetting(key, value) {
    data.settings[key] = value;
    save();
  },
  discover(id) {
    if (data.codex[id]) return false;
    data.codex[id] = true;
    save();
    return true;
  },
  isDiscovered(id) {
    return !!data.codex[id];
  },
  addKills(map) {
    for (const [id, n] of Object.entries(map)) {
      data.kills[id] = (data.kills[id] || 0) + n;
    }
    save();
  },
  // Borra enciclopedia, memoria, partidas y desbloqueos; conserva los ajustes.
  resetProgress() {
    const settings = data.settings;
    data = defaults();
    data.settings = settings;
    save();
  },
  endRun(won) {
    data.runs += 1;
    if (won) data.wins += 1;
    save();
  },
  isTouch,
};

// Memoria inmunológica: cuantas más veces te enfrentas a una especie,
// más eficaz eres contra ella en partidas futuras.
export const MEMORY_TIERS = [
  { kills: 10, bonus: 0.1 },
  { kills: 30, bonus: 0.2 },
  { kills: 75, bonus: 0.3 },
];

export function memoryTier(speciesId) {
  const k = data.kills[speciesId] || 0;
  let tier = 0;
  MEMORY_TIERS.forEach((t, i) => {
    if (k >= t.kills) tier = i + 1;
  });
  return tier;
}

export function memoryBonus(speciesId) {
  const tier = memoryTier(speciesId);
  return tier ? MEMORY_TIERS[tier - 1].bonus : 0;
}
