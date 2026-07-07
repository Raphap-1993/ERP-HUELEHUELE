import {
  gamePrototypeBenefitIcons,
  gamePrototypeProductArt,
  gamePrototypeUiIcons,
} from "./storefront-v2-game-art";

export type GamePrototypeNavItem = {
  label: string;
  href: string;
};

export type GamePrototypePowerUp = {
  title: string;
  body: string;
  icon: string;
  stat: string;
};

export type GamePrototypeZone = {
  label: string;
  detail: string;
  icon: string;
};

export type GamePrototypeProduct = {
  slug: string;
  name: string;
  price: string;
  coinPrice: string;
  compareAtPrice?: string;
  meta: string;
  rarity: string;
  level: string;
  stock: string;
  image: string;
  accent: string;
  description: string;
  flavorText: string;
  sellerLine: string;
  benefits: string[];
  stats: { label: string; value: string }[];
  loadout: string[];
};

export type GamePrototypeQuest = {
  title: string;
  body: string;
  author: string;
  icon: string;
};

export type GamePrototypeGuildRank = {
  title: string;
  description: string;
  badge: string;
  icon: string;
};

export type GamePrototypeCommandModule = {
  title: string;
  status: string;
  detail: string;
  tone: "green" | "gold" | "pink" | "blue";
};

export const gamePrototypeNav: GamePrototypeNavItem[] = [
  { label: "HOME", href: "/storefront-v2-game" },
  { label: "SHOP", href: "/storefront-v2-game/catalogo" },
  { label: "QUEST LOG", href: "/storefront-v2-game#quest-log" },
  { label: "ABOUT", href: "/storefront-v2-game/mayoristas" },
  { label: "CART (0)", href: "/storefront-v2-game/checkout" },
];

export const gamePrototypePowerUps: GamePrototypePowerUp[] = [
  {
    title: "Altitud herbal",
    body: "Más aire para altura, tráfico y esas rutas que te apagan antes del mediodía.",
    icon: gamePrototypeBenefitIcons.freshness,
    stat: "+12 frescura",
  },
  {
    title: "Memoria clara",
    body: "Reset fresco para oficina, estudio y jornadas largas sin ruido artificial.",
    icon: gamePrototypeBenefitIcons.focus,
    stat: "+9 foco",
  },
  {
    title: "Energía herbal",
    body: "Golpe corto y claro, sin la pesadez de una bebida sintética.",
    icon: gamePrototypeBenefitIcons.energy,
    stat: "+7 energía",
  },
  {
    title: "Descongestión natural",
    body: "Respirar mejor sin que la experiencia se sienta clínica o fría.",
    icon: gamePrototypeBenefitIcons.breath,
    stat: "+11 calma",
  },
  {
    title: "Misión diaria",
    body: "Formato de bolsillo para mochila, auto o escritorio de guerra.",
    icon: gamePrototypeBenefitIcons.carry,
    stat: "+5 carga",
  },
  {
    title: "Seguro y portable",
    body: "Se siente coleccionable, usable y listo para recompra o regalo.",
    icon: gamePrototypeBenefitIcons.trust,
    stat: "+8 confianza",
  },
];

export const gamePrototypeZones: GamePrototypeZone[] = [
  {
    label: "Nivel 1: Descubrimiento",
    detail: "Primer contacto fresco",
    icon: gamePrototypeUiIcons.bloom,
  },
  {
    label: "Nivel 2: Puzzle de aroma",
    detail: "Elegir perfil y ruta",
    icon: gamePrototypeUiIcons.puzzle,
  },
  {
    label: "Nivel 3: Recompensa final",
    detail: "Compra, regalo o gremio",
    icon: gamePrototypeUiIcons.reward,
  },
];

