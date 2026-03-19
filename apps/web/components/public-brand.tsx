"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn, Badge, Button, Card, CardContent, CardDescription, CardTitle } from "@huelegood/ui";
import type { CatalogProduct } from "@huelegood/shared";

export const brandArt = {
  hero: "/brand/hero-huele-huele.svg",
  office: "/brand/moment-office.svg",
  travel: "/brand/moment-travel.svg",
  traffic: "/brand/moment-traffic.svg",
  wholesale: "/brand/wholesale-hero.svg",
  seller: "/brand/seller-story.svg",
  checkout: "/brand/checkout-hero.svg"
} as const;

export const productArtBySlug: Record<string, string> = {
  "clasico-verde": "/brand/product-classic-green.svg",
  "premium-negro": "/brand/product-premium-black.svg",
  "combo-duo-perfecto": "/brand/product-duo-perfecto.svg"
};

function toneFrame(tone?: CatalogProduct["tone"]) {
  if (tone === "amber") {
    return "from-[#efe8da] via-[#f6f2ea] to-[#e3dcc9]";
  }

  if (tone === "graphite") {
    return "from-[#e4e9e1] via-[#f3f4f0] to-[#d7ddd4]";
  }

  return "from-[#e5eedb] via-[#f6f7f1] to-[#dce4d1]";
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
        "group relative overflow-hidden rounded-[2.55rem] border border-black/8 bg-[linear-gradient(145deg,#edf2e6_0%,#f9faf5_46%,#dde7d2_100%)] shadow-[0_28px_80px_rgba(20,32,22,0.1)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(19,32,22,0.08),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(196,155,93,0.22),transparent_28%)]" />
      <div className="absolute inset-[1px] rounded-[2.45rem] border border-white/35" />
      <Image
        fill
        priority={priority}
        sizes="(min-width: 1280px) 42vw, (min-width: 768px) 50vw, 100vw"
        src={src}
        alt={alt}
        className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.025]", imageClassName)}
      />
      {overlay ? <div className="absolute inset-0">{overlay}</div> : null}
    </div>
  );
}

export function EditorialProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const art = productArtBySlug[product.slug] ?? brandArt.hero;

        return (
          <Card
            key={product.id}
            className="overflow-hidden rounded-[2.2rem] border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,249,244,0.96)_100%)] shadow-[0_24px_70px_rgba(22,34,20,0.07)]"
          >
            <div className={cn("relative aspect-[4/4.4] overflow-hidden bg-gradient-to-br p-4", toneFrame(product.tone))}>
              <div className="absolute inset-4 rounded-[1.75rem] border border-white/35" />
              <Image fill src={art} alt={product.name} sizes="(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw" className="object-cover" />
              <div className="absolute left-4 top-4">
                <Badge
                  className={cn(
                    "backdrop-blur",
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
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-[1.45rem]">{product.name}</CardTitle>
                    <CardDescription className="text-sm leading-6">{product.tagline}</CardDescription>
                  </div>
                  <div className="text-right text-[#132016]">
                    <div className="text-[1.9rem] font-semibold tracking-tight">${product.price}</div>
                    {product.compareAtPrice ? (
                      <div className="text-sm text-black/35 line-through">${product.compareAtPrice}</div>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm leading-6 text-black/64">{product.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.benefits.map((benefit) => (
                  <Badge key={benefit} tone="neutral" className="bg-[#eef3e8] text-[#213523]">
                    {benefit}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.18em] text-black/38">{product.sku}</span>
                <Button href={`/checkout?producto=${product.slug}`} size="sm">
                  Comprar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
