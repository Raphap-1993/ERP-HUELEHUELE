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
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <StorefrontV2PremiumPanel tone="light" className="space-y-8">
        <StorefrontV2PremiumSectionHeading
          eyebrow="Por qué elegirlo"
          title="Lo esencial para una compra premium: claridad, frescura y portabilidad real."
          description="La decisión mejora cuando el producto se entiende rápido y cada formato tiene un rol claro dentro de la rutina."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {reasons.map((reason, index) => (
            <div key={reason.title} className="rounded-[1.7rem] border border-[#162117]/8 bg-white/84 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/36">0{index + 1}</p>
              <h3 className="mt-3 text-[1.35rem] font-semibold tracking-tight text-[#162117]">{reason.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/62">{reason.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.9rem] border border-[#162117]/8 bg-[linear-gradient(180deg,#f4f6f0_0%,#fffdf9_100%)] p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">Sensación premium</p>
          <p className="mt-3 max-w-3xl text-xl font-semibold tracking-[-0.03em] text-[#162117]">
            Una home más fuerte no vende más palabras: muestra mejor el producto, ordena la elección y deja respirar la marca.
          </p>
        </div>
      </StorefrontV2PremiumPanel>

      <StorefrontV2PremiumPanel tone="dark" className="flex flex-col justify-between gap-8">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{callout.label}</p>
          <h3 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-[3rem]">{callout.title}</h3>
          <p className="max-w-xl text-sm leading-7 text-white/72">{callout.description}</p>
        </div>

        <div className="grid gap-3">
          {callout.points.map((point, index) => (
            <div key={point} className="rounded-[1.7rem] border border-white/12 bg-white/8 px-5 py-5 text-sm leading-6 text-white/78">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">0{index + 1}</p>
              <p className="mt-3">{point}</p>
            </div>
          ))}
        </div>
      </StorefrontV2PremiumPanel>
    </section>
  );
}
