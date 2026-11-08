# INMUNE: documento de diseño (GDD)

> Roguelike de acción en pixel art, estilo *Soul Knight*, donde controlas células reales del sistema inmune combatiendo infecciones y cáncer. Se juega en móvil y en PC.

Versión del documento: 0.1 (prototipo jugable de la Zona 1)

---

## 1. Pilares

1. **Realismo en las reglas, no solo en el aspecto.** Cada mecánica se apoya en un fenómeno biológico real: la fisión bacteriana, las cadenas de estreptococos, las hifas de *Candida*, la infección viral de células sanas, la evasión tumoral por MHC-I o la angiogénesis.
2. **Se aprende jugando, sin ser un libro de texto.** Los datos científicos aparecen en fichas cortas (enciclopedia, cartas de mejora y avisos de "nuevo patógeno"). Nunca bloquean la acción.
3. **Partidas cortas y rejugables.** Una partida completa dura de 15 a 20 minutos (varias zonas). Cada partida se genera de forma procedural.
4. **Controles simples en móvil.** Un stick y dos botones, con apuntado automático opcional.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Personajes | Cada personaje es un tipo de célula inmune con su propio estilo de combate |
| Combate | Mezcla según la célula: proyectiles (neutrófilo, linfocito B), cuerpo a cuerpo (macrófago), etc. |
| Apuntado | Tres modos: **Manual**, **Asistido** (imán suave) y **Automático**. Por defecto es automático en móvil y manual en PC |
| Estructura | Zonas del cuerpo como "biomas": piel, pulmón, intestino, sangre, ganglio linfático... |
| Progresión entre partidas | **Memoria inmunológica**: cuanto más eliminas una especie, más daño le haces en el futuro |
| Rigor | Educativo pero accesible: datos reales y simplificaciones honestas |
| Plataforma | Web (HTML5 con Phaser 3); se empaquetará como app (Capacitor) |
| Arte | Pixel art. En el prototipo se genera por código; luego se puede pulir a mano |
| Idiomas | Español e inglés |
| Duración | Partidas de 15 a 20 minutos |

## 3. Bucle de juego

```
Menú → Elegir célula → Piso (salas procedurales)
  ├─ Sala de combate: se cierran las puertas, llegan 2-3 oleadas, se abren al terminar
  ├─ Sala de mejora: eliges 1 de 3 moléculas (IL-8, TNF-α, lisozima...)
  └─ Sala del jefe → mejora → vaso linfático (portal) → siguiente piso
Fin de la partida → resumen + memoria inmunológica ganada
```

### Recursos del jugador (equivalentes a Soul Knight)

| Soul Knight | Inmune | Comportamiento |
|---|---|---|
| Vida | **Integridad** | No se regenera; se cura con objetos |
| Escudo | **Membrana** | Se regenera tras unos segundos sin recibir daño |
| Energía | **ATP** | Se gasta en habilidades; se regenera poco a poco o con **glucosa** |

## 4. Células jugables

### Neutrófilo (disponible)
- **Ataque:** gránulos de defensinas (proyectiles rápidos).
- **Habilidad, NET (trampa extracelular de neutrófilo):** una red de ADN y enzimas que ralentiza y daña. Hace triple daño a las hifas, igual que en la realidad, donde las NETs sirven contra lo que es demasiado grande para fagocitar.
- **Rol:** rápido y versátil, el "primer respondedor".

### Macrófago (disponible)
- **Ataque, pseudópodos (fagocitosis):** zarpazo cuerpo a cuerpo en arco. Engulle microbios pequeños, lo que da +3 ATP, y destruye proyectiles enemigos. Contra hifas hace la mitad de daño porque son demasiado grandes.
- **Habilidad, activación M1 (IFN-γ):** una onda de TNF-α empuja y daña. Durante 6 s, +50% de daño y +40% de velocidad de ataque, y recupera 1 de membrana.
- **Rol:** tanque lento con más integridad (7) y menos membrana (2).

