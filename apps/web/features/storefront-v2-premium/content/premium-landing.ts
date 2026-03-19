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
    eyebrow: "Storefront premium curado en código",
    title: "Huele Huele se entiende mejor cuando la marca respira como un editorial, no como una promo genérica.",
    description:
      "Una landing premium para mostrar producto, atmósfera y compra directa con claridad. La operación sigue intacta: catálogo, checkout y canal comercial continúan sobre las rutas actuales.",
    primaryCta: {
      label: "Explorar catálogo",
      href: "/catalogo"
    },
    secondaryCta: {
      label: "Comprar el favorito",
      href: "/checkout?producto=clasico-verde"
    },
    metrics: [
      {
        label: "Selección",
        value: "3 formatos",
        detail: "Catálogo corto y legible, pensado para decidir rápido sin perder percepción premium."
      },
      {
        label: "Experiencia",
        value: "Editorial",
        detail: "Más aire, mejor ritmo visual y escenas de uso concretas en lugar de saturación."
      },
      {
        label: "Compra",
        value: "Sin ruptura",
        detail: "Las salidas siguen usando `/catalogo`, `/checkout` y las rutas productivas ya operativas."
      },
      {
        label: "Media",
        value: "Cloudflare-ready",
        detail: "La capa admite assets remotos en `cdn.huelegood.com` e `images.huelegood.com`."
      }
    ],
    productChips: ["Clásico Verde", "Premium Negro", "Combo Dúo Perfecto"],
    notes: [
      {
        label: "Narrativa",
        title: "Rutina real, no promesa abstracta.",
        description: "La marca entra por escenas concretas: tráfico, escritorio, viaje y momentos de pausa breve."
      },
      {
        label: "Canal",
        title: "D2C, wholesale y vendor sin mezclar mensajes.",
        description: "La landing prioriza compra directa y deja visibles las rutas comerciales paralelas.",
        tone: "dark"
      }
    ]
  },
  products: featuredProducts,
  productHighlights: [
    {
      slug: "clasico-verde",
      eyebrow: "Uso diario",
      story: "El formato más directo para quien quiere una sensación fresca siempre cerca, sin complicar la compra."
    },
    {
      slug: "premium-negro",
      eyebrow: "Acabado sobrio",
      story: "La versión de presencia más limpia y premium para una rutina que exige discreción y mejor objeto."
    },
    {
      slug: "combo-duo-perfecto",
      eyebrow: "Más valor",
      story: "Pensado para tener un formato contigo y otro listo en carro, escritorio o viaje sin volver a empezar."
    }
  ],
  useCases: [
    {
      label: "Tráfico y trayecto",
      title: "Listo para carro, bolso y movimiento constante.",
      description: "La propuesta se vuelve creíble cuando se muestra en trayectos largos, cambios de ritmo y días sin pausa.",
      image: "traffic"
    },
    {
      label: "Oficina y foco",
      title: "Un gesto breve que cabe en una jornada larga.",
      description: "Mesa, escritorio y reuniones: el formato acompaña bloques de trabajo sin volverse protagonista visual.",
      image: "office"
    },
    {
      label: "Viaje y altura",
      title: "Ligero, limpio y fácil de llevar fuera de casa.",
      description: "La estética premium gana fuerza cuando el producto se lee como parte natural de la rutina y del equipaje.",
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
      description: "La propuesta pública se sostiene mejor cuando se diferencia con lenguaje claro y sin confundir el ritual de uso."
    },
    {
      title: "No requiere una rutina complicada.",
      description: "Cabe en el día a día y se entiende rápido: se ve, se elige y se compra sin fricción adicional."
    },
    {
      title: "Se percibe discreto y mejor resuelto.",
      description: "Diseño, acabado y narrativa apuntan a una sensación premium sin convertir la página en un catálogo frío."
    }
  ],
  whyChooseCallout: {
    label: "Por qué elegirlo",
    title: "Una alternativa limpia y portable que se compra con claridad.",
    description:
      "La experiencia premium no depende solo de colores o layout. Depende de hacer evidente qué es, cuándo entra en juego y cómo se compra sin rodeos.",
    points: [
      "Frescura herbal y portátil sin lenguaje clínico.",
      "Selección corta que facilita la decisión.",
      "Salida directa a checkout y canal mayorista actual.",
      "Narrativa editorial alineada con una marca de wellness sobria."
    ]
  },
  wholesalePlans,
  wholesaleCallout: {
    label: "Canal mayorista",
    title: "El bloque B2B debe sentirse serio, no como una promo lateral.",
    description:
      "Mayoristas y distribuidores necesitan una salida clara y visible desde la landing sin competir con la compra directa. Por eso el canal vive en su propio bloque, con beneficios y umbrales concretos.",
    points: [
      "Cotización rápida para volumen y reposición.",
      "Acompañamiento comercial y continuidad operativa.",
      "Condiciones visibles sin tocar la lógica del ERP."
    ]
  },
  vendorCallout: {
    label: "Canal vendedor",
    title: "Buscamos personas capaces de representar bien la marca, no solo mover inventario.",
    description:
      "El onboarding comercial debe verse cuidado, breve y serio. La landing lo anuncia, pero la postulación completa vive en una ruta dedicada para no romper foco de compra.",
    points: [
      "Código comercial para atribución y seguimiento.",
      "Proceso de revisión con screening y aprobación.",
      "Relación alineada con narrativa, presencia y criterio de venta."
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
      question: "¿La compra premium cambia el checkout?",
      answer:
        "No. Esta landing eleva la presentación visual, pero la salida a compra sigue usando catálogo y checkout ya operativos."
    },
    {
      question: "¿Puedo comprar por volumen o distribuir?",
      answer:
        "Sí. La landing mantiene visible la ruta mayorista para cotización y conversación comercial sin mezclarla con la compra directa."
    }
  ],
  faqCallout: {
    label: "Menos duda, más claridad",
    title: "La landing premium también debe cerrar objeciones prácticas.",
    description:
      "FAQ no es relleno. Aquí sirve para bajar fricción sobre formato, elección, compra y rutas comerciales sin sobreexplicar el producto.",
    points: [
      "Qué es y cómo se interpreta el formato.",
      "Cuál referencia elegir según momento o preferencia.",
      "Cómo conviven compra directa, mayoristas y vendedores."
    ]
  },
  ctaBanner: {
    eyebrow: "Cierre comercial",
    title: "Compra directa si ya sabes qué formato quieres. Canal comercial si quieres escalar.",
    description:
      "La nueva capa premium no reemplaza la operación actual: solo la presenta con más orden, más contraste y una salida más clara a compra, wholesale y vendor onboarding.",
    primaryCta: {
      label: "Comprar ahora",
      href: "/catalogo"
    },
    secondaryCta: {
      label: "Canal mayorista",
      href: "/mayoristas"
    },
    tertiaryCta: {
      label: "Trabaja con nosotros",
      href: "/trabaja-con-nosotros"
    }
  }
};
