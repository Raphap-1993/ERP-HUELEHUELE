import type { PremiumMetric, PremiumStoryCard } from "../content";
import { StorefrontV2PremiumMedia } from "../components/storefront-v2-premium-media";
import { StorefrontV2PremiumPanel } from "../components/storefront-v2-premium-section";
import { storefrontV2PremiumMedia } from "../lib/media";

export function BrandStorySection({
  metrics,
  cards
}: {
  metrics: PremiumMetric[];
  cards: PremiumStoryCard[];
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.98fr]">
      <StorefrontV2PremiumPanel tone="muted" className="space-y-7">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#667064]">Historia de marca</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-[#162117] md:text-[2.9rem]">
            La marca se siente más fuerte cuando cada formato ocupa su lugar.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-black/62">
            Clásico Verde entra fácil, Premium Negro aporta presencia y Combo Dúo Perfecto convierte la compra en algo más resuelto.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.65rem] border border-[#162117]/8 bg-white/84 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-black/38">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#162117]">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-black/58">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.8rem] border border-[#162117]/8 bg-[linear-gradient(180deg,#f6f1e7_0%,#fffdf9_100%)] p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">Lectura editorial</p>
          <p className="mt-3 max-w-3xl text-xl font-semibold tracking-[-0.03em] text-[#162117]">
            Primero se entiende el formato, luego aparece el deseo. Ese orden hace que la home respire mejor.
          </p>
        </div>
      </StorefrontV2PremiumPanel>

      <div className="grid gap-4">
        <StorefrontV2PremiumMedia
          src={storefrontV2PremiumMedia.office}
          alt="Historia visual de la marca Huele Huele"
          className="min-h-[340px]"
          overlay={
            <div className="flex h-full items-end p-6">
              <div className="max-w-md rounded-[1.7rem] border border-white/18 bg-white/82 p-5 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">Escena de marca</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#162117]">
                  Una composición sobria para que el producto se vea claro, premium y fácil de elegir.
                </p>
              </div>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-[1.7rem] border border-[#162117]/8 bg-white/84 p-5 shadow-[0_18px_50px_rgba(17,32,23,0.05)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{card.label}</p>
              <h3 className="mt-3 text-[1.35rem] font-semibold tracking-tight text-[#162117]">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/62">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
