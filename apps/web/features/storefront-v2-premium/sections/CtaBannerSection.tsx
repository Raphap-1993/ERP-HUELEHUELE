import { Button } from "@huelegood/ui";
import type { PremiumCtaBanner } from "../content";

export function CtaBannerSection({ banner }: { banner: PremiumCtaBanner }) {
  return (
    <section className="overflow-hidden rounded-[2.6rem] border border-[#112017]/8 bg-[linear-gradient(135deg,#112017_0%,#233024_52%,#50614c_100%)] px-7 py-8 text-white shadow-[0_32px_100px_rgba(17,32,23,0.26)] md:px-10 md:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/42">{banner.eyebrow}</p>
          <h2 className="max-w-4xl text-3xl font-semibold leading-[0.96] tracking-[-0.04em] text-white md:text-[3.5rem]">{banner.title}</h2>
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
          <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Ruta comercial</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{banner.tertiaryCta.label}</h3>
            <p className="mt-2 text-sm leading-7 text-white/72">
              El canal vendedor sigue vivo como entrada separada para onboarding comercial y no interrumpe el flujo D2C.
            </p>
            <div className="mt-4">
              <Button href={banner.tertiaryCta.href} variant="secondary">
                Ir a la postulación
              </Button>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Rollout seguro</p>
            <p className="mt-3 text-xl font-semibold tracking-tight text-white">La experiencia premium ya es la home oficial y mantiene una ruta dedicada para QA.</p>
            <p className="mt-2 text-sm leading-7 text-white/72">
              El storefront anterior queda solo como referencia histórica. La evolución del canal público continúa sobre esta capa premium.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
