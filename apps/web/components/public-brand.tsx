"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn, Badge, Button, Card, CardContent, CardDescription, CardTitle } from "@huelegood/ui";
import type { CatalogProduct } from "@huelegood/shared";
import { brandArt, productArtBySlug } from "./public-brand-art";

export { brandArt, productArtBySlug } from "./public-brand-art";

function toneFrame(tone?: CatalogProduct["tone"]) {
  if (tone === "amber") {
    return "from-[#efe8da] via-[#f6f2ea] to-[#e3dcc9]";
  }

  if (tone === "graphite") {
    return "from-[#e4e9e1] via-[#f3f4f0] to-[#d7ddd4]";
  }

  return "from-[#e5eedb] via-[#f6f7f1] to-[#dce4d1]";
}

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

export function EditorialMedia({
  src,
  alt,
  className,
  overlay,
  imageClassName,
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  overlay?: ReactNode;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-black/6 bg-[#efeae1] shadow-[0_16px_42px_rgba(20,32,22,0.05)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(19,32,22,0.05),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(198,184,157,0.14),transparent_30%)]" />
      <div className="absolute inset-[1px] rounded-[1.95rem] border border-white/55" />
      <Image
        fill
        priority={priority}
        sizes="(min-width: 1280px) 42vw, (min-width: 768px) 50vw, 100vw"
        src={src}
        alt={alt}
        className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.01]", imageClassName)}
      />
      {overlay ? <div className="absolute inset-0">{overlay}</div> : null}
    </div>
  );
}

export function EditorialProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const art = productArtBySlug[product.slug] ?? brandArt.hero;
        const currencyCode = product.currencyCode ?? "PEN";
        const price = formatPrice(product.price, currencyCode);
        const compareAtPrice =
          product.compareAtPrice && product.compareAtPrice > product.price
            ? formatPrice(product.compareAtPrice, currencyCode)
            : null;

        return (
          <Card
            key={product.id}
            className="overflow-hidden rounded-[1.9rem] border-black/6 bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(247,241,233,0.94)_100%)] shadow-[0_12px_36px_rgba(22,34,20,0.04)]"
          >
            <div className={cn("relative aspect-[4/4.4] overflow-hidden bg-gradient-to-br p-3.5", toneFrame(product.tone))}>
              <div className="absolute inset-3.5 rounded-[1.45rem] border border-white/40" />
              <Image fill src={art} alt={product.name} sizes="(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw" className="object-cover" />
              <div className="absolute left-4 top-4">
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] backdrop-blur",
                    product.tone === "amber"
                      ? "bg-white/72 text-[#7b4f1e]"
                      : product.tone === "graphite"
                        ? "bg-white/72 text-[#132016]"
                        : "bg-[#132016] text-white"
                  )}
                >
                  {product.badge}
                </Badge>
              </div>
            </div>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="font-serif text-[1.5rem] tracking-[-0.04em]">{product.name}</CardTitle>
                    <CardDescription className="text-sm leading-6 text-black/56">{product.tagline}</CardDescription>
                  </div>
                  <div className="text-right text-[#132016]">
                    <div className="text-[1.8rem] font-semibold tracking-[-0.04em]">{price}</div>
                    {compareAtPrice ? (
                      <div className="text-sm text-black/35 line-through">{compareAtPrice}</div>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm leading-6 text-black/60">{product.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.benefits.map((benefit) => (
                  <Badge key={benefit} tone="neutral" className="rounded-full bg-[#edf2e8] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#213523]">
                    {benefit}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button href={`/checkout?producto=${product.slug}`} size="sm">
                  Comprar ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
