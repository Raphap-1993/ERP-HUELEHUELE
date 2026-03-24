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
    eyebrow: "Edición premium",
    title: "Tres formatos, una lectura clara y una compra sin ruido.",
    description:
      "Clásico Verde abre la puerta, Premium Negro afina la presencia y Combo Dúo Perfecto resuelve una compra doble con más valor.",
    primaryCta: {
      label: "Ver la selección",
      href: "/catalogo"
    },
    secondaryCta: {
      label: "Ver Clásico Verde",
      href: "/producto/clasico-verde"
    },
    metrics: [
      {
        label: "Selección",
        value: "3 esenciales",
        detail: "La home se concentra en las tres referencias que mejor explican la marca."
      },
      {
        label: "Formato",
        value: "Portátil",
        detail: "Cabe fácil en bolso, mochila, carro o escritorio sin sumar peso visual."
      },
      {
        label: "Escena",
        value: "Trabajo y viaje",
        detail: "La narrativa prioriza movimiento, pausa breve y días con muchas horas fuera."
      }
    ],
    productChips: ["Clásico Verde", "Premium Negro", "Combo Dúo Perfecto"],
    notes: [
      {
        label: "Selección clara",
        title: "Tres formatos editados para decidir rápido.",
        description: "La home deja respirar el producto y reduce el ruido a lo esencial."
      },
      {
        label: "Uso diario",
        title: "Ligero, discreto y fácil de llevar durante el día.",
        description: "En bolso, carro o escritorio mantiene una presencia limpia y resuelve bien la pausa breve.",
        tone: "dark"
      }
    ]
  },
  products: featuredProducts,
  productHighlights: [
    {
      slug: "clasico-verde",
      eyebrow: "Entrada limpia",
      story: "La referencia más directa para quienes quieren una compra clara y una sensación fresca para el día a día."
    },
    {
      slug: "premium-negro",
      eyebrow: "Presencia sobria",
      story: "Un acabado más limpio y premium para bolso, oficina o trayectos largos donde prefieres discreción."
    },
    {
      slug: "combo-duo-perfecto",
      eyebrow: "Compra doble",
      story: "Dos unidades para dejar una contigo y otra lista en carro, escritorio o equipaje."
    }
  ],
  useCases: [
    {
      label: "Trayecto diario",
      title: "Pensado para tráfico, carretera y cambios de ritmo.",
      description: "Su formato portátil entra bien en carro, bolso o mochila cuando necesitas una sensación fresca sin detener el día.",
      image: "traffic"
    },
    {
      label: "Oficina",
      title: "Una pausa breve que encaja en jornadas largas y espacios compartidos.",
      description: "Acompaña escritorio, reuniones y bloques intensos con una presencia discreta y fácil de guardar.",
      image: "office"
    },
    {
      label: "Viaje y altura",
      title: "Ligero para salir de casa, sobrio para moverte entre ciudades.",
      description: "En equipaje de mano, mochila o bolso mantiene una lectura premium y un uso simple en trayectos largos o destinos de altura.",
      image: "travel"
    }
  ],
  benefits: [
    {
      eyebrow: "Portabilidad real",
      title: "Cabe fácil y se siente bien resuelto desde el primer contacto.",
      description: "El formato gana valor cuando se percibe útil, limpio y listo para acompañar trayectos, oficina o viaje."
    },
    {
      eyebrow: "Selección curada",
      title: "Menos opciones visibles, mejor comprensión comercial.",
      description: "Una selección corta ayuda a elegir rápido y deja que la historia visual haga el trabajo pesado."
    },
    {
      eyebrow: "Look premium",
      title: "Sobrio por fuera, fácil de integrar por dentro.",
      description: "El lenguaje visual se apoya en bienestar, viaje y frescura sin caer en estética clínica ni promesas exageradas.",
      tone: "dark"
    },
    {
      eyebrow: "Escena correcta",
      title: "La marca se entiende mejor en movimiento que en discurso.",
      description: "Tráfico, escritorio, trayecto y altura construyen una narrativa más aspiracional y más útil para vender."
    }
  ],
  brandMetrics: [
    {
      label: "Selección principal",
      value: "3 formatos",
      detail: "La home enfoca la decisión en las referencias que mejor explican la marca."
    },
    {
      label: "Escenas de uso",
      value: "Movimiento",
      detail: "Los momentos reales de uso le dan contexto al producto sin sobreexplicarlo."
    },
    {
      label: "Lenguaje",
      value: "Sobrio y portable",
      detail: "La composición prioriza claridad, portabilidad y una sensación de compra limpia."
    }
  ],
  brandStoryCards: [
    {
      label: "Edición",
      title: "La home vende mejor cuando respira y no compite consigo misma.",
      description: "Primero aparece la atmósfera, luego la selección curada y al final la salida de compra."
    },
    {
      label: "Objeto",
      title: "Cada formato se presenta como parte de una rutina móvil y sobria.",
      description: "Eso eleva la percepción del producto y lo vuelve más claro para quien compra por primera vez."
    },
    {
      label: "Compra",
      title: "La decisión de compra se vuelve más directa cuando el contexto está bien elegido.",
      description: "Uso diario, oficina y viaje hacen visible el valor del formato sin necesidad de sobreprometer."
    }
  ],
  whyChooseReasons: [
    {
      title: "Portátil de verdad para bolso, carro o escritorio.",
      description: "No exige espacio extra ni una rutina nueva: se guarda fácil y acompaña el día sin fricción."
    },
    {
      title: "Frescura herbal con una lectura clara y contemporánea.",
      description: "La propuesta se entiende desde el primer vistazo: sensación fresca, formato limpio y estética sobria."
    },
    {
      title: "Tres opciones bien diferenciadas para elegir rápido.",
      description: "Clásico Verde resuelve el día a día, Premium Negro eleva el acabado y el Combo suma valor para uso frecuente."
    }
  ],
  whyChooseCallout: {
    label: "Guía rápida",
    title: "Qué elegir según tu ritmo y tu forma de moverte.",
    description:
      "Cuando la selección está bien curada, cada formato ocupa un rol claro y la elección se siente más simple desde el primer scroll.",
    points: [
      "Clásico Verde para frescura diaria y entrada directa a la marca.",
      "Premium Negro para quienes prefieren un acabado más sobrio y premium.",
      "Combo Dúo Perfecto para tener una unidad contigo y otra en oficina, carro o equipaje.",
      "Compra directa, mayoristas y representación comercial en rutas separadas."
    ]
  },
  wholesalePlans,
  wholesaleCallout: {
    label: "Mayoristas",
    title: "Compra por volumen con una ruta clara y separada de la tienda.",
    description:
      "Si buscas reposición o distribución, la conversación comercial vive en su propio espacio para no mezclarla con la compra individual.",
    points: [
      "Cotización rápida para volumen y reposición.",
      "Condiciones visibles para compras recurrentes.",
      "Escalado comercial para puntos de venta y distribución."
    ]
  },
  vendorCallout: {
    label: "Vendedores",
    title: "Una ruta aparte para quienes quieren representar la marca.",
    description:
      "La tienda premium mantiene el foco en producto y deja la representación comercial en una ruta dedicada, con información más clara para aplicar.",
    points: [
      "Proceso claro para aplicar y entender el perfil buscado.",
      "Acompañamiento comercial según desempeño y zona.",
      "Separación limpia entre compra directa y representación."
    ],
    primaryCta: {
      label: "Quiero vender Huelegood",
      href: "/trabaja-con-nosotros"
    },
    secondaryCta: {
      label: "Ver mayoristas",
      href: "/mayoristas"
    }
  },
  faqs: [
    {
      question: "¿Qué tipo de producto es Huelegood?",
      answer:
        "Es un inhalador herbal aromático pensado para acompañar tráfico, oficina, viaje y altura con una sensación fresca, portable y fácil de llevar."
    },
    {
      question: "¿Cuál debería elegir si es mi primera compra?",
      answer:
        "Clásico Verde es la entrada más directa para uso diario, Premium Negro prioriza un acabado más sobrio y Combo Dúo Perfecto da más valor si quieres dos unidades listas."
    },
    {
      question: "¿Sirve para llevar en viaje o altura?",
      answer:
        "Sí. Su formato ligero y fácil de guardar funciona bien para equipaje de mano, mochila o bolso cuando pasas muchas horas fuera de casa."
    },
    {
      question: "¿Cómo compro o cotizo por volumen?",
      answer:
        "Puedes comprar directo desde catálogo o ir a la ruta mayorista si necesitas cotización, reposición o distribución."
    }
  ],
  faqCallout: {
    label: "Contacto",
    title: "Si necesitas ayuda para elegir, te respondemos con una recomendación simple.",
    description:
      "Clásico Verde, Premium Negro y Combo Dúo Perfecto cubren las dudas más comunes: cuál elegir, cómo se usa y qué formato encaja mejor contigo.",
    points: [
      "Te orientamos por correo o WhatsApp.",
      "Te ayudamos a elegir entre Verde, Negro y Dúo.",
      "La compra directa sigue visible y sin rodeos."
    ]
  },
  ctaBanner: {
    eyebrow: "Cierre editorial",
    title: "Elige el formato que mejor encaja con tu ritmo.",
    description:
      "Compra directo si ya sabes cuál va contigo. Si quieres revisar las tres referencias, vuelve al catálogo y compara sin prisa.",
    primaryCta: {
      label: "Clásico Verde",
      href: "/producto/clasico-verde"
    },
    secondaryCta: {
      label: "Premium Negro",
      href: "/producto/premium-negro"
    },
    tertiaryCta: {
      label: "Combo Dúo Perfecto",
      href: "/producto/combo-duo-perfecto"
    }
  }
};
