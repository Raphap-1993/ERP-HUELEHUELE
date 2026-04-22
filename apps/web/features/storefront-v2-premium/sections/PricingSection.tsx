import Image from "next/image";
import Link from "next/link";
import { type CatalogProduct } from "@huelegood/shared";
import { AddToCartLink } from "../../../components/add-to-cart-link";
import {
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc,
  storefrontV2PremiumProductArtBySlug
} from "../lib/media";
import { StorefrontReveal } from "../components/StorefrontReveal";

type PricingStyle = {
  badge: string;
  badgeTone: string;
  placeholder: string;
  imgBg: string;
  cta: string;
  featured?: boolean;
};

const DISPLAY_ORDER = ["clasico-verde", "combo-duo-perfecto", "premium-negro"] as const;

const STYLE_BY_SLUG: Record<(typeof DISPLAY_ORDER)[number], PricingStyle> = {
  "clasico-verde": {
    badge: "🌿 Nuevo",
    badgeTone: "bg-[#577e2f] text-white",
    placeholder: "🌿",
    imgBg: "bg-gradient-to-br from-[#e8f5e9] to-[#eef6e8]",
    cta: "Quiero el Clásico →"
  },
  "combo-duo-perfecto": {
    badge: "⭐ Más Vendido — Mejor Valor",
    badgeTone: "bg-[#c9a84c] text-[#1a3a2e]",
    placeholder: "🎁",
    imgBg: "bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]",
    cta: "¡Llevo el Combo! →",
    featured: true
  },
  "premium-negro": {
    badge: "🖤 Premium",
    badgeTone: "bg-[#1c1c1c] text-white",
    placeholder: "🖤",
    imgBg: "bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]",
    cta: "Quiero el Premium →"
  }
};

