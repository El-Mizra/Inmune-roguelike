// Estado de entrada compartido entre la escena de juego (teclado/ratón)
// y la escena de interfaz (controles táctiles).
export const Controls = {
  // movimiento normalizado desde el stick táctil
  touchMoveX: 0,
  touchMoveY: 0,
  // apuntado táctil (stick derecho); aimActive = el stick se ha arrastrado
  touchAimX: 0,
  touchAimY: 0,
  touchAimActive: false,
  touchFire: false,
  // pulsación de habilidad (flanco): la escena de juego la consume
  skillQueued: false,
  pauseQueued: false,
  debugQueued: false,
  reset() {
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.touchAimX = 0;
    this.touchAimY = 0;
    this.touchAimActive = false;
    this.touchFire = false;
    this.skillQueued = false;
    this.pauseQueued = false;
    this.debugQueued = false;
  },
};
