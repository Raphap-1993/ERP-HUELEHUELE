import { WholesalePlanCard } from "@huelegood/ui";
import type { PremiumCallout } from "../content";
import type { WholesalePlan } from "@huelegood/shared";
import { StorefrontV2PremiumMedia } from "../components/storefront-v2-premium-media";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";
import { storefrontV2PremiumMedia } from "../lib/media";

export function WholesaleSection({
  plans,
  callout
}: {
  plans: WholesalePlan[];
  callout: PremiumCallout;
}) {
  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Wholesale"
        title="Compra por volumen y distribución con una salida B2B visible y seria."
        description="El canal mayorista no compite con la compra directa: se presenta como una ruta paralela con criterios claros, beneficios y continuidad comercial."
      />

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <StorefrontV2PremiumMedia
          src={storefrontV2PremiumMedia.wholesale}
          alt="Bloque comercial para canal mayorista Huele Huele"
          className="min-h-[520px]"
          overlay={
            <div className="flex h-full items-end p-6">
              <div className="max-w-sm rounded-[1.7rem] border border-white/18 bg-white/78 p-5 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{callout.label}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#112017]">{callout.title}</p>
              </div>
            </div>
          }
        />

        <StorefrontV2PremiumPanel tone="muted" className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#667064]">{callout.label}</p>
            <h3 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#112017] md:text-[2.6rem]">{callout.title}</h3>
            <p className="max-w-2xl text-base leading-7 text-black/62">{callout.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <WholesalePlanCard key={plan.tier} plan={plan} />
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {callout.points.map((point) => (
              <div key={point} className="rounded-[1.6rem] border border-[#112017]/8 bg-white/82 p-4 text-sm leading-6 text-black/62">
                {point}
              </div>
            ))}
          </div>
        </StorefrontV2PremiumPanel>
      </div>
    </section>
  );
}
