import {
  CmsSocialPlatform,
  CmsTestimonialKind,
  type CatalogProduct,
  type CmsTestimonial
} from "@huelegood/shared";
import { resolveStorefrontPrimaryAction, type StorefrontPrimaryAction } from "./storefront-purchase";

export type HueleHomeMomentKey = "trafico" | "oficina" | "viaje" | "sierra" | "noche";
export type HueleHomeProductKey = string;
export type HueleHomeBenefitTone = "lime" | "mint" | "sun" | "coral";

export type HueleHomeMoment = {
  key: HueleHomeMomentKey;
  time: string;
  title: string;
  label: string;
  copy: string;
};

export type HueleHomeBenefit = {
  icon: "mountain" | "wind" | "sparkles" | "zap";
  title: string;
  copy: string;
  tone: HueleHomeBenefitTone;
};

export type HueleHomeProduct = {
  key: HueleHomeProductKey;
  slug: string;
  name: string;
  badge: string;
  copy: string;
  accent: string;
};

export type HueleHomeProductCard = HueleHomeProduct & {
  href: string;
  imageAlt: string;
  imageUrl?: string;
  priceLabel: string;
  ctaLabel: string;
  action: StorefrontPrimaryAction | { mode: "catalog"; label: "Ver catálogo"; href: "/catalogo" };
  source: "runtime" | "fallback";
};

export type HueleHomeTikTokVideo = {
  id: string;
  title: string;
  caption: string;
  subcopy: string;
  href: string;
  playerUrl: string;
  imageAlt: string;
  imageUrl: string;
  platformLabel: "TikTok";
};

export const hueleHomeMoments: HueleHomeMoment[] = [
  {
    key: "trafico",
    time: "08.20",
    title: "Tráfico y calor",
    label: "Fresh start",
    copy: "Un respiro herbal para llevar en la mochila, el carro o el bolsillo."
  },
  {
    key: "oficina",
    time: "10.30",
    title: "Oficina intensa",
    label: "Focus verde",
    copy: "Aromas naturales para resetear energía sin parecer un vape."
  },
  {
    key: "viaje",
    time: "12.15",
    title: "Viaje largo",
    label: "Anti-mareo",
    copy: "Mentol y eucalipto para esos momentos de mareo o náuseas."
  },
  {
    key: "sierra",
    time: "15.40",
    title: "Altura",
    label: "Soroche",
    copy: "Un ritual portátil para sentir frescura cuando sube la altura."
  },
  {
    key: "noche",
    time: "19.00",
    title: "Después de comer",
    label: "Buen olor",
    copy: "Una salida discreta para malos olores, cocina, taxi o ambientes cerrados."
  }
];

export const hueleHomeBenefits: HueleHomeBenefit[] = [
  {
    icon: "mountain",
    title: "Soroche",
    copy: "Frescura herbal para momentos de altura o viajes exigentes.",
    tone: "lime"
  },
  {
    icon: "wind",
    title: "Mareos",
    copy: "Ayuda cuando aparecen náuseas, movimiento o sensación pesada.",
    tone: "mint"
  },
  {
    icon: "sparkles",
    title: "Malos olores",
    copy: "Un gesto rápido para cambiar el aire alrededor sin invadir.",
    tone: "sun"
  },
  {
    icon: "zap",
    title: "Energía",
    copy: "Mentol y eucalipto para un golpe fresco, limpio y portable.",
    tone: "coral"
  }
];

export const hueleHomeProducts: HueleHomeProduct[] = [
  {
    key: "verde",
    slug: "clasico-verde",
    name: "Huele Huele Verde",
    badge: "Clásico herbal",
    copy: "El inhalador aromático de bolsillo para escritorio, carro y viaje.",
    accent: "#7fd24f"
  },
  {
    key: "black",
    slug: "premium-negro",
    name: "Huele Huele Black",
    badge: "Más sobrio",
    copy: "La versión de look oscuro para quienes quieren frescura discreta.",
    accent: "#1d2b22"
  },
  {
    key: "combo",
    slug: "combo-duo-perfecto",
    name: "Combo Duo",
    badge: "Para compartir",
    copy: "Dos unidades para casa, mochila, oficina o regalo rápido.",
    accent: "#ffc144"
  }
];

export const hueleHomeHeroFacts = ["Sin nicotina", "Hasta 300 usos", "Envíos a Perú"] as const;

export const hueleHomeNaturalFacts = ["Aceites naturales", "Sin vape", "Perú"] as const;

export const hueleHomeSellerStats = [
  { value: "12", label: "unid. mínimo" },
  { value: "72h", label: "entrega aprox." },
  { value: "100%", label: "margen potencial" }
] as const;

function formatPrice(value: number, currencyCode = "PEN") {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `S/ ${value.toFixed(2)}`;
  }
}

function resolveRuntimeProductImage(product: CatalogProduct) {
  const sortedImages = [...(product.images ?? [])].sort((left, right) => {
    if (left.isPrimary && !right.isPrimary) return -1;
    if (!left.isPrimary && right.isPrimary) return 1;
    return left.sortOrder - right.sortOrder;
  });
  const selectedImage = sortedImages.find((image) => image.url.trim());
  const imageUrl = selectedImage?.url || product.imageUrl?.trim() || undefined;

  return {
    imageAlt: selectedImage?.altText || product.imageAlt || product.name,
    imageUrl
  };
}

