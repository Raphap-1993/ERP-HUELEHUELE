import {
  cmsTestimonials,
  faqItems,
  featuredProducts,
  heroCopy,
  promoBanners,
  type CatalogProduct,
  type CmsBanner,
  type CmsFaq,
  type CmsTestimonial,
  type FaqItem,
  type HeroCopy,
  type PromoBanner
} from "@huelegood/shared";
import { fetchCatalogSummary, fetchCmsSnapshot } from "../../../lib/api";

export interface StorefrontV2Metric {
  label: string;
  value: string;
  detail: string;
}

export interface StorefrontV2Benefit {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "light" | "dark";
}

export interface StorefrontV2IngredientStory {
  title: string;
  description: string;
  note: string;
}

export interface StorefrontV2UsageStep {
  step: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface StorefrontV2BrandMetric {
  label: string;
  value: string;
  detail: string;
}

export interface StorefrontV2StoryCard {
  label: string;
  title: string;
  description: string;
}

export interface StorefrontV2Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface StorefrontV2Content {
  hero: HeroCopy;
  heroMetrics: StorefrontV2Metric[];
  products: CatalogProduct[];
  benefits: StorefrontV2Benefit[];
  ingredientStories: StorefrontV2IngredientStory[];
  usageSteps: StorefrontV2UsageStep[];
  testimonials: StorefrontV2Testimonial[];
  faqs: FaqItem[];
  ctaBanner: PromoBanner;
  secondaryBanner: PromoBanner;
  brandMetrics: StorefrontV2BrandMetric[];
  brandStoryCards: StorefrontV2StoryCard[];
}

async function loadStorefrontCms() {
  try {
    const response = await fetchCmsSnapshot();
    return response.data;
  } catch {
    return null;
  }
}

async function loadStorefrontCatalog() {
  try {
    const response = await fetchCatalogSummary();
    return response.data.products ?? [];
  } catch {
    return [];
  }
}

function mapBanner(banner: CmsBanner): PromoBanner {
  return {
    title: banner.title,
    description: banner.description,
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref,
    note: banner.note,
    tone: banner.tone
  };
}

function mapFaq(faq: CmsFaq): FaqItem {
  return {
    question: faq.question,
    answer: faq.answer,
    category: faq.category
  };
}

function mapTestimonial(testimonial: CmsTestimonial): StorefrontV2Testimonial {
  return {
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.quote ?? "Testimonio curado desde CMS."
  };
}

export async function loadStorefrontV2Content(): Promise<StorefrontV2Content> {
  const cms = await loadStorefrontCms();
  const catalogProducts = await loadStorefrontCatalog();
  const hero = cms?.heroCopy ?? heroCopy;
  const banners = cms?.banners.filter((banner) => banner.status === "active").map(mapBanner) ?? promoBanners;
  const faqs = cms?.faqs.filter((faq) => faq.status === "active").map(mapFaq) ?? faqItems;
  const testimonials =
    cms?.testimonials.filter((testimonial) => testimonial.status === "active").map(mapTestimonial) ?? cmsTestimonials.map(mapTestimonial);
  const products = catalogProducts.length > 0 ? catalogProducts : featuredProducts;

  return {
    hero,
    heroMetrics: [
      {
        label: "Selección",
        value: `${products.length} formatos`,
        detail: catalogProducts.length > 0 ? "Selección actual disponible." : "Selección corta y fácil de recorrer."
      },
      {
        label: "Sensación",
        value: "Herbal",
        detail: "La lectura visual comunica frescura limpia y portátil."
      },
      {
        label: "Checkout",
        value: "Directo",
        detail: "Compra simple y directa desde el primer clic."
      },
      {
        label: "Escala",
        value: "Imagen cuidada",
        detail: "Fotografía y presentación alineadas a una lectura clara."
      }
    ],
    products,
    benefits: [
      {
        eyebrow: "Portabilidad real",
        title: "Hecho para bolso, carro, escritorio y viaje.",
        description: "El diseño del storefront enfatiza escenas de uso concretas para que la promesa se entienda al instante."
      },
      {
        eyebrow: "Jerarquía editorial",
        title: "Más respiración, mejor lectura y CTAs visibles.",
        description: "Cada bloque prioriza foco, ritmo visual y salida clara a compra sin parecer un dashboard."
      },
      {
        eyebrow: "Compra simple",
        title: "Una experiencia premium, clara y fácil de recorrer.",
        description: "La navegación respira mejor, prioriza el producto y facilita la decisión.",
        tone: "dark"
      },
      {
        eyebrow: "Imagen cuidada",
        title: "Visuales limpios para entender cada formato.",
        description: "Las imágenes acompañan la elección sin distraer ni recargar."
      }
    ],
    ingredientStories: [
      {
        title: "Salida verde",
        description: "La apertura visual sugiere una frescura herbal inmediata, limpia y fácil de reconocer en pocos segundos.",
        note: "Lectura sensorial"
      },
      {
        title: "Corazón balsámico",
        description: "La narrativa busca una sensación serena y refinada, más cercana a un ritual cotidiano que a un claim funcional agresivo.",
        note: "Ritmo editorial"
      },
      {
        title: "Acabado sobrio",
        description: "El cierre comunica discreción, portabilidad y presencia premium para gifting, escritorio o trayectos largos.",
        note: "Premium portable"
      }
    ],
    usageSteps: [
      {
        step: "01",
        title: "Explora el formato",
        description: "Empieza por el catálogo corto y entiende rápido la diferencia entre uso diario, acabado premium o bundle.",
        ctaLabel: "Ver catálogo",
        ctaHref: "/catalogo"
      },
      {
        step: "02",
        title: "Compra sin rodeos",
        description: "Elige tu formato y pasa a una compra simple y directa.",
        ctaLabel: "Ir al checkout",
        ctaHref: "/checkout"
      },
      {
        step: "03",
        title: "Escala a volumen cuando haga sentido",
        description: "El canal mayorista sigue disponible como salida paralela para regalos, distribución o compras recurrentes.",
        ctaLabel: "Ver mayoristas",
        ctaHref: "/mayoristas"
      }
    ],
    testimonials,
    faqs,
    ctaBanner: banners[0] ?? promoBanners[0],
    secondaryBanner: banners[1] ?? promoBanners[1] ?? promoBanners[0],
    brandMetrics: [
      {
        label: "Formatos activos",
        value: `${products.length}`,
        detail: catalogProducts.length > 0 ? "Selección disponible hoy." : "Selección disponible hoy."
      },
      {
        label: "Momentos clave",
        value: "4",
        detail: "Bolso, carro, escritorio y viaje como escenas principales."
      },
      {
        label: "Ruta comercial",
        value: "D2C + B2B",
        detail: "Compra directa y opción mayorista, según lo que necesites."
      }
    ],
    brandStoryCards: [
      {
        label: "Editorial",
        title: "Una marca que respira mejor cuando el contenido se ordena.",
        description: "La nueva composición separa inspiración, prueba social, producto y conversión en bloques claros y respirados."
      },
      {
        label: "Rutina real",
        title: "La portabilidad no se explica: se demuestra.",
        description: "La historia visual prioriza escenas concretas y decisiones rápidas para reforzar el uso diario sin claims ambiguos."
      },
      {
        label: "Escala cuidada",
        title: "Lista para campañas, temporadas y nuevos momentos de uso.",
        description: "La estructura permite crecer el contenido sin perder claridad visual."
      }
    ]
  };
}
