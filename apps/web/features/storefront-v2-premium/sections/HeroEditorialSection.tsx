import { Badge, Button } from "@huelegood/ui";
import type { PremiumHeroContent } from "../content";
import { StorefrontV2PremiumMedia } from "../components/storefront-v2-premium-media";
import { storefrontV2PremiumMedia } from "../lib/media";

export function HeroEditorialSection({ hero, preview = false }: { hero: PremiumHeroContent; preview?: boolean }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <div className="relative overflow-hidden rounded-[2.8rem] border border-[#162117]/8 bg-[linear-gradient(155deg,rgba(255,255,255,0.98)_0%,rgba(249,243,234,0.96)_58%,rgba(233,240,228,0.94)_100%)] px-7 py-8 shadow-[0_38px_100px_rgba(22,33,23,0.09)] md:px-10 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,161,123,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(199,160,102,0.16),transparent_30%)]" />
        <div className="relative space-y-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-[#162117] text-white">{hero.eyebrow}</Badge>
              {preview ? <span className="hidden" aria-hidden="true" /> : null}
              <span className="rounded-full border border-[#162117]/10 bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#162117]/56">
                Frescura portable
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold leading-[0.9] tracking-[-0.05em] text-[#162117] md:text-[4.9rem]">
                {hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/66 md:text-lg">{hero.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {hero.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.75rem] border border-[#162117]/8 bg-white/76 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.54)] backdrop-blur"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{metric.label}</p>
                <p className="mt-3 text-[1.9rem] font-semibold tracking-tight text-[#162117]">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-black/56">{metric.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-[#162117]/8 bg-white/74 p-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">Selección curada</p>
                <p className="text-lg font-semibold tracking-tight text-[#162117]">Tres referencias para decidir rápido y seguir con tu día.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hero.productChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full border border-[#162117]/10 bg-[#f3f4ef] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#162117]/64"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <StorefrontV2PremiumMedia
          src={storefrontV2PremiumMedia.hero}
          alt="Escena editorial premium de Huelegood"
          priority
          className="min-h-[420px] xl:min-h-[520px]"
          overlay={
            <div className="flex h-full flex-col justify-between p-6">
              <div className="flex justify-between gap-3">
                <div className="rounded-full border border-white/22 bg-[#162117]/74 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white backdrop-blur">
                  Huelegood
                </div>
                <div className="rounded-full border border-white/22 bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#162117] backdrop-blur">
                  Viajes y altura
                </div>
              </div>
              <div className="grid gap-3">
                {hero.notes.map((note) => {
                  const dark = note.tone === "dark";

                  return (
                    <div
                      key={note.label}
                      className={
                        dark
                          ? "max-w-md justify-self-end rounded-[1.8rem] border border-white/12 bg-[#162117]/84 p-5 text-white backdrop-blur"
                          : "max-w-md rounded-[1.8rem] border border-white/24 bg-white/84 p-5 backdrop-blur"
                      }
                    >
                      <p className={`text-[11px] uppercase tracking-[0.24em] ${dark ? "text-white/42" : "text-black/38"}`}>{note.label}</p>
                      <p className={`mt-2 text-base font-semibold leading-6 ${dark ? "text-white" : "text-[#162117]"}`}>{note.title}</p>
                      <p className={`mt-2 text-sm leading-6 ${dark ? "text-white/74" : "text-black/58"}`}>{note.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-[#162117]/8 bg-white/84 p-5 shadow-[0_18px_50px_rgba(22,33,23,0.07)] backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">Ritmo diario</p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#162117]">Portátil para oficina, carro y bolso.</p>
            <p className="mt-2 text-sm leading-7 text-black/58">
              El producto gana cuando se ve integrado a una rutina real: movimiento, pausa breve y días con muchas horas fuera.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#162117_0%,#314031_100%)] p-5 text-white shadow-[0_22px_55px_rgba(22,33,23,0.18)]">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Selección favorita</p>
            <div className="mt-4 grid gap-3">
              {hero.productChips.map((chip, index) => (
                <div key={chip} className="flex items-center justify-between rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm">
                  <span>{chip}</span>
                  <span className="text-white/64">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
