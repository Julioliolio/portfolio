/**
 * Mock venue data for the venue-detail sheet (Figma 1277:3310). One entry per
 * venue pin on the map, so tapping different pins opens different content.
 * Purely a visual prototype: photos are tinted placeholder tiles (see
 * VenueSheet) and events go nowhere yet.
 */
import { figmaIcons } from '../components/icons/figmaIcons';

export type VenueId =
  | 'ritas'
  | 'molienda'
  | 'deldiego'
  | 'toma'
  | 'uadibloc'
  | 'costello'
  | 'wurlitzer'
  // — cushion venues, scattered across Madrid's neighbourhoods —
  | 'salmonguru'
  | 'angelita'
  | 'ojala'
  | 'federal'
  | 'lacomba'
  | 'caracol'
  | 'riviera'
  | 'fabrica'
  | 'comercial'
  | 'bendito'
  | 'junco'
  | 'sanfernando'
  | 'macera'
  | 'salaequis'
  | 'florida'
  | 'framboise'
  | 'matadero'
  | 'reinasofia';

export type VenueEvent = {
  id: string;
  /** Short day tag on the white time badge ("TODAY", "FRI"…). */
  day: string;
  time: string;
  title: string;
  meta: string;
  /** Activity-card fields (Figma 1300:3843). */
  description: string;
  /** Ticket price shown next to the CTA ("$8", "Free"). */
  price: string;
  /** Peer plans linked to this event (the "Going together" menu). */
  peerPlanIds: string[];
};

/** "TODAY - 20:30" badge day → the long form the activity card shows. */
export const dayLabel = (day: string) =>
  ({
    TODAY: 'Today',
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday',
  })[day] ?? day;

export type Venue = {
  id: VenueId;
  name: string;
  address: string;
  /** figmaIcons glyph — same one the map pin shows. */
  icon: string;
  category: string;
  hours: string;
  description: string;
  events: VenueEvent[];
};

