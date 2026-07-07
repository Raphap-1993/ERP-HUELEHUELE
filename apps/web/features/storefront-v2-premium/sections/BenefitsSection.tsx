import { StorefrontReveal } from "../components/StorefrontReveal";

const BENEFITS = [
  {
    icon: "⛰️",
    title: "Alivio del Soroche",
    body: "La mezcla de mentol y eucalipto expande las vías respiratorias y apoya tu adaptación a la altitud. Ideal para Cusco, Puno y la sierra peruana.",
    kw: "remedio natural soroche Perú",
  },
  {
    icon: "🤢",
    title: "Adiós Mareos y Náuseas",
    body: "El aroma fresco distrae al cerebro del malestar por movimiento. Perfecto para combis, buses interprovinciales, aviones y barcos.",
    kw: "aliviar mareos rápido",
  },
  {
    icon: "🚗",
    title: "Escudo contra Malos Olores",
    body: "En el tráfico de Lima, mercados, buses llenos o espacios cerrados: acércalo a la nariz y reemplaza cualquier olor por frescura herbal inmediata.",
    kw: "inhalador aceites esenciales ciudad",
  },
  {
    icon: "⚡",
    title: "Energía Instantánea",
    body: 'El mentol y los aceites cítricos activan zonas del cerebro relacionadas con el foco y la alerta. Un "shot" natural sin cafeína ni efectos secundarios.',
    kw: "aromaterapia energía concentración",
  },
  {
    icon: "🌬️",
    title: "Descongestión Nasal",
    body: "La combinación de eucalipto y hierbas mentoladas despeja las fosas nasales en segundos. Respira profundo y vuelve a sentirte bien.",
    kw: "descongestión nasal natural herbal",
  },
  {
    icon: "🌱",
    title: "100% Natural y Seguro",
    body: "Sin nicotina, sin alcohol, sin parabenos. Solo aceites esenciales puros y hierbas herbales sobre un filtro de algodón. No es un vape.",
    kw: "inhalador herbal natural sin químicos",
  },
] as const;

export function BenefitsSection() {
  return (
    <section id="beneficios" className="bg-white py-24">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        {/* Heading */}
        <StorefrontReveal className="mb-14">
          <span className="mb-4 inline-block rounded-full bg-[#eef6e8] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#61a740]">
            Por qué funciona
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-[#1a3a2e] md:text-5xl">
            6 razones para tener uno<br />en tu bolsillo hoy
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-[#6b7280]">
            Cuando inhalas Huele Huele, las moléculas aromáticas viajan directo al sistema límbico — el centro emocional del cerebro — y actúan en segundos.
          </p>
        </StorefrontReveal>

        {/* Grid */}
        <StorefrontReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" selector="[data-storefront-reveal-item]" stagger={0.08} y={20}>
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              data-storefront-reveal-item
              className="group relative overflow-hidden rounded-2xl border border-[#1a3a2e]/7 bg-[#faf8f3] p-7 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(26,58,46,0.12)]"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[#61a740] to-[#c9a84c] transition-transform duration-300 group-hover:scale-x-100" />
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6e8] text-2xl">
                {b.icon}
              </div>
              <h3 className="mb-3 font-serif text-lg font-bold text-[#1a3a2e]">{b.title}</h3>
              <p className="mb-3 text-sm leading-relaxed text-[#6b7280]">{b.body}</p>
              <p className="text-xs font-semibold text-[#61a740]">{b.kw}</p>
            </div>
          ))}
        </StorefrontReveal>
      </div>
    </section>
  );
}
