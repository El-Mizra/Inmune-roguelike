// Células jugables. Por ahora solo el neutrófilo; el resto aparece como
// "próximamente" para mostrar la dirección del juego.

export const CELLS = {
  neutrophil: {
    playable: true,
    texture: 'neutrophil',
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
      name: { es: 'Gránulos de defensinas', en: 'Defensin granules' },
      desc: {
        es: 'Dispara gránulos cargados de péptidos antimicrobianos.',
        en: 'Fires granules loaded with antimicrobial peptides.',
      },
    },
    skill: {
      id: 'net',
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
    playable: false,
    texture: 'macrophage',
    name: { es: 'Macrófago', en: 'Macrophage' },
    branch: 'innate',
    summary: {
      es: 'Devora patógenos (cuerpo a cuerpo) y presenta antígenos.',
      en: 'Devours pathogens (melee) and presents antigens.',
    },
  },
  nk: {
    playable: false,
    texture: 'nkcell',
    name: { es: 'Célula NK', en: 'NK cell' },
    branch: 'innate',
    summary: {
      es: 'Detecta células sin MHC-I: experta contra virus y cáncer.',
      en: 'Detects cells lacking MHC-I: expert against viruses and cancer.',
    },
  },
  tcd8: {
    playable: false,
    texture: 'tcell',
    name: { es: 'Linfocito T CD8', en: 'CD8 T cell' },
    branch: 'adaptive',
    summary: {
      es: 'Asesino de precisión de células infectadas.',
      en: 'Precision killer of infected cells.',
    },
  },
  bcell: {
    playable: false,
    texture: 'bcell',
    name: { es: 'Linfocito B', en: 'B cell' },
    branch: 'adaptive',
    summary: {
      es: 'Dispara anticuerpos que marcan y neutralizan al enemigo.',
      en: 'Fires antibodies that tag and neutralize enemies.',
    },
  },
};

export const CELL_ORDER = ['neutrophil', 'macrophage', 'nk', 'tcd8', 'bcell'];
