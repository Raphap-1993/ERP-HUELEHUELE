const TESTIMONIALS = [
  {
    stars: 5,
    text: "Subí al Machu Picchu con mi familia y a las 2 horas en Aguas Calientes ya sentía el soroche clásico: cabeza pesada, náuseas. Mi guía tenía un Huele Huele. Lo usé tres veces y en 10 minutos era otra persona.",
    highlight: "Ahora es lo primero que meto a la mochila antes de cada viaje a la sierra.",
    name: "Rodrigo M.",
    role: "Ingeniero, 34 años",
    location: "Cusco — Machu Picchu",
    avatar: "🧔",
    avatarBg: "#d8f3dc",
  },
  {
    stars: 5,
    text: "Dos horas en la Panamericana Norte todos los días. El olor a smog y al bus me tenía con dolor de cabeza constante. Empecé a usar el Huele Huele Verde en el trayecto y cambió todo.",
    highlight: "Llego a la oficina como si hubiera descansado bien.",
    name: "Valeria Ch.",
    role: "Analista financiera, 28 años",
    location: "Lima — Tráfico diario",
    avatar: "👩",
    avatarBg: "#fff9e6",
  },
  {
    stars: 5,
    text: "Semanas de exámenes finales en la UNI: 5 horas de pantalla, sin dormir bien, con los ojos y la cabeza bloqueados. Un amigo me pasó el Negro y lo probé antes de estudiar. El mentol es intenso pero te activa al toque.",
    highlight: "Ahora lo tengo en mi escritorio y no estudio sin él.",
    name: "Sebastián A.",
    role: "Estudiante de Sistemas, 22 años",
    location: "Lima — UNI",
    avatar: "🧑‍💻",
    avatarBg: "#e8f4fd",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="bg-white py-24">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        {/* Heading */}
        <div className="mb-14">
          <span className="mb-4 inline-block rounded-full bg-[#d8f3dc] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2d6a4f]">
            Lo dicen ellos
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-[#1a3a2e] md:text-5xl">
            Reales. Peruanos. Convencidos.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-[#6b7280]">
            Más de cientos de personas ya lo tienen en su bolsillo. Aquí algunas historias.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative overflow-hidden rounded-3xl border border-[#1a3a2e]/7 bg-[#faf8f3] p-7"
            >
              {/* Large quote mark */}
              <span className="pointer-events-none absolute right-5 top-4 font-serif text-8xl leading-none text-[#d8f3dc]" aria-hidden="true">
                &ldquo;
              </span>

              {/* Stars */}
              <div className="mb-4 text-lg tracking-widest text-[#c9a84c]">
                {"★".repeat(t.stars)}
              </div>

              <p className="relative mb-4 text-sm leading-7 text-[#1c1c1c]">
                {t.text}{" "}
                <strong className="font-semibold text-[#2d6a4f]">{t.highlight}</strong>
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl"
                  style={{ background: t.avatarBg }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a3a2e]">{t.name}</p>
                  <p className="text-xs text-[#6b7280]">{t.role}</p>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#d8f3dc] px-2.5 py-0.5 text-[11px] font-semibold text-[#52b788]">
                    📍 {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
