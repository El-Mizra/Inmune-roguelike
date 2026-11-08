// Especies enemigas. Cada una tiene estadísticas de juego y una ficha educativa
// (bilingüe) para la enciclopedia. Las mecánicas intentan reflejar biología real:
// ver docs/GDD.md para la justificación de cada una.

export const ENEMIES = {
  saureus: {
    simpleName: { es: 'Racimo dorado', en: 'Golden cluster' },
    name: 'Staphylococcus aureus',
    category: 'gramPos',
    tags: ['bacteria', 'gramPos'],
    texture: 'saureus',
    hp: 6,
    speed: 34,
    contactDamage: 1,
    cost: 1,
    radius: 5,
    fission: { every: 7500, jitter: 3000, maxGen: 2 },
    summary: {
      es: 'Coco Gram + que forma racimos dorados. Se divide sin parar.',
      en: 'Gram + coccus that forms golden clusters. Never stops dividing.',
    },
    facts: {
      es: [
        'Su nombre viene del griego staphylé (racimo) y del latín aureus (dorado), por el color de sus colonias.',
        'Vive en la piel y nariz de ~30% de las personas sin causar daño, pero en una herida provoca abscesos y celulitis.',
        'Produce leucocidina de Panton-Valentine, una toxina que perfora la membrana de los neutrófilos.',
        'Se divide por fisión binaria aproximadamente cada 30 minutos en condiciones ideales.',
      ],
      en: [
        'Its name comes from Greek staphylé (bunch of grapes) and Latin aureus (golden), for the color of its colonies.',
        'It lives harmlessly on the skin and nose of ~30% of people, but in a wound it causes abscesses and cellulitis.',
        'It produces Panton-Valentine leukocidin, a toxin that punches holes in neutrophil membranes.',
        'It divides by binary fission roughly every 30 minutes under ideal conditions.',
      ],
    },
    tip: {
      es: 'Elimínalos rápido: cada pocos segundos se dividen en dos.',
      en: 'Kill them fast: every few seconds they split in two.',
    },
  },
  spyogenes: {
    simpleName: { es: 'Cadena púrpura', en: 'Purple chain' },
    name: 'Streptococcus pyogenes',
    category: 'gramPos',
    tags: ['bacteria', 'gramPos'],
    texture: 'spyogenes',
    hp: 4,
    speed: 72,
    contactDamage: 1,
    cost: 3, // por cadena completa
    radius: 4,
    chain: 5,
    summary: {
      es: 'Coco Gram + que crece en cadenas. Rápido y escurridizo.',
      en: 'Gram + coccus that grows in chains. Fast and slippery.',
    },
    facts: {
      es: [
        'Forma cadenas porque sus células se dividen siempre en el mismo eje y no se separan.',
        'Causa faringitis, impétigo y, en casos graves, fascitis necrosante ("bacteria come-carne").',
        'Su proteína M dificulta la fagocitosis: los fagocitos necesitan anticuerpos para atraparlo bien.',
      ],
      en: [
        'It forms chains because its cells always divide along the same axis and stay attached.',
        'It causes strep throat, impetigo and, in severe cases, necrotizing fasciitis ("flesh-eating bacteria").',
        'Its M protein hinders phagocytosis: phagocytes need antibodies to grab it efficiently.',
      ],
    },
    tip: {
      es: 'Si destruyes un eslabón, la cadena se parte en dos.',
      en: 'Destroy one link and the chain splits in two.',
    },
  },
  paeruginosa: {
    simpleName: { es: 'Bacilo escupidor', en: 'Spitting rod' },
    name: 'Pseudomonas aeruginosa',
    category: 'gramNeg',
    tags: ['bacteria', 'gramNeg'],
    texture: 'paeruginosa',
    hp: 8,
    speed: 170,
    contactDamage: 1,
    cost: 2,
    radius: 5,
    shoot: { every: 1800, speed: 70, damage: 1 },
    summary: {
      es: 'Bacilo Gram − con flagelo. Se mueve a tirones y escupe piocianina.',
      en: 'Flagellated Gram − rod. Darts around and spits pyocyanin.',
    },
    facts: {
      es: [
        'Es un patógeno oportunista típico de quemaduras, heridas crónicas y pacientes hospitalizados.',
        'Produce piocianina, un pigmento azul-verdoso que genera radicales libres y daña a las células inmunes.',
        'Su flagelo le permite nadar rápido; sus pili le permiten avanzar "a tirones" sobre superficies.',
        'Su membrana externa (Gram −) la hace resistente a muchos antibióticos y a la lisozima.',
      ],
      en: [
        'An opportunistic pathogen typical of burns, chronic wounds and hospitalized patients.',
        'It produces pyocyanin, a blue-green pigment that generates free radicals and harms immune cells.',
        'Its flagellum lets it swim fast; its pili let it "twitch" across surfaces.',
        'Its outer membrane (Gram −) makes it resistant to many antibiotics and to lysozyme.',
      ],
    },
    tip: {
      es: 'Ataca cuando se detiene para disparar.',
      en: 'Strike when it stops to shoot.',
    },
  },
  calbicans: {
    simpleName: { es: 'Levadura', en: 'Yeast' },
    name: 'Candida albicans',
    category: 'fungus',
    tags: ['fungus'],
    texture: 'calbicans',
    hp: 10,
    speed: 22,
    contactDamage: 1,
    cost: 2,
    radius: 6,
    hypha: { after: 6500, jitter: 2500, hp: 26, shootEvery: 2600, damage: 1 },
    summary: {
      es: 'Levadura que puede transformarse en hifas invasivas.',
      en: 'A yeast that can switch into invasive hyphae.',
    },
    facts: {
      es: [
        'Es dimórfica: puede vivir como levadura redonda o formar hifas, filamentos largos que invaden tejidos.',
        'Las hifas son demasiado grandes para ser fagocitadas, así que los neutrófilos lanzan NETs: redes de ADN con enzimas.',
        'Normalmente vive en boca, intestino y piel; causa infección cuando las defensas bajan.',
        'Los receptores Dectin-1 reconocen el β-glucano de su pared celular.',
      ],
      en: [
        'It is dimorphic: it can live as a round yeast or form hyphae, long filaments that invade tissue.',
        'Hyphae are too big to phagocytose, so neutrophils cast NETs: webs of DNA loaded with enzymes.',
        'It normally lives in the mouth, gut and skin; it causes infection when defenses drop.',
        'Dectin-1 receptors recognize the β-glucan in its cell wall.',
      ],
    },
    tip: {
      es: 'Mátala antes de que forme hifas. Contra las hifas usa tu NET: hace triple daño.',
      en: 'Kill it before it forms hyphae. Use your NET against hyphae: it deals triple damage.',
    },
  },
  hsv1: {
    simpleName: { es: 'Virus del herpes', en: 'Herpes virus' },
    name: 'Herpes simplex 1 (HSV-1)',
    category: 'virus',
    tags: ['virus'],
    texture: 'hsv1',
    hp: 2,
    speed: 58,
    contactDamage: 1,
    cost: 2, // por grupo
    radius: 3,
    group: 3,
    infect: { burstAfter: 4200, virions: 3 },
    summary: {
      es: 'Virus envuelto. Infecta células sanas y las usa como fábricas.',
      en: 'Enveloped virus. Infects healthy cells and turns them into factories.',
    },
    facts: {
      es: [
        'Un virus no puede reproducirse solo: entra en una célula y usa su maquinaria para fabricar copias.',
        'La célula infectada acaba rompiéndose (lisis) y libera cientos de viriones nuevos.',
        'Infecta queratinocitos de la piel y luego se esconde en neuronas, donde puede reactivarse (fuegos labiales).',
        'Los especialistas contra células infectadas son los linfocitos T CD8 y las células NK, no los neutrófilos.',
      ],
      en: [
        'A virus cannot reproduce on its own: it enters a cell and hijacks its machinery to make copies.',
        'The infected cell eventually bursts (lysis), releasing hundreds of new virions.',
        'It infects skin keratinocytes and then hides in neurons, where it can reactivate (cold sores).',
        'The specialists against infected cells are CD8 T cells and NK cells, not neutrophils.',
      ],
    },
    tip: {
      es: 'Protege las células sanas: si una se infecta, destrúyela antes de que estalle.',
      en: 'Protect healthy cells: if one gets infected, destroy it before it bursts.',
    },
  },
  infected: {
    simpleName: { es: 'Célula infectada', en: 'Infected cell' },
    name: { es: 'Queratinocito infectado', en: 'Infected keratinocyte' },
    category: 'host',
    tags: ['infected', 'virus'],
    texture: 'kera_infected',
    hp: 10,
    speed: 0,
    contactDamage: 0,
    cost: 0,
    radius: 7,
    hidden: true,
    summary: {
      es: 'Célula de la piel convertida en fábrica de virus.',
      en: 'A skin cell turned into a virus factory.',
    },
    facts: {
      es: [
        'Las células infectadas muestran fragmentos del virus en sus moléculas MHC-I: es su forma de "pedir ayuda".',
        'Los linfocitos T CD8 reconocen esa señal y ordenan a la célula autodestruirse (apoptosis) antes de que libere más virus.',
      ],
      en: [
        'Infected cells display viral fragments on their MHC-I molecules: it is their way of "calling for help".',
        'CD8 T cells recognize that signal and order the cell to self-destruct (apoptosis) before it releases more virus.',
      ],
    },
    tip: {
      es: 'Destrúyela antes de que estalle y libere más viriones.',
      en: 'Destroy it before it bursts and releases more virions.',
    },
  },
  biofilm: {
    name: { es: 'Biopelícula', en: 'Biofilm' },
    category: 'boss',
    tags: ['biofilm', 'bacteria'],
    texture: 'biofilm',
    hp: 8,
    speed: 0,
    contactDamage: 1,
    cost: 0,
    radius: 5,
    hidden: true,
  },
  tumornode: {
    name: { es: 'Nódulo metastásico', en: 'Metastatic nodule' },
    category: 'cancer',
    tags: ['cancer'],
    texture: 'tumornode',
    hp: 12,
    speed: 0,
    contactDamage: 1,
    cost: 0,
    radius: 7,
    hidden: true,
  },
  mrsa: {
    simpleName: { es: 'Súper racimo resistente', en: 'Resistant super-cluster' },
    name: 'S. aureus MRSA',
    category: 'boss',
    tags: ['bacteria', 'gramPos', 'boss'],
    texture: 'mrsa',
    hp: 360,
    speed: 22,
    contactDamage: 1,
    cost: 0,
    radius: 20,
    boss: true,
    summary: {
      es: 'Staphylococcus aureus resistente a meticilina, protegido por una biopelícula.',
      en: 'Methicillin-resistant Staphylococcus aureus, shielded by a biofilm.',
    },
    facts: {
      es: [
        'MRSA es una cepa de S. aureus resistente a los antibióticos β-lactámicos (meticilina, penicilinas).',
        'Forma biopelículas: comunidades bacterianas envueltas en una matriz que bloquea fagocitos y fármacos.',
        'Libera toxinas como la α-hemolisina, que forma poros en las membranas de nuestras células.',
        'Es una de las principales causas de infecciones hospitalarias en el mundo.',
      ],
      en: [
        'MRSA is a strain of S. aureus resistant to β-lactam antibiotics (methicillin, penicillins).',
        'It forms biofilms: bacterial communities wrapped in a matrix that blocks phagocytes and drugs.',
        'It releases toxins like α-hemolysin, which forms pores in our cell membranes.',
        'It is one of the leading causes of hospital-acquired infections worldwide.',
      ],
    },
    tip: {
      es: 'Rompe la biopelícula para poder dañarlo. Aléjate cuando aparezca el círculo rojo (leucocidina).',
      en: 'Break the biofilm to damage it. Step away when the red circle appears (leukocidin).',
    },
  },
  melanoma: {
    simpleName: { es: 'Melanoma', en: 'Melanoma' },
    name: { es: 'Melanoma', en: 'Melanoma' },
    category: 'cancer',
    tags: ['cancer', 'boss'],
    texture: 'melanoma',
    hp: 400,
    speed: 18,
    contactDamage: 1,
    cost: 0,
    radius: 20,
    boss: true,
    summary: {
      es: 'Cáncer de melanocitos. Se esconde del sistema inmune y hace metástasis.',
      en: 'Cancer of melanocytes. Hides from the immune system and metastasizes.',
    },
    facts: {
      es: [
        'Surge de melanocitos, las células que producen melanina, a menudo por daño del ADN causado por la radiación UV.',
        'Muchos tumores reducen sus moléculas MHC-I para que los linfocitos T no los reconozcan.',
        'Las células NK detectan precisamente esa ausencia de MHC-I ("falta de lo propio").',
        'Los tumores liberan VEGF para crear vasos sanguíneos nuevos (angiogénesis) que los alimentan.',
        'La inmunoterapia (anti-PD-1) revolucionó el tratamiento del melanoma al "quitar el freno" a los linfocitos T.',
      ],
      en: [
        'It arises from melanocytes, the cells that make melanin, often after DNA damage from UV radiation.',
        'Many tumors reduce their MHC-I molecules so T cells cannot recognize them.',
        'NK cells detect exactly that missing MHC-I ("missing self").',
        'Tumors release VEGF to grow new blood vessels (angiogenesis) that feed them.',
        'Immunotherapy (anti-PD-1) revolutionized melanoma treatment by "releasing the brakes" on T cells.',
      ],
    },
    tip: {
      es: 'Destruye los nódulos metastásicos: sus vasos sanguíneos curan al tumor.',
      en: 'Destroy the metastatic nodules: their blood vessels heal the tumor.',
    },
  },

  // ---------------- Zona 2: intestino ----------------
  salmonella: {
    name: 'Salmonella enterica',
    simpleName: { es: 'Salmonela', en: 'Salmonella' },
    category: 'gramNeg',
    tags: ['bacteria', 'gramNeg'],
    texture: 'salmonella',
    hp: 10,
    speed: 75,
    contactDamage: 1,
    cost: 2,
    radius: 5,
    summary: {
      es: 'Bacilo que se mete dentro de las células del intestino para esconderse.',
      en: 'A rod that slips inside gut cells to hide.',
    },
    facts: {
      es: [
        'Se contagia por alimentos mal cocinados, como huevo o pollo, y causa gastroenteritis.',
        'Usa una "jeringa molecular" (sistema de secreción tipo III) para inyectar proteínas que la meten dentro de las células del intestino.',
        'Puede sobrevivir dentro de los propios macrófagos, escondida del resto del sistema inmune.',
      ],
      en: [
        'It spreads through undercooked food, like eggs or chicken, and causes gastroenteritis.',
        'It uses a "molecular syringe" (type III secretion system) to inject proteins that pull it inside gut cells.',
        'It can even survive inside macrophages, hidden from the rest of the immune system.',
      ],
    },
    tip: {
      es: 'Se esconde dentro de las células un momento: atácala cuando reaparezca.',
      en: 'It hides inside cells for a moment: hit it when it reappears.',
    },
  },
  ecoli: {
    name: 'Escherichia coli O157:H7',
    simpleName: { es: 'E. coli tóxica', en: 'Toxic E. coli' },
    category: 'gramNeg',
    tags: ['bacteria', 'gramNeg'],
    texture: 'ecoli',
    hp: 7,
    speed: 50,
    contactDamage: 1,
    cost: 1,
    radius: 4,
    summary: {
      es: 'Cepa peligrosa de E. coli que deja charcos de toxina a su paso.',
      en: 'A dangerous E. coli strain that leaves toxin puddles behind.',
    },
    facts: {
      es: [
        'La mayoría de las E. coli son inofensivas y forman parte de tu microbiota intestinal.',
        'La cepa O157:H7 produce toxina Shiga, que daña los vasos sanguíneos del intestino y puede afectar a los riñones.',
        'Se contagia por carne poco cocida, verduras mal lavadas o agua contaminada.',
      ],
      en: [
        'Most E. coli are harmless and part of your gut microbiota.',
        'The O157:H7 strain produces Shiga toxin, which damages gut blood vessels and can affect the kidneys.',
        'It spreads through undercooked meat, unwashed vegetables or contaminated water.',
      ],
    },
    tip: {
      es: 'Deja charcos verdes de toxina: no te quedes encima.',
      en: 'It leaves green toxin puddles: do not stand in them.',
    },
  },
  rotavirus: {
    name: 'Rotavirus',
    simpleName: { es: 'Rotavirus', en: 'Rotavirus' },
    category: 'virus',
    tags: ['virus'],
    texture: 'rotavirus',
    hp: 3,
    speed: 60,
    contactDamage: 1,
    cost: 2,
    radius: 4,
    group: 3,
    infect: { burstAfter: 3800, virions: 3 },
    summary: {
      es: 'Virus con forma de rueda que infecta las células del intestino.',
      en: 'A wheel-shaped virus that infects gut cells.',
    },
    facts: {
      es: [
        'Su nombre viene del latín rota (rueda), por su forma al microscopio.',
        'Es la causa más común de diarrea grave en bebés en todo el mundo.',
        'Infecta los enterocitos, las células que absorben los nutrientes. Existe una vacuna oral muy eficaz.',
      ],
      en: [
        'Its name comes from Latin rota (wheel), for its shape under the microscope.',
        'It is the most common cause of severe diarrhea in babies worldwide.',
        'It infects enterocytes, the cells that absorb nutrients. A very effective oral vaccine exists.',
      ],
    },
    tip: {
      es: 'Como el herpes: protege las células sanas y destruye las infectadas antes de que estallen.',
      en: 'Like herpes: protect healthy cells and destroy infected ones before they burst.',
    },
  },
  giardia: {
    name: 'Giardia lamblia',
    simpleName: { es: 'Giardia', en: 'Giardia' },
    category: 'protozoan',
    tags: ['protozoan'],
    texture: 'giardia',
    hp: 14,
    speed: 85,
    contactDamage: 1,
    cost: 2,
    radius: 6,
    summary: {
      es: 'Parásito de una sola célula que se pega a la pared del intestino.',
      en: 'A single-celled parasite that sticks to the gut wall.',
    },
    facts: {
      es: [
        'Es un protozoo: un organismo de una sola célula, más complejo que una bacteria.',
        'Tiene dos núcleos que parecen "ojos" y un disco adhesivo con el que se pega al intestino como una ventosa.',
        'Se contagia por agua contaminada y causa diarrea y mala absorción de nutrientes.',
        'Los anticuerpos IgA del intestino ayudan a impedir que se pegue.',
      ],
      en: [
        'It is a protozoan: a single-celled organism, more complex than a bacterium.',
        'It has two nuclei that look like "eyes" and an adhesive disc that sticks to the gut like a suction cup.',
        'It spreads through contaminated water and causes diarrhea and poor nutrient absorption.',
        'IgA antibodies in the gut help stop it from sticking.',
      ],
    },
    tip: {
      es: 'Cuando se pega (se vuelve azulada) resiste mucho el daño: atácala cuando se suelte.',
      en: 'When it sticks (turns bluish) it resists damage: hit it when it lets go.',
    },
  },
  giardiaboss: {
    name: { es: 'Giardia gigante', en: 'Giant Giardia' },
    simpleName: { es: 'Giardia gigante', en: 'Giant Giardia' },
    category: 'protozoan',
    tags: ['protozoan', 'boss'],
    texture: 'giardiaboss',
    hp: 460,
    speed: 40,
    contactDamage: 1,
    cost: 0,
    radius: 18,
    boss: true,
    summary: {
      es: 'Una Giardia enorme que embiste, se adhiere y se multiplica dividiéndose.',
      en: 'A huge Giardia that charges, sticks and multiplies by splitting.',
    },
    facts: {
      es: [
        'Giardia se reproduce por fisión binaria: una célula se divide en dos idénticas.',
        'Sus cuatro pares de flagelos le permiten nadar rápido por el intestino.',
        'Forma quistes muy resistentes que sobreviven fuera del cuerpo durante semanas.',
      ],
      en: [
        'Giardia reproduces by binary fission: one cell splits into two identical ones.',
        'Its four pairs of flagella let it swim fast through the gut.',
        'It forms very hardy cysts that survive outside the body for weeks.',
      ],
    },
    tip: {
      es: 'Esquiva su embestida (aparece una línea antes). Cuando se pega, gira y dispara en todas direcciones.',
      en: 'Dodge its charge (a line warns you first). When it sticks, it spins and fires in every direction.',
    },
  },
  cdiff: {
    name: 'Clostridioides difficile',
    simpleName: { es: 'Bacilo de esporas', en: 'Spore bacillus' },
    category: 'boss',
    tags: ['bacteria', 'gramPos', 'boss'],
    texture: 'cdiff',
    hp: 560,
    speed: 26,
    contactDamage: 1,
    cost: 0,
    radius: 20,
    boss: true,
    summary: {
      es: 'Bacteria que aprovecha cuando los antibióticos destruyen tu microbiota.',
      en: 'A bacterium that strikes when antibiotics wipe out your microbiota.',
    },
    facts: {
      es: [
        'Muchas personas la llevan sin enfermar: la microbiota sana la mantiene a raya.',
        'Los antibióticos de amplio espectro eliminan a la microbiota y C. difficile se multiplica sin competencia.',
        'Libera las toxinas A y B, que inflaman el colon y forman "pseudomembranas".',
        'Forma esporas casi indestructibles. Un tratamiento eficaz es el trasplante de microbiota fecal.',
      ],
      en: [
        'Many people carry it without getting sick: a healthy microbiota keeps it in check.',
        'Broad-spectrum antibiotics wipe out the microbiota and C. difficile multiplies with no competition.',
        'It releases toxins A and B, which inflame the colon and form "pseudomembranes".',
        'It forms nearly indestructible spores. One effective treatment is a fecal microbiota transplant.',
      ],
    },
    tip: {
      es: 'Cuando se convierte en espora es invulnerable: aléjate de sus nubes de toxina y espera.',
      en: 'When it turns into a spore it is invulnerable: stay away from its toxin clouds and wait.',
    },
  },
};

