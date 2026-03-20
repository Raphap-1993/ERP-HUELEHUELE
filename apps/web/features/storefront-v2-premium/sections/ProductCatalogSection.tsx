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
        eyebrow="Selección curada"
        title="Tres inhaladores herbales que explican la marca sin ruido."
        description="La composición toma una lógica editorial: un favorito para el día a día, una opción más sobria y un combo pensado para viajes, oficina o doble uso."
        action={{ label: "Ver catálogo completo", href: "/catalogo" }}
      />

      <div className="grid gap-5 xl:auto-rows-fr xl:grid-cols-12">
        {products.map((product, index) => {
          const tone = premiumProductToneClasses(product.tone);
          const art = storefrontV2PremiumProductArtBySlug[product.slug] ?? storefrontV2PremiumMedia.hero;
          const resolvedArt = resolveStorefrontMediaSrc(art);
          const isRemote = isRemoteStorefrontMediaUrl(resolvedArt);
          const highlight = highlightBySlug(highlights, product.slug);
          const featured = index === 0;

          return (
            <article
              key={product.id}
              className={cn(
                "overflow-hidden rounded-[2.4rem] border border-[#162117]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,244,236,0.95)_100%)] shadow-[0_28px_80px_rgba(22,33,23,0.08)]",
                featured ? "xl:col-span-7 xl:row-span-2" : "xl:col-span-5"
              )}
            >
              <div className={cn("grid h-full", featured ? "lg:grid-cols-[0.98fr_1.02fr]" : "md:grid-cols-[0.84fr_1.16fr]")}>
                <div className={cn("relative overflow-hidden", tone.frame, featured ? "min-h-[420px] p-6" : "min-h-[300px] p-5")}>
                  <div className="absolute inset-5 rounded-[1.95rem] border border-white/35" />
                  <Image
                    fill
                    alt={product.name}
                    src={resolvedArt}
                    loader={isRemote ? cloudflareImageLoader : undefined}
                    sizes={featured ? "(min-width: 1280px) 36vw, (min-width: 768px) 42vw, 100vw" : "(min-width: 1280px) 22vw, (min-width: 768px) 42vw, 100vw"}
                    className={cn("object-cover", featured ? "p-10" : "p-7")}
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

                <div className={cn("flex h-full flex-col justify-between p-6", featured ? "gap-8 md:p-8" : "gap-6")}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className={cn("text-[11px] uppercase tracking-[0.26em]", tone.accent)}>{highlight?.eyebrow ?? product.badge}</p>
                        <h3 className={cn("font-semibold tracking-[-0.035em] text-[#162117]", featured ? "text-[2.3rem]" : "text-[1.7rem]")}>{product.name}</h3>
                      </div>
                      <div className="text-right text-[#162117]">
                        <div className={cn("font-semibold tracking-tight", featured ? "text-[2.4rem]" : "text-[2rem]")}>${product.price}</div>
                        {product.compareAtPrice ? <div className="text-sm text-black/34 line-through">${product.compareAtPrice}</div> : null}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-black/58">{product.tagline}</p>
                      <p className="text-sm leading-7 text-black/62">{highlight?.story ?? product.description}</p>
                    </div>

                    <div className={cn("grid gap-3", featured ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                      <div className="rounded-[1.4rem] border border-[#162117]/8 bg-[#f6f7f2] px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-black/38">Ideal para</p>
                        <p className="mt-2 text-sm font-semibold text-[#162117]">{product.benefits[0]}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-[#162117]/8 bg-[#f6f7f2] px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-black/38">Perfil</p>
                        <p className="mt-2 text-sm font-semibold text-[#162117]">{product.benefits[1]}</p>
                      </div>
                      <div className={cn("rounded-[1.4rem] border border-[#162117]/8 bg-[#f6f7f2] px-4 py-4", !featured && "sm:col-span-2")}>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-black/38">Mejor uso</p>
                        <p className="mt-2 text-sm font-semibold text-[#162117]">{product.benefits[2]}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {product.benefits.slice(0, 3).map((benefit) => (
                        <span
                          key={benefit}
                          className="inline-flex items-center rounded-full border border-[#162117]/8 bg-[#f2f4ed] px-3 py-1 text-xs font-medium text-[#253326]"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm leading-6 text-black/48">Compra directa y lectura clara del producto desde la home.</p>
                      <Button href={`/checkout?producto=${product.slug}`}>Comprar</Button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
