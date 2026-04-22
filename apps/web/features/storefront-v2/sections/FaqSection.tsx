import { FAQAccordion, Button } from "@huelegood/ui";
import type { FaqItem, PromoBanner } from "@huelegood/shared";
import { StorefrontV2Panel, StorefrontV2SectionHeading } from "../components/storefront-v2-section";

export function FaqSection({
  faqs,
  secondaryBanner
}: {
  faqs: FaqItem[];
  secondaryBanner: PromoBanner;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <StorefrontV2Panel tone="light" className="space-y-6">
        <StorefrontV2SectionHeading
          eyebrow="Preguntas frecuentes"
          title="La información crítica sigue visible y ordenada."
          description="Respuestas claras para elegir con confianza."
        />
        <div className="rounded-[1.85rem] border border-[#17211a]/8 bg-white/76 p-3 md:p-4">
          <FAQAccordion items={faqs} />
        </div>
      </StorefrontV2Panel>

      <StorefrontV2Panel tone="dark" className="flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">{secondaryBanner.note}</p>
          <h3 className="text-3xl font-semibold tracking-[-0.03em] text-white">{secondaryBanner.title}</h3>
          <p className="text-sm leading-7 text-white/74">{secondaryBanner.description}</p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1.65rem] border border-white/12 bg-white/8 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Compra simple</p>
            <p className="mt-2 text-sm leading-7 text-white/74">
              El camino a compra es directo y fácil de entender.
            </p>
          </div>
          <div className="rounded-[1.65rem] border border-white/12 bg-white/8 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Más opciones</p>
            <p className="mt-2 text-sm leading-7 text-white/74">
              Puedes comprar por catálogo o pedir atención mayorista según lo que necesites.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button href={secondaryBanner.ctaHref} variant="secondary">
            {secondaryBanner.ctaLabel}
          </Button>
          <Button href="/catalogo" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            Ver catálogo
          </Button>
        </div>
      </StorefrontV2Panel>
    </section>
  );
}
