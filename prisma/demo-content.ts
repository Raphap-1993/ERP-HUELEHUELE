import type { CmsSnapshotResponse } from "@huelegood/shared";

interface LocalDemoBundleComponentSeed {
  productSlug: string;
  quantity: number;
}

export interface LocalDemoCategorySeed {
  slug: string;
  name: string;
  description: string;
}

export interface LocalDemoProductSeed {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  categorySlug: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  imageAlt: string;
  bundleComponents?: LocalDemoBundleComponentSeed[];
}

export const localDemoCategories: LocalDemoCategorySeed[] = [
  {
    slug: "productos",
    name: "Productos",
    description: "Referencias principales para venta directa."
  },
  {
    slug: "bundles",
    name: "Combos",
    description: "Combos, ofertas y promociones activas."
  }
];

export const localDemoProducts: LocalDemoProductSeed[] = [
  {
    slug: "clasico-verde",
    name: "Huele Huele Verde - Herbal",
    shortDescription:
      "Huele Huele Verde combina hierbas secas y aceites esenciales para brindarte una sensación fresca, natural y reconfortante en cualquier momento del día.",
    longDescription:
      "Huele Huele Verde está hecho para darte una sensación más natural, fresca y reconfortante. Su combinación de hierbas secas y aceites esenciales crea una experiencia aromática suave, ideal para acompañarte en momentos de pausa, enfoque o relajación durante el día.",
    categorySlug: "productos",
    sku: "HG-CV-001",
    price: 34.9,
    compareAtPrice: 40,
    imageUrl: "https://media.huelegood.com/product/clasico-verde/1774415860628-bb6e76ac-12bb-418f-a4a5-80df52687ad9.webp",
    imageAlt: "Huele Huele Verde - imagen principal"
  },
  {
    slug: "premium-negro",
    name: "Premium Negro",
    shortDescription:
      "Huele Huele Black está elaborado con aceites esenciales y ofrece una experiencia aromática intensa, fresca y práctica para acompañarte con un respiro inmediato donde estés.",
    longDescription:
      "Huele Huele Black ofrece una experiencia más intensa y práctica, elaborado con aceites esenciales para brindarte un aroma concentrado, fresco y duradero. Es perfecto para quienes buscan una opción fácil de llevar, usar en cualquier momento y disfrutar de un respiro inmediato.",
    categorySlug: "productos",
    sku: "HG-PN-001",
    price: 39.9,
    compareAtPrice: 50,
    imageUrl: "https://media.huelegood.com/product/premium-negro/1774415833172-a761d08e-93d9-4faf-bf22-7b018660126e.webp",
    imageAlt: "Premium Negro - imagen principal"
  },
  {
    slug: "combo-duo-perfecto",
    name: "Combo Dúo Perfecto",
    shortDescription: "Clásico Verde + Premium Negro en un solo pack.",
    longDescription:
      "El Pack Duo te permite disfrutar lo mejor de ambos mundos: la frescura natural del Verde y la intensidad práctica del Black. Es ideal para probar dos experiencias diferentes, alternarlas según tu momento del día y además aprovechar una compra más conveniente.",
    categorySlug: "bundles",
    sku: "HG-CDP-001",
    price: 69.9,
    compareAtPrice: 90,
    imageUrl: "https://media.huelegood.com/product/combo-duo-perfecto/1774416528622-88eb81e2-add4-457d-a947-1984d9b456d7.webp",
    imageAlt: "Combo Dúo Perfecto - imagen principal",
    bundleComponents: [
      { productSlug: "clasico-verde", quantity: 1 },
      { productSlug: "premium-negro", quantity: 1 }
    ]
  }
];

