"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type CatalogProduct, type CatalogSummaryResponse } from "@huelegood/shared";
import { fetchCatalogSummary } from "../lib/api";
import { AddToCartLink } from "./add-to-cart-link";
import {
  cloudflareImageLoader,
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc,
  storefrontProductArtBySlug
} from "../features/storefront-v2/lib/media";

type CatalogCardStyle = {
  badgeStyle: string;
  emoji: string;
  imgBg: string;
  desc: string;
  tags: string[];
  priceNote?: string;
  priceSave?: string;
  featured?: boolean;
  btnClass: string;
  btnLabel: string;
};

const CARD_STYLE_BY_SLUG: Record<string, CatalogCardStyle> = {
  "clasico-verde": {
    badgeStyle: "bg-[#577e2f] text-white",
    emoji: "🌿",
    imgBg: "bg-gradient-to-br from-[#e8f5e9] to-[#eef6e8]",
    desc: "Frescura herbal suave para el día a día. Tráfico, oficina, estudio y viajes largos.",
    tags: ["Diario", "Viaje", "Oficina", "Frescura"],
    priceNote: "+ recarga incluida",
    btnClass: "bg-[#61a740] hover:bg-[#577e2f]",
    btnLabel: "Comprar"
  },
  "premium-negro": {
    badgeStyle: "bg-[#1c1c1c] text-white",
    emoji: "🖤",
    imgBg: "bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]",
    desc: "Fórmula intensificada. El de las noches, el gym y los viajes a la sierra.",
    tags: ["Gym", "Altitud", "Noche", "Foco"],
    priceNote: "+ recarga incluida",
    btnClass: "bg-[#61a740] hover:bg-[#577e2f]",
    btnLabel: "Comprar"
  },
  "combo-duo-perfecto": {
    badgeStyle: "bg-[#c9a84c] text-[#1a3a2e]",
    emoji: "🎁",
    imgBg: "bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]",
    desc: "1 Clásico Verde + 1 Premium Negro. El pack completo para compra doble o regalo.",
    tags: ["Verde + Negro", "Ahorro", "Regalo"],
    priceSave: "Mejor valor",
    btnClass: "bg-[#61a740] hover:bg-[#577e2f]",
    btnLabel: "Comprar"
  }
};

const CATEGORY_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "productos", label: "Individuales" },
  { id: "bundles", label: "Bundles" }
];

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

function compactDescription(value: string, maxLength = 96) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function resolveCardStyle(product: CatalogProduct): CatalogCardStyle {
  return CARD_STYLE_BY_SLUG[product.slug] ?? {
    badgeStyle: "bg-[#eef6e8] text-[#1a3a2e]",
    emoji: "✨",
    imgBg: "bg-gradient-to-br from-[#f4f4f0] to-[#e8f5e9]",
    desc: product.description,
    tags: product.benefits.slice(0, 4),
    btnClass: "bg-[#61a740] hover:bg-[#577e2f]",
    btnLabel: "Comprar"
  };
}

function resolveProductImage(product: CatalogProduct) {
  const fallback = storefrontProductArtBySlug[product.slug] ?? storefrontProductArtBySlug["clasico-verde"];
  const resolved = resolveStorefrontMediaSrc(product.imageUrl ?? fallback);

  return {
    src: resolved,
    remote: isRemoteStorefrontMediaUrl(resolved),
    alt: product.imageAlt ?? product.name
  };
}

function isProductPurchasable(product: CatalogProduct) {
  if (typeof product.isPurchasable === "boolean") {
    return product.isPurchasable;
  }

  if (typeof product.availableStock === "number") {
    return product.availableStock > 0;
  }

  return true;
}

function resolveStockBadge(product: CatalogProduct) {
  if (product.stockStatus === "out_of_stock") {
    return {
      label: product.stockLabel ?? "Sin stock",
      className: "bg-rose-50 text-rose-700"
    };
  }

  if (product.stockStatus === "low_stock") {
    return {
      label: product.stockLabel ?? "Pocas unidades",
      className: "bg-[#fff7e8] text-[#8c6331]"
    };
  }

  return null;
}

