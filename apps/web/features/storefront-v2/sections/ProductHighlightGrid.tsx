import Image from "next/image";
import { Badge, Button, cn } from "@huelegood/ui";
import type { CatalogProduct } from "@huelegood/shared";
import { cloudflareImageLoader, isRemoteStorefrontMediaUrl, resolveStorefrontMediaSrc, storefrontProductArtBySlug, storefrontV2Media } from "../lib/media";
import { productToneClasses } from "../tokens/storefront-tokens";
import { StorefrontV2SectionHeading } from "../components/storefront-v2-section";

function productDescriptor(product: CatalogProduct) {
  if (product.slug === "premium-negro") {
    return "Acabado premium";
  }

  if (product.slug === "combo-duo-perfecto") {
    return "Más valor";
  }

  return "Uso diario";
}

export function ProductHighlightGrid({
  products
}: {
  products: CatalogProduct[];
}) {
  return (
    <section className="space-y-6">
      <StorefrontV2SectionHeading
        eyebrow="Selección curada"
        title="El catálogo se siente más premium cuando cada ficha hace menos, pero mejor."
        description="Reutilizamos `featuredProducts` como fuente actual y solo reordenamos la presentación para elevar percepción y conversión."
        action={{ label: "Ver catálogo completo", href: "/catalogo" }}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const tone = productToneClasses(product.tone);
          const art = storefrontProductArtBySlug[product.slug] ?? storefrontV2Media.hero;
          const resolvedArt = resolveStorefrontMediaSrc(art);
          const isRemote = isRemoteStorefrontMediaUrl(resolvedArt);

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-[2.2rem] border border-[#17211a]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.95)_100%)] shadow-[0_24px_70px_rgba(23,33,26,0.08)]"
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
                  <span className="rounded-full border border-black/8 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-black/48">
                    {productDescriptor(product)}
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className={cn("text-[11px] uppercase tracking-[0.24em]", tone.accent)}>{product.categorySlug}</p>
                      <h3 className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[#17211a]">{product.name}</h3>
                    </div>
                    <div className="text-right text-[#17211a]">
                      <div className="text-[1.95rem] font-semibold tracking-tight">${product.price}</div>
                      {product.compareAtPrice ? <div className="text-sm text-black/34 line-through">${product.compareAtPrice}</div> : null}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-black/58">{product.tagline}</p>
                  <p className="text-sm leading-7 text-black/62">{product.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.benefits.map((benefit) => (
                    <span
                      key={benefit}
                      className="inline-flex items-center rounded-full border border-[#17211a]/8 bg-[#f2f4ed] px-3 py-1 text-xs font-medium text-[#253326]"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-black/36">{product.sku}</span>
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
