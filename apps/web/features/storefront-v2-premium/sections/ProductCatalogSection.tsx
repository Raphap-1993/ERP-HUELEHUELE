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

export function ProductCatalogSection({
  products,
  highlights
}: {
  products: CatalogProduct[];
  highlights: PremiumProductHighlight[];
}) {
  const [classicGreen, premiumBlack, duoPerfecto] = products;

  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Productos destacados"
        title="Tres piezas editadas para verse claras y comprarse rápido."
        description="Clásico Verde abre la lectura, Premium Negro afina la presencia y Combo Dúo Perfecto resuelve una compra doble con más valor."
        action={{ label: "Ver los tres formatos", href: "/catalogo" }}
      />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[1.08fr_0.92fr]">
        {classicGreen ? (
          <article className="overflow-hidden rounded-[2.5rem] border border-[#162117]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,241,232,0.96)_100%)] shadow-[0_24px_70px_rgba(22,33,23,0.08)]">
            <div className="grid h-full lg:grid-cols-[0.98fr_1.02fr]">
              <div className={cn("relative overflow-hidden", premiumProductToneClasses(classicGreen.tone).frame, "min-h-[420px] p-6")}>
                <div className="absolute inset-5 rounded-[2rem] border border-white/34" />
                <Image
                  fill
                  alt={classicGreen.name}
                  src={resolveStorefrontMediaSrc(storefrontV2PremiumProductArtBySlug[classicGreen.slug] ?? storefrontV2PremiumMedia.hero)}
                  loader={isRemoteStorefrontMediaUrl(resolveStorefrontMediaSrc(storefrontV2PremiumProductArtBySlug[classicGreen.slug] ?? storefrontV2PremiumMedia.hero)) ? cloudflareImageLoader : undefined}
                  sizes="(min-width: 1280px) 38vw, 100vw"
                  className="object-cover p-9"
                />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <Badge className={premiumProductToneClasses(classicGreen.tone).badge}>{classicGreen.badge}</Badge>
                  <span className="rounded-full border border-black/8 bg-white/78 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-black/48">
                    {highlightBySlug(highlights, classicGreen.slug)?.eyebrow ?? "Favorito diario"}
                  </span>
                </div>
              </div>

              <div className="flex h-full flex-col justify-between gap-8 p-6 md:p-8">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className={cn("text-[11px] uppercase tracking-[0.26em]", premiumProductToneClasses(classicGreen.tone).accent)}>
                        {highlightBySlug(highlights, classicGreen.slug)?.eyebrow ?? classicGreen.badge}
                      </p>
                      <h3 className="text-[2.25rem] font-semibold tracking-[-0.04em] text-[#162117] md:text-[2.8rem]">{classicGreen.name}</h3>
                    </div>
                    <div className="text-right text-[#162117]">
                      <div className="text-[2.35rem] font-semibold tracking-tight">
                        {formatPrice(classicGreen.price, classicGreen.currencyCode ?? "PEN")}
                      </div>
                      {classicGreen.compareAtPrice ? (
                        <div className="text-sm text-black/34 line-through">
                          {formatPrice(classicGreen.compareAtPrice, classicGreen.currencyCode ?? "PEN")}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-black/58">{classicGreen.tagline}</p>
                    <p className="text-sm leading-7 text-black/62">{highlightBySlug(highlights, classicGreen.slug)?.story ?? classicGreen.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {classicGreen.benefits.map((benefit) => (
                      <div key={benefit} className="rounded-[1.35rem] border border-[#162117]/8 bg-[#f7f3ea] px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-black/38">Clave</p>
                        <p className="mt-2 text-sm font-semibold text-[#162117]">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm leading-6 text-black/48">Clásico Verde como entrada limpia a la marca.</p>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/producto/${classicGreen.slug}`}
                      className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d6a4f] hover:text-[#162117]"
                    >
                      Ver detalle
                    </a>
                    <Button href={`/checkout?producto=${classicGreen.slug}`}>Comprar</Button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ) : null}

        <div className="grid gap-5">
          {[premiumBlack, duoPerfecto]
            .filter((product): product is CatalogProduct => Boolean(product))
            .map((product) => {
              const tone = premiumProductToneClasses(product.tone);
              const highlight = highlightBySlug(highlights, product.slug);
              const resolvedArt = resolveStorefrontMediaSrc(storefrontV2PremiumProductArtBySlug[product.slug] ?? storefrontV2PremiumMedia.hero);
              const remote = isRemoteStorefrontMediaUrl(resolvedArt);

              return (
                <article
                  key={product.id}
                  className="grid overflow-hidden rounded-[2.2rem] border border-[#162117]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,241,232,0.96)_100%)] shadow-[0_20px_56px_rgba(22,33,23,0.07)] md:grid-cols-[0.92fr_1.08fr]"
                >
                  <div className={cn("relative min-h-[240px] overflow-hidden", tone.frame)}>
                    <div className="absolute inset-4 rounded-[1.7rem] border border-white/34" />
                    <Image
                      fill
                      alt={product.name}
                      src={resolvedArt}
                      loader={remote ? cloudflareImageLoader : undefined}
                      sizes="(min-width: 1280px) 22vw, 100vw"
                      className="object-cover p-7"
                    />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge className={tone.badge}>{product.badge}</Badge>
                    </div>
                  </div>

                  <div className="flex h-full flex-col justify-between gap-5 p-5 md:p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <p className={cn("text-[11px] uppercase tracking-[0.26em]", tone.accent)}>{highlight?.eyebrow ?? product.badge}</p>
                          <h3 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[#162117]">{product.name}</h3>
                        </div>
                        <div className="text-right text-[#162117]">
                          <div className="text-[1.95rem] font-semibold tracking-tight">
                            {formatPrice(product.price, product.currencyCode ?? "PEN")}
                          </div>
                          {product.compareAtPrice ? (
                            <div className="text-sm text-black/34 line-through">
                              {formatPrice(product.compareAtPrice, product.currencyCode ?? "PEN")}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <p className="text-sm leading-7 text-black/62">{highlight?.story ?? product.description}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {product.benefits.slice(0, 3).map((benefit) => (
                          <span
                            key={benefit}
                            className="inline-flex items-center rounded-full border border-[#162117]/8 bg-[#f4efe4] px-3 py-1 text-xs font-medium text-[#253326]"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm leading-6 text-black/48">Compra directa desde la referencia que ya tienes en mente.</p>
                        <div className="flex items-center gap-3">
                          <a
                            href={`/producto/${product.slug}`}
                            className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d6a4f] hover:text-[#162117]"
                          >
                            Ver detalle
                          </a>
                          <Button href={`/checkout?producto=${product.slug}`}>Comprar</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
}
