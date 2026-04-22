import Link from "next/link";
import type { WholesalePlan } from "@huelegood/shared";
import { StorefrontReveal } from "../components/StorefrontReveal";

const PERKS = [
  { num: "100%", label: "Margen de ganancia posible comprando al por mayor" },
  { num: "72h", label: "Tiempo de entrega a Lima y principales ciudades" },
  { num: "12+", label: "Unidades mínimas para acceder a precio mayorista" },
  { num: "🇵🇪", label: "Distribución disponible en todo el territorio peruano" },
] as const;

function tierMargin(plan: WholesalePlan) {
  return plan.savingsLabel || `${plan.minimumUnits}+ unidades`;
}

export function WholesaleB2BSection({
  plans,
  ctaHref = "/mayoristas?interestType=distributor"
}: {
  plans: WholesalePlan[];
  ctaHref?: string;
}) {
  return (
    <section id="distribuidores" className="relative overflow-hidden bg-gradient-to-br from-[#1a3a2e] to-[#0d2b20] py-24">
      <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(97,167,64,0.08)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-[1120px] px-4 md:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left */}
          <div>
            <StorefrontReveal selector="[data-storefront-reveal-item]" duration={0.72} stagger={0.1} y={28}>
              <span
                data-storefront-reveal-item
                className="mb-4 inline-block rounded-full bg-[#61a740]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#61a740]"
              >
                Oportunidad de negocio
              </span>
              <h2
                data-storefront-reveal-item
                className="mb-4 font-serif text-4xl font-black leading-tight text-white md:text-5xl"
              >
                ¿Quieres ser distribuidor<br />oficial de Huele Huele?
              </h2>
              <p data-storefront-reveal-item className="mb-10 max-w-lg text-base leading-relaxed text-white/65">
                Un producto con historia viral, demanda real y márgenes de hasta el{" "}
                <strong className="text-[#61a740]">100%</strong>. Ideal para emprendedores, farmacias, tiendas naturistas y negocios de bienestar.
              </p>
            </StorefrontReveal>

            <StorefrontReveal className="mb-10 grid grid-cols-2 gap-4" selector="[data-storefront-reveal-item]" stagger={0.08} y={20} delay={0.08}>
              {PERKS.map((p) => (
                <div key={p.num} data-storefront-reveal-item className="rounded-2xl border border-white/10 bg-white/6 p-5">
                  <p className="mb-1 font-serif text-3xl font-black text-[#61a740]">{p.num}</p>
                  <p className="text-xs leading-5 text-white/55">{p.label}</p>
                </div>
              ))}
            </StorefrontReveal>

            <StorefrontReveal delay={0.14}>
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#c9a84c] px-8 py-4 text-sm font-bold text-[#1a3a2e] shadow-[0_8px_30px_rgba(201,168,76,0.35)] transition hover:-translate-y-0.5 hover:bg-[#f0d080] hover:shadow-[0_12px_40px_rgba(201,168,76,0.45)]"
              >
                📋 Solicitar Catálogo Mayorista
              </Link>
            </StorefrontReveal>
          </div>

          {/* Right — tiers */}
          <StorefrontReveal
            className="rounded-3xl border border-white/12 bg-white/5 p-8"
            selector="[data-storefront-reveal-item]"
            duration={0.72}
            stagger={0.08}
            y={26}
            delay={0.05}
          >
            <h3 data-storefront-reveal-item className="mb-2 font-serif text-2xl font-bold text-white">Planes de distribución</h3>
            <p data-storefront-reveal-item className="mb-8 text-sm text-white/55">Elige el paquete que se adapta a tu negocio.</p>

            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.tier}
                  data-storefront-reveal-item
                  className="flex items-center justify-between rounded-2xl border border-white/7 bg-white/5 p-5"
                >
                  <div>
                    <p className="mb-0.5 text-sm font-semibold text-white">{plan.tier}</p>
                    <p className="text-xs text-white/55">{plan.description}</p>
                  </div>
                  <span className="font-serif text-3xl font-black text-[#61a740]">{tierMargin(plan)}</span>
                </div>
              ))}
            </div>
          </StorefrontReveal>
        </div>
      </div>
    </section>
  );
}
