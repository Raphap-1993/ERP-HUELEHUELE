import { Button } from "@huelegood/ui";
import type { StorefrontV2PremiumContent } from "../content";
import { StorefrontV2PremiumMedia } from "../components/storefront-v2-premium-media";
import { StorefrontV2PremiumPanel } from "../components/storefront-v2-premium-section";
import { storefrontV2PremiumMedia } from "../lib/media";

export function VendorCalloutSection({
  callout
}: {
  callout: StorefrontV2PremiumContent["vendorCallout"];
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <StorefrontV2PremiumPanel tone="dark" className="flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">{callout.label}</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-[2.85rem]">{callout.title}</h2>
          <p className="text-base leading-7 text-white/72">{callout.description}</p>
        </div>

        <div className="grid gap-3">
          {callout.points.map((point) => (
            <div key={point} className="rounded-[1.65rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/78">
              {point}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button href={callout.primaryCta.href} variant="secondary">
            {callout.primaryCta.label}
          </Button>
          <Button href={callout.secondaryCta.href} variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            {callout.secondaryCta.label}
          </Button>
        </div>
      </StorefrontV2PremiumPanel>

      <StorefrontV2PremiumMedia
        src={storefrontV2PremiumMedia.seller}
        alt="Canal vendedor y onboarding comercial Huele Huele"
        className="min-h-[520px]"
        overlay={
          <div className="flex h-full items-end p-6">
            <div className="max-w-md rounded-[1.7rem] border border-white/18 bg-white/80 p-5 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">Ruta dedicada</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#112017]">
                La landing anuncia el canal. La postulación completa vive en `trabaja-con-nosotros` para no competir con el flujo de compra.
              </p>
            </div>
          </div>
        }
      />
    </section>
  );
}
