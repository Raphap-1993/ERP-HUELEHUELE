import { Button } from "@huelegood/ui";
import type { StorefrontV2PremiumContent } from "../content";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";

export function CommercialRoutesSection({
  wholesale,
  vendor
}: {
  wholesale: StorefrontV2PremiumContent["wholesaleCallout"];
  vendor: StorefrontV2PremiumContent["vendorCallout"];
}) {
  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Canales comerciales"
        title="Si buscas volumen o quieres vender la marca, esas rutas ya están separadas."
        description="La home se queda enfocada en producto. Mayoristas y vendedores tienen su propio espacio sin competir con la compra directa."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <StorefrontV2PremiumPanel tone="muted" className="space-y-5">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{wholesale.label}</p>
            <h3 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#112017]">{wholesale.title}</h3>
            <p className="max-w-2xl text-sm leading-7 text-black/64">{wholesale.description}</p>
          </div>

          <div className="grid gap-3">
            {wholesale.points.slice(0, 2).map((point) => (
              <div key={point} className="rounded-[1.55rem] border border-[#112017]/8 bg-white/82 px-4 py-4 text-sm leading-6 text-black/62">
                {point}
              </div>
            ))}
          </div>

          <div>
            <Button href="/mayoristas" variant="secondary">
              Ver plan mayorista
            </Button>
          </div>
        </StorefrontV2PremiumPanel>

        <StorefrontV2PremiumPanel tone="dark" className="space-y-5">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{vendor.label}</p>
            <h3 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">{vendor.title}</h3>
            <p className="max-w-2xl text-sm leading-7 text-white/72">{vendor.description}</p>
          </div>

          <div className="grid gap-3">
            {vendor.points.slice(0, 2).map((point) => (
              <div key={point} className="rounded-[1.55rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/78">
                {point}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href={vendor.primaryCta.href} variant="secondary">
              {vendor.primaryCta.label}
            </Button>
            <Button href={vendor.secondaryCta.href} variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              {vendor.secondaryCta.label}
            </Button>
          </div>
        </StorefrontV2PremiumPanel>
      </div>
    </section>
  );
}
