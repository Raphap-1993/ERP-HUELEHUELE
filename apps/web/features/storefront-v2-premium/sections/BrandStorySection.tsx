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
    <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
      <StorefrontV2PremiumPanel tone="muted" className="space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#667064]">Brand story</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#112017] md:text-[2.75rem]">
            La marca gana cuando el storefront se siente curado, sensorial y comercialmente claro.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-black/62">
            Este bloque ordena producto, narrativa y operación en una misma lectura. No es un manifiesto abstracto: es una explicación visual
            de por qué Huele Huele se ve y se compra mejor así.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.65rem] border border-[#112017]/8 bg-white/82 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-black/38">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#112017]">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-black/58">{metric.detail}</p>
            </div>
          ))}
        </div>
      </StorefrontV2PremiumPanel>

      <div className="grid gap-4">
        <StorefrontV2PremiumMedia src={storefrontV2PremiumMedia.office} alt="Historia visual de la marca Huele Huele" className="min-h-[320px]" />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-[1.7rem] border border-[#112017]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(17,32,23,0.05)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{card.label}</p>
              <h3 className="mt-3 text-[1.35rem] font-semibold tracking-tight text-[#112017]">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/62">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
