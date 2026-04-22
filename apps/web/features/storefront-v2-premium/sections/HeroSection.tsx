import Image from "next/image";
import Link from "next/link";
import type { HeroCopy } from "@huelegood/shared";
import { StorefrontReveal } from "../components/StorefrontReveal";

export function HeroSection({
  heroProductImageUrl,
  heroCopy
}: {
  heroProductImageUrl?: string;
  heroCopy: HeroCopy;
}) {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--background))] pt-8 pb-20 md:pt-14 md:pb-28">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(97,167,64,0.15)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-[1120px] px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy (second on mobile, first on desktop) */}
          <StorefrontReveal className="order-last lg:order-first" selector="[data-storefront-reveal-item]" duration={0.72} stagger={0.1}>
            {/* Badge */}
            <div
              data-storefront-reveal-item
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#61a740]/30 bg-[#eef6e8] px-4 py-2 text-sm font-semibold text-[#61a740]"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#61a740] motion-reduce:animate-none" />
              {heroCopy.eyebrow}
            </div>

            {/* Headline */}
            <h1
              data-storefront-reveal-item
              className="mb-6 font-serif text-5xl font-black leading-[1.05] tracking-tight text-[#1a3a2e] md:text-6xl lg:text-[4rem] xl:text-[4.5rem]"
            >
              {heroCopy.title}
            </h1>

            <p data-storefront-reveal-item className="mb-8 max-w-lg text-base leading-relaxed text-[#6b7280] md:text-lg">
              {heroCopy.description}
            </p>

            {/* CTAs */}
            <div data-storefront-reveal-item className="mb-10 flex flex-wrap gap-3">
              <Link
                href={heroCopy.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-full bg-[#61a740] px-7 py-4 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(97,167,64,0.35)] transition hover:-translate-y-0.5 hover:bg-[#577e2f] hover:shadow-[0_12px_40px_rgba(97,167,64,0.45)]"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                {heroCopy.primaryCta.label}
              </Link>
              <Link
                href={heroCopy.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#61a740]/30 bg-transparent px-6 py-4 text-sm font-medium text-[#1a3a2e] transition hover:border-[#61a740] hover:bg-[#eef6e8]"
              >
                {heroCopy.secondaryCta.label} →
              </Link>
            </div>

            {/* Trust signals */}
            <div data-storefront-reveal-item className="flex flex-wrap gap-5">
              {[
                "Envíos a todo el Perú",
                "Acción en segundos",
                "Sin contraindicaciones",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-medium text-[#6b7280]">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#61a740" strokeWidth={2.5} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </div>
              ))}
            </div>
          </StorefrontReveal>

          {/* Right — product image (first on mobile, second on desktop) */}
          <StorefrontReveal
            className="relative order-first lg:order-last"
            selector="[data-storefront-reveal-item]"
            duration={0.78}
            stagger={0.12}
            delay={0.08}
            y={30}
          >
            {/* Float card top */}
            <div
              data-storefront-reveal-item
              className="absolute -left-4 -top-4 z-10 flex animate-[float_4s_ease-in-out_infinite] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] motion-reduce:animate-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef6e8] text-xl">🌿</div>
              <div>
                <p className="text-[11px] text-[#6b7280]">Ingredientes</p>
                <p className="text-sm font-semibold text-[#1a3a2e]">100% Aceites Naturales</p>
              </div>
            </div>

            {/* Product image */}
            <div
              data-storefront-reveal-item
              className="overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(26,58,46,0.12)]"
            >
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
            <div
              data-storefront-reveal-item
              className="absolute -bottom-4 -right-4 z-10 flex animate-[float_4s_2s_ease-in-out_infinite] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] motion-reduce:animate-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff9e6] text-xl">⚡</div>
              <div>
                <p className="text-[11px] text-[#6b7280]">Resultado</p>
                <p className="text-sm font-semibold text-[#1a3a2e]">Frescura instantánea</p>
              </div>
            </div>
          </StorefrontReveal>
        </div>
      </div>
    </section>
  );
}
