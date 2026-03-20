import Link from "next/link";

const PRODUCTS = [
  {
    id: "clasico",
    emoji: "🌿",
    name: "Clásico Verde",
    desc: "El favorito para el día a día. Frescura suave, mentol balanceado. Ideal para estudiantes, viajeros y quien quiere empezar.",
    price: "S/ 39.90",
    oldPrice: null,
    save: null,
    features: [
      "Doble inhalador (2 vías)",
      "Aceites de mentol + eucalipto",
      "Hasta ~300 inhalaciones",
      "Tamaño mini-bolsillo",
    ],
    cta: "Quiero el Clásico →",
    featured: false,
  },
  {
    id: "combo",
    emoji: "🎁",
    name: "Combo Dúo Perfecto",
    desc: "1 Clásico Verde + 1 Premium Negro. Uno para el día a día, otro para cuando necesitas más potencia. El pack completo.",
    price: "S/ 79.90",
    oldPrice: "S/ 89.80",
    save: "🎉 Ahorras S/ 9.90 — ¡casi uno gratis!",
    features: [
      "1 Clásico Verde + 1 Premium Negro",
      "Envío prioritario incluido",
      "Perfectos para regalar",
      "Variedad de aromas y potencias",
    ],
    cta: "¡Llevo el Combo! →",
    featured: true,
  },
  {
    id: "premium",
    emoji: "🖤",
    name: "Premium Negro",
    desc: "Más intenso, más poderoso. Para cuando el soroche o la jornada pesada necesitan una respuesta de alto impacto.",
    price: "S/ 49.90",
    oldPrice: null,
    save: null,
    features: [
      "Fórmula intensificada (x1.5)",
      "Diseño elegante mate negro",
      "Hasta ~300 inhalaciones",
      "Ideal para altitudes extremas",
    ],
    cta: "Quiero el Premium →",
    featured: false,
  },
] as const;

export function PricingSection() {
  return (
    <section id="tienda" className="bg-[#f4f4f0] py-24">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        {/* Heading */}
        <div className="mb-14">
          <span className="mb-4 inline-block rounded-full bg-[#d8f3dc] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2d6a4f]">
            Elige tu Huele Huele
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-[#1a3a2e] md:text-5xl">
            Simple. Natural. Tuyo.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-[#6b7280]">
            Elige el que va contigo. Envíos rápidos a todo el Perú vía Olva Courier y Shalom.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 items-start md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-3xl bg-white p-8 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(26,58,46,0.12)] ${
                p.featured
                  ? "scale-[1.02] border-2 border-[#2d6a4f] shadow-[0_20px_60px_rgba(26,58,46,0.12)]"
                  : "border-2 border-transparent"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#52b788] px-5 py-2 text-xs font-bold text-white">
                  ⭐ Más Vendido — Mejor Valor
                </div>
              )}

              {/* Image placeholder */}
              <div className="mb-6 flex h-44 items-center justify-center rounded-2xl bg-[#f4f4f0] text-6xl">
                {p.emoji}
              </div>

              <h3 className="mb-2 font-serif text-xl font-bold text-[#1a3a2e]">{p.name}</h3>
              <p className="mb-5 text-sm leading-relaxed text-[#6b7280]">{p.desc}</p>

              {/* Price */}
              <div className="mb-1 flex items-baseline gap-3">
                <span className="font-serif text-4xl font-black text-[#1a3a2e]">{p.price}</span>
                {p.oldPrice && <span className="text-base text-[#6b7280] line-through">{p.oldPrice}</span>}
              </div>
              {p.save && (
                <div className="mb-5 inline-block rounded-full bg-[#d8f3dc] px-3 py-1 text-xs font-bold text-[#52b788]">
                  {p.save}
                </div>
              )}

              {/* Features */}
              <ul className="mb-7 space-y-2 border-t border-[#f4f4f0] pt-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#6b7280]">
                    <span className="mt-0.5 text-[#52b788]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="https://www.instagram.com/huele.good/"
                target="_blank"
                rel="noreferrer"
                className={`block w-full rounded-full py-4 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 ${
                  p.featured
                    ? "bg-gradient-to-r from-[#2d6a4f] to-[#52b788] hover:shadow-[0_8px_30px_rgba(45,106,79,0.35)]"
                    : "bg-[#2d6a4f] hover:bg-[#1a3a2e]"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[#6b7280]">
          💳 Aceptamos Yape, Plin, transferencia y contra-entrega · 🚚 Envíos en 24-72h a todo el Perú
        </p>
      </div>
    </section>
  );
}
