import Image from "next/image";
import type { CatalogProduct } from "@huelegood/shared";
import { Badge, Button, cn } from "@huelegood/ui";
import type { PremiumProductHighlight } from "../content";
import { StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";
import {
  cloudflareImageLoader,
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc,
  storefrontV2PremiumMedia,
  storefrontV2PremiumProductArtBySlug
} from "../lib/media";
import { premiumProductToneClasses } from "../tokens/storefront-v2-premium-tokens";

function highlightBySlug(highlights: PremiumProductHighlight[], slug: string) {
  return highlights.find((item) => item.slug === slug);
}

export function ProductCatalogSection({
  products,
  highlights
}: {
  products: CatalogProduct[];
  highlights: PremiumProductHighlight[];
}) {
  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Elige tu formato"
        title="Tres favoritos, una lectura rápida y salida directa a compra."
        description="El home no necesita un catálogo infinito. Solo la selección principal para decidir rápido y seguir al checkout sin fricción."
        action={{ label: "Ver catálogo completo", href: "/catalogo" }}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const tone = premiumProductToneClasses(product.tone);
          const art = storefrontV2PremiumProductArtBySlug[product.slug] ?? storefrontV2PremiumMedia.hero;
          const resolvedArt = resolveStorefrontMediaSrc(art);
          const isRemote = isRemoteStorefrontMediaUrl(resolvedArt);
          const highlight = highlightBySlug(highlights, product.slug);

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-[2.2rem] border border-[#112017]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,244,236,0.95)_100%)] shadow-[0_24px_70px_rgba(17,32,23,0.08)]"
            >
              <div className={cn("relative aspect-[4/4.6] overflow-hidden p-5", tone.frame)}>
                <div className="absolute inset-5 rounded-[1.85rem] border border-white/35" />
                <Image
                  fill
                  alt={product.name}
                  src={resolvedArt}
                  loader={isRemote ? cloudflareImageLoader : undefined}
                  sizes="(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw"
                  className="object-cover p-7"
                />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <Badge className={tone.badge}>{product.badge}</Badge>
                  {highlight ? (
                    <span className="rounded-full border border-black/8 bg-white/72 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-black/48">
                      {highlight.eyebrow}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className={cn("text-[11px] uppercase tracking-[0.24em]", tone.accent)}>{highlight?.eyebrow ?? product.badge}</p>
                      <h3 className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[#112017]">{product.name}</h3>
                    </div>
                    <div className="text-right text-[#112017]">
                      <div className="text-[1.95rem] font-semibold tracking-tight">${product.price}</div>
                      {product.compareAtPrice ? <div className="text-sm text-black/34 line-through">${product.compareAtPrice}</div> : null}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-black/58">{product.tagline}</p>
                  <p className="text-sm leading-7 text-black/62">{highlight?.story ?? product.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.benefits.slice(0, 3).map((benefit) => (
                    <span
                      key={benefit}
                      className="inline-flex items-center rounded-full border border-[#112017]/8 bg-[#f2f4ed] px-3 py-1 text-xs font-medium text-[#253326]"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button href={`/checkout?producto=${product.slug}`}>Comprar</Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
