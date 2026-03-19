import type { PremiumCallout, PremiumReason } from "../content";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";

export function WhyChooseSection({
  reasons,
  callout
}: {
  reasons: PremiumReason[];
  callout: PremiumCallout;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <StorefrontV2PremiumPanel tone="light" className="space-y-6">
        <StorefrontV2PremiumSectionHeading
          eyebrow="Por qué elegirlo"
          title="La decisión mejora cuando la propuesta se explica con calma, no con ruido."
          description="Este bloque deja clara la diferencia entre formato, ritual y facilidad de compra para reducir fricción de conversión."
        />
        <div className="grid gap-4">
          {reasons.map((reason) => (
            <div key={reason.title} className="rounded-[1.7rem] border border-[#112017]/8 bg-white/80 p-5">
              <h3 className="text-[1.35rem] font-semibold tracking-tight text-[#112017]">{reason.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/62">{reason.description}</p>
            </div>
          ))}
        </div>
      </StorefrontV2PremiumPanel>

      <StorefrontV2PremiumPanel tone="dark" className="flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{callout.label}</p>
          <h3 className="text-3xl font-semibold tracking-[-0.03em] text-white">{callout.title}</h3>
          <p className="text-sm leading-7 text-white/72">{callout.description}</p>
        </div>

        <div className="grid gap-3">
          {callout.points.map((point) => (
            <div key={point} className="rounded-[1.65rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/78">
              {point}
            </div>
          ))}
        </div>
      </StorefrontV2PremiumPanel>
    </section>
  );
}
