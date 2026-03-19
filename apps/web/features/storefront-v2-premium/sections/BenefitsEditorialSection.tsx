import { cn } from "@huelegood/ui";
import type { PremiumBenefit } from "../content";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";

export function BenefitsEditorialSection({ benefits }: { benefits: PremiumBenefit[] }) {
  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Beneficios editoriales"
        title="La percepción premium viene de cómo se ordena la experiencia, no solo del color o del claim."
        description="La nueva composición separa portabilidad, claridad y compatibilidad operativa para que la marca venda mejor sin romper la base actual."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {benefits.map((benefit, index) => {
          const dark = benefit.tone === "dark";

          return (
            <StorefrontV2PremiumPanel
              key={benefit.title}
              tone={dark ? "dark" : index === 0 ? "muted" : "light"}
              className={cn(index === 2 && "md:col-span-2 xl:col-span-2")}
            >
              <div className="space-y-4">
                <p className={cn("text-[11px] uppercase tracking-[0.26em]", dark ? "text-white/42" : "text-black/38")}>{benefit.eyebrow}</p>
                <h3 className={cn("text-[1.65rem] font-semibold tracking-[-0.03em]", dark ? "text-white" : "text-[#112017]")}>{benefit.title}</h3>
                <p className={cn("text-sm leading-7", dark ? "text-white/72" : "text-black/62")}>{benefit.description}</p>
              </div>
            </StorefrontV2PremiumPanel>
          );
        })}
      </div>
    </section>
  );
}
