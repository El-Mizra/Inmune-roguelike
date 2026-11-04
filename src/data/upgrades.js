// Mejoras durante la partida, cada una basada en una molécula real.
// `apply` modifica las estadísticas del jugador (ver entities/Player.js).

export const UPGRADES = {
  il8: {
    name: 'IL-8 (CXCL8)',
    effect: { es: '+18% velocidad de movimiento', en: '+18% movement speed' },
    fact: {
      es: 'Quimiocina que atrae a los neutrófilos hacia la infección: ellos siguen su gradiente de concentración.',
      en: 'A chemokine that draws neutrophils to the infection: they follow its concentration gradient.',
    },
    apply: (s) => {
      s.speed *= 1.18;
    },
  },
  mpo: {
    name: { es: 'Mieloperoxidasa', en: 'Myeloperoxidase' },
    effect: { es: '+1 de daño por disparo', en: '+1 damage per shot' },
    fact: {
      es: 'Enzima de los gránulos que fabrica ácido hipocloroso (HOCl): básicamente, cloro como el de la lejía.',
      en: 'A granule enzyme that makes hypochlorous acid (HOCl): essentially the same chlorine as in bleach.',
    },
    apply: (s) => {
      s.damage += 1;
    },
  },
  defensin: {
    only: 'projectile',
    name: { es: 'α-Defensinas', en: 'α-Defensins' },
    effect: { es: 'Los disparos atraviesan 1 enemigo más', en: 'Shots pierce 1 more enemy' },
    fact: {
      es: 'Péptidos con carga positiva que se insertan en las membranas microbianas y las perforan.',
      en: 'Positively charged peptides that insert into microbial membranes and punch holes in them.',
    },
    apply: (s) => {
      s.pierce += 1;
    },
  },
  lysozyme: {
    name: { es: 'Lisozima', en: 'Lysozyme' },
    effect: { es: '+40% daño contra bacterias Gram +', en: '+40% damage vs Gram + bacteria' },
    fact: {
      es: 'Rompe el peptidoglicano de la pared bacteriana. Las Gram + lo tienen expuesto; también está en lágrimas y saliva.',
      en: 'Breaks down peptidoglycan in the bacterial wall. Gram + bacteria have it exposed; it is also in tears and saliva.',
    },
    apply: (s) => {
      s.bonus.gramPos += 0.4;
    },
  },
  c3b: {
    name: { es: 'Complemento C3b', en: 'Complement C3b' },
    effect: { es: '+25% daño contra todas las bacterias', en: '+25% damage vs all bacteria' },
    fact: {
      es: 'Proteína del complemento que "recubre" a los microbios (opsonización) para que los fagocitos los atrapen mejor.',
      en: 'A complement protein that coats microbes (opsonization) so phagocytes can grab them more easily.',
    },
    apply: (s) => {
      s.bonus.bacteria += 0.25;
    },
  },
  lactoferrin: {
    name: { es: 'Lactoferrina', en: 'Lactoferrin' },
    effect: { es: 'Las bacterias se dividen un 50% más lento', en: 'Bacteria divide 50% slower' },
    fact: {
      es: 'Secuestra el hierro libre. Sin hierro, las bacterias no pueden crecer: se llama "inmunidad nutricional".',
      en: 'It sequesters free iron. Without iron, bacteria cannot grow: this is called "nutritional immunity".',
    },
    apply: (s) => {
      s.fissionMult *= 1.5;
    },
  },
  gcsf: {
    name: 'G-CSF',
    effect: { es: '+2 de integridad máxima (y cura 2)', en: '+2 max integrity (and heals 2)' },
    fact: {
      es: 'Factor que ordena a la médula ósea producir y liberar más neutrófilos durante una infección.',
      en: 'A factor that tells bone marrow to make and release more neutrophils during an infection.',
    },
    apply: (s, p) => {
      s.maxHp += 2;
      if (p) p.heal(2);
    },
  },
  tnf: {
    name: 'TNF-α',
    effect: { es: '+25% cadencia de disparo', en: '+25% fire rate' },
    fact: {
      es: 'Citocina proinflamatoria que activa a los fagocitos. En exceso causa daño (por eso existe la terapia anti-TNF).',
      en: 'A pro-inflammatory cytokine that activates phagocytes. In excess it causes damage (hence anti-TNF therapy).',
    },
    apply: (s) => {
      s.fireRate *= 1.25;
    },
  },
  ll37: {
    name: { es: 'Catelicidina LL-37', en: 'Cathelicidin LL-37' },
    effect: { es: '+60% daño contra biopelículas y virus', en: '+60% damage vs biofilms and viruses' },
    fact: {
      es: 'El único péptido humano de su familia. Desestabiliza biopelículas y la envoltura de algunos virus.',
      en: 'The only human peptide of its family. It destabilizes biofilms and the envelope of some viruses.',
    },
    apply: (s) => {
      s.bonus.biofilm += 0.6;
      s.bonus.virus += 0.6;
    },
  },
  dectin: {
    name: 'Dectin-1',
    effect: { es: '+50% daño contra hongos', en: '+50% damage vs fungi' },
    fact: {
      es: 'Receptor que reconoce el β-glucano de la pared de los hongos y activa la respuesta antifúngica.',
      en: 'A receptor that recognizes β-glucan in fungal walls and triggers the antifungal response.',
    },
    apply: (s) => {
      s.bonus.fungus += 0.5;
    },
  },
  ifn: {
    name: { es: 'Interferón tipo I', en: 'Type I interferon' },
    effect: {
      es: 'Las células sanas resisten 1 infección viral',
      en: 'Healthy cells resist 1 viral infection',
    },
    fact: {
      es: 'Las células infectadas lo liberan para avisar a sus vecinas, que activan defensas antivirales.',
      en: 'Infected cells release it to warn their neighbors, which switch on antiviral defenses.',
    },
    apply: (s) => {
      s.cellShield += 1;
    },
  },
  fever: {
    name: { es: 'Fiebre (IL-1β)', en: 'Fever (IL-1β)' },
    effect: { es: 'Los patógenos se mueven un 15% más lento', en: 'Pathogens move 15% slower' },
    fact: {
      es: 'La IL-1β actúa sobre el hipotálamo y sube la temperatura; muchos microbios crecen peor con calor.',
      en: 'IL-1β acts on the hypothalamus and raises body temperature; many microbes grow worse in the heat.',
    },
    apply: (s) => {
      s.enemySlow *= 0.85;
    },
  },
  glycolysis: {
    name: { es: 'Glucólisis acelerada', en: 'Boosted glycolysis' },
    effect: { es: '+60% regeneración de ATP', en: '+60% ATP regeneration' },
    fact: {
      es: 'Los neutrófilos obtienen casi toda su energía de la glucólisis, incluso con oxígeno disponible.',
      en: 'Neutrophils get almost all their energy from glycolysis, even when oxygen is available.',
    },
    apply: (s) => {
      s.atpRegen *= 1.6;
    },
  },
  nadph: {
    name: { es: 'NADPH oxidasa', en: 'NADPH oxidase' },
    effect: { es: 'Tu habilidad dura más y abarca más', en: 'Your skill lasts longer and reaches farther' },
    fact: {
      es: 'Genera el "estallido respiratorio" de especies reactivas de oxígeno: los neutrófilos lo necesitan para formar NETs y los macrófagos para destruir lo que fagocitan.',
      en: 'It produces the "respiratory burst" of reactive oxygen species: neutrophils need it to form NETs and macrophages to destroy what they engulf.',
    },
    apply: (s) => {
      s.skillRadius *= 1.25;
      s.skillDuration *= 1.35;
    },
  },
};

export const UPGRADE_IDS = Object.keys(UPGRADES);
