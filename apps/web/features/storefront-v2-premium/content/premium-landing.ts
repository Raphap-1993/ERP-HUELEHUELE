import { featuredProducts, wholesalePlans, type CatalogProduct, type FaqItem, type NavigationItem, type WholesalePlan } from "@huelegood/shared";

export interface PremiumMetric {
  label: string;
  value: string;
  detail: string;
}

export interface PremiumHeroNote {
  label: string;
  title: string;
  description: string;
  tone?: "light" | "dark";
}

export interface PremiumHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: NavigationItem;
  secondaryCta: NavigationItem;
  metrics: PremiumMetric[];
  productChips: string[];
  notes: PremiumHeroNote[];
}

export interface PremiumProductHighlight {
  slug: string;
  eyebrow: string;
  story: string;
}

export interface PremiumUseCase {
  label: string;
  title: string;
  description: string;
  image: "traffic" | "office" | "travel";
}

export interface PremiumBenefit {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "light" | "dark";
}

export interface PremiumStoryCard {
  label: string;
  title: string;
  description: string;
}

export interface PremiumReason {
  title: string;
  description: string;
}

export interface PremiumCallout {
  label: string;
  title: string;
  description: string;
  points: string[];
}

export interface PremiumCtaBanner {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: NavigationItem;
  secondaryCta: NavigationItem;
  tertiaryCta: NavigationItem;
}

export interface StorefrontV2PremiumContent {
  hero: PremiumHeroContent;
  products: CatalogProduct[];
  productHighlights: PremiumProductHighlight[];
  useCases: PremiumUseCase[];
  benefits: PremiumBenefit[];
  brandMetrics: PremiumMetric[];
  brandStoryCards: PremiumStoryCard[];
  whyChooseReasons: PremiumReason[];
  whyChooseCallout: PremiumCallout;
  wholesalePlans: WholesalePlan[];
  wholesaleCallout: PremiumCallout;
  vendorCallout: PremiumCallout & {
    primaryCta: NavigationItem;
    secondaryCta: NavigationItem;
  };
  faqs: FaqItem[];
  faqCallout: PremiumCallout;
  ctaBanner: PremiumCtaBanner;
}

