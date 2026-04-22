import { Button } from "@huelegood/ui";
import type { PromoBanner } from "@huelegood/shared";

export function CtaBannerSection({
  banner,
  secondaryBanner
}: {
  banner: PromoBanner;
  secondaryBanner: PromoBanner;
}) {
  return (
    <section className="overflow-hidden rounded-[2.6rem] border border-[#17211a]/8 bg-[linear-gradient(135deg,#17211a_0%,#2a382b_52%,#516052_100%)] px-7 py-8 text-white shadow-[0_32px_100px_rgba(23,33,26,0.26)] md:px-10 md:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/42">{banner.note}</p>
          <h2 className="max-w-4xl text-3xl font-semibold leading-[0.96] tracking-[-0.04em] text-white md:text-[3.5rem]">{banner.title}</h2>
          <p className="max-w-2xl text-base leading-7 text-white/72">{banner.description}</p>
          <div className="flex flex-wrap gap-3">
            <Button href={banner.ctaHref} variant="secondary">
              {banner.ctaLabel}
            </Button>
            <Button href="/mayoristas" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              Canal mayorista
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{secondaryBanner.note}</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{secondaryBanner.title}</h3>
            <p className="mt-2 text-sm leading-7 text-white/72">{secondaryBanner.description}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Experiencia cuidada</p>
            <p className="mt-3 text-xl font-semibold tracking-tight text-white">Una experiencia más clara, fresca y premium.</p>
            <p className="mt-2 text-sm leading-7 text-white/72">
              Cada sección busca ayudarte a entender el producto y decidir rápido.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
