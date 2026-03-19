import { cn } from "@huelegood/ui";
import { StorefrontV2Panel, StorefrontV2SectionHeading } from "../components/storefront-v2-section";
import type { StorefrontV2Benefit } from "../lib/content";

export function BenefitsGridSection({ benefits }: { benefits: StorefrontV2Benefit[] }) {
  return (
    <section className="space-y-6">
      <StorefrontV2SectionHeading
        eyebrow="Por qué esta capa nueva"
        title="Un storefront más premium sin abrir un refactor masivo."
        description="La propuesta v2 moderniza la lectura visual, mejora la jerarquía y deja preparada la capa de media remota sin mover los flujos críticos."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {benefits.map((benefit, index) => {
          const dark = benefit.tone === "dark";

          return (
            <StorefrontV2Panel
              key={benefit.title}
              tone={dark ? "dark" : index === 0 ? "muted" : "light"}
              className={cn(index === 2 && "md:col-span-2 xl:col-span-2")}
            >
              <div className="space-y-4">
                <p className={cn("text-[11px] uppercase tracking-[0.26em]", dark ? "text-white/42" : "text-black/38")}>{benefit.eyebrow}</p>
                <h3 className={cn("text-[1.65rem] font-semibold tracking-[-0.03em]", dark ? "text-white" : "text-[#17211a]")}>{benefit.title}</h3>
                <p className={cn("text-sm leading-7", dark ? "text-white/72" : "text-black/62")}>{benefit.description}</p>
              </div>
            </StorefrontV2Panel>
          );
        })}
      </div>
    </section>
  );
}