### Célula NK (disponible)
- **Ataque, perforina y granzimas:** disparos de corto alcance. Hacen +100% de daño a células infectadas, +50% al cáncer y +30% a virus.
- **Habilidad, sinapsis letal:** embiste sin recibir daño y daña todo lo que atraviesa.
- **Pasiva, "falta de lo propio":** ve y daña con normalidad al melanoma aunque haya reducido su MHC-I.
- **Rol:** rápida y frágil; especialista contra virus y cáncer.

### Linfocito T CD8 (disponible)
- **Ataque, granzimas dirigidas:** +150% de daño a células infectadas, +50% a virus y +30% al cáncer.
- **Pasiva, aprendizaje adaptativo:** +2% de daño contra una especie por cada eliminado de esa especie durante la partida (máximo +40%).
- **Habilidad, expansión clonal:** 2 clones aliados cazan durante 9 s.

### Linfocito B (disponible)
- **Ataque, anticuerpos IgG:** largo alcance y poco daño, pero **opsonizan** (el enemigo recibe +30% de daño de todo durante 4 s) y **neutralizan** los viriones libres de un impacto.
- **Habilidad, célula plasmática:** ráfaga de 16 anticuerpos perforantes en todas direcciones.
- **Rol:** apoyo a distancia.

### Próximamente
| Célula | Estilo | Especialidad realista |
|---|---|---|
| Eosinófilo | Gránulos explosivos | Parásitos (zona intestino) |

## 5. Enemigos de la Zona 1 (piel, herida infectada)

| Especie | Mecánica | Base real |
|---|---|---|
| *Staphylococcus aureus* | Racimos lentos que **se dividen** cada pocos segundos | Fisión binaria, crecimiento exponencial |
| *Streptococcus pyogenes* | **Cadena** veloz: al romper un eslabón, se divide en dos cadenas | Crece en cadenas |
| *Pseudomonas aeruginosa* | Se mueve **a tirones** y escupe **piocianina** | Motilidad por pili y flagelo; pigmento tóxico |
| *Candida albicans* | Levadura que se transforma en **hifa** estacionaria que lanza esporas; resiste disparos, débil a la NET | Dimorfismo levadura-hifa |
| HSV-1 (herpes) | Los viriones **infectan células sanas**, que estallan y liberan más virus | Ciclo lítico viral |

### Jefes
- **MRSA (S. aureus resistente a meticilina):** protegido por **biopelícula** orbitante (reduce el daño que recibe). Lanza α-toxina en anillo, invoca estafilococos y hace un pulso de **leucocidina PVL** (círculo rojo que daña a los neutrófilos cercanos).
- **Melanoma:** espirales de disparos y **metástasis**, que lanza nódulos que se conectan con **vasos sanguíneos** (angiogénesis/VEGF) y curan al tumor. Periódicamente **reduce su MHC-I**: se vuelve casi invisible, el apuntado automático no lo detecta y recibe menos daño. Es un guiño a por qué las células NK son clave contra el cáncer.

## 6. Mejoras (moléculas)

Cada carta muestra el efecto y un dato real.

| Molécula | Efecto |
|---|---|
| IL-8 (CXCL8) | + velocidad (quimiotaxis) |
| Mieloperoxidasa | + daño (HOCl) |
| α-Defensinas | Disparos perforantes |
| Lisozima | + daño contra Gram + |
| Complemento C3b | + daño contra bacterias (opsonización) |
| Lactoferrina | Bacterias se dividen más lento (secuestro de hierro) |
| G-CSF | + integridad máxima |
| TNF-α | + cadencia |
| Catelicidina LL-37 | + daño contra biopelículas y virus |
| Dectin-1 | + daño contra hongos |
| Interferón tipo I | Las células sanas resisten una infección |
| Fiebre (IL-1β) | Patógenos más lentos |
| Glucólisis acelerada | + regeneración de ATP |
| NADPH oxidasa | NET más grande y duradera |

## 7. Progresión entre partidas

### Desbloqueo de células
| Célula | Cómo se desbloquea |
|---|---|
| Neutrófilo | Disponible desde el inicio (el primero en llegar) |
| Macrófago | Completar 1 partida |
| Célula NK | Eliminar 15 viriones de herpes o células infectadas |
| Linfocito T CD8 | Derrotar al MRSA |
| Linfocito B | Memoria inmunológica nivel 1 contra 2 especies |

### Memoria inmunológica