// Qué especies pueden aparecer en cada piso (con peso relativo).
export const FLOOR_POOLS = [
  // Piso 1-1: bacterias de una herida recién contaminada.
  [
    ['saureus', 5],
    ['spyogenes', 3],
    ['paeruginosa', 3],
  ],
  // Piso 1-2: la infección avanza; aparecen hongos y virus.
  [
    ['saureus', 4],
    ['spyogenes', 2],
    ['paeruginosa', 3],
    ['calbicans', 3],
    ['hsv1', 3],
  ],
  // Piso 2-1: intestino, primeras infecciones.
  [
    ['salmonella', 4],
    ['ecoli', 3],
    ['giardia', 3],
    ['rotavirus', 2],
  ],
  // Piso 2-2: la infección intestinal se complica.
  [
    ['salmonella', 3],
    ['ecoli', 3],
    ['giardia', 3],
    ['rotavirus', 3],
    ['calbicans', 1],
  ],
];

export const FLOOR_BOSSES = ['mrsa', 'melanoma', 'giardiaboss', 'cdiff'];

// Orden en la enciclopedia.
export const CODEX_PATHOGENS = [
  'saureus',
  'spyogenes',
  'paeruginosa',
  'calbicans',
  'hsv1',
  'infected',
  'mrsa',
  'melanoma',
  'salmonella',
  'ecoli',
  'rotavirus',
  'giardia',
  'giardiaboss',
  'cdiff',
];
