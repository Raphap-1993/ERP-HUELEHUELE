import { Badge, Button } from "@huelegood/ui";
import type { CatalogProduct, HeroCopy } from "@huelegood/shared";
import { StorefrontV2Media } from "../components/storefront-v2-media";
import { storefrontV2Media } from "../lib/media";
import type { StorefrontV2Metric } from "../lib/content";

export function HeroEditorialSection({
  hero,
  metrics,
  products,
  preview = false
}: {
  hero: HeroCopy;
  metrics: StorefrontV2Metric[];
  products: CatalogProduct[];
  preview?: boolean;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <div className="relative overflow-hidden rounded-[2.6rem] border border-[#17211a]/8 bg-[linear-gradient(160deg,rgba(255,255,255,0.97)_0%,rgba(247,242,232,0.95)_55%,rgba(232,239,226,0.94)_100%)] px-7 py-8 shadow-[0_34px_90px_rgba(23,33,26,0.09)] md:px-10 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(134,144,111,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(210,192,159,0.18),transparent_30%)]" />
        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-[#17211a] text-white">{hero.eyebrow}</Badge>
              {preview ? <span className="text-[11px] uppercase tracking-[0.28em] text-black/42">Vista controlada v2</span> : null}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold leading-[0.93] tracking-[-0.045em] text-[#17211a] md:text-[4.4rem]">
                {hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/64 md:text-lg">{hero.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {products.map((product) => (
              <span
                key={product.id}
                className="inline-flex items-center rounded-full border border-[#17211a]/10 bg-white/74 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#17211a]/64 backdrop-blur"
              >
                {product.name}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.65rem] border border-[#17211a]/8 bg-white/74 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[#17211a]">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-black/56">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StorefrontV2Media
        src={storefrontV2Media.hero}
        alt="Escena editorial del rediseño premium de Huele Huele"
        priority
        className="min-h-[560px]"
        overlay={
          <div className="flex h-full flex-col justify-between p-6">
            <div className="flex justify-between gap-3">
              <div className="rounded-full border border-white/24 bg-white/76 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#17211a] backdrop-blur">
                Premium editorial
              </div>
              <div className="rounded-full bg-[#17211a]/84 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white backdrop-blur">
                Wellness retail
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.7rem] border border-white/22 bg-white/82 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">Escena</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#17211a]">
                  Bloques grandes, ritmo aireado y una lectura de marca más curada.
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-white/12 bg-[#17211a]/84 p-4 text-white backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Salida</p>
                <p className="mt-2 text-sm font-semibold leading-6">
                  El flujo sigue llevando a catálogo, checkout y mayoristas actuales.
                </p>
              </div>
            </div>
          </div>
        }
      />
    </section>
  );
}
