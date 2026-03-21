const ROWS = [
  { feature: "100% Natural / Sin químicos", huele: "✓ Sí", pomada: "–", vape: "✗" },
  { feature: "No mancha ropa ni piel", huele: "✓", pomada: "✗ Grasoso", vape: "✓" },
  { feature: "Acción doble (2 vías)", huele: "✓", pomada: "–", vape: "–" },
  { feature: "Cabe en cualquier bolsillo", huele: "✓", pomada: "– Engorroso", vape: "✓" },
  { feature: "Sin humo ni vapor", huele: "✓", pomada: "✓", vape: "✗" },
  { feature: "Duración (hasta 300 usos)", huele: "✓", pomada: "– Se acaba rápido", vape: "– Batería" },
  { feature: "Uso discreto en cualquier lugar", huele: "✓", pomada: "– Incómodo", vape: "✗ Prohibido" },
] as const;

function CheckCell({ value, highlight = false }: { value: string; highlight?: boolean }) {
  const isYes = value.startsWith("✓");
  const isNo = value.startsWith("✗");
  return (
    <span
      className={
        isYes
          ? highlight
            ? "font-bold text-[#52b788]"
            : "text-[#52b788]"
          : isNo
          ? "text-white/20"
          : "text-white/40"
      }
    >
      {highlight && isYes ? (
        <span className="inline-flex items-center gap-1.5">
          {value}{" "}
          <span className="rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#52b788] px-2.5 py-0.5 text-[11px] font-bold text-white">
            Sí
          </span>
        </span>
      ) : (
        value
      )}
    </span>
  );
}

export function ComparisonSection() {
  return (
    <section className="bg-[#1a3a2e] py-16 md:py-24">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        {/* Heading */}
        <div className="mb-14">
          <span className="mb-4 inline-block rounded-full bg-[#52b788]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#52b788]">
            La diferencia es clara
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-white md:text-5xl">
            Huele Huele vs. las<br />alternativas de siempre
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-white/60">
            ¿Por qué seguir manchándote con pomadas o arriesgarte con vapes cuando existe algo mejor?
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 min-w-[540px]">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] bg-white/8 px-6 py-4 text-xs font-semibold uppercase tracking-widest">
            <span className="text-white/40">Característica</span>
            <span className="text-[#52b788]">✦ Huele Huele</span>
            <span className="text-white/40">Pomadas / Vicks</span>
            <span className="text-white/40">Vapes</span>
          </div>

          {ROWS.map((row, i) => (
            <div
              key={row.feature}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center border-t border-white/6 px-6 py-4 text-sm transition hover:bg-white/3"
            >
              <span className="font-medium text-white/80">{row.feature}</span>
              <CheckCell value={row.huele} highlight />
              <span className="text-center text-white/40">{row.pomada}</span>
              <span className="text-center text-white/40">{row.vape}</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