- Las muertes por especie se acumulan entre partidas.
- Hay tres niveles: 10, 30 y 75 eliminados, que dan +10%, +20% y +30% de daño contra esa especie.
- Para el neutrófilo se justifica como **inmunidad entrenada**; para linfocitos, como memoria adaptativa clásica.
- **Idea a futuro:** "vacunas" desbloqueables que dan memoria inicial contra un jefe.

## 8. Zonas planeadas

| Zona | Ambiente | Patógenos | Jefe(s) |
|---|---|---|---|
| 1. Piel | Herida infectada | *S. aureus*, *S. pyogenes*, *P. aeruginosa*, *Candida*, HSV-1 | MRSA, melanoma |
| 2. Pulmón | Alvéolos, moco | *S. pneumoniae*, influenza, *Aspergillus*, SARS-CoV-2 | *Mycobacterium tuberculosis* (granuloma), cáncer de pulmón |
| 3. Intestino | Vellosidades, microbiota | *Salmonella*, *C. difficile*, rotavirus, helmintos | *C. difficile* hipervirulento, cáncer colorrectal |
| 4. Sangre | Vasos, flujo que empuja | *Plasmodium* (malaria), *N. meningitidis* | Sepsis (tormenta de citocinas), leucemia |
| 5. Ganglio linfático | Centro germinal | VIH (ataca a tus propias células T) | VIH, linfoma |

Ideas de mecánicas por zona: el moco del pulmón que ralentiza, la microbiota "amiga" a la que no debes dañar en el intestino, el flujo sanguíneo que te arrastra, o el VIH que convierte aliados en enemigos.

### Ideas propuestas por el equipo (pendientes de revisión)
| Zona | Dificultad | Enemigos / jefe | Ideas de mecánica |
|---|---|---|---|
| Sistema digestivo | Intermedia | *Giardia lamblia* (parásito con flagelos y disco adhesivo) | Se pega a las paredes intestinales y hay que despegarlo; diarrea como corriente que arrastra; microbiota amiga que no se debe dañar |
| Sistema nervioso | Difícil | Jefe: virus de la rabia | Viaja por los nervios (pasillos largos y estrechos); barrera hematoencefálica: pocas células pueden entrar; si no se vence a tiempo, "llega al cerebro" |
| Sistema circulatorio | Por definir | Jefe: lupus (autoinmunidad) | Tus propios anticuerpos y células se vuelven contra ti: enemigos con el aspecto de las células jugables; idea de "tolerancia": dañar células sanas cuesta vida |

La autoinmunidad es una idea especialmente buena: es la única zona donde el enemigo es el propio sistema inmune y enseña por qué el cuerpo necesita tolerancia.

## 9. Técnica

- **Motor:** Phaser 3 + Vite, en JavaScript con módulos ES.
- **Render:** resolución base 960×540, modo `EXPAND` para pantallas anchas y cámara con zoom ×2 (vista de 480×270 px del mundo).
- **Sprites:** se generan por código en `src/gfx/sprites.js`. Para sustituirlos por arte hecho a mano basta con cargar imágenes con la misma clave de textura.
- **Guardado:** `localStorage` (ajustes, enciclopedia, memoria).
- **Empaquetado futuro:** Capacitor (Android/iOS) o PWA instalable (ya incluye `manifest.webmanifest`).

### Estructura de carpetas

```
src/
  main.js              configuración de Phaser
  data/                contenido: células, enemigos, mejoras (bilingüe)
  entities/            jugador, enemigos y jefes
  gfx/                 pintor de píxeles y sprites
  scenes/              menús, juego, HUD, pausa, enciclopedia...
  systems/             mazmorra, idioma, guardado, sonido, controles, UI
```

## 10. Próximos pasos sugeridos

1. Probar el prototipo en móvil y PC y ajustar la sensación de juego (velocidad, daño, dificultad).
2. Añadir el **macrófago** como segundo personaje (cuerpo a cuerpo).
3. Hacer una pasada de **arte**: personaje con animación de caminar, tiles con más variedad y efectos.
4. Añadir música y una mejor mezcla de sonido.
5. Crear la **Zona 2 (pulmón)**.
6. Empaquetar con Capacitor y probar en Android.
