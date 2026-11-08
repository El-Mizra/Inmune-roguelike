// Zonas del cuerpo. Cada zona tiene 2 pisos; una partida recorre las zonas en orden.
export const ZONES = [
  {
    id: 'skin',
    name: { es: 'Piel · Herida infectada', en: 'Skin · Infected wound' },
    host: 'kera', // célula sana que los virus infectan
    hostInfected: 'kera_infected',
  },
  {
    id: 'gut',
    name: { es: 'Intestino · Infección intestinal', en: 'Gut · Intestinal infection' },
    host: 'entero',
    hostInfected: 'entero_infected',
  },
];

export const FLOORS_PER_ZONE = 2;
export const zoneOf = (floor) => Math.min(ZONES.length - 1, Math.floor(floor / FLOORS_PER_ZONE));
// "1-1", "1-2", "2-1"...
export const floorLabel = (floor) => `${Math.floor(floor / FLOORS_PER_ZONE) + 1}-${(floor % FLOORS_PER_ZONE) + 1}`;
