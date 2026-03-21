import Image from "next/image";
import Link from "next/link";

export function HeroSection({ heroProductImageUrl }: { heroProductImageUrl?: string }) {
  return (
    <section className="relative overflow-hidden bg-[#faf8f3] py-20 md:py-28">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(82,183,136,0.15)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-[1120px] px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <div>
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#52b788]/30 bg-[#d8f3dc] px-4 py-2 text-sm font-semibold text-[#2d6a4f]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#52b788]" />
              Inspirado en inhaladores tailandeses "Ya Dom" · 100% Natural
            </div>

            {/* Headline */}
            <h1 className="mb-6 font-serif text-5xl font-black leading-[1.05] tracking-tight text-[#1a3a2e] md:text-6xl lg:text-[4rem] xl:text-[4.5rem]">
              ¿Cansado de llegar al{" "}
              <span className="text-[#52b788]">destino sintiéndote</span>{" "}
              <span className="text-[#c9a84c]">al piso?</span>
            </h1>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-[#6b7280] md:text-lg">
              El <strong className="text-[#1c1c1c]">soroche, los mareos, el tráfico</strong> y la fatiga mental te frenan. Huele Huele es el inhalador herbal de doble vía que te{" "}
              <strong className="text-[#1c1c1c]">resetea en segundos</strong>, directo al cerebro, sin químicos, sin manchas, sin excusas.
            </p>

            {/* CTAs */}
            <div className="mb-10 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 rounded-full bg-[#2d6a4f] px-7 py-4 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(45,106,79,0.35)] transition hover:-translate-y-0.5 hover:bg-[#1a3a2e] hover:shadow-[0_12px_40px_rgba(45,106,79,0.45)]"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Quiero el mío
              </Link>
              <Link
                href="#beneficios"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#2d6a4f]/30 bg-transparent px-6 py-4 text-sm font-medium text-[#1a3a2e] transition hover:border-[#2d6a4f] hover:bg-[#d8f3dc]"
              >
                Ver cómo funciona →
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-5">
              {[
                "Envíos a todo el Perú",
                "Acción en segundos",
                "Sin contraindicaciones",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-medium text-[#6b7280]">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#52b788" strokeWidth={2.5} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right — product image */}
          <div className="relative">
            {/* Float card top */}
            <div className="absolute -left-4 -top-4 z-10 flex animate-[float_4s_ease-in-out_infinite] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f3dc] text-xl">🌿</div>
              <div>
                <p className="text-[11px] text-[#6b7280]">Ingredientes</p>
                <p className="text-sm font-semibold text-[#1a3a2e]">100% Aceites Naturales</p>
              </div>
            </div>

            {/* Product image */}
            <div className="overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(26,58,46,0.12)]">
              <Image
                src={heroProductImageUrl ?? "/brand/product-classic-green.svg"}
                alt="Huele Huele inhalador herbal Premium — vista del producto"
                width={560}
                height={560}
                priority
                className="w-full object-cover"
              />
            </div>

            {/* Float card bottom */}
            <div className="absolute -bottom-4 -right-4 z-10 flex animate-[float_4s_2s_ease-in-out_infinite] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff9e6] text-xl">⚡</div>
              <div>
                <p className="text-[11px] text-[#6b7280]">Resultado</p>
                <p className="text-sm font-semibold text-[#1a3a2e]">Frescura instantánea</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
