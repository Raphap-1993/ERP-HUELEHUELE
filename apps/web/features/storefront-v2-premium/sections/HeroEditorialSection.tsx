import Link from "next/link";
import { Badge, Button, cn } from "@huelegood/ui";
import type { PremiumHeroContent } from "../content";
import { StorefrontReveal } from "../components/StorefrontReveal";
import { StorefrontV2PremiumMedia } from "../components/storefront-v2-premium-media";
import { storefrontV2PremiumMedia } from "../lib/media";

export function HeroEditorialSection({ hero, preview = false }: { hero: PremiumHeroContent; preview?: boolean }) {
  const quickLinks = [
    { label: "6 razones", href: "#beneficios" },
    { label: "3 formatos", href: "#tienda" },
    { label: "Historias reales", href: "#testimonios" },
    { label: "Mayoristas", href: "#mayoristas" }
  ];

  return (
    <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.06fr_0.94fr]">
      <StorefrontReveal
        className="rounded-[2.6rem] border border-[#162117]/8 bg-[linear-gradient(180deg,rgba(255,253,249,0.98)_0%,rgba(246,240,230,0.96)_100%)] px-7 py-8 shadow-[0_20px_55px_rgba(22,33,23,0.06)] md:px-10 md:py-10"
        selector="[data-hero-copy-item]"
        duration={0.56}
        stagger={0.08}
      >
        <div className="space-y-8">
          <div className="space-y-5" data-hero-copy-item>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-[#162117] text-white">{hero.eyebrow}</Badge>
              {preview ? <span className="hidden" aria-hidden="true" /> : null}
              <span className="rounded-full border border-[#162117]/10 bg-white/82 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#162117]/56">
                Clásico Verde · Premium Negro · Combo Dúo Perfecto
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#162117] md:text-[5.1rem]">
                {hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/66 md:text-lg">{hero.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3" data-hero-copy-item>
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-hero-copy-item>
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-between rounded-[1.35rem] border border-[#162117]/8 bg-white/84 px-4 py-3 text-sm font-medium text-[#162117] transition hover:-translate-y-0.5 hover:border-[#61a740]/30 hover:bg-[#eef6e8]"
              >
                <span>{item.label}</span>
                <span className="text-[#61a740]">↗</span>
              </Link>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3" data-hero-copy-item>
            {hero.metrics.map((metric) => (
              <div key={metric.label} className="rounded-[1.7rem] border border-[#162117]/8 bg-white/82 px-4 py-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{metric.label}</p>
                <p className="mt-3 text-[1.8rem] font-semibold tracking-tight text-[#162117]">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-black/56">{metric.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.9rem] border border-[#162117]/8 bg-white/78 p-5" data-hero-copy-item>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">Selección curada</p>
                <p className="text-lg font-semibold tracking-tight text-[#162117]">Tres formatos que explican la marca sin distraer.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hero.productChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full border border-[#162117]/10 bg-[#f6f1e8] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#162117]/64"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StorefrontReveal>

      <StorefrontReveal
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-1"
        selector="[data-hero-media-item]"
        duration={0.6}
        stagger={0.1}
        delay={0.08}
        y={20}
      >
        <div data-hero-media-item>
          <StorefrontV2PremiumMedia
            src={storefrontV2PremiumMedia.hero}
            alt="Escena editorial premium de Huelegood"
            priority
            className="min-h-[420px] xl:min-h-[520px]"
            overlay={
              <div className="flex h-full flex-col justify-between p-6 md:p-7">
                <div className="flex justify-between gap-3">
                  <div className="rounded-full border border-white/20 bg-[#162117]/76 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white backdrop-blur">
                    Huelegood
                  </div>
                  <div className="rounded-full border border-white/20 bg-white/82 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#162117] backdrop-blur">
                    Selección principal
                  </div>
                </div>
                <div className="grid gap-3">
                  {hero.notes.map((note) => {
                    const dark = note.tone === "dark";

                    return (
                      <div
                        key={note.label}
                        className={cn(
                          "max-w-md rounded-[1.7rem] border p-5 backdrop-blur",
                          dark ? "justify-self-end border-white/12 bg-[#162117]/84 text-white" : "border-white/24 bg-white/86 text-[#162117]"
                        )}
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <div data-hero-media-item className="rounded-[1.9rem] border border-[#162117]/8 bg-white/82 p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">Ritmo diario</p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#162117]">Funciona bien en bolso, carro y escritorio.</p>
            <p className="mt-2 text-sm leading-7 text-black/58">
              La lectura editorial pone el producto en movimiento y deja que la compra se entienda desde el primer scroll.
            </p>
          </div>

          <div data-hero-media-item className="rounded-[1.9rem] border border-[#162117]/8 bg-[linear-gradient(135deg,#162117_0%,#2c3227_100%)] p-5 text-white">
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
      </StorefrontReveal>
    </section>
  );
}
