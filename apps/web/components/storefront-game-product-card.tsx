"use client";

import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@huelegood/shared";
import {
  PRODUCT_VARIANTS_SECTION_ID,
  resolveStorefrontPrimaryAction,
  resolveStorefrontStockBadge
} from "../lib/storefront-purchase";
import {
  cloudflareImageLoader,
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc,
  storefrontProductArtBySlug
} from "../features/storefront-v2/lib/media";
import { gamePrototypeProductArt } from "../features/storefront-v2-game/content/storefront-v2-game-art";
import { HueleBadge, HueleButtonLink, HuelePanel } from "./huele-public-ui";
import { HueleCommerceAction } from "./huele-commerce-action";

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

function compactDescription(value: string, maxLength = 108) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function resolvePanelTone(product: CatalogProduct) {
  if (product.tone === "graphite") {
    return "dark" as const;
  }

  if (product.tone === "amber") {
    return "sun" as const;
  }

  return "cream" as const;
}

function resolveStockBadgeTone(stockBadge: ReturnType<typeof resolveStorefrontStockBadge>) {
  if (!stockBadge) {
    return "blue" as const;
  }

  if (stockBadge.className.includes("rose")) {
    return "coral" as const;
  }

  if (stockBadge.className.includes("8c6331")) {
    return "sun" as const;
  }

  return "blue" as const;
}

function resolveImage(product: CatalogProduct) {
  const fallback =
    gamePrototypeProductArt[product.slug as keyof typeof gamePrototypeProductArt] ??
    storefrontProductArtBySlug[product.slug] ??
    storefrontProductArtBySlug["clasico-verde"];
  const resolved = product.imageUrl ? resolveStorefrontMediaSrc(product.imageUrl) : fallback;

  return {
    src: resolved,
    alt: product.imageAlt ?? product.name,
    remote: isRemoteStorefrontMediaUrl(resolved)
  };
}

export function StorefrontGameProductCard({
  product,
  compact = false
}: {
  product: CatalogProduct;
  compact?: boolean;
}) {
  const image = resolveImage(product);
  const currencyCode = product.currencyCode ?? "PEN";
  const price = formatPrice(product.price, currencyCode);
  const compareAtPrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, currencyCode)
      : null;
  const description = compactDescription(product.tagline || product.description);
  const stockBadge = resolveStorefrontStockBadge(product);
  const action = resolveStorefrontPrimaryAction(product);
  const benefits = product.benefits.slice(0, compact ? 2 : 3);
  const panelTone = resolvePanelTone(product);
  const isDarkPanel = panelTone === "dark";

  return (
    <HuelePanel tone={panelTone} className={compact ? "hh-catalog-product-card h-full" : "h-full"}>
      <div className={compact ? "hh-catalog-product-card-inner" : "grid gap-4 xl:grid-cols-[160px_minmax(0,1fr)] xl:items-start"}>
        <div className={compact ? "hh-catalog-product-media-stack" : "space-y-3"}>
          <div className="hh-catalog-product-image-shell rounded-[18px] shadow-[0_18px_38px_rgba(4,24,12,0.12)]">
            <div className="relative aspect-square overflow-hidden rounded-[14px] bg-white/45">
              <Image
                fill
                src={image.src}
                loader={image.remote ? cloudflareImageLoader : undefined}
                alt={image.alt}
                sizes={compact ? "(min-width: 821px) 45vw, (min-width: 641px) 88vw, 92vw" : "(min-width: 1024px) 16vw, 100vw"}
                className="object-contain p-3"
              />
            </div>
          </div>

          <div className={compact ? "hh-catalog-product-badges flex flex-wrap gap-2" : "flex flex-wrap gap-2"}>
            <HueleBadge tone="green">{product.badge}</HueleBadge>
            {stockBadge ? (
              <HueleBadge tone={resolveStockBadgeTone(stockBadge)}>{stockBadge.label}</HueleBadge>
            ) : null}
          </div>
        </div>

        <div className={compact ? "hh-catalog-product-body flex h-full flex-col" : "flex h-full flex-col"}>
          <div className={compact ? "hh-catalog-product-main flex flex-wrap items-start justify-between gap-3" : "flex flex-wrap items-start justify-between gap-3"}>
            <div className={compact ? "hh-catalog-product-title-wrap" : undefined}>
              <h3 className={`text-3xl leading-none ${isDarkPanel ? "text-white" : "text-[var(--hh-public-green-950)]"}`}>
                <Link href={`/producto/${product.slug}`} className="transition hover:opacity-78">
                  {product.name}
                </Link>
              </h3>
              <p className={`mt-2 text-xs font-black uppercase leading-5 ${isDarkPanel ? "text-white/62" : "text-[var(--hh-public-muted)]"}`}>
                {product.sku}
              </p>
            </div>

            <div className={`hh-catalog-product-price text-right ${isDarkPanel ? "text-white" : "text-[var(--hh-public-green-950)]"}`}>
              <div className="text-3xl font-black leading-none">{price}</div>
              {compareAtPrice ? <div className="mt-1 text-sm line-through opacity-60">{compareAtPrice}</div> : null}
            </div>
          </div>

          <p className={`hh-catalog-product-description mt-4 text-base font-semibold leading-7 ${isDarkPanel ? "text-white/74" : "text-[var(--hh-public-muted)]"}`}>
            {description}
          </p>

          <div className="hh-catalog-product-benefits mt-4 flex flex-wrap gap-2">
            {benefits.map((benefit) => (
              <HueleBadge key={benefit} tone={isDarkPanel ? "dark" : "cream"}>
                {benefit}
              </HueleBadge>
            ))}
          </div>

          <div className="hh-catalog-product-actions mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <HueleCommerceAction action={action} productSlug={product.slug} />

            <HueleButtonLink href={`/producto/${product.slug}#${PRODUCT_VARIANTS_SECTION_ID}`} tone={isDarkPanel ? "ghost" : "secondary"}>
              Ver detalle
            </HueleButtonLink>
          </div>
        </div>
      </div>
    </HuelePanel>
  );
}
