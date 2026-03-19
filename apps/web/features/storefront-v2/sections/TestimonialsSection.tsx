import { StorefrontV2Panel, StorefrontV2SectionHeading } from "../components/storefront-v2-section";
import type { StorefrontV2Testimonial } from "../lib/content";

export function TestimonialsSection({
  testimonials
}: {
  testimonials: StorefrontV2Testimonial[];
}) {
  return (
    <section className="space-y-6">
      <StorefrontV2SectionHeading
        eyebrow="Prueba social"
        title="La narrativa gana cuando se apoya en momentos de uso reales."
        description="Seguimos usando testimonios y CMS actuales, pero con una composición más premium y más legible."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {testimonials.slice(0, 3).map((testimonial) => (
          <StorefrontV2Panel key={testimonial.id} tone="light" className="h-full">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex gap-1 text-[#b18a4d]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={`${testimonial.id}-${index}`}>●</span>
                  ))}
                </div>
                <p className="text-base leading-8 text-black/68">“{testimonial.quote}”</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#17211a]">{testimonial.name}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-black/40">{testimonial.role}</p>
              </div>
            </div>
          </StorefrontV2Panel>
        ))}
      </div>
    </section>
  );
}
