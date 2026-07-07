import { cn } from "@huelegood/ui";
import { StorefrontReveal } from "../components/StorefrontReveal";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";

type LandingBenefit = {
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  tone?: "dark";
};

const BENEFITS: LandingBenefit[] = [
  {
    label: "01",
    eyebrow: "Portátil",
    title: "Cabe fácil en bolso, carro o escritorio.",
    body: "El valor se entiende rápido cuando el formato acompaña trayectos, oficina y días largos sin pedir una rutina nueva."
  },
  {
    label: "02",
    eyebrow: "Reset fresco",
    title: "La sensación herbal se lee en segundos.",
    body: "La home baja ruido visual para que la promesa principal se entienda antes de abrir catálogo o detalle."
  },
  {
    label: "03",
    eyebrow: "Compra clara",
    title: "Tres formatos bien diferenciados para decidir rápido.",
    body: "Clásico Verde abre la puerta, Premium Negro sube el acabado y el Combo resuelve una compra doble con más valor.",
    tone: "dark"
  },
  {
    label: "04",
    eyebrow: "Escenas reales",
    title: "Funciona mejor cuando se muestra en movimiento.",
    body: "Trayectos, altura, oficina y vida diaria hacen más creíble la historia del producto que una metáfora de videojuego."
  },
  {
    label: "05",
    eyebrow: "Compra directa",
    title: "Si ya sabes cuál te gusta, compras sin rodeos.",
    body: "La landing ordena la decisión y deja que PDP y checkout resuelvan variante, carrito y pago sin contaminar la lectura."
  },
  {
    label: "06",
    eyebrow: "Cobertura Perú",
    title: "Retail, mayoristas y vendedores en rutas separadas.",
    body: "La compra DTC sigue limpia; volumen y representación comercial aparecen después, como salidas secundarias bien ubicadas."
  }
] as const;

export function BenefitsSection() {
  return (
    <section id="beneficios" className="space-y-6">
      <StorefrontReveal>
        <StorefrontV2PremiumSectionHeading
          eyebrow="6 razones"
          title="La energía del prototipo aterrizada a una compra real."
          description="Tomamos la memoria de marca, la mascota y la idea de reset fresco, pero ordenamos la home para conversión, confianza y lectura rápida."
        />
      </StorefrontReveal>

      <StorefrontReveal className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" selector="[data-benefit-item]" stagger={0.06} y={18}>
        {BENEFITS.map((benefit, index) => {
          const dark = benefit.tone === "dark";

          return (
            <StorefrontV2PremiumPanel
              key={benefit.title}
              data-benefit-item
              tone={dark ? "dark" : index === 4 ? "muted" : "light"}
              className="group min-h-[220px] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-[1rem] border text-sm font-semibold",
                      dark ? "border-white/12 bg-white/10 text-white" : "border-[#162117]/8 bg-white/84 text-[#162117]"
                    )}
                  >
                    {benefit.label}
                  </span>
                  <span className={cn("text-[11px] uppercase tracking-[0.26em]", dark ? "text-white/42" : "text-black/38")}>
                    {benefit.eyebrow}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className={cn("text-[1.55rem] font-semibold leading-tight tracking-[-0.03em]", dark ? "text-white" : "text-[#162117]")}>
                    {benefit.title}
                  </h3>
                  <p className={cn("text-sm leading-7", dark ? "text-white/72" : "text-black/62")}>{benefit.body}</p>
                </div>
              </div>
            </StorefrontV2PremiumPanel>
          );
        })}
      </StorefrontReveal>
    </section>
  );
}
