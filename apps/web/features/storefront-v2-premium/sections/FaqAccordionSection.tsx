import type { FaqItem } from "@huelegood/shared";

const FAQS: FaqItem[] = [
  {
    question: "⏱️ ¿Cuánto dura el aroma del Huele Huele?",
    answer: "Cada inhalador tiene una vida útil de aproximadamente 300 inhalaciones o hasta 6 meses desde su apertura. La intensidad del aroma puede reducirse con el tiempo, pero la eficacia se mantiene durante ese período si lo guardas con la tapa puesta y alejado del calor directo.",
  },
  {
    question: "🚚 ¿Hacen envíos a todo el Perú?",
    answer: "Sí. Enviamos a todo el territorio peruano vía Olva Courier y Shalom. Lima y Callao: 24-48 horas. Provincias: 48-96 horas. Aceptamos Yape, Plin, transferencia bancaria y contra-entrega (en zonas seleccionadas). También puedes coordinarlo por nuestro Instagram @huele.good.",
  },
  {
    question: "🌿 ¿De qué está hecho exactamente?",
    answer: "Huele Huele contiene aceites esenciales 100% puros (mentol, eucalipto, alcanfor y otras hierbas naturales de origen asiático) absorbidos en un filtro de algodón médico. No contiene nicotina, tabaco, alcohol, parabenos ni ningún componente sintético. No es un vape ni un cigarrillo electrónico.",
  },
  {
    question: "⚠️ ¿Tiene contraindicaciones o efectos secundarios?",
    answer: "Es de uso externo (no se ingiere). No está indicado para niños menores de 3 años ni para personas con alergia conocida al mentol o eucalipto. Las mujeres embarazadas deben consultar con su médico antes de usarlo. No reemplaza ningún tratamiento médico. Es un producto de bienestar complementario.",
  },
] as const;

export function FaqAccordionSection({ faqs = FAQS }: { faqs?: FaqItem[] }) {
  return (
    <section id="faq" className="bg-[#faf8f3] py-24">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        {/* Heading */}
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full bg-[#d8f3dc] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2d6a4f]">
            Preguntas frecuentes
          </span>
          <h2 className="font-serif text-4xl font-black leading-tight text-[#1a3a2e] md:text-5xl">
            Resolvemos tus dudas
          </h2>
        </div>

        {/* Preline accordion — chevron rotates via [.hs-accordion.active_&] (Tailwind v3 arbitrary selector) */}
        <div className="hs-accordion-group mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={`${faq.question}-${i}`}
              className="hs-accordion overflow-hidden rounded-2xl border border-[#1a3a2e]/7 bg-white"
              id={`faq-item-${i}`}
            >
              <button
                className="hs-accordion-toggle flex w-full items-start justify-between gap-4 px-7 py-5 text-left text-base font-semibold text-[#1a3a2e] transition hover:text-[#2d6a4f] focus:outline-none"
                aria-expanded="false"
                aria-controls={`faq-collapse-${i}`}
              >
                <span>{faq.question}</span>
                {/* Chevron rotates 180° when accordion is active */}
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#52b788] transition-transform duration-300 [.hs-accordion.active_&]:rotate-180"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                id={`faq-collapse-${i}`}
                className="hs-accordion-content hidden w-full overflow-hidden transition-[height] duration-300"
                role="region"
                aria-labelledby={`faq-item-${i}`}
              >
                <div className="px-7 pb-6 text-sm leading-7 text-[#6b7280]">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
