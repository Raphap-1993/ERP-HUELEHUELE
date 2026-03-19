import { Button, cn } from "@huelegood/ui";
import { StorefrontV2Panel, StorefrontV2SectionHeading } from "../components/storefront-v2-section";
import type { StorefrontV2UsageStep } from "../lib/content";

export function HowToUseSection({ steps }: { steps: StorefrontV2UsageStep[] }) {
  return (
    <section className="space-y-6">
      <StorefrontV2SectionHeading
        eyebrow="Cómo convertir mejor"
        title="Un recorrido simple entre inspiración, catálogo y compra."
        description="El rediseño organiza la narrativa para que el usuario entienda rápido el producto y caiga sobre rutas ya existentes."
        action={{ label: "Ir al checkout", href: "/checkout" }}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => {
          const dark = index === 1;

          return (
            <StorefrontV2Panel key={step.step} tone={dark ? "dark" : index === 0 ? "muted" : "light"} className="flex h-full flex-col">
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                      dark ? "bg-white/14 text-white" : "bg-[#17211a] text-white"
                    )}
                  >
                    {step.step}
                  </span>
                  <div className="space-y-3">
                    <h3 className={cn("text-[1.55rem] font-semibold tracking-[-0.03em]", dark ? "text-white" : "text-[#17211a]")}>
                      {step.title}
                    </h3>
                    <p className={cn("text-sm leading-7", dark ? "text-white/72" : "text-black/62")}>{step.description}</p>
                  </div>
                </div>
                <div>
                  <Button href={step.ctaHref} variant={dark ? "secondary" : "primary"}>
                    {step.ctaLabel}
                  </Button>
                </div>
              </div>
            </StorefrontV2Panel>
          );
        })}
      </div>
    </section>
  );
}
