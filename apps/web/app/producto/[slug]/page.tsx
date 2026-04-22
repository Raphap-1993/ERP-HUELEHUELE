import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProductBySlug } from "../../../lib/api";
import {
  resolveStorefrontMediaSrc,
  storefrontProductArtBySlug
} from "../../../features/storefront-v2/lib/media";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function resolveProductImageSrc(slug: string, src?: string) {
  const fallback = storefrontProductArtBySlug[slug] ?? storefrontProductArtBySlug["clasico-verde"];
  return resolveStorefrontMediaSrc(src ?? fallback);
}

type StockAwareProduct = {
  availableStock?: number;
  isPurchasable?: boolean;
  stockStatus?: "available" | "low_stock" | "out_of_stock";
  stockLabel?: string;
};

function isPurchasable(product: StockAwareProduct) {
  if (typeof product.isPurchasable === "boolean") {
    return product.isPurchasable;
  }

  if (typeof product.availableStock === "number") {
    return product.availableStock > 0;
  }

  return true;
}

function resolveStockBadge(product: StockAwareProduct) {
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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const envelope = await fetchProductBySlug(slug).catch(() => null);
  const product = envelope?.data;

  if (!product) {
    notFound();
  }

  const currencyCode = product.currencyCode ?? "PEN";
  const price = formatPrice(product.price, currencyCode);
  const compareAtPrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, currencyCode)
      : null;
  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? `Ahorras ${formatPrice(product.compareAtPrice - product.price, currencyCode)}`
      : null;

  const images = (product.images ?? []).slice().sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });

  const primaryImage = images[0]?.url ?? product.imageUrl;
  const primaryAlt = images[0]?.altText ?? product.imageAlt ?? product.name;
  const primary = resolveProductImageSrc(product.slug, primaryImage);

  const variants = (product.variants ?? []).filter((variant) => variant.status === "active");
  const hasMultipleVariants = variants.length > 1;
  const checkoutHref = "/checkout";
  const bundleComponents = product.bundleComponents ?? [];
  const purchasable = isPurchasable(product);
  const stockBadge = resolveStockBadge(product);

  return (
    <main className="bg-[hsl(var(--background))] py-10">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Link href="/" className="hover:text-[#1a3a2e]">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/catalogo" className="hover:text-[#1a3a2e]">
              Catálogo
            </Link>
            <span>/</span>
            <span className="text-[#1a3a2e]">{product.name}</span>
          </div>
          {purchasable ? (
            <Link
              href={checkoutHref}
              className="rounded-full bg-[#61a740] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#577e2f]"
            >
              Comprar ahora
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="cursor-not-allowed rounded-full bg-[#ece9e1] px-5 py-2.5 text-sm font-semibold text-[#7a8179]"
            >
              Sin stock
            </span>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <section className="space-y-4">
            <div className="relative aspect-[4/3.6] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(26,58,46,0.10)]">
              <Image
                fill
                src={primary}
                alt={primaryAlt}
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover"
                priority
              />
            </div>

            {images.length > 1 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.slice(0, 8).map((image) => {
                  const resolved = resolveProductImageSrc(product.slug, image.url);
                  return (
                    <div
                      key={image.id}
                      className="relative aspect-square overflow-hidden rounded-2xl border border-black/10 bg-white"
                    >
                      <Image
                        fill
                        src={resolved}
                        alt={image.altText ?? product.name}
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef6e8] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#61a740]">
                {product.badge}
              </span>
              <h1 className="mt-4 font-serif text-5xl font-black leading-tight text-[#1a3a2e]">
                {product.name}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[#6b7280]">
                {product.tagline}
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-end gap-4">
                <div className="font-serif text-4xl font-black text-[#1a3a2e]">{price}</div>
                {compareAtPrice ? <div className="text-base text-[#6b7280] line-through">{compareAtPrice}</div> : null}
                {savings ? (
                  <span className="rounded-full bg-[#eef6e8] px-3 py-1 text-xs font-bold text-[#61a740]">
                    {savings}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#6b7280]">{product.description}</p>
              {stockBadge ? (
                <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${stockBadge.className}`}>
                  {stockBadge.label}
                </span>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {product.benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="rounded-full bg-[#f4f4f0] px-3 py-1 text-xs font-semibold text-[#1a3a2e]"
                  >
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {purchasable ? (
                  <Link
                    href={checkoutHref}
                    className="rounded-full bg-[#61a740] px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#577e2f]"
                  >
                    Comprar ahora
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-full bg-[#ece9e1] px-7 py-3 text-sm font-semibold text-[#7a8179]"
                  >
                    Sin stock
                  </span>
                )}
                <Link
                  href="/catalogo"
                  className="rounded-full border-2 border-[rgba(97,167,64,0.25)] px-7 py-3 text-sm font-semibold text-[#1a3a2e] transition hover:bg-[#eef6e8]"
                >
                  Ver catálogo
                </Link>
              </div>
            </div>

            {bundleComponents.length > 0 ? (
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-serif text-xl font-bold text-[#1a3a2e]">Incluye</h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Este combo descuenta stock de los productos componentes al momento de la compra.
                </p>
                <div className="mt-5 space-y-3">
                  {bundleComponents.map((component) => (
                    <div
                      key={component.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#1a3a2e]">
                          {component.productName}
                          {component.variantName ? <span className="text-[#6b7280]"> · {component.variantName}</span> : null}
                        </div>
                        <div className="text-xs text-[#6b7280]">{component.productSlug}</div>
                      </div>
                      <div className="text-sm font-bold text-[#1a3a2e]">x{component.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {hasMultipleVariants ? (
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-serif text-xl font-bold text-[#1a3a2e]">Opciones disponibles</h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Si este producto tuviera varias presentaciones, se muestran aqui.
                </p>
                <div className="mt-4 space-y-3">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#1a3a2e]">{variant.name}</div>
                        <div className="text-xs text-[#6b7280]">{variant.sku}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-bold text-[#1a3a2e]">{formatPrice(variant.price, currencyCode)}</div>
                        {isPurchasable(variant) ? (
                          <Link
                            href="/checkout"
                            className="rounded-full bg-[#577e2f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black"
                          >
                            Comprar
                          </Link>
                        ) : (
                          <span
                            aria-disabled="true"
                            className="cursor-not-allowed rounded-full bg-[#ece9e1] px-4 py-2 text-xs font-semibold text-[#7a8179]"
                          >
                            Sin stock
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
