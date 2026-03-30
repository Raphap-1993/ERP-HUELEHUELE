import Link from "next/link";
import { CmsSocialPlatform, CmsTestimonialKind, type CmsTestimonial } from "@huelegood/shared";

const FALLBACK_TESTIMONIALS: CmsTestimonial[] = [
  {
    id: "premium-tst-1",
    name: "Rodrigo M.",
    role: "Ingeniero, 34 años",
    quote:
      "Subí al Machu Picchu con mi familia y a las 2 horas en Aguas Calientes ya sentía el soroche clásico. Lo usé tres veces y en 10 minutos era otra persona.",
    rating: 5,
    kind: CmsTestimonialKind.Text,
    position: 1,
    status: "active",
    updatedAt: "2026-03-28T10:00:00.000Z"
  },
  {
    id: "premium-tst-2",
    name: "Valeria Ch.",
    role: "Analista financiera, 28 años",
    quote:
      "Dos horas en la Panamericana Norte todos los días. Empecé a usar el Huele Huele Verde en el trayecto y ahora llego a la oficina mucho más fresca.",
    rating: 5,
    kind: CmsTestimonialKind.Text,
    position: 2,
    status: "active",
    updatedAt: "2026-03-28T10:05:00.000Z"
  },
  {
    id: "premium-tst-3",
    name: "Sebastián A.",
    role: "Estudiante de Sistemas, 22 años",
    quote:
      "En semanas de exámenes el Negro me ayudó a mantenerme enfocado. Ahora lo tengo en mi escritorio y ya es parte de mi rutina.",
    rating: 5,
    kind: CmsTestimonialKind.Text,
    position: 3,
    status: "active",
    updatedAt: "2026-03-28T10:10:00.000Z"
  }
];

function kindLabel(testimonial: CmsTestimonial) {
  if (testimonial.kind === CmsTestimonialKind.Audio) {
    return "Audio curado";
  }

  if (testimonial.kind === CmsTestimonialKind.Social) {
    return testimonial.socialPlatform === CmsSocialPlatform.Tiktok ? "TikTok curado" : "Instagram curado";
  }

  return "Testimonio real";
}

function summaryText(testimonial: CmsTestimonial) {
  if (testimonial.kind === CmsTestimonialKind.Audio) {
    return testimonial.quote ?? "Escucha un testimonio en audio curado desde el CMS.";
  }

  if (testimonial.kind === CmsTestimonialKind.Social) {
    return testimonial.quote ?? "Ver testimonio curado desde redes sociales.";
  }

  return testimonial.quote ?? "Testimonio activo.";
}

function actionHref(testimonial: CmsTestimonial) {
  if (testimonial.kind === CmsTestimonialKind.Audio) {
    return testimonial.audioUrl;
  }

  if (testimonial.kind === CmsTestimonialKind.Social) {
    return testimonial.socialUrl;
  }

  return undefined;
}

function actionLabel(testimonial: CmsTestimonial) {
  if (testimonial.kind === CmsTestimonialKind.Audio) {
    return "Escuchar audio";
  }

  if (testimonial.kind === CmsTestimonialKind.Social) {
    return "Ver publicación";
  }

  return undefined;
}

export function TestimonialsSection({ testimonials = FALLBACK_TESTIMONIALS }: { testimonials?: CmsTestimonial[] }) {
  const visibleTestimonials = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

  return (
    <section id="testimonios" className="bg-white py-24">
      <div className="mx-auto max-w-[1120px] px-4 md:px-6">
        <div className="mb-14">
          <span className="mb-4 inline-block rounded-full bg-[#d8f3dc] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2d6a4f]">
            Lo dicen ellos
          </span>
          <h2 className="mb-4 font-serif text-4xl font-black leading-tight text-[#1a3a2e] md:text-5xl">
            Prueba social curada y visible en runtime
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-[#6b7280]">
            Testimonios de texto, audio y social publicados desde CMS sin redeploy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {visibleTestimonials.map((testimonial) => {
            const href = actionHref(testimonial);
            const label = actionLabel(testimonial);
            return (
              <div
                key={testimonial.id}
                className="relative overflow-hidden rounded-3xl border border-[#1a3a2e]/7 bg-[#faf8f3] p-7"
              >
                <span className="mb-4 inline-flex rounded-full bg-[#d8f3dc] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d6a4f]">
                  {kindLabel(testimonial)}
                </span>
                <div className="mb-4 text-lg tracking-widest text-[#c9a84c]">
                  {"★".repeat(Math.max(1, Math.min(5, testimonial.rating ?? 5)))}
                </div>
                <p className="mb-5 text-sm leading-7 text-[#1c1c1c]">{summaryText(testimonial)}</p>
                {href && label ? (
                  <Link
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-5 inline-flex rounded-full border border-[#2d6a4f]/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#2d6a4f] transition hover:border-[#2d6a4f] hover:bg-[#d8f3dc]"
                  >
                    {label}
                  </Link>
                ) : null}

                <div className="border-t border-[#1a3a2e]/8 pt-4">
                  <p className="text-sm font-bold text-[#1a3a2e]">{testimonial.name}</p>
                  <p className="text-xs text-[#6b7280]">{testimonial.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
