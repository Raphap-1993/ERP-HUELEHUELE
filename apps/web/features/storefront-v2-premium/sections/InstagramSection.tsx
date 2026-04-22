import Link from "next/link";
import { StorefrontReveal } from "../components/StorefrontReveal";

const IG_PLACEHOLDERS = [
  { bg: "#eef6e8", color: "#61a740", emoji: "🌿" },
  { bg: "#e8f4fd", color: "#3b82f6", emoji: "✈️" },
  { bg: "#fff9e6", color: "#d97706", emoji: "⛰️" },
  { bg: "#fdf2f8", color: "#9333ea", emoji: "🌸" },
] as const;

export function InstagramSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1120px] px-4 text-center md:px-6">
        <StorefrontReveal>
          <span className="mb-4 inline-block rounded-full bg-[#eef6e8] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#61a740]">
            Síguenos
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-[#1a3a2e] md:text-5xl">
            Únete a la comunidad
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-base leading-relaxed text-[#6b7280]">
            Mira cómo el Huele Huele acompaña a peruanos en sus aventuras, trabajo y vida diaria.
          </p>
        </StorefrontReveal>

        <StorefrontReveal className="mb-10 inline-flex" delay={0.04}>
          <Link
            href="https://www.instagram.com/huele.good/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 font-serif text-2xl font-black text-[#1a3a2e] transition hover:text-[#61a740] md:text-3xl"
          >
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            @huele.good
          </Link>
        </StorefrontReveal>

        <StorefrontReveal className="grid grid-cols-2 gap-4 md:grid-cols-4" selector="[data-storefront-reveal-item]" stagger={0.08} y={18}>
          {IG_PLACEHOLDERS.map((p, i) => (
            <Link
              key={i}
              data-storefront-reveal-item
              href="https://www.instagram.com/huele.good/"
              target="_blank"
              rel="noreferrer"
              className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl text-4xl transition hover:scale-[1.02] hover:opacity-90"
              style={{ background: p.bg, color: p.color }}
              aria-label={`Ver Instagram @huele.good — post ${i + 1}`}
            >
              {p.emoji}
            </Link>
          ))}
        </StorefrontReveal>
      </div>
    </section>
  );
}
