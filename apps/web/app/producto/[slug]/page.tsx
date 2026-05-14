import { notFound } from "next/navigation";
import { ProductPurchaseExperience } from "../../../components/product-purchase-experience";
import { fetchProductBySlug } from "../../../lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeDetailAttributeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isAromaDetailAttribute(label: string) {
  const normalized = normalizeDetailAttributeLabel(label);
  return normalized === "aroma" || normalized === "aromas";
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const envelope = await fetchProductBySlug(slug).catch(() => null);
  const product = envelope?.data;

  if (!product) {
    notFound();
  }

  const detailAttributes = product.detailAttributes ?? [];
  const bundleComponents = product.bundleComponents ?? [];

  return (
    <main className="bg-[hsl(var(--background))] py-10">
      <div className="mx-auto max-w-[1120px] space-y-6 px-6">
        <ProductPurchaseExperience product={product} />

        {detailAttributes.length > 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-[#1a3a2e]">Detalles del producto</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {detailAttributes.map((attribute, index) => (
                <div
                  key={`${attribute.label}:${index}`}
                  className="rounded-2xl border border-black/8 bg-[#faf8f3] px-4 py-3"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b876f]">
                    {attribute.label}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#1a3a2e]">{attribute.value}</div>
                  {isAromaDetailAttribute(attribute.label) ? (
                    <div className="mt-3 rounded-2xl border border-[rgba(97,167,64,0.16)] bg-[#f7fbf5] px-3 py-2 text-xs leading-5 text-[#1a3a2e]">
                      Este bloque es informativo. La compra se resuelve desde la selección de variante de arriba.
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
      </div>
    </main>
  );
}