export const storefrontV2PremiumContent: StorefrontV2PremiumContent = {
  hero: {
    eyebrow: "Inhalador herbal aromático",
    title: "Frescura herbal que cabe en tu ritmo diario.",
    description:
      "Huele Huele acompaña tráfico, oficina, viaje y momentos de pausa con una sensación fresca, portable y fácil de llevar a cualquier parte.",
    primaryCta: {
      label: "Ver catálogo",
      href: "/catalogo"
    },
    secondaryCta: {
      label: "Comprar ahora",
      href: "/checkout?producto=clasico-verde"
    },
    metrics: [
      {
        label: "Favoritos",
        value: "3 formatos",
        detail: "La selección principal se entiende rápido y sin saturación."
      },
      {
        label: "Uso diario",
        value: "Portable",
        detail: "Cabe en bolso, carro, escritorio o equipaje sin complicaciones."
      },
      {
        label: "Compra",
        value: "Directa",
        detail: "Exploras, eliges y compras desde la misma experiencia pública."
      }
    ],
    productChips: ["Clásico Verde", "Premium Negro", "Combo Dúo Perfecto"],
    notes: [
      {
        label: "No es vape",
        title: "Es una alternativa herbal fresca y portable.",
        description: "La marca se entiende mejor cuando el producto se ve dentro de una rutina real y sobria."
      },
      {
        label: "Uso real",
        title: "Pensado para pausa breve, movimiento y trayectos largos.",
        description: "Cuando el día no se detiene, el formato sigue siendo fácil de llevar y fácil de usar.",
        tone: "dark"
      }
    ]
  },
  products: featuredProducts,
  productHighlights: [
    {
      slug: "clasico-verde",
      eyebrow: "Uso diario",
      story: "La referencia más directa para quien quiere una sensación fresca siempre a la mano."
    },
    {
      slug: "premium-negro",
      eyebrow: "Acabado sobrio",
      story: "Una versión más sobria para quienes prefieren un look discreto y limpio."
    },
    {
      slug: "combo-duo-perfecto",
      eyebrow: "Más valor",
      story: "Dos formatos listos para tener uno contigo y otro donde más lo necesitas."
    }
  ],
  useCases: [
    {
      label: "Tráfico y trayecto",
      title: "Listo para carro, bolso y movimiento constante.",
      description: "Se integra bien a trayectos largos, cambios de ritmo y días en movimiento sin pedir una rutina nueva.",
      image: "traffic"
    },
    {
      label: "Oficina y foco",
      title: "Un gesto breve que cabe en una jornada larga.",
      description: "Acompaña escritorio, reuniones y bloques de trabajo sin volverse un objeto invasivo.",
      image: "office"
    },
    {
      label: "Viaje y altura",
      title: "Ligero, limpio y fácil de llevar fuera de casa.",
      description: "En equipaje, mochila o bolso conserva una presencia limpia y una lectura simple del producto.",
      image: "travel"
    }
  ],
  benefits: [
    {
      eyebrow: "Portabilidad real",
      title: "Se guarda fácil y mantiene una presencia cuidada.",
      description: "La compra se siente más premium cuando el objeto se percibe útil, discreto y listo para acompañar el día."
    },
    {
      eyebrow: "Jerarquía curada",
      title: "Cada bloque hace una sola cosa, pero mejor.",
      description: "Hero, catálogo, escena, marca y CTA viven separados para que la lectura sea más rápida y con mejor conversión."
    },
    {
      eyebrow: "Compatibilidad operativa",
      title: "Checkout, ERP y admin quedan fuera del experimento visual.",
      description: "La nueva landing es aditiva: mejora percepción pública sin tocar contratos API ni flujos críticos.",
      tone: "dark"
    },
    {
      eyebrow: "Escala editorial",
      title: "Lista para campañas, temporadas y media remota.",
      description: "Los assets pueden migrar progresivamente a Cloudflare sin rehacer la composición premium."
    }
  ],
  brandMetrics: [
    {
      label: "Ruta comercial",
      value: "D2C + B2B",
      detail: "Compra directa, mayoristas y canal vendedor conviven sin mezclar promesas ni contratos."
    },
    {
      label: "Momentos clave",
      value: "4",
      detail: "Carro, bolso, escritorio y viaje como escenas base para explicar el producto."
    },
    {
      label: "Lenguaje",
      value: "Premium",
      detail: "Editorial natural/wellness sin caer en clichés spa, claims clínicos ni estética genérica."
    }
  ],
  brandStoryCards: [
    {
      label: "Ritmo",
      title: "La landing no intenta vender todo al mismo tiempo.",
      description: "Primero atmósfera, luego producto, después claridad comercial. Ese orden mejora comprensión y confianza."
    },
    {
      label: "Objeto",
      title: "El producto se presenta como parte de una rutina bien editada.",
      description: "La marca gana cuando el formato se ve útil y refinado, no cuando se sobreexplica con claims ambiguos."
    },
    {
      label: "Operación",
      title: "La capa premium vive encima de la base que ya funciona.",
      description: "Esto permite iterar visualmente sin afectar checkout, admin ni la operación del ERP."
    }
  ],
  whyChooseReasons: [
    {
      title: "No depende de humo ni vapor.",
      description: "La experiencia se entiende mejor cuando el producto se presenta con lenguaje claro y una categoría propia."
    },
    {
      title: "No requiere una rutina complicada.",
      description: "Se guarda fácil, se entiende rápido y entra bien en el día a día sin fricción extra."
    },
    {
      title: "Se percibe discreto y bien resuelto.",
      description: "Diseño, acabado y narrativa apuntan a una sensación premium sin convertir la marca en algo frío."
    }
  ],
  whyChooseCallout: {
    label: "Lo esencial",
    title: "Una alternativa fresca, portable y fácil de integrar a la rutina.",
    description:
      "La decisión mejora cuando queda claro qué es, cómo encaja en el día y por qué se siente más simple de llevar que otras alternativas.",
    points: [
      "Frescura herbal y portable sin lenguaje clínico.",
      "Selección corta que facilita la decisión.",
      "Diseño sobrio para carro, escritorio, bolso o viaje.",
      "Compra directa y rutas comerciales bien separadas."
    ]
  },
  wholesalePlans,
  wholesaleCallout: {
    label: "Mayoristas",
    title: "Compra por volumen y distribución con una ruta clara.",
    description:
      "Si buscas reposición, volumen o distribución, el canal mayorista mantiene una entrada separada con condiciones visibles y atención comercial.",
    points: [
      "Cotización rápida para volumen y reposición.",
      "Acompañamiento comercial y continuidad operativa.",
      "Planes escalables según volumen."
    ]
  },
  vendorCallout: {
    label: "Vendedores",
    title: "Un canal para personas que quieren representar la marca.",
    description:
      "La postulación vive en una ruta propia para mantener el foco del home en producto y dejar el onboarding comercial donde corresponde.",
    points: [
      "Código comercial para atribución y seguimiento.",
      "Proceso de revisión con screening y aprobación.",
      "Comisiones y seguimiento dentro del panel vendedor."
    ],
    primaryCta: {
      label: "Postularme",
      href: "/trabaja-con-nosotros"
    },
    secondaryCta: {
      label: "Ver mayoristas",
      href: "/mayoristas"
    }
  },
  faqs: [
    {
      question: "¿Qué es Huele Huele?",
      answer:
        "Es un formato herbal aromático portátil pensado para acompañar momentos de tráfico, oficina, viaje y cambios de ritmo con una sensación fresca y limpia."
    },
    {
      question: "¿Cuál debería elegir primero?",
      answer:
        "Clásico Verde es la opción más directa para uso diario, Premium Negro prioriza un acabado más sobrio y Combo Dúo Perfecto ofrece más valor si quieres dos formatos listos."
    },
    {
      question: "¿Cómo compro?",
      answer:
        "Puedes entrar por catálogo para comparar los formatos o ir directo al checkout desde la referencia que más te guste."
    },
    {
      question: "¿Puedo comprar por volumen o distribuir?",
      answer:
        "Sí. La landing mantiene visible la ruta mayorista para cotización y conversación comercial sin mezclarla con la compra directa."
    }
  ],
  faqCallout: {
    label: "Antes de decidir",
    title: "La duda principal casi siempre es qué elegir y cómo comprar.",
    description:
      "Este bloque resuelve las preguntas que sí afectan la conversión: formato, elección y rutas de compra.",
    points: [
      "Qué es y cómo se interpreta el formato.",
      "Cuál referencia elegir según momento o preferencia.",
      "Cómo conviven compra directa, mayoristas y vendedores."
    ]
  },
  ctaBanner: {
    eyebrow: "Cierre de compra",
    title: "Elige tu formato y entra por la ruta que mejor te convenga.",
    description:
      "Compra directa si ya sabes qué formato quieres. Ruta comercial si necesitas volumen, atención o quieres vender la marca.",
    primaryCta: {
      label: "Comprar ahora",
      href: "/catalogo"
    },
    secondaryCta: {
      label: "Canal mayorista",
      href: "/mayoristas"
    },
    tertiaryCta: {
      label: "Atención comercial",
      href: "/trabaja-con-nosotros"
    }
  }
};