export const gamePrototypeProducts: GamePrototypeProduct[] = [
  {
    slug: "clasico-verde",
    name: "Huele Huele Verde",
    price: "S/ 40",
    coinPrice: "50 monedas",
    meta: "Reset diario",
    rarity: "Héroe común",
    level: "Lv. 01",
    stock: "18 unidades",
    image: gamePrototypeProductArt["clasico-verde"],
    accent: "from-[#d7f0c7] to-[#9ed965]",
    description:
      "Entrada limpia a la marca: herbal, clara y fácil de recomendar en primera compra.",
    flavorText:
      "Pensado para tráfico, oficina, estudio y viajes con poco margen de error.",
    sellerLine: "Herbal, claro y amable para onboarding de marca.",
    benefits: ["Frescura herbal", "Uso diario", "Bolsillo listo"],
    stats: [
      { label: "Aire", value: "+12" },
      { label: "Foco", value: "+9" },
      { label: "Calma", value: "+11" },
    ],
    loadout: ["Auto", "Mochila", "Escritorio"],
  },
  {
    slug: "combo-duo-perfecto",
    name: "Combo Dúo Perfecto",
    price: "S/ 80",
    coinPrice: "90 monedas",
    compareAtPrice: "S/ 90",
    meta: "Pack doble",
    rarity: "Bundle dúo",
    level: "Lv. 02",
    stock: "9 combos",
    image: gamePrototypeProductArt["combo-duo-perfecto"],
    accent: "from-[#fae8b8] to-[#f4ba60]",
    description:
      "Pack de dos piezas para regalo, recompra rápida o mezcla de Verde + Negro en una misma misión.",
    flavorText:
      "El pack doble para cuando quieres resolver una compra sin explicar demasiado.",
    sellerLine: "Regalo fácil y ticket más alto sin fricción extra.",
    benefits: ["Ahorro visible", "Regalo", "Doble espacio"],
    stats: [
      { label: "Valor", value: "+18" },
      { label: "Flexibilidad", value: "+14" },
      { label: "Botín", value: "+16" },
    ],
    loadout: ["Regalo", "Viaje", "Compra dupla"],
  },
  {
    slug: "premium-negro",
    name: "Premium Negro",
    price: "S/ 40",
    coinPrice: "90 monedas",
    meta: "Modo noche",
    rarity: "Ítem raro",
    level: "Lv. 03",
    stock: "11 unidades",
    image: gamePrototypeProductArt["premium-negro"],
    accent: "from-[#d7d7d7] to-[#8d8d8d]",
    description:
      "Versión más intensa y nocturna, pensada para gym, carretera y una presencia más sobria.",
    flavorText:
      "Se siente como pieza rara: discreta, más densa y con empaque más premium.",
    sellerLine: "El raro sobrio para gym, noche y rutas largas.",
    benefits: ["Modo noche", "Ruta gym", "Drop raro"],
    stats: [
      { label: "Impulso", value: "+13" },
      { label: "Presencia", value: "+15" },
      { label: "Altura", value: "+10" },
    ],
    loadout: ["Noche", "Ruta larga", "Gym"],
  },
];

export const gamePrototypeQuests: GamePrototypeQuest[] = [
  {
    title: "Misión verde real",
    body: "Para oficina y viajes cortos siento el golpe de aire apenas lo uso. No se siente clínico, se siente fresco.",
    author: "Vero, Lima",
    icon: gamePrototypeUiIcons.bloom,
  },
  {
    title: "Misión nocturna desbloqueada",
    body: "Premium Negro me funcionó mejor para gym y carretera. El empaque se siente como pieza rara, no como un producto cualquiera.",
    author: "Marco, Cusco",
    icon: gamePrototypeUiIcons.reward,
  },
];

export const gamePrototypeGuildRanks: GamePrototypeGuildRank[] = [
  {
    title: "Explorador de ruta",
    description:
      "Ruta rápida para vendedores que necesitan materiales simples, catálogo claro y stock visible.",
    badge: "Lv. 01",
    icon: gamePrototypeUiIcons.bloom,
  },
  {
    title: "Distribuidor del gremio",
    description:
      "Mayoristas con acceso a combos, cotización por volumen y lanzamientos por campaña.",
    badge: "Lv. 02",
    icon: gamePrototypeUiIcons.puzzle,
  },
  {
    title: "Socio de mando",
    description:
      "Aliados de mayor escala con activaciones, abastecimiento y storytelling de marca compartido.",
    badge: "Lv. 03",
    icon: gamePrototypeUiIcons.reward,
  },
];

export const gamePrototypeCommandModules: GamePrototypeCommandModule[] = [
  {
    title: "Lead Queue",
    status: "14 quests",
    detail: "Orders and requests ready for routing, approvals, or packing.",
    tone: "green",
  },
  {
    title: "Stock Pulse",
    status: "3 alerts",
    detail: "Verde high, Combo medium, and Negro pushing the night route.",
    tone: "gold",
  },
  {
    title: "Realm Map",
    status: "6 zones",
    detail: "Coverage active across Lima, North, South, and field activations.",
    tone: "blue",
  },
  {
    title: "System Alerts",
    status: "2 urgent",
    detail: "Combo needs stock backup and one guild mission needs quick approval.",
    tone: "pink",
  },
];

export const gamePrototypeInventoryCategories = [
  {
    label: "Catálogo",
    icon: gamePrototypeUiIcons.bloom,
    detail: "3 aromas activos",
  },
  {
    label: "Beneficios",
    icon: gamePrototypeBenefitIcons.focus,
    detail: "Frescura + foco + calma",
  },
  {
    label: "Rutas",
    icon: gamePrototypeUiIcons.reward,
    detail: "Diario / regalo / noche",
  },
] as const;

export const gamePrototypeCommunityStats = [
  { label: "Comunidad", value: "5,000+" },
  { label: "Rangos", value: "3" },
  { label: "Historias", value: "24" },
] as const;

export const gamePrototypeSystemAlerts = [
  "Dungeon Reports",
  "Server Data Updated",
  "New Bug Detected!",
  "Minor Slime Encounter",
] as const;

export const gamePrototypeCheckoutSteps = [
  { title: "Bolsa", detail: "Confirma tus aromas y cantidades." },
  { title: "Datos", detail: "Nombre, contacto y ruta." },
  { title: "Entrega", detail: "Distrito, referencia y ventana." },
  { title: "Cierre", detail: "Confirmación final y recompensa." },
] as const;

export function getGamePrototypeProduct(slug: string) {
  return gamePrototypeProducts.find((product) => product.slug === slug);
}