function formatPrice(value: number, currencyCode: string) {
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

function resolvePricingImage(product: CatalogProduct) {
  const fallback =
    storefrontV2PremiumProductArtBySlug[product.slug] ?? storefrontV2PremiumProductArtBySlug["clasico-verde"];
  const src = resolveStorefrontMediaSrc(product.imageUrl ?? fallback);

  return {
    src,
    remote: isRemoteStorefrontMediaUrl(src),
    alt: product.imageAlt ?? product.name
  };
}

function resolveFeaturedCopy(product: CatalogProduct) {
  if (product.slug === "clasico-verde") {
    return {
      description: "El favorito para el día a día. Frescura suave, mentol balanceado. Ideal para estudiantes, viajeros y quien quiere empezar.",
      features: ["Doble inhalador (2 vías)", "Aceites de mentol + eucalipto", "Hasta ~300 inhalaciones", "Tamaño mini-bolsillo"]
    };
  }

  if (product.slug === "combo-duo-perfecto") {
    return {
      description: "1 Clásico Verde + 1 Premium Negro. Uno para el día a día, otro para cuando necesitas más potencia. El pack completo.",
      features: ["1 Clásico Verde + 1 Premium Negro", "Envío prioritario incluido", "Perfectos para regalar", "Variedad de aromas y potencias"]
    };
  }

  return {
    description: "Más intenso, más poderoso. Para cuando el soroche o la jornada pesada necesitan una respuesta de alto impacto.",
    features: ["Fórmula intensificada (x1.5)", "Diseño elegante mate negro", "Hasta ~300 inhalaciones", "Ideal para altitudes extremas"]
  };
}

function PricingCard({
  product,
  currencyCode
}: {
  product: CatalogProduct;
  currencyCode: string;
}) {
  const style = STYLE_BY_SLUG[product.slug as (typeof DISPLAY_ORDER)[number]] ?? STYLE_BY_SLUG["clasico-verde"];
  const image = resolvePricingImage(product);
  const fallback = resolveFeaturedCopy(product);
  const description = product.description || fallback.description;
  const features = product.benefits.length > 0 ? product.benefits : fallback.features;
  const price = formatPrice(product.price, currencyCode);
  const compareAtPrice = product.compareAtPrice ? formatPrice(product.compareAtPrice, currencyCode) : null;
  const savings =
    compareAtPrice && product.compareAtPrice && product.compareAtPrice > product.price
      ? `Ahorras ${formatPrice(product.compareAtPrice - product.price, currencyCode)}`
      : null;

  return (
    <div
      className={`relative rounded-3xl bg-white p-8 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(26,58,46,0.12)] ${
        style.featured ? "scale-[1.02] border-2 border-[#61a740] shadow-[0_20px_60px_rgba(26,58,46,0.12)]" : "border-2 border-transparent"
      }`}
    >
      {style.featured ? (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#577e2f] to-[#61a740] px-5 py-2 text-xs font-bold text-white">
          {style.badge}
        </div>
      ) : (
        <div className={`mb-4 inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${style.badgeTone}`}>
          {style.badge}
        </div>
      )}

      <div className={`relative mb-6 flex h-44 items-center justify-center overflow-hidden rounded-2xl ${style.imgBg}`}>
        {image.src ? (
          <Image
            fill
            src={image.src}
            alt={image.alt}
            sizes="(min-width: 1024px) 22vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="select-none text-6xl">{style.placeholder}</span>
        )}
      </div>

      <h3 className="mb-2 font-serif text-xl font-bold text-[#1a3a2e]">{product.name}</h3>
      <p className="mb-5 text-sm leading-relaxed text-[#6b7280]">{description}</p>

      <div className="mb-1 flex items-baseline gap-3">
        <span className="font-serif text-4xl font-black text-[#1a3a2e]">{price}</span>
        {compareAtPrice ? <span className="text-base text-[#6b7280] line-through">{compareAtPrice}</span> : null}
      </div>

      {savings ? (
        <div className="mb-5 inline-block rounded-full bg-[#eef6e8] px-3 py-1 text-xs font-bold text-[#61a740]">
          {savings}
        </div>
      ) : product.compareAtPrice ? (
        <div className="mb-5 inline-block rounded-full bg-[#eef6e8] px-3 py-1 text-xs font-bold text-[#61a740]">
          {`Ahorro frente al precio de referencia`}
        </div>
      ) : null}

      <ul className="mb-7 space-y-2 border-t border-[#f4f4f0] pt-5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-[#6b7280]">
            <span className="mt-0.5 text-[#61a740]">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <AddToCartLink
        productSlug={product.slug}
        className={`block w-full rounded-full py-4 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 ${
          style.featured
            ? "bg-gradient-to-r from-[#577e2f] to-[#61a740] hover:shadow-[0_8px_30px_rgba(97,167,64,0.35)]"
            : "bg-[#61a740] hover:bg-[#577e2f]"
        }`}
      >
        {style.cta}
      </AddToCartLink>

      <Link
        href={`/producto/${product.slug}`}
        className="mt-3 block text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#61a740] transition hover:text-[#1a3a2e]"
      >
        Ver detalle
      </Link>
    </div>
  );
}

export function PricingSection({
  products,
  currencyCode = "PEN"
}: {
  products: CatalogProduct[];
  currencyCode?: string;
}) {
  const bySlug = new Map(products.map((product) => [product.slug, product] as const));
  const orderedProducts = DISPLAY_ORDER.map((slug) => bySlug.get(slug)).filter((product): product is CatalogProduct => Boolean(product));
  const visibleProducts = orderedProducts.length > 0 ? orderedProducts : products;
  const loading = false;

  return (
    <section id="tienda" className="bg-[#f4f4f0] py-24">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        <StorefrontReveal className="mb-14">
          <span className="mb-4 inline-block rounded-full bg-[#eef6e8] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#61a740]">
            Elige tu Huele Huele
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-[#1a3a2e] md:text-5xl">
            Simple. Natural. Tuyo.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-[#6b7280]">
            Elige el que va contigo. Envíos rápidos a todo el Perú vía Olva Courier y Shalom.
          </p>
        </StorefrontReveal>

        {loading && visibleProducts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-[rgba(97,167,64,0.16)] bg-white/60 px-6 py-10 text-center text-sm text-[#6b7280]">
            Cargando catálogo...
          </div>
        ) : null}

        <StorefrontReveal className="grid items-start gap-6 md:grid-cols-3" selector="[data-storefront-reveal-item]" stagger={0.1} y={24}>
          {visibleProducts.length > 0 ? (
            visibleProducts.map((product) => (
              <div key={product.slug} data-storefront-reveal-item>
                <PricingCard product={product} currencyCode={currencyCode} />
              </div>
            ))
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[rgba(97,167,64,0.16)] bg-white/70 px-6 py-10 text-center text-sm text-[#6b7280] md:col-span-3">
              No pudimos cargar productos desde el catálogo.
            </div>
          )}
        </StorefrontReveal>

        <StorefrontReveal className="mt-10 text-center text-sm text-[#6b7280]">
          <p>💳 Aceptamos billetera virtual, transferencia y contra-entrega · 🚚 Envíos en 24-72h a todo el Perú</p>
        </StorefrontReveal>
      </div>
    </section>
  );
}
