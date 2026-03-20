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
    <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <StorefrontV2PremiumPanel tone="light" className="space-y-6">
        <StorefrontV2PremiumSectionHeading eyebrow="FAQ" title="Respuestas rápidas antes de comprar." description="Solo lo que ayuda a decidir mejor: qué es, cuál elegir y cómo comprar." />
        <div className="rounded-[1.85rem] border border-[#112017]/8 bg-white/76 p-3 md:p-4">
          <FAQAccordion items={faqs} />
        </div>
      </StorefrontV2PremiumPanel>

      <StorefrontV2PremiumPanel tone="muted" className="space-y-6">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{callout.label}</p>
          <h3 className="text-3xl font-semibold tracking-[-0.03em] text-[#112017]">{callout.title}</h3>
          <p className="text-sm leading-7 text-black/64">{callout.description}</p>
        </div>

        <div className="grid gap-3">
          {callout.points.map((point) => (
            <div key={point} className="rounded-[1.65rem] border border-[#112017]/8 bg-white/82 p-5 text-sm leading-7 text-black/62">
              {point}
            </div>
          ))}
        </div>
      </StorefrontV2PremiumPanel>
    </section>
  );
}
