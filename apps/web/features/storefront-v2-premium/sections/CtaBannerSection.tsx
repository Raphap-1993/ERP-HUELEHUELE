import { Button } from "@huelegood/ui";
import type { PremiumCtaBanner } from "../content";

export function CtaBannerSection({ banner }: { banner: PremiumCtaBanner }) {
  return (
    <section className="overflow-hidden rounded-[2.8rem] border border-[#162117]/8 bg-[linear-gradient(140deg,#162117_0%,#2c392d_48%,#61714f_100%)] px-7 py-8 text-white shadow-[0_34px_110px_rgba(22,33,23,0.24)] md:px-10 md:py-10">
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/42">{banner.eyebrow}</p>
          <h2 className="max-w-4xl text-3xl font-semibold leading-[0.94] tracking-[-0.045em] text-white md:text-[3.7rem]">{banner.title}</h2>
          <p className="max-w-2xl text-base leading-7 text-white/72">{banner.description}</p>
          <div className="flex flex-wrap gap-3">
            <Button href={banner.primaryCta.href} variant="secondary">
              {banner.primaryCta.label}
            </Button>
            <Button href={banner.secondaryCta.href} variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              {banner.secondaryCta.label}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.85rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Compra guiada</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{banner.tertiaryCta.label}</h3>
            <p className="mt-2 text-sm leading-7 text-white/72">
              Si buscas representar la marca o abrir conversación comercial, esta ruta queda visible sin romper el foco del home.
            </p>
            <div className="mt-4">
              <Button href={banner.tertiaryCta.href} variant="secondary">
                Abrir ruta comercial
              </Button>
            </div>
          </div>
          <div className="rounded-[1.85rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Compra directa</p>
            <p className="mt-3 text-xl font-semibold tracking-tight text-white">Si ya sabes cuál te gusta, entra directo al catálogo y compra sin fricción.</p>
            <p className="mt-2 text-sm leading-7 text-white/72">
              El storefront se queda limpio para que el producto sea el centro, con foco total en Clásico Verde, Premium Negro y Combo Dúo Perfecto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
