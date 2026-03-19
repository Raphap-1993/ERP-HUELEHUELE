import { StorefrontV2Media } from "../components/storefront-v2-media";
import { StorefrontV2Panel } from "../components/storefront-v2-section";
import type { StorefrontV2BrandMetric, StorefrontV2StoryCard } from "../lib/content";
import { storefrontV2Media } from "../lib/media";

export function BrandStorySection({
  metrics,
  cards
}: {
  metrics: StorefrontV2BrandMetric[];
  cards: StorefrontV2StoryCard[];
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
      <StorefrontV2Panel tone="muted" className="space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#6c7368]">Brand story</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#17211a] md:text-[2.75rem]">
            La marca sube de nivel cuando el storefront se siente curado, no cargado.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-black/62">
            Esta versión reorganiza la experiencia pública en escenas, producto, prueba social y CTA. La operación sigue donde estaba; la
            percepción cambia por completo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.65rem] border border-[#17211a]/8 bg-white/82 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-black/38">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#17211a]">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-black/58">{metric.detail}</p>
            </div>
          ))}
        </div>
      </StorefrontV2Panel>

      <div className="grid gap-4">
        <StorefrontV2Media src={storefrontV2Media.office} alt="Historia visual de la marca Huele Huele" className="min-h-[320px]" />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-[1.7rem] border border-[#17211a]/8 bg-white/82 p-5 shadow-[0_18px_50px_rgba(23,33,26,0.05)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{card.label}</p>
              <h3 className="mt-3 text-[1.35rem] font-semibold tracking-tight text-[#17211a]">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/62">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