// Frozen from public production endpoints to keep local review visually close to prod
// without depending on live production data at runtime.
export const localDemoCmsSnapshot: CmsSnapshotResponse = {
  siteSetting: {
    brandName: "Huelegood",
    tagline: "Frescura herbal portátil para acompañarte en tráfico, viajes, oficina y altura.",
    supportEmail: "contacto@huelegood.com",
    whatsapp: "+51 927 476 668",
    shippingFlatRate: 15,
    freeShippingThreshold: 99,
    yapeNumber: "+51 929 970 537",
    walletType: "Yape",
    walletOwnerName: "Estefanía Isabel Paredes Llocclla",
    headerLogoUrl: "https://media.huelegood.com/logo%202.png",
    heroProductImageUrl: "https://media.huelegood.com/hero/huelegood/1774057589662-d9ac2375-40ab-4668-940d-0e36a363ee3b.webp",
    loadingImageUrl: "https://media.huelegood.com/logo/huelegood/1774332583212-31c1b29b-19e1-4ad0-8ddb-ede0043d7a32.webp"
  },
  heroCopy: {
    title: "Huele Huele te da un reset fresco cuando el día no se detiene.",
    eyebrow: "Inhalador herbal aromático • fresco y portable",
    primaryCta: {
      href: "/catalogo",
      label: "Comprar ahora"
    },
    description: "Una experiencia herbal práctica para quienes buscan frescura inmediata en movimiento. Ideal para bolso, escritorio, carro y viaje.",
    secondaryCta: {
      href: "/catalogo",
      label: "Ver productos"
    }
  },
  webNavigation: [
    {
      title: "Explorar",
      items: [
        { label: "Inicio", href: "/" },
        { label: "Catálogo", href: "/catalogo" },
        { label: "Mayoristas", href: "/mayoristas" },
        { label: "Trabaja con nosotros", href: "/trabaja-con-nosotros" }
      ]
    },
    {
      title: "Cuenta",
      items: [
        { label: "Mi cuenta", href: "/cuenta" },
        { label: "Checkout", href: "/checkout" }
      ]
    }
  ],
  banners: [
    {
      id: "banner-001",
      note: "Oferta por tiempo limitado",
      tone: "olive",
      title: "Compra tu favorito con promo activa",
      status: "active",
      ctaHref: "/catalogo",
      ctaLabel: "Comprar ahora",
      position: 1,
      updatedAt: "2026-03-19T19:48:32.775Z",
      description: "Aprovecha descuentos y llévate Huele Huele en el formato que mejor se adapte a tu rutina."
    },
    {
      id: "banner-002",
      note: "Formato práctico",
      tone: "amber",
      title: "No es vape. No es pomada. Es Huele Huele.",
      status: "active",
      ctaHref: "/catalogo",
      ctaLabel: "Ver productos",
      position: 2,
      updatedAt: "2026-03-19T19:48:32.898Z",
      description: "Una alternativa práctica, limpia y portable para quienes prefieren una sensación herbal fresca sin complicarse."
    }
  ],
  faqs: [
    {
      id: "faq-001",
      answer: "Es un inhalador herbal aromático pensado para acompañarte con una sensación fresca en tráfico, oficina, viajes o cambios de ritmo.",
      status: "active",
      category: "producto",
      position: 1,
      question: "¿Qué es Huele Huele?",
      updatedAt: "2026-03-19T19:48:33.027Z"
    },
    {
      id: "faq-002",
      answer: "Muchas personas lo llevan en la bolsa, el carro o el escritorio para tenerlo a mano durante trayectos largos, jornadas intensas o viajes.",
      status: "active",
      category: "uso",
      position: 2,
      question: "¿En qué momentos suele usarse?",
      updatedAt: "2026-03-19T19:48:33.148Z"
    },
    {
      id: "faq-003",
      answer: "Clásico Verde es la opción más versátil, Premium Negro prioriza un look más sobrio y Combo Dúo Perfecto te da mejor valor si quieres más de una unidad.",
      status: "active",
      category: "catalogo",
      position: 3,
      question: "¿Cuál debería elegir?",
      updatedAt: "2026-03-19T19:48:33.276Z"
    }
  ],
  pages: [
    {
      slug: "home",
      title: "Inicio Huele Huele",
      description: "Hero comercial, formatos destacados, beneficios de uso y preguntas frecuentes del producto.",
      status: "published",
      blocks: [
        {
          id: "blk-home-01",
          pageSlug: "home",
          type: "hero",
          title: "Hero principal",
          description: "Narrativa de conversión seller-first.",
          content: "Una plataforma comercial propia para Huelegood.",
          position: 1,
          status: "active",
          updatedAt: "2026-03-25T04:27:34.518Z"
        },
        {
          id: "blk-home-02",
          pageSlug: "home",
          type: "promo-banner",
          title: "Promociones activas",
          description: "Bloques de valor y promociones.",
          content: "Oferta activa con código promocional | Bloque mayorista y distribuidores",
          position: 2,
          status: "active",
          updatedAt: "2026-03-25T04:27:34.518Z"
        },
        {
          id: "blk-home-03",
          pageSlug: "home",
          type: "featured-products",
          title: "Productos visibles",
          description: "Clásico Verde, Premium Negro y Combo Dúo Perfecto.",
          content: "Catálogo visible con bundle y oferta activa.",
          position: 3,
          status: "active",
          updatedAt: "2026-03-25T04:27:34.518Z"
        },
        {
          id: "blk-home-04",
          pageSlug: "home",
          type: "wholesale-plans",
          title: "Mayoristas",
          description: "Tiers comerciales y captación de distribuidores.",
          content: "Captación B2B con condiciones por volumen.",
          position: 4,
          status: "active",
          updatedAt: "2026-03-25T04:27:34.518Z"
        },
        {
          id: "blk-home-05",
          pageSlug: "home",
          type: "faq",
          title: "FAQ",
          description: "Preguntas de pago y operación.",
          content: "¿Puedo pagar con Openpay? | ¿Se aceptan pagos manuales? | ¿Hay vendedor con código y comisión?",
          position: 5,
          status: "active",
          updatedAt: "2026-03-25T04:27:34.518Z"
        }
      ],
      seoMeta: {
        pageSlug: "home",
        title: "Huele Huele | Frescura herbal portátil",
        description: "Frescura herbal portátil para acompañarte en tráfico, viajes, oficina, entrenamientos y para zonas de altura.",
        keywords: ["huele huele", "inhalador herbal aromático", "frescura portátil", "huele huele peru", "aromaterapia peru"],
        canonicalPath: "/",
        robots: "index,follow",
        updatedAt: "2026-03-25T04:27:34.518Z"
      },
      updatedAt: "2026-03-25T04:27:34.518Z"
    },
    {
      slug: "catalogo",
      title: "Catálogo",
      description: "Productos, bundles y ofertas activas.",
      status: "published",
      blocks: [
        {
          id: "blk-catalogo-01",
          pageSlug: "catalogo",
          type: "hero",
          title: "Hero catálogo",
          description: "Presentación visible de productos.",
          content: "Visibilidad de productos y filtros.",
          position: 1,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        },
        {
          id: "blk-catalogo-02",
          pageSlug: "catalogo",
          type: "product-grid",
          title: "Grid de productos",
          description: "Producto visible y bundle.",
          content: "Clásico Verde, Premium Negro, Combo Dúo Perfecto.",
          position: 2,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        }
      ],
      seoMeta: {
        pageSlug: "catalogo",
        title: "Catálogo Huelegood",
        description: "Productos visibles, bundles y ofertas activas.",
        keywords: ["catalogo", "productos", "bundles"],
        canonicalPath: "/catalogo",
        robots: "index,follow",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      slug: "mayoristas",
      title: "Mayoristas y distribuidores",
      description: "Cotización por volumen y seguimiento comercial.",
      status: "published",
      blocks: [
        {
          id: "blk-mayoristas-01",
          pageSlug: "mayoristas",
          type: "hero",
          title: "Mayoristas hero",
          description: "Captación de leads B2B.",
          content: "Condiciones por volumen y seguimiento comercial.",
          position: 1,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        },
        {
          id: "blk-mayoristas-02",
          pageSlug: "mayoristas",
          type: "wholesale-plans",
          title: "Planes mayoristas",
          description: "Tiers de volumen y ahorro.",
          content: "Mayorista Inicial y Distribuidor.",
          position: 2,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        },
        {
          id: "blk-mayoristas-03",
          pageSlug: "mayoristas",
          type: "lead-form",
          title: "Formulario mayorista",
          description: "Lead calificado para operación comercial.",
          content: "Nombre de empresa, contacto, ciudad y notas.",
          position: 3,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        }
      ],
      seoMeta: {
        pageSlug: "mayoristas",
        title: "Mayoristas Huelegood",
        description: "Leads y cotización por volumen.",
        keywords: ["mayoristas", "distribuidores", "b2b"],
        canonicalPath: "/mayoristas",
        robots: "index,follow",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      slug: "trabaja-con-nosotros",
      title: "Trabaja con nosotros",
      description: "Postulación de vendedores y aliados comerciales.",
      status: "published",
      blocks: [
        {
          id: "blk-trabaja-con-nosotros-01",
          pageSlug: "trabaja-con-nosotros",
          type: "hero",
          title: "Recruitment hero",
          description: "Atracción de vendedores y aliados.",
          content: "Perfil seller-first y oportunidades comerciales.",
          position: 1,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        },
        {
          id: "blk-trabaja-con-nosotros-02",
          pageSlug: "trabaja-con-nosotros",
          type: "vendor-application-form",
          title: "Formulario vendedor",
          description: "Postulación con código y seguimiento.",
          content: "Nombre, correo, ciudad y fuente.",
          position: 2,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        }
      ],
      seoMeta: {
        pageSlug: "trabaja-con-nosotros",
        title: "Trabaja con Huelegood",
        description: "Postulación de vendedores y aliados.",
        keywords: ["vendedores", "seller", "postulacion"],
        canonicalPath: "/trabaja-con-nosotros",
        robots: "index,follow",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      slug: "cuenta",
      title: "Mi cuenta",
      description: "Acceso, sesión y fidelización.",
      status: "published",
      blocks: [
        {
          id: "blk-cuenta-01",
          pageSlug: "cuenta",
          type: "auth",
          title: "Acceso",
          description: "Login y registro.",
          content: "Sesión de cliente, seller o admin demo.",
          position: 1,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        },
        {
          id: "blk-cuenta-02",
          pageSlug: "cuenta",
          type: "loyalty",
          title: "Fidelización",
          description: "Saldo y movimientos de puntos.",
          content: "Puntos disponibles, pendientes y canjes.",
          position: 2,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        }
      ],
      seoMeta: {
        pageSlug: "cuenta",
        title: "Mi cuenta Huelegood",
        description: "Acceso de usuario y fidelización.",
        keywords: ["cuenta", "loyalty", "sesion"],
        canonicalPath: "/cuenta",
        robots: "noindex,nofollow",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      slug: "checkout",
      title: "Checkout",
      description: "Openpay, pago manual y revisión.",
      status: "published",
      blocks: [
        {
          id: "blk-checkout-01",
          pageSlug: "checkout",
          type: "checkout-summary",
          title: "Resumen",
          description: "Totales y vendedor aplicado.",
          content: "Subtotal, descuento, envío y total.",
          position: 1,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        },
        {
          id: "blk-checkout-02",
          pageSlug: "checkout",
          type: "payment-methods",
          title: "Pagos",
          description: "Openpay y comprobante manual.",
          content: "Pago online y pago manual con revisión.",
          position: 2,
          status: "active",
          updatedAt: "2026-03-18T09:00:00.000Z"
        }
      ],
      seoMeta: {
        pageSlug: "checkout",
        title: "Checkout Huelegood",
        description: "Openpay y comprobante manual.",
        keywords: ["checkout", "openpay", "pagos"],
        canonicalPath: "/checkout",
        robots: "noindex,nofollow",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      updatedAt: "2026-03-18T09:00:00.000Z"
    }
  ],
  testimonials: [
    {
      id: "tst-003",
      name: "Sofía Rivera",
      role: "Viajes y altura",
      quote: "Me gusta porque se siente limpio, portable y con una imagen mucho más cuidada que otras opciones.",
      rating: 5,
      status: "active",
      updatedAt: "2026-03-19T19:48:33.682Z"
    },
    {
      id: "tst-002",
      name: "Carlos Gómez",
      role: "Ruta y carretera",
      quote: "En viajes largos me funciona perfecto porque cabe en cualquier lado y siempre lo tengo a la mano.",
      rating: 5,
      status: "active",
      updatedAt: "2026-03-19T19:48:33.563Z"
    },
    {
      id: "tst-001",
      name: "Laura Mendoza",
      role: "Oficina y traslados",
      quote: "Lo llevo siempre en la bolsa. Me gusta porque es práctico, se siente fresco y no me complica el día.",
      rating: 5,
      status: "active",
      updatedAt: "2026-03-19T19:48:33.436Z"
    }
  ],
  seoMeta: [
    {
      pageSlug: "home",
      title: "Huele Huele | Frescura herbal portátil",
      description: "Frescura herbal portátil para acompañarte en tráfico, viajes, oficina, entrenamientos y para zonas de altura.",
      keywords: ["huele huele", "inhalador herbal aromático", "frescura portátil", "huele huele peru", "aromaterapia peru"],
      canonicalPath: "/",
      robots: "index,follow",
      updatedAt: "2026-03-25T04:27:34.518Z"
    },
    {
      pageSlug: "catalogo",
      title: "Catálogo Huelegood",
      description: "Productos visibles, bundles y ofertas activas.",
      keywords: ["catalogo", "productos", "bundles"],
      canonicalPath: "/catalogo",
      robots: "index,follow",
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      pageSlug: "mayoristas",
      title: "Mayoristas Huelegood",
      description: "Leads y cotización por volumen.",
      keywords: ["mayoristas", "distribuidores", "b2b"],
      canonicalPath: "/mayoristas",
      robots: "index,follow",
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      pageSlug: "trabaja-con-nosotros",
      title: "Trabaja con Huelegood",
      description: "Postulación de vendedores y aliados.",
      keywords: ["vendedores", "seller", "postulacion"],
      canonicalPath: "/trabaja-con-nosotros",
      robots: "index,follow",
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      pageSlug: "cuenta",
      title: "Mi cuenta Huelegood",
      description: "Acceso de usuario y fidelización.",
      keywords: ["cuenta", "loyalty", "sesion"],
      canonicalPath: "/cuenta",
      robots: "noindex,nofollow",
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      pageSlug: "checkout",
      title: "Checkout Huelegood",
      description: "Openpay y comprobante manual.",
      keywords: ["checkout", "openpay", "pagos"],
      canonicalPath: "/checkout",
      robots: "noindex,nofollow",
      updatedAt: "2026-03-18T09:00:00.000Z"
    }
  ]
};
