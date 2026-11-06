import { Save, memoryTier } from '../systems/storage.js';

// Células jugables. Por ahora solo el neutrófilo; el resto aparece como
// "próximamente" para mostrar la dirección del juego.

export const CELLS = {
  neutrophil: {
    playable: true,
    texture: 'neutrophil',
    podColor: 0xdcb4c8,
    name: { es: 'Neutrófilo', en: 'Neutrophil' },
    branch: 'innate',
    stats: {
      maxHp: 5,
      maxArmor: 3,
      maxAtp: 100,
      speed: 92,
      damage: 2,
      fireRate: 4.2, // disparos por segundo
      bulletSpeed: 230,
      spread: 0.06,
      range: 190,
    },
    weapon: {
      type: 'projectile',
      name: { es: 'Gránulos de defensinas', en: 'Defensin granules' },
      desc: {
        es: 'Dispara gránulos cargados de péptidos antimicrobianos.',
        en: 'Fires granules loaded with antimicrobial peptides.',
      },
    },
    skill: {
      id: 'net',
      short: 'NET',
      cost: 35,
      cooldown: 9000,
      duration: 4500,
      radius: 54,
      name: { es: 'NET · Trampa extracelular', en: 'NET · Extracellular trap' },
      desc: {
        es: 'Lanza una red de ADN y enzimas que atrapa y daña a todo lo que toca. Triple daño contra hifas.',
        en: 'Casts a web of DNA and enzymes that traps and damages everything it touches. Triple damage to hyphae.',
      },
    },
    summary: {
      es: 'El primero en llegar. Rápido, numeroso y dispuesto a sacrificarse.',
      en: 'First to arrive. Fast, numerous and willing to sacrifice itself.',
    },
    facts: {
      es: [
        'Es el glóbulo blanco más abundante: la médula ósea produce unos 100 mil millones al día.',
        'Llega en minutos a una herida siguiendo señales químicas como la IL-8 (quimiotaxis).',
        'Su núcleo tiene de 3 a 5 lóbulos y su citoplasma está lleno de gránulos con enzimas y péptidos antimicrobianos.',
        'Puede liberar su propio ADN como una red (NETosis), a menudo muriendo en el proceso.',
        'El pus está formado en gran parte por neutrófilos muertos.',
      ],
      en: [
        'It is the most abundant white blood cell: bone marrow makes about 100 billion every day.',
        'It reaches a wound within minutes by following chemical signals like IL-8 (chemotaxis).',
        'Its nucleus has 3 to 5 lobes and its cytoplasm is packed with granules full of enzymes and antimicrobial peptides.',
        'It can release its own DNA as a web (NETosis), often dying in the process.',
        'Pus is largely made of dead neutrophils.',
      ],
    },
  },
  macrophage: {
    playable: true,
    unlock: {
      check: (s) => s.runs >= 1,
      text: { es: 'Completa 1 partida (ganes o pierdas).', en: 'Finish 1 run (win or lose).' },
    },
    texture: 'macrophage',
    bodyRadius: 7,
    podColor: 0xb48d70,
    name: { es: 'Macrófago', en: 'Macrophage' },
    branch: 'innate',
    stats: {
      maxHp: 7,
      maxArmor: 2,
      maxAtp: 100,
      speed: 80,
      damage: 4,
      fireRate: 2.4, // zarpazos por segundo
      range: 30,
      targetRange: 150,
    },
    weapon: {
      type: 'melee',
      reach: 26,
      arc: 2.0, // radianes
      name: { es: 'Pseudópodos (fagocitosis)', en: 'Pseudopods (phagocytosis)' },
      desc: {
        es: 'Ataque cuerpo a cuerpo que engulle microbios pequeños (+ATP) y destruye proyectiles enemigos.',
        en: 'Melee attack that engulfs small microbes (+ATP) and destroys enemy projectiles.',
      },
    },
    skill: {
      id: 'm1',
      short: 'M1',
      cost: 40,
      cooldown: 11000,
      duration: 6000,
      radius: 64,
      name: { es: 'Activación M1 (IFN-γ)', en: 'M1 activation (IFN-γ)' },
      desc: {
        es: 'Una onda de TNF-α empuja y daña a los enemigos cercanos; durante 6 s haces +50% de daño y atacas un 40% más rápido.',
        en: 'A TNF-α wave pushes back and damages nearby enemies; for 6 s you deal +50% damage and attack 40% faster.',
      },
    },
    summary: {
      es: 'El gran devorador: lento pero resistente. Engulle microbios cuerpo a cuerpo.',
      en: 'The big eater: slow but tough. Engulfs microbes up close.',
    },
    facts: {
      es: [
        'Su nombre significa "gran comedor" en griego. Un solo macrófago puede fagocitar cientos de bacterias.',
        'Atrapa microbios con pseudópodos (extensiones de su membrana) y los digiere dentro del fagolisosoma.',
        'Al activarse con IFN-γ (activación M1 o "clásica") se vuelve mucho más agresivo y libera TNF-α e IL-1.',
        'Presenta fragmentos de lo que se come a los linfocitos T: conecta la inmunidad innata con la adaptativa.',
        'También limpia células muertas y ayuda a reparar tejidos (macrófagos M2).',
      ],
      en: [
        'Its name means "big eater" in Greek. A single macrophage can phagocytose hundreds of bacteria.',
        'It traps microbes with pseudopods (membrane extensions) and digests them inside the phagolysosome.',
        'When activated by IFN-γ (M1 or "classical" activation) it becomes far more aggressive and releases TNF-α and IL-1.',
        'It presents fragments of what it eats to T cells: it links innate and adaptive immunity.',
        'It also clears dead cells and helps repair tissue (M2 macrophages).',
      ],
    },
  },
  nk: {
    playable: true,
    unlock: {
      check: (s) => (s.kills.hsv1 || 0) + (s.kills.infected || 0) >= 15,
      text: { es: 'Elimina 15 viriones de herpes o células infectadas.', en: 'Eliminate 15 herpes virions or infected cells.' },
    },
    texture: 'nkcell',
    podColor: 0xa9b9d6,
    name: { es: 'Célula NK', en: 'NK cell' },
    branch: 'innate',
    // "falta de lo propio": ve y daña normalmente a los tumores que esconden su MHC-I
    seesStealth: true,
    bonus: { infected: 1.0, cancer: 0.5, virus: 0.3 },
    stats: {
      maxHp: 5,
      maxArmor: 3,
      maxAtp: 100,
      speed: 100,
      damage: 2.5,
      fireRate: 3.2,
      bulletSpeed: 260,
      spread: 0.04,
      range: 140,
    },
    weapon: {
      type: 'projectile',
      texture: 'perforin',
      name: { es: 'Perforina y granzimas', en: 'Perforin and granzymes' },
      desc: {
        es: 'Disparos de corto alcance: +100% de daño a células infectadas, +50% al cáncer y +30% a virus.',
        en: 'Short-range shots: +100% damage to infected cells, +50% to cancer and +30% to viruses.',
      },
    },
    skill: {
      id: 'synapse',
      short: { es: 'Sinapsis', en: 'Synapse' },
      cost: 30,
      cooldown: 5000,
      duration: 240,
      radius: 0,
      damage: 9,
      name: { es: 'Sinapsis letal', en: 'Lethal synapse' },
      desc: {
        es: 'Embiste en la dirección de apuntado, sin recibir daño, y descarga granzimas sobre todo lo que atraviesa. Ve al melanoma camuflado.',
        en: 'Dashes toward your aim, untouchable, unloading granzymes on everything it passes through. Sees camouflaged melanoma.',
      },
    },
    summary: {
      es: 'Asesina natural, rápida y frágil. Experta contra virus y cáncer.',
      en: 'A fast, fragile natural killer. Expert against viruses and cancer.',
    },
    facts: {
      es: [
        'NK significa "natural killer" (asesina natural): mata sin necesidad de haber visto antes al enemigo.',
        'Revisa las moléculas MHC-I de las células. Si faltan ("falta de lo propio"), las destruye: así detecta tumores y células infectadas que se esconden de los linfocitos T.',
        'Forma una sinapsis inmunológica con su objetivo y le inyecta perforina (que abre poros) y granzimas (que activan su autodestrucción, la apoptosis).',
        'Es la primera línea contra virus como el herpes y el citomegalovirus.',
      ],
      en: [
        'NK stands for "natural killer": it kills without having seen the enemy before.',
        'It checks cells for MHC-I molecules. If they are missing ("missing self") it destroys them: that is how it finds tumors and infected cells hiding from T cells.',
        'It forms an immunological synapse with its target and injects perforin (which opens pores) and granzymes (which trigger self-destruction, apoptosis).',
        'It is a first line of defense against viruses such as herpes and cytomegalovirus.',
      ],
    },
  },
  tcd8: {
    playable: true,
    unlock: {
      check: (s) => (s.kills.mrsa || 0) >= 1,
      text: { es: 'Derrota al jefe MRSA.', en: 'Defeat the MRSA boss.' },
    },
    texture: 'tcell',
    podColor: 0x93c7ad,
    name: { es: 'Linfocito T CD8', en: 'CD8 T cell' },
    branch: 'adaptive',
    // aprende durante la partida: +2% de daño por cada eliminado de esa especie (máx. +40%)
    adaptive: true,
    bonus: { infected: 1.5, virus: 0.5, cancer: 0.3 },
    stats: {
      maxHp: 6,
      maxArmor: 3,
      maxAtp: 100,
      speed: 90,
      damage: 3,
      fireRate: 2.6,
      bulletSpeed: 240,
      spread: 0.03,
      range: 170,
    },
    weapon: {
      type: 'projectile',
      texture: 'granzyme',
      name: { es: 'Granzimas dirigidas', en: 'Targeted granzymes' },
      desc: {
        es: '+150% de daño a células infectadas, +50% a virus y +30% al cáncer. Aprende: cada eliminado de una especie aumenta tu daño contra ella.',
        en: '+150% damage to infected cells, +50% to viruses and +30% to cancer. Learns: each kill of a species raises your damage against it.',
      },
    },
    skill: {
      id: 'clonal',
      short: { es: 'Clones', en: 'Clones' },
      cost: 45,
      cooldown: 14000,
      duration: 9000,
      radius: 0,
      clones: 2,
      name: { es: 'Expansión clonal', en: 'Clonal expansion' },
      desc: {
        es: 'Te divides: aparecen 2 clones idénticos que cazan enemigos por su cuenta durante 9 s.',
        en: 'You divide: 2 identical clones appear and hunt enemies on their own for 9 s.',
      },
    },
    summary: {
      es: 'Asesino de precisión de la inmunidad adaptativa: aprende y se multiplica.',
      en: 'Precision killer of adaptive immunity: it learns and multiplies.',
    },
    facts: {
      es: [
        'Cada linfocito T tiene un receptor (TCR) único que reconoce un solo fragmento de antígeno, presentado en las moléculas MHC-I.',
        'Al reconocer su antígeno se activa y se divide sin parar (expansión clonal): de una célula pueden salir miles de clones en pocos días.',
        'Mata a las células infectadas con perforina, granzimas y el ligando Fas, induciendo su apoptosis.',
        'Tras la infección, algunos clones sobreviven como células de memoria: por eso las vacunas funcionan.',
      ],
      en: [
        'Each T cell has a unique receptor (TCR) that recognizes a single antigen fragment, presented on MHC-I molecules.',
        'When it recognizes its antigen it activates and divides nonstop (clonal expansion): one cell can yield thousands of clones within days.',
        'It kills infected cells with perforin, granzymes and Fas ligand, triggering their apoptosis.',
        'After the infection, some clones survive as memory cells: that is why vaccines work.',
      ],
    },
  },
  bcell: {
    playable: true,
    unlock: {
      check: (s) => Object.keys(s.kills).filter((id) => memoryTier(id) >= 1).length >= 2,
      text: { es: 'Alcanza memoria inmunológica nivel 1 contra 2 especies.', en: 'Reach immunological memory tier 1 against 2 species.' },
    },
    texture: 'bcell',
    podColor: 0xc9b47e,
    name: { es: 'Linfocito B', en: 'B cell' },
    branch: 'adaptive',
    stats: {
      maxHp: 5,
      maxArmor: 3,
      maxAtp: 100,
      speed: 88,
      damage: 1.6,
      fireRate: 4.6,
      bulletSpeed: 250,
      spread: 0.05,
      range: 230,
    },
    weapon: {
      type: 'projectile',
      texture: 'antibody',
      // opsoniza: el enemigo marcado recibe +30% de daño de todo durante 4 s
      opsonize: true,
      // neutraliza: los viriones libres caen de un solo impacto
      neutralize: ['hsv1'],
      name: { es: 'Anticuerpos (IgG)', en: 'Antibodies (IgG)' },
      desc: {
        es: 'Largo alcance y poco daño, pero marcan (opsonizan) al enemigo: recibe +30% de daño de todo durante 4 s. Neutralizan los virus libres de un impacto.',
        en: 'Long range and low damage, but they tag (opsonize) enemies: +30% damage taken from everything for 4 s. They neutralize free viruses in one hit.',
      },
    },
    skill: {
      id: 'volley',
      short: { es: 'Ráfaga', en: 'Burst' },
      cost: 35,
      cooldown: 7000,
      duration: 0,
      radius: 0,
      count: 16,
      name: { es: 'Célula plasmática', en: 'Plasma cell' },
      desc: {
        es: 'Te diferencias por un momento en célula plasmática y liberas una ráfaga de 16 anticuerpos en todas direcciones, que atraviesan enemigos.',
        en: 'You briefly differentiate into a plasma cell and release a burst of 16 antibodies in every direction that pierce enemies.',
      },
    },
    summary: {
      es: 'Francotirador de anticuerpos: marca a los enemigos para que todo les haga más daño.',
      en: 'Antibody sniper: tags enemies so everything hits them harder.',
    },
    facts: {
      es: [
        'Al activarse, el linfocito B se convierte en célula plasmática: una fábrica que libera unos 2 000 anticuerpos por segundo.',
        'Los anticuerpos tienen forma de "Y": las puntas se unen al antígeno y el tallo (Fc) avisa a fagocitos y al complemento.',
        'Opsonización: un microbio cubierto de anticuerpos es mucho más fácil de fagocitar.',
        'Neutralización: los anticuerpos bloquean las proteínas que el virus usa para entrar en las células.',
        'Algunos linfocitos B se quedan como células de memoria: la base de las vacunas.',
      ],
      en: [
        'When activated, the B cell becomes a plasma cell: a factory releasing about 2,000 antibodies per second.',
        'Antibodies are Y-shaped: the tips bind the antigen and the stem (Fc) alerts phagocytes and complement.',
        'Opsonization: a microbe coated in antibodies is much easier to phagocytose.',
        'Neutralization: antibodies block the proteins a virus uses to enter cells.',
        'Some B cells remain as memory cells: the basis of vaccines.',
      ],
    },
  },
};

export const CELL_ORDER = ['neutrophil', 'macrophage', 'nk', 'tcd8', 'bcell'];

// Una célula se puede elegir si es jugable y cumple su condición de desbloqueo.
export function isUnlocked(id) {
  const c = CELLS[id];
  if (!c.playable) return false;
  // en modo de pruebas todo está desbloqueado
  if (!c.unlock || Save.settings.debug) return true;
  return c.unlock.check({ ...Save.stats, kills: Save.kills });
}
