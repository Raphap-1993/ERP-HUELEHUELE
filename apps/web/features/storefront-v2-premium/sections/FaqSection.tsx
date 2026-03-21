import { FAQAccordion } from "@huelegood/ui";
import type { FaqItem } from "@huelegood/shared";
import type { PremiumCallout } from "../content";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";

export function FaqSection({
  faqs,
  callout
}: {
  faqs: FaqItem[];
  callout: PremiumCallout;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.02fr_0.98fr]">
      <StorefrontV2PremiumPanel tone="light" className="space-y-6">
        <StorefrontV2PremiumSectionHeading
          eyebrow="Preguntas frecuentes"
          title="Respuestas cortas para comprar con más claridad."
          description="Una tienda premium no sobreexplica. Resuelve formato, elección y portabilidad para que la compra avance."
        />
        <div className="rounded-[1.95rem] border border-[#162117]/8 bg-white/78 p-3 md:p-4">
          <FAQAccordion items={faqs} />
        </div>
      </StorefrontV2PremiumPanel>

      <StorefrontV2PremiumPanel tone="muted" className="space-y-6">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{callout.label}</p>
          <h3 className="text-3xl font-semibold tracking-[-0.04em] text-[#162117] md:text-[3rem]">{callout.title}</h3>
          <p className="text-sm leading-7 text-black/64">{callout.description}</p>
        </div>

        <div className="grid gap-3">
          {callout.points.map((point, index) => (
            <div key={point} className="rounded-[1.75rem] border border-[#162117]/8 bg-white/84 p-5 text-sm leading-7 text-black/62">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/36">0{index + 1}</p>
              <p className="mt-3">{point}</p>
            </div>
          ))}
        </div>
      </StorefrontV2PremiumPanel>
    </section>
  );
}
