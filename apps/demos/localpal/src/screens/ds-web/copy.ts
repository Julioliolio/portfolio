/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TODO EL TEXTO DEL SITIO EN UN SOLO SITIO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Esto es lo único que necesitas tocar para cambiar copy. Edita las cadenas
 * de aquí y la web se actualiza sola — no hace falta abrir los componentes.
 *
 * Reglas rápidas:
 *  - Cambia lo que está entre comillas '...'. No borres las comillas ni las
 *    comas del final de cada línea.
 *  - Los valores técnicos (hex de color, tamaños de tipografía, radios) salen
 *    solos de theme/tokens.ts — no se escriben aquí a mano.
 *  - Acentos, ñ, «» y — se pueden usar sin problema.
 */

import { color, text } from "../../theme/tokens";

export const copy = {
  /* ── Cromo fijo (marca, salida, riel lateral) ──────────────────────────── */
  chrome: {
    wordmark: "LocalPal",
    exit: "Prototipo",
    // El texto de cada punto del riel lateral (el orden y las anclas no cambian).
    rail: {
      overview: "Inicio",
      principios: "Principios",
      color: "Color",
      tipografia: "Tipografía",
      squircles: "Squircles",
      movimiento: "Movimiento",
      componentes: "Componentes",
      sello: "Sello",
    },
  },

  /* ── Portada ───────────────────────────────────────────────────────────── */
  hero: {
    eyebrow: "El sistema de diseño de la app",
    // El titular grande, una frase por línea. La lupa aparece al final de la
    // 3ª línea automáticamente.
    titleLines: ["Stop scrolling.", "Start showing up.", ""],
    tagline: "Sistema de diseño de LocalPal",
    scrollCue: "Principios",
    meta: [
      { k: "Color", v: "#3121FF" },
      { k: "TIMING", v: "250ms · 0.23" },
      { k: "Tipografía", v: "PP Neue Montreal" },
    ],
  },

  /* ── Principios ────────────────────────────────────────────────────────── */
  principios: {
    eyebrow: "01 — Principios",
    title: "Principios",
    items: [
      {
        n: "01",
        title: "Todo responde",
        body: "Cada cosa que toques tendrá una respuesta: entra, se pasa un poco y se asienta, rebota, da una vueltecita...",
      },
      {
        n: "02",
        title: "Modular y modificable",
        body: "Ningún elemento escribe a mano dentro de un componente. Todo sale de un registro central, así que afinar una vez recolorea o remodela la app entera a la vez.",
      },
      {
        n: "03",
        title: "Superelipses",
        body: "Cada esquina es una curva continua, no un arco de círculo. El suavizado solo se nota si el radio deja un tramo recto",
      },
    ],
  },

  /* ── Color ─────────────────────────────────────────────────────────────── */
  color: {
    eyebrow: "02 — Fundamentos",
    title: "Color",
    lede: "Un solo azul hace el trabajo pesado. La lavanda como segundario, la tinta y el gris cargan las palabras, y una paleta cartográfica suave pinta el mapa. con mucho contraste.",
    // Cada grupo: title + note, y sus muestras. El `value` sale de tokens.ts.
    groups: [
      {
        title: "Marca",
        note: "El azul hyperlink. Un solo tono sostiene todo el producto.",
        swatches: [
          {
            name: "Brand",
            value: color.brand,
            use: "Hojas, botones primarios, pines activos, el punto de ubicación.",
          },
          {
            name: "Brand Deep",
            value: color.brandDeep,
            use: "Un tono más oscuro — algunos rellenos y degradados.",
          },
          {
            name: "Brand Pressed",
            value: color.brandPressed,
            use: "El estado presionado de los botones.",
          },
        ],
      },
      {
        title: "Lavanda",
        note: "La voz secundaria — casi siempre viviendo sobre el azul.",
        swatches: [
          {
            name: "Lavender",
            value: color.lavender,
            use: "Texto secundario, meta y placeholders sobre azul.",
          },
          {
            name: "Lavender Dim",
            value: color.lavenderDim,
            use: "Una variante apagada para acentos más callados.",
          },
        ],
      },
      {
        title: "Tinta y texto",
        note: "Para tipografía y marcas sobre superficies claras.",
        swatches: [
          {
            name: "Ink",
            value: color.ink,
            use: "Texto principal sobre claro — un azul marino profundo y desaturado.",
          },
          {
            name: "Muted",
            value: color.muted,
            use: "Pies, meta y texto secundario sobre claro.",
          },
          {
            name: "Black",
            value: color.black,
            use: "Negro puro — usado con cuentagotas (el goo del zoom de borde, etc.).",
          },
        ],
      },
      {
        title: "Superficies",
        note: "El suelo claro sobre el que se apoya todo lo demás.",
        swatches: [
          {
            name: "White",
            value: color.white,
            use: "La superficie principal — tarjetas, hojas, CTAs.",
            outline: true,
          },
          {
            name: "Off-White",
            value: color.offWhite,
            use: "Un pelín más cálido que el blanco — fondos de página.",
            outline: true,
          },
        ],
      },
      {
        title: "Sobre azul",
        note: "Valores afinados para vivir encima de una superficie azul.",
        swatches: [
          {
            name: "On Brand",
            value: color.onBrand,
            use: "Texto principal sobre azul.",
            alpha: true,
          },
          {
            name: "On Brand Muted",
            value: color.onBrandMuted,
            use: "Texto secundario sobre azul (lavanda).",
            alpha: true,
          },
          {
            name: "Card on Brand",
            value: color.cardOnBrand,
            use: "Tarjetas translúcidas sobre azul.",
            alpha: true,
          },
          {
            name: "Bubble on Brand",
            value: color.bubbleOnBrand,
            use: "Burbujas de actividad — los solapes aclaran.",
            alpha: true,
          },
        ],
      },
      {
        title: "Mapa",
        note: "La paleta con la que está pintado el mapa de inicio.",
        swatches: [
          { name: "Land", value: color.mapLand, use: "Tierra base." },
          {
            name: "Water",
            value: color.mapWater,
            use: "Ríos, mar, masas de agua.",
          },
          {
            name: "Park",
            value: color.mapPark,
            use: "Parques y zonas verdes.",
          },
          {
            name: "Road",
            value: color.mapRoad,
            use: "Líneas de carretera (blanco).",
            outline: true,
          },
        ],
      },
    ],
    onIndigoTag: "sobre azul",
  },

  /* ── Tipografía ────────────────────────────────────────────────────────── */
  tipografia: {
    eyebrow: "03 — Fundamentos",
    title: "Tipografía",
    lede: "Una sola familia: PP Neue Montreal. Una neo grotesca que hace de titular gigante y de etiqueta diminuta sin perder carácter.",
    pangram: "Jovencito emponzoñado de whisky, ¡qué figurota exhibe!",
    weights: [
      { w: 400, name: "Regular" },
      { w: 450, name: "Book" },
      { w: 500, name: "Medium" },
      { w: 600, name: "SemiBold" },
    ],
    // La muestra que se ve a cada tamaño de la escala.
    sample: "Aparece por aquí",
    // key = nombre del token en tokens.ts. label y use son editables.
    scale: [
      { key: "display" as const, label: "Display", use: "Títulos de pantalla" },
      { key: "h1" as const, label: "H1", use: "Encabezado principal" },
      { key: "h2" as const, label: "H2", use: "Encabezado secundario" },
      {
        key: "bodyLg" as const,
        label: "Body L",
        use: "Texto tipo iOS / estado",
      },
      { key: "body" as const, label: "Body", use: "Títulos de tarjeta" },
      {
        key: "caption" as const,
        label: "Caption",
        use: "Meta: hora · distancia",
      },
      { key: "micro" as const, label: "Micro", use: "Detalles pequeños" },
      { key: "nano" as const, label: "Nano", use: "Etiquetas diminutas" },
    ] satisfies Array<{ key: keyof typeof text; label: string; use: string }>,
  },

  /* ── Squircles ─────────────────────────────────────────────────────────── */
  squircles: {
    eyebrow: "04 — Fundamentos",
    title: "Squircles",
    lede: "No son rectángulos redondeados. Cada superficie se recorta con una superelipse generada como un path exacto. El suavizado va de 0 a 1",
    controls: { radius: "Radio", smoothing: "Suavizado" },
    feelerNote:
      "Un squircle necesita un tramo recto para que el suavizado se note. Si el radio llega a la mitad del lado corto, colapsa en pastilla o círculo y el suavizado deja de verse.",
    rolesTitle: "21 papeles",
    rolesNote:
      "Cada botón y superficie referencia un papel, nunca un radio suelto.",
  },

  /* ── Movimiento ────────────────────────────────────────────────────────── */
  movimiento: {
    eyebrow: "05 — Fundamentos",
    title: "Movimiento",
    lede: "Un tipo de motion base para todo el prototipo. Los cambios individuales solo la aceleran o le suben el rebote. Toca cada botón para verlo moverse.",
    sigLabel: "Firma",
    sigNote:
      "Rápido al comprometerse, un pequeño exceso, y se asienta. Snappy pero no rígido; con resorte pero no lento.",
    // title + hint de cada azulejo (los números de vel/rebote salen del registro).
    tiles: {
      press: { title: "Press", hint: "Squish al tocar; vuelve con resorte." },
      snap: { title: "Snap", hint: "Encaja en su sitio: ticks, sueltas." },
      morph: { title: "Morph", hint: "Superficies que se remodelan." },
      entrance: { title: "Entrance", hint: "Cosas que aparecen y se van." },
      pop: { title: "Pop", hint: "Golpe alegre al tocar una burbuja." },
      ambient: { title: "Ambient", hint: "Destello inactivo cada {n}s." }, // {n} = segundos
      float: { title: "Float", hint: "Flotación suave; nunca da resorte." },
      inform: {
        title: "Inform",
        hint: "Progreso: ease-out calmo, sin exceso.",
      },
    },
  },

  /* ── Componentes ───────────────────────────────────────────────────────── */
  componentes: {
    eyebrow: "06 — Biblioteca",
    title: "Componentes",
    lede: "Los componentes presentes a lo largo de LocalPal.",
    groups: {
      botones: {
        title: "Botones",
        note: "Todo toque tiene squish (papel press).",
      },
      superficies: {
        title: "Superficies",
        note: "Tarjetas, pines y placas — cada una su papel.",
      },
      chips: {
        title: "Chips y campos",
        note: "Selección y entrada, sobre azul.",
      },
      iconos: {
        title: "Íconos",
        note: "Vectores propios, nítidos a cualquier tamaño.",
      },
    },
    // title + hint de cada tarjeta. Los `sample*` son el texto de ejemplo dentro.
    cards: {
      search: {
        title: "Botón de búsqueda",
        hint: "Pastilla · papel button.",
        sample: "Buscar",
      },
      cta: {
        title: "CTA",
        hint: "Acción grande blanca · papel cta.",
        sample: "Crear plan",
      },
      control: {
        title: "Control redondo",
        hint: "Botón de mapa · papel control.",
      },
      mini: {
        title: "Mini botón",
        hint: "Cerrar / utilidad 24px · papel miniButton.",
      },
      venuePin: { title: "Pin de local", hint: "Azulejo azul · papel pin." },
      peerPin: {
        title: "Pin de contacto",
        hint: "Foto + insignia · sombra flotante.",
      },
      planCard: {
        title: "Tarjeta de plan",
        hint: "Plan enfocado · papel planCard.",
        sampleTitle: "Cañas en Malasaña",
        sampleMeta: "Jue · 20:00 · 4 van",
      },
      badge: {
        title: "Placa de hora",
        hint: "Día / hora blanco · papel badge.",
        sampleTop: "JUE",
        sampleBottom: "20:00",
      },
      stat: {
        title: "Tarjeta de stat",
        hint: "Perfil · papel statCard.",
        sampleNum: "128",
        sampleLabel: "Amigos",
      },
      chips: { title: "Chips de filtro", hint: "Categorías · papel chip." },
      field: {
        title: "Campo de búsqueda",
        hint: "Entrada · papel field.",
        placeholder: "Busca planes, sitios…",
      },
      glyphs: {
        title: "Glifos de actividad",
        hint: "Bebidas, música, deporte, comida, café.",
      },
      lupa: { title: "Lupa", hint: "Reflejo que orbita en reposo." },
      utils: {
        title: "Utilidades",
        hint: "Cerrar, check, guardar, compartir, persona.",
      },
    },
  },

  /* ── Sello ─────────────────────────────────────────────────────────────── */
  sello: {
    eyebrow: "07 — Distintivos",
    title: "El cariñín",
    lede: "Detalles que no salen en ninguna checklist pero que hacen que la app sea más divertida de usar y ver.",
    tags: { live: "en vivo", concept: "concepto" },
    cards: {
      float: {
        title: "Sombra flotante",
        body: "Una pieza seleccionada se despega del mapa: sombra ambiental alrededor y una sombra de contacto que es su propia silueta, aplastada contra el suelo.",
      },
      glyph: {
        title: "Lupa que orbita",
        body: "El reflejo de la lente es su propio trazo. En reposo da una vuelta completa sobre el resorte «ambient» — se pasa de 360° y vuelve. El gesto de «viva, esperando».",
      },
      edgeZoom: {
        title: "Zoom por el borde",
        body: 'Si deslizas el dedo por el borde, aparece este "blob" que te deja hacer zoom en el mapa',
      },
      cluster: {
        title: "Agrypaciones de actividades",
        body: "Cuando los pines chocan se apilan en un abanico ligeramente inclinado, los que sobran caen a puntos. Tocar el grupo lo separa y acerca la cámara.",
      },
      morph: {
        title: "Superficies que se transforman",
        body: "La barra inferior no abre ventanas: se remodela. Pastilla ⇄ hoja de burbujas ⇄ texto ⇄ local, con un zoom jerárquico al cambiar de capa.",
      },
    },
  },

  /* ── Pie ───────────────────────────────────────────────────────────────── */
  footer: {
    kicker: "LocalPal · Sistema de diseño",
    line: "Hecho con el mismo sistema que enseña. Cada squircle de esta página es una superelipse real; cada entrada montó el resorte de firma.",
    cta: "Prueba el prototipo",
    fine: "Principios · Color · Tipografía · Squircles · Movimiento · Componentes · Sello",
  },
} as const;
