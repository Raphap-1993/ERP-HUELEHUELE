import Link from "next/link";

const PERKS = [
  { num: "100%", label: "Margen de ganancia posible comprando al por mayor" },
  { num: "72h", label: "Tiempo de entrega a Lima y principales ciudades" },
  { num: "12+", label: "Unidades mínimas para acceder a precio mayorista" },
  { num: "🇵🇪", label: "Distribución disponible en todo el territorio peruano" },
] as const;

const TIERS = [
  { name: "Starter — 12 unidades", sub: "Precio mayorista inicial", margin: "~40%" },
  { name: "Distribuidor — 24 unidades", sub: "Acceso a catálogo completo", margin: "~65%" },
  { name: "Partner Oficial — 48+ unidades", sub: "Máximo margen + soporte marketing", margin: "~100%" },
] as const;

export function WholesaleB2BSection() {
  return (
    <section id="distribuidores" className="relative overflow-hidden bg-gradient-to-br from-[#1a3a2e] to-[#0d2b20] py-24">
      <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(82,183,136,0.08)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-[1120px] px-4 md:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left */}
          <div>
            <span className="mb-4 inline-block rounded-full bg-[#52b788]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#52b788]">
              Oportunidad de negocio
            </span>
            <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-white md:text-5xl">
              ¿Quieres ser distribuidor<br />oficial de Huele Huele?
            </h2>
            <p className="mb-10 max-w-lg text-base leading-relaxed text-white/65">
              Un producto con historia viral, demanda real y márgenes de hasta el{" "}
              <strong className="text-[#52b788]">100%</strong>. Ideal para emprendedores, farmacias, tiendas naturistas y negocios de bienestar.
            </p>

            <div className="mb-10 grid grid-cols-2 gap-4">
              {PERKS.map((p) => (
                <div key={p.num} className="rounded-2xl border border-white/10 bg-white/6 p-5">
                  <p className="mb-1 font-serif text-3xl font-black text-[#52b788]">{p.num}</p>
                  <p className="text-xs leading-5 text-white/55">{p.label}</p>
                </div>
              ))}
            </div>

            <Link
              href="https://www.instagram.com/huele.good/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#c9a84c] px-8 py-4 text-sm font-bold text-[#1a3a2e] shadow-[0_8px_30px_rgba(201,168,76,0.35)] transition hover:-translate-y-0.5 hover:bg-[#f0d080] hover:shadow-[0_12px_40px_rgba(201,168,76,0.45)]"
            >
              📋 Solicitar Catálogo Mayorista
            </Link>
          </div>

          {/* Right — tiers */}
          <div className="rounded-3xl border border-white/12 bg-white/5 p-8">
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">Planes de distribución</h3>
            <p className="mb-8 text-sm text-white/55">Elige el paquete que se adapta a tu negocio.</p>

            <div className="space-y-3">
              {TIERS.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between rounded-2xl border border-white/7 bg-white/5 p-5">
                  <div>
                    <p className="mb-0.5 text-sm font-semibold text-white">{tier.name}</p>
                    <p className="text-xs text-white/55">{tier.sub}</p>
                  </div>
                  <span className="font-serif text-3xl font-black text-[#52b788]">{tier.margin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