export const VENUES: Record<VenueId, Venue> = {
  ritas: {
    id: 'ritas',
    name: 'Rita’s',
    address: 'C. de Barceló, 11 2894, Madrid',
    icon: figmaIcons.music,
    category: 'Cocktail Bar - Live Music',
    hours: 'Open till 2:00',
    description:
      'Tiny basement bar in Madrid, good drinks, vermut on a tap, good food and live bands every few days.',
    events: [
      {
        id: 'r1', day: 'TODAY', time: '20:30', title: 'Live music night at the basement', meta: '62 people going - $8', price: '$8',
        description:
          'Afterwork, nothing serius. There will be a live band playing until 1:00 AM and we’ve got plenty of drinks and food to go around. The ticket comes with one free drink, be there or be square :)',
        peerPlanIds: ['p-cardumen', 'p-predrinks', 'p-rooftop', 'p-evarun'],
      },
      {
        id: 'r2', day: 'FRI', time: '22:00', title: 'Vinyl session: funk & soul', meta: '31 people going - $0', price: '$0',
        description:
          'All-vinyl set from the house collection — funk, soul and the occasional disco detour. Bring a record and we might spin it.',
        peerPlanIds: ['p-crate', 'p-vinyldinner'],
      },
      {
        id: 'r3', day: 'SAT', time: '21:00', title: 'Open mic + vermut hour', meta: '18 people going - $5', price: '$5',
        description:
          'Five-minute slots, any instrument, any level. Vermut on tap at happy-hour prices while the sign-up sheet goes around.',
        peerPlanIds: ['p-openmic'],
      },
      {
        id: 'r4', day: 'SUN', time: '13:00', title: 'Sunday vermut & tapas', meta: '24 people going - $0', price: '$0',
        description:
          'The classic Madrid Sunday: vermut on tap, rotating tapas from the kitchen and no rush whatsoever. Entry is free, tapas are not.',
        peerPlanIds: ['p-rastro', 'p-picnicafter'],
      },
      {
        id: 'r5', day: 'TUE', time: '20:00', title: 'Blues jam with the house band', meta: '27 people going - $6', price: '$6',
        description:
          'The house band lays the groove and anyone can sit in — bring your instrument or just your ears. Jam etiquette applies.',
        peerPlanIds: ['p-bluesbeers'],
      },
      {
        id: 'r6', day: 'WED', time: '19:30', title: 'Natural wine tasting night', meta: '15 people going - $12', price: '$12',
        description:
          'Six natural wines from small Spanish producers, guided by whoever imported them. Snacks welcome, opinions mandatory.',
        peerPlanIds: ['p-cheeserun'],
      },
      {
        id: 'r7', day: 'THU', time: '22:30', title: 'Late set: surprise guest act', meta: '48 people going - $10', price: '$10',
        description:
          'We book someone good and don’t tell you who. Doors at 22:00, set at 22:30, no spoilers — that’s the whole point.',
        peerPlanIds: ['p-lateset'],
      },
    ],
  },
  molienda: {
    id: 'molienda',
    name: 'La Molienda',
    address: 'C. del Pez, 27, Madrid',
    icon: figmaIcons.coffee,
    category: 'Café - Brunch',
    hours: 'Open till 17:00',
    description:
      'Cozy specialty-coffee spot with homemade brunch, sourdough toasts and a quiet corner to work in the mornings.',
    events: [
      {
        id: 'm1', day: 'TODAY', time: '10:00', title: 'Latte art workshop', meta: '12 people going - $10', price: '$10',
        description:
          'Hands-on session at the steam wand: hearts first, rosettas if you behave. Includes all the practice milk you can pour.',
        peerPlanIds: ['p-latteclub'],
      },
      {
        id: 'm2', day: 'SAT', time: '11:30', title: 'Brunch club meetup', meta: '35 people going - $15', price: '$15',
        description:
          'The monthly long-table brunch: fixed menu, bottomless filter coffee and a table of people you haven’t met yet.',
        peerPlanIds: ['p-brunchwalk', 'p-brunchtable'],
      },
      {
        id: 'm3', day: 'SUN', time: '09:00', title: 'Morning run + coffee', meta: '9 people going - $0', price: '$0',
        description:
          'Easy 5k along Madrid Río, all paces welcome, then back here for coffee. The run is optional, the coffee is not.',
        peerPlanIds: ['p-runcoffee'],
      },
    ],
  },
  deldiego: {
    id: 'deldiego',
    name: 'Del Diego',
    address: 'C. de la Reina, 12, Madrid',
    icon: figmaIcons.cocktail,
    category: 'Cocktail Bar - Classics',
    hours: 'Open till 2:30',
    description:
      'Old-school Madrid cocktail institution — white jackets, perfect martinis and zero pretension since 1992.',
    events: [
      {
        id: 'd1', day: 'TODAY', time: '19:00', title: 'Classic martini masterclass', meta: '14 people going - $20', price: '$20',
        description:
          'The head bartender walks you through the house martini — history, ratios and the stir. You drink your homework.',
        peerPlanIds: ['p-martini'],
      },
      {
        id: 'd2', day: 'THU', time: '21:00', title: 'Jazz trio on the corner stage', meta: '40 people going - $6', price: '$6',
        description:
          'Upright bass, brushes and standards in the corner while the room keeps its conversation volume. Very Del Diego.',
        peerPlanIds: ['p-jazzdinner', 'p-jazzafter'],
      },
      {
        id: 'd3', day: 'FRI', time: '23:00', title: 'After-hours: guest bartender', meta: '51 people going - $0', price: '$0',
        description:
          'A guest bartender takes over the well after closing time with a one-night-only menu. No cover, drinks as priced.',
        peerPlanIds: ['p-afterhours'],
      },
    ],
  },
  toma: {
    id: 'toma',
    name: 'Toma Café',
    address: 'C. de la Palma, 49, Madrid',
    icon: figmaIcons.coffee,
    category: 'Specialty Coffee - Roastery',
    hours: 'Open till 18:00',
    description:
      'The café that started Madrid’s specialty coffee scene back in 2012 — single-origin filter, a small roastery in the back and avocado toast for the regulars.',
    events: [
      {
        id: 't1', day: 'TODAY', time: '10:30', title: 'Cupping session: single origins', meta: '10 people going - $6', price: '$6',
        description:
          'Three origins, side by side, no rush. The roaster talks through what makes each one taste the way it does — bring your palate and questions.',
        peerPlanIds: ['p-cupwarmup'],
      },
      {
        id: 't2', day: 'SUN', time: '11:00', title: 'Sunday brew bar: guest roaster', meta: '16 people going - $0', price: '$0',
        description:
          'A different roaster takes over the brew bar every month, pouring their beans on rotation all morning. Free tastings, no sign-up.',
        peerPlanIds: ['p-brewbarcrew'],
      },
      {
        id: 't3', day: 'WED', time: '09:00', title: 'Coffee & sketch morning', meta: '7 people going - $0', price: '$0',
        description:
          'Bring a notebook, take a corner table, draw whatever’s in front of you. Quiet, unstructured, refills included.',
        peerPlanIds: ['p-sketchclub'],
      },
    ],
  },
  uadibloc: {
    id: 'uadibloc',
    name: 'UADIBLOC',
    address: 'Av. de la Albufera, 150, Vallecas, Madrid',
    icon: figmaIcons.bouldering,
    category: 'Climbing Gym - Bouldering',
    hours: 'Open till 23:00',
    description:
      'Vallecas’ bouldering gym — colour-coded problems on every wall, a solid training area and a crowd that resets routes often enough to keep it interesting.',
    // No hosted activities — drop-in climbing only. Shows on the map with no
    // activity ring, and its sheet skips the "What's on" section.
    events: [],
  },
  costello: {
    id: 'costello',
    name: 'Costello Club',
    address: 'C. de la Princesa, 60, Argüelles, Madrid',
    icon: figmaIcons.music,
    category: 'Live Music - Cocktail Bar',
    hours: 'Open till 3:00',
    description:
      'Small basement club up in Argüelles — velvet booths, a tight stage and a booking policy that leans indie, jazz and whatever the promoter’s excited about that week.',
    events: [
      {
        id: 'c1', day: 'WED', time: '21:00', title: 'Acoustic Wednesdays', meta: '19 people going - $0', price: '$0',
        description:
          'Stripped-down sets, no drum kit allowed. A rotating lineup of singer-songwriters plays to a room that actually listens.',
        peerPlanIds: ['p-acousticdrinks'],
      },
      {
        id: 'c2', day: 'SAT', time: '22:00', title: 'Local bands showcase', meta: '33 people going - $7', price: '$7',
        description:
          'Four local acts, twenty minutes each, one ticket. The lineup changes monthly and it’s where half the city’s bookers scout.',
        peerPlanIds: ['p-showcasepre'],
      },
    ],
  },
  wurlitzer: {
    id: 'wurlitzer',
    name: 'Wurlitzer Ballroom',
    address: 'C. de Alcalá, 480, San Blas, Madrid',
    icon: figmaIcons.music,
    category: 'Live Music - Rock & Punk',
    hours: 'Open till 3:30',
    description:
      'Industrial-feel room out in San Blas built for loud guitars — rock, punk and power-pop most nights, with a bar that pours fast between sets.',
    events: [
      {
        id: 'w1', day: 'FRI', time: '23:00', title: 'Punk & power-pop night', meta: '45 people going - $10', price: '$10',
        description:
          'Three bands, no ballads. Earplugs at the bar if you ask nicely, mosh etiquette enforced by the regulars.',
        peerPlanIds: ['p-punkpregame'],
      },
      {
        id: 'w2', day: 'SUN', time: '20:00', title: 'Alt-folk Sunday sessions', meta: '17 people going - $5', price: '$5',
        description:
          'A calmer end to the weekend — alt-folk and country acts on the same stage that’s screaming by Friday. Sit down, it’s allowed tonight.',
        peerPlanIds: ['p-folkwinddown'],
      },
    ],
  },

  // ——————————————————————————————————————————————————————————————
  // Cushion venues — a wider spread of Madrid so the map feels lived-in.
  // Same shape as the seven above; each event links one peer plan so the
  // "Going together" menu is never empty (a few venues are drop-in, events: []).
  // ——————————————————————————————————————————————————————————————
  salmonguru: {
    id: 'salmonguru',
    name: 'Salmon Guru',
    address: 'C. de Echegaray, 21, Madrid',
    icon: figmaIcons.cocktail,
    category: 'Cocktail Bar - Award-winning',
    hours: 'Open till 2:30',
    description:
      'Loud, comic-book-bright cocktail bar in the Barrio de las Letras that keeps turning up on the world’s-best lists — theatrical drinks, no attitude.',
    events: [
      {
        id: 'sg1', day: 'FRI', time: '21:00', title: 'Guest shift: classics reimagined', meta: '38 people going - $0', price: '$0',
        description:
          'A rotating guest bartender takes over the back station for one night, riffing on the classics. No cover, drinks as priced, get there early for a stool.',
        peerPlanIds: ['p-sg-pre'],
      },
    ],
  },
  angelita: {
    id: 'angelita',
    name: 'Angelita Madrid',
    address: 'C. de Jorge Juan, 20, Salamanca, Madrid',
    icon: figmaIcons.cocktail,
    category: 'Wine Bar - Cocktails',
    hours: 'Open till 1:30',
    description:
      'Ground-floor wine bar, downstairs cocktail den — a serious Spanish list up top and low-lit drinks below, a two-in-one in the heart of Salamanca.',
    events: [
      {
        id: 'an1', day: 'WED', time: '19:30', title: 'Spanish natural wine flight', meta: '16 people going - $14', price: '$14',
        description:
          'Six pours from small Iberian producers walking north to south, guided by the sommelier. Bread and cheese to keep you upright.',
        peerPlanIds: ['p-an-cheese'],
      },
    ],
  },
  ojala: {
    id: 'ojala',
    name: 'Ojalá',
    address: 'C. de Bravo Murillo, 180, Tetuán, Madrid',
    icon: figmaIcons.coffee,
    category: 'Café - Beach Basement',
    hours: 'Open till 1:00',
    description:
      'Tetuán all-dayer with a sand-floored basement — brunch and laptops upstairs, cocktails and bare feet down below. No hosted events, just walk in.',
    // Drop-in only — shows on the map with no activity ring.
    events: [],
  },
  federal: {
    id: 'federal',
    name: 'Federal Café',
    address: 'C. de Alberto Alcocer, 40, Chamartín, Madrid',
    icon: figmaIcons.coffee,
    category: 'Café - All-day Brunch',
    hours: 'Open till 17:30',
    description:
      'Australian-style café up in Chamartín — flat whites, big brunch plates and a terrace that fills the second the sun hits.',
    events: [
      {
        id: 'fe1', day: 'SAT', time: '11:00', title: 'Weekend long-table brunch', meta: '29 people going - $0', price: '$0',
        description:
          'We hold the big terrace table on Saturday mornings and order half the menu to share. Turn up hungry, leave with new contacts.',
        peerPlanIds: ['p-fe-table'],
      },
    ],
  },
  lacomba: {
    id: 'lacomba',
    name: 'Taberna La Concha',
    address: 'C. de la Cava Baja, 7, Madrid',
    icon: figmaIcons.utensils,
    category: 'Tapas - Vermut',
    hours: 'Open till 1:30',
    description:
      'Tiled old-Madrid taberna on the Cava Baja tapas run — vermut on tap, croquetas that vanish and standing room only by nine.',
    events: [
      {
        id: 'lc1', day: 'SUN', time: '13:00', title: 'Sunday tapeo crawl kick-off', meta: '22 people going - $0', price: '$0',
        description:
          'First stop of the La Latina Sunday crawl. One vermut, one tapa, then we move on down the street. Entry free, tapas are not.',
        peerPlanIds: ['p-lc-crawl'],
      },
    ],
  },
  caracol: {
    id: 'caracol',
    name: 'Sala Caracol',
    address: 'C. de Marcelo Usera, 20, Usera, Madrid',
    icon: figmaIcons.music,
    category: 'Live Music - Concert Hall',
    hours: 'Open till 3:00',
    description:
      'Mid-size Usera music hall with a proper sound rig — indie, rock and the odd tribute night, a step up from the basement bars.',
    events: [
      {
        id: 'ca1', day: 'THU', time: '21:30', title: 'Indie showcase: three bands', meta: '54 people going - $12', price: '$12',
        description:
          'Three touring indie acts, one ticket, doors at 21:00. The kind of lineup that’s twice the price by the time they come back.',
        peerPlanIds: ['p-ca-pre'],
      },
    ],
  },
  riviera: {
    id: 'riviera',
    name: 'La Riviera',
    address: 'Paseo Bajo de la Virgen del Puerto, s/n, Madrid',
    icon: figmaIcons.music,
    category: 'Live Music - Club',
    hours: 'Open till 6:00',
    description:
      'Riverside institution by Madrid Río — gigs early, club night late, and a garden out back for when the room gets too warm.',
    events: [
      {
        id: 'ri1', day: 'SAT', time: '23:30', title: 'Late club night: house & disco', meta: '120 people going - $15', price: '$15',
        description:
          'Resident DJs downstairs until it’s uncomfortably late. Ticket includes cloakroom, not your dignity. Go big or go home early.',
        peerPlanIds: ['p-ri-pregame'],
      },
    ],
  },
  fabrica: {
    id: 'fabrica',
    name: 'La Fábrica Boulder',
    address: 'C. del General Ricardos, 200, Carabanchel, Madrid',
    icon: figmaIcons.bouldering,
    category: 'Climbing Gym - Bouldering',
    hours: 'Open till 23:00',
    description:
      'Carabanchel bouldering gym in a converted workshop — steep cave, slab wall and a café upstairs. Drop in any time, no booking.',
    // Drop-in climbing only, like UADIBLOC — no hosted activities.
    events: [],
  },
  comercial: {
    id: 'comercial',
    name: 'Café Comercial',
    address: 'Glorieta de Bilbao, 7, Madrid',
    icon: figmaIcons.coffee,
    category: 'Historic Café - 1887',
    hours: 'Open till 00:30',
    description:
      'Madrid’s oldest café, marble tables and revolving doors intact, reopened and buzzing again on the Glorieta de Bilbao.',
    events: [
      {
        id: 'co1', day: 'TODAY', time: '18:00', title: 'Board games & merienda', meta: '14 people going - $0', price: '$0',
        description:
          'Coffee, churros and a stack of board games at the big marble table. Beginners welcome, the rules get explained. Order something, stay for hours.',
        peerPlanIds: ['p-co-games'],
      },
    ],
  },
  bendito: {
    id: 'bendito',
    name: 'Bendito Vinos',
    address: 'C. de Arturo Soria, 245, Hortaleza, Madrid',
    icon: figmaIcons.cocktail,
    category: 'Natural Wine Bar',
    hours: 'Open till 00:30',
    description:
      'Tiny Hortaleza wine bar stacked floor to ceiling with natural bottles — pull one off the shelf, they’ll open it, you’ll stay all night.',
    events: [
      {
        id: 'be1', day: 'TUE', time: '20:00', title: 'Orange wine tasting', meta: '12 people going - $10', price: '$10',
        description:
          'Four skin-contact wines from the shelves, poured blind, argued over loudly. Snacks provided, opinions expected.',
        peerPlanIds: ['p-be-taste'],
      },
    ],
  },
  junco: {
    id: 'junco',
    name: 'El Junco Jazz Club',
    address: 'C. de Ríos Rosas, 30, Chamberí, Madrid',
    icon: figmaIcons.music,
    category: 'Jazz Club - Late Night',
    hours: 'Open till 5:30',
    description:
      'Chamberí jazz club that turns into a soul-and-funk dancefloor after the last set — live early, sweaty late.',
    events: [
      {
        id: 'ju1', day: 'THU', time: '23:00', title: 'Late jam session', meta: '40 people going - $8', price: '$8',
        description:
          'The house trio opens, then the stage is anyone’s — bring an instrument or just a good ear. It runs till it runs out.',
        peerPlanIds: ['p-ju-dinner'],
      },
    ],
  },
  sanfernando: {
    id: 'sanfernando',
    name: 'Mercado de San Fernando',
    address: 'C. de Embajadores, 41, Madrid',
    icon: figmaIcons.utensils,
    category: 'Food Market - Craft Beer',
    hours: 'Open till 22:00',
    description:
      'Lavapiés’ un-gentrified market — craft beer, a book stall by the kilo, empanadas and a crowd from every continent under one roof.',
    // Wander-in market, no single hosted event.
    events: [],
  },
  macera: {
    id: 'macera',
    name: 'Macera TallerBar',
    address: 'C. de Bravo Murillo, 50, Chamberí, Madrid',
    icon: figmaIcons.cocktail,
    category: 'Cocktail Bar - House-macerated',
    hours: 'Open till 2:00',
    description:
      'Everything behind the bar is macerated in-house in big glass jars — the spirits are the whole point. Chamberí, tiny, worth the wait.',
    events: [
      {
        id: 'ma1', day: 'FRI', time: '20:30', title: 'Macerated gin flight', meta: '20 people going - $9', price: '$9',
        description:
          'Three house-infused gins side by side while they explain what’s in the jars. You’ll leave wanting to buy a jar.',
        peerPlanIds: ['p-ma-round'],
      },
    ],
  },
  salaequis: {
    id: 'salaequis',
    name: 'Sala Equis',
    address: 'Av. de la Osa Mayor, 40, Aravaca, Madrid',
    icon: figmaIcons.museum,
    category: 'Cinema Bar - Lounge',
    hours: 'Open till 2:30',
    description:
      'A former adult cinema turned airy drinks hall with a little screening room out the back, out west in Aravaca — deckchairs, vermut and a film most nights.',
    events: [
      {
        id: 'se1', day: 'WED', time: '20:00', title: 'Film + vermut screening', meta: '26 people going - $6', price: '$6',
        description:
          'A cult film in the back room with a vermut in hand. Doors at 19:30, seats are deckchairs, latecomers stand at the bar.',
        peerPlanIds: ['p-se-film'],
      },
    ],
  },
  florida: {
    id: 'florida',
    name: 'Florida Park',
    address: 'Paseo de Fernán Núñez, 3, Madrid',
    icon: figmaIcons.utensils,
    category: 'Garden Restaurant - Events',
    hours: 'Open till 00:00',
    description:
      'Glass-house restaurant tucked inside the Retiro gardens — long lunches under the trees and DJ brunches when the weather turns.',
    events: [
      {
        id: 'fl1', day: 'SUN', time: '12:30', title: 'Garden DJ brunch', meta: '48 people going - $0', price: '$0',
        description:
          'Bottomless coffee, a DJ on the terrace and the whole of the Retiro to walk off after. Entry free, brunch à la carte.',
        peerPlanIds: ['p-fl-walk'],
      },
    ],
  },
  framboise: {
    id: 'framboise',
    name: 'Mamá Framboise',
    address: 'C. de Arturo Soria, 130, Ciudad Lineal, Madrid',
    icon: figmaIcons.coffee,
    category: 'Patisserie - Café',
    hours: 'Open till 21:00',
    description:
      'French-trained pâtisserie up in Ciudad Lineal — croissants gone by eleven, éclairs worth the queue, coffee to sit with.',
    // Grab-and-go pastry counter, no hosted event.
    events: [],
  },
  matadero: {
    id: 'matadero',
    name: 'Matadero Madrid',
    address: 'Pl. de Legazpi, 8, Arganzuela, Madrid',
    icon: figmaIcons.museum,
    category: 'Arts Centre - Exhibitions',
    hours: 'Open till 21:00',
    description:
      'Former slaughterhouse turned sprawling arts centre by the river — galleries, design markets, a cinema and open studios across a dozen brick halls. Wander in, it’s mostly free.',
    // Drop-in arts centre — programme changes weekly, no single hosted event.
    events: [],
  },
  reinasofia: {
    id: 'reinasofia',
    name: 'Museo Reina Sofía',
    address: 'C. de Santa Isabel, 52, Madrid',
    icon: figmaIcons.museum,
    category: 'Museum - Modern Art',
    hours: 'Free eves from 19:00',
    description:
      'Spain’s national modern-art museum — Guernica, Dalí and Miró in a converted hospital by Atocha. The last two hours each evening are free, and far quieter.',
    // Walk-in museum — the free evening slot is the plan, no ticketed event here.
    events: [],
  },
};
