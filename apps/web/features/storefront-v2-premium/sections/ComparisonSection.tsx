"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "../lib/motion";

const ROWS = [
  { feature: "100% Natural / Sin químicos", huele: "✓ Sí", pomada: "–", vape: "✗" },
  { feature: "No mancha ropa ni piel", huele: "✓", pomada: "✗ Grasoso", vape: "✓" },
  { feature: "Acción doble (2 vías)", huele: "✓", pomada: "–", vape: "–" },
  { feature: "Cabe en cualquier bolsillo", huele: "✓", pomada: "– Engorroso", vape: "✓" },
  { feature: "Sin humo ni vapor", huele: "✓", pomada: "✓", vape: "✗" },
  { feature: "Duración (hasta 300 usos)", huele: "✓", pomada: "– Se acaba rápido", vape: "– Batería" },
  { feature: "Uso discreto en cualquier lugar", huele: "✓", pomada: "– Incómodo", vape: "✗ Prohibido" }
] as const;

function CheckCell({ value, highlight = false }: { value: string; highlight?: boolean }) {
  const isYes = value.startsWith("✓");
  const isNo = value.startsWith("✗");

  if (highlight && isYes) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(97,167,64,0.16)] bg-[#eef6e8] px-3 py-1.5 text-sm font-semibold text-[#577e2f]">
        <span aria-hidden="true">✓</span>
        <span>Sí</span>
      </span>
    );
  }

  return (
    <span
      className={
        isYes
          ? "font-medium text-[#577e2f]"
          : isNo
            ? "text-[#98a48f]"
            : "text-[#7f8c82]"
      }
    >
      {value}
    </span>
  );
}

export function ComparisonSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) {
      return;
    }

    let ctx: gsap.Context | null = null;
    let animated = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || animated) {
          return;
        }

        animated = true;
        ctx = gsap.context(() => {
          gsap.fromTo(
            "[data-comparison-intro]",
            { autoAlpha: 0, y: 26 },
            { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" }
          );
          gsap.fromTo(
            "[data-comparison-row]",
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.06, ease: "power2.out", delay: 0.08 }
          );
        }, section);
        observer.disconnect();
      },
      { threshold: 0.25 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f4ec_0%,#f3f8ee_100%)] py-16 md:py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(97,167,64,0.10),transparent_65%)]" />

      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        <div data-comparison-intro className="mb-14">
          <span className="mb-4 inline-block rounded-full border border-[rgba(97,167,64,0.14)] bg-[#eef6e8] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#61a740]">
            La diferencia es clara
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-[#163126] md:text-5xl">
            Huele Huele vs. las
            <br />
            alternativas de siempre
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-[#5f6f66]">
            ¿Por qué seguir manchándote con pomadas o arriesgarte con vapes cuando existe algo mejor?
          </p>
        </div>

        <div className="overflow-x-auto rounded-[30px]">
          <div className="min-w-[540px] overflow-hidden rounded-[30px] border border-[rgba(97,167,64,0.14)] bg-white shadow-[0_26px_60px_rgba(19,32,22,0.06)]">
            <div className="grid grid-cols-[2fr_1.35fr_1fr_1fr] bg-[#f5f8ef] px-6 py-4 text-xs font-semibold uppercase tracking-widest">
              <span className="text-[#7d8a80]">Característica</span>
              <span className="text-[#61a740]">✦ Huele Huele</span>
              <span className="text-[#7d8a80]">Pomadas / Vicks</span>
              <span className="text-[#7d8a80]">Vapes</span>
            </div>

            {ROWS.map((row, index) => (
              <div
                key={row.feature}
                data-comparison-row
                className={`grid grid-cols-[2fr_1.35fr_1fr_1fr] items-center border-t border-[rgba(97,167,64,0.08)] px-6 py-4 text-sm transition hover:bg-[#f8fbf4] ${
                  index % 2 === 0 ? "bg-white" : "bg-[#fcfdfb]"
                }`}
              >
                <span className="font-medium text-[#163126]">{row.feature}</span>
                <div>
                  <CheckCell value={row.huele} highlight />
                </div>
                <span className="text-center text-[#7f8c82]">{row.pomada}</span>
                <span className="text-center text-[#7f8c82]">{row.vape}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