function resolveRuntimeAccent(product: CatalogProduct, fallback?: HueleHomeProduct) {
  if (fallback?.accent) {
    return fallback.accent;
  }

  if (product.tone === "graphite") {
    return "#1d2b22";
  }

  if (product.tone === "amber") {
    return "#ffc144";
  }

  return "#7fd24f";
}

function resolveRuntimeProductCard(product: CatalogProduct): HueleHomeProductCard {
  const fallback = hueleHomeProducts.find((baseProduct) => baseProduct.slug === product.slug);
  const action = resolveStorefrontPrimaryAction(product);
  const image = resolveRuntimeProductImage(product);

  return {
    key: product.slug,
    slug: product.slug,
    name: product.name || fallback?.name || "Producto Huele Huele",
    badge: product.badge || fallback?.badge || "Disponible",
    copy: product.tagline || product.description || fallback?.copy || "",
    accent: resolveRuntimeAccent(product, fallback),
    href: `/producto/${product.slug}`,
    imageAlt: image.imageAlt,
    imageUrl: image.imageUrl,
    priceLabel: formatPrice(product.price, product.currencyCode),
    ctaLabel: action.label,
    action,
    source: "runtime"
  };
}

function truncateHueleHomeText(value: string | undefined, maxLength: number) {
  const text = value?.trim() ?? "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength).trimEnd();
}

function firstNonEmptyHueleHomeText(...values: string[]) {
  return values.map((value) => value.trim()).find(Boolean) ?? "";
}

const TIKTOK_SOCIAL_HOSTNAMES = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com"
]);

function hasUsableTikTokSocialUrl(socialUrl?: string) {
  const href = socialUrl?.trim();
  if (!href) {
    return false;
  }

  try {
    const parsedUrl = new URL(href);
    return parsedUrl.protocol === "https:" && TIKTOK_SOCIAL_HOSTNAMES.has(parsedUrl.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function resolveTikTokPlayerUrl(socialUrl?: string) {
  const href = socialUrl?.trim();
  if (!href) {
    return null;
  }

  try {
    const parsedUrl = new URL(href);
    if (parsedUrl.protocol !== "https:" || !TIKTOK_SOCIAL_HOSTNAMES.has(parsedUrl.hostname.toLowerCase())) {
      return null;
    }

    const videoId = parsedUrl.pathname.match(/\/(?:video|player\/v1)\/(\d+)/)?.[1];
    if (!videoId) {
      return null;
    }

    return `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&controls=1&rel=0`;
  } catch {
    return null;
  }
}

function hasUsableTikTokCover(coverImageUrl?: string) {
  const imageUrl = coverImageUrl?.trim();
  if (!imageUrl) {
    return false;
  }

  if (imageUrl.startsWith("/") && !imageUrl.startsWith("//")) {
    return true;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return parsedUrl.protocol === "https:" && parsedUrl.hostname === "media.huelegood.com";
  } catch {
    return false;
  }
}

export function resolveHueleHomeTikTokVideos(testimonials: CmsTestimonial[]): HueleHomeTikTokVideo[] {
  return testimonials
    .filter((testimonial) => {
      const socialUrl = testimonial.socialUrl?.trim();
      const coverImageUrl = testimonial.coverImageUrl?.trim();
      const playerUrl = resolveTikTokPlayerUrl(socialUrl);

      return (
        testimonial.status === "active" &&
        testimonial.kind === CmsTestimonialKind.Social &&
        testimonial.socialPlatform === CmsSocialPlatform.Tiktok &&
        hasUsableTikTokSocialUrl(socialUrl) &&
        Boolean(playerUrl) &&
        Boolean(coverImageUrl) &&
        hasUsableTikTokCover(coverImageUrl)
      );
    })
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .slice(0, 5)
    .map((testimonial) => {
      const title = truncateHueleHomeText(
        firstNonEmptyHueleHomeText(testimonial.name, testimonial.quote ?? "", "Video Huele Huele"),
        48
      );

      return {
        id: testimonial.id,
        title,
        caption: truncateHueleHomeText(testimonial.quote, 92),
        subcopy: truncateHueleHomeText(testimonial.role, 42),
        href: testimonial.socialUrl?.trim() ?? "",
        playerUrl: resolveTikTokPlayerUrl(testimonial.socialUrl) ?? "",
        imageAlt: `TikTok Huele Huele: ${title}`,
        imageUrl: testimonial.coverImageUrl?.trim() ?? "",
        platformLabel: "TikTok"
      };
    });
}

export function resolveHueleHomeProductCards(products: CatalogProduct[]): HueleHomeProductCard[] {
  if (products.length > 0) {
    return products.map(resolveRuntimeProductCard);
  }

  return hueleHomeProducts.map((baseProduct) => {
    return {
      ...baseProduct,
      href: "/catalogo",
      imageAlt: baseProduct.name,
      priceLabel: "Ver catálogo",
      ctaLabel: "Ver catálogo",
      action: { mode: "catalog", label: "Ver catálogo", href: "/catalogo" },
      source: "fallback"
    };
  });
}