export function CatalogBrowser() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [catalog, setCatalog] = useState<CatalogSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetchCatalogSummary();
        if (!active) {
          return;
        }

        setCatalog(response.data);
      } catch {
        if (active) {
          setCatalog(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const products = catalog?.products ?? [];
  const currencyCode = catalog?.currencyCode ?? "PEN";
  const filters = catalog?.categories?.length
    ? CATEGORY_FILTERS.filter((filter) => filter.id === "todos" || catalog.categories.some((category) => category.slug === filter.id))
    : CATEGORY_FILTERS;

  const visibleProducts = useMemo(() => {
    if (!products.length) {
      return [];
    }

    return products.filter((product) => activeFilter === "todos" || product.categorySlug === activeFilter);
  }, [activeFilter, products]);

  return (
    <section className="bg-[hsl(var(--background))] pb-24 pt-32 md:pt-36">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-13 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="inline-block rounded-full bg-[#eef6e8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#61a740]">
              Nuestros productos
            </span>
            <h2 className="mt-4 mb-3 font-serif text-5xl font-black text-[#1a3a2e]">
              Todo Huele Huele,
              <br />
              en un solo lugar
            </h2>
            <p className="max-w-[560px] text-[17px] leading-7 text-[#6b7280]">
              Elige el que va contigo. Encuentra tu fórmula ideal en una compra simple y directa.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full border-[1.5px] px-4 py-2 text-sm font-medium transition ${
                  activeFilter === filter.id
                    ? "border-[#61a740] bg-[#eef6e8] text-[#1a3a2e]"
                    : "border-[rgba(97,167,64,0.22)] text-[#6b7280] hover:border-[#61a740] hover:bg-[#eef6e8] hover:text-[#1a3a2e]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading && !products.length ? (
          <div className="rounded-[1.75rem] border border-dashed border-[rgba(97,167,64,0.18)] bg-[#faf8f3] px-6 py-10 text-center text-sm text-[#6b7280]">
            Cargando catálogo...
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => {
            const style = resolveCardStyle(product);
            const image = resolveProductImage(product);
            const price = formatPrice(product.price, currencyCode);
            const compareAtPrice = product.compareAtPrice ? formatPrice(product.compareAtPrice, currencyCode) : null;
            const tags = style.tags.length ? style.tags : product.benefits;
            const description = compactDescription(style.desc || product.tagline || product.description);
            const purchasable = isProductPurchasable(product);
            const stockBadge = resolveStockBadge(product);
            const savings =
              compareAtPrice && product.compareAtPrice && product.compareAtPrice > product.price
                ? `Ahorras ${formatPrice(product.compareAtPrice - product.price, currencyCode)}`
                : style.priceSave;

            return style.featured ? (
              <div
                key={product.slug}
                className="col-span-1 overflow-hidden rounded-2xl border border-[rgba(97,167,64,0.12)] shadow-sm sm:col-span-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className={`relative min-h-[220px] overflow-hidden ${style.imgBg}`}>
                    {image.src ? (
                      <Image
                        fill
                        src={image.src}
                        loader={image.remote ? cloudflareImageLoader : undefined}
                        alt={image.alt}
                        sizes="(min-width: 1024px) 34vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="select-none text-7xl">{style.emoji}</span>
                      </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badgeStyle}`}>
                      {product.badge}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between bg-white p-6">
                    <div>
                      <h3 className="mb-2 font-serif text-xl font-black leading-snug text-[#1a3a2e]">
                        <Link href={`/producto/${product.slug}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="mb-4 text-sm leading-6 text-[#6b7280]">
                        {description}
                      </p>
                      <div className="mb-5 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#eef6e8] px-2.5 py-0.5 text-xs font-medium text-[#1a3a2e]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <div className="font-serif text-2xl font-bold text-[#1a3a2e]">{price}</div>
                        {compareAtPrice ? (
                          <div className="text-sm text-[#6b7280] line-through">{compareAtPrice}</div>
                        ) : null}
                        {savings ? (
                          <span className="mt-1 inline-block rounded-full bg-[#eef6e8] px-2 py-0.5 text-xs font-semibold text-[#61a740]">
                            {savings}
                          </span>
                        ) : null}
                        {stockBadge ? (
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${stockBadge.className}`}>
                            {stockBadge.label}
                          </span>
                        ) : null}
                      </div>
                      {purchasable ? (
                        <AddToCartLink
                          productSlug={product.slug}
                          className={`inline-flex h-12 min-w-[132px] items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition ${style.btnClass}`}
                        >
                          {style.btnLabel}
                        </AddToCartLink>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="inline-flex h-12 min-w-[132px] cursor-not-allowed items-center justify-center rounded-full bg-[#ece9e1] px-5 text-sm font-semibold text-[#7a8179]"
                        >
                          Sin stock
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/producto/${product.slug}`}
                        className="text-xs font-semibold uppercase tracking-[0.22em] text-[#61a740] transition hover:text-[#1a3a2e]"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={product.slug}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-[rgba(97,167,64,0.12)] bg-white shadow-sm"
              >
                <div className={`relative aspect-square overflow-hidden ${style.imgBg}`}>
                  {image.src ? (
                    <Image
                      fill
                      src={image.src}
                      loader={image.remote ? cloudflareImageLoader : undefined}
                      alt={image.alt}
                      sizes="(min-width: 1024px) 22vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="select-none text-6xl">{style.emoji}</span>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badgeStyle}`}>
                    {product.badge}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 font-serif text-lg font-black leading-snug text-[#1a3a2e]">
                    <Link href={`/producto/${product.slug}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-6 text-[#6b7280]">
                    {description}
                  </p>

                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {(style.tags.length ? style.tags : product.benefits).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#eef6e8] px-2.5 py-0.5 text-xs font-medium text-[#1a3a2e]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="font-serif text-2xl font-bold text-[#1a3a2e]">{price}</div>
                      {compareAtPrice ? (
                        <div className="text-sm text-[#6b7280] line-through">{compareAtPrice}</div>
                      ) : null}
                      {savings ? (
                        <div className="mt-1 text-xs font-semibold text-[#61a740]">{savings}</div>
                      ) : null}
                      {stockBadge ? (
                        <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockBadge.className}`}>
                          {stockBadge.label}
                        </div>
                      ) : null}
                      <div className="mt-0.5 text-xs text-[#6b7280]">{style.priceNote}</div>
                    </div>
                    {purchasable ? (
                      <AddToCartLink
                        productSlug={product.slug}
                        className={`inline-flex h-12 min-w-[132px] items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition ${style.btnClass}`}
                      >
                        {style.btnLabel}
                      </AddToCartLink>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="inline-flex h-12 min-w-[132px] cursor-not-allowed items-center justify-center rounded-full bg-[#ece9e1] px-5 text-sm font-semibold text-[#7a8179]"
                      >
                        Sin stock
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/producto/${product.slug}`}
                      className="text-xs font-semibold uppercase tracking-[0.22em] text-[#61a740] transition hover:text-[#1a3a2e]"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-[#6b7280]">
            💳 Billetera virtual · Transferencia · Contra-entrega &nbsp;|&nbsp; 🚚 Envíos 24-72h a todo el Perú
          </p>
          <a
            href="https://www.instagram.com/huele.good/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[rgba(97,167,64,0.3)] px-6 py-3 text-sm font-medium text-[#1a3a2e] transition hover:border-[#61a740] hover:bg-[#eef6e8]"
          >
            Ver más en @huele.good →
          </a>
        </div>
      </div>
    </section>
  );
}
