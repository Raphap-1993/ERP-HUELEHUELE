import {
  cmsTestimonials,
  faqItems,
  featuredProducts,
  heroCopy,
  promoBanners,
  type CmsBanner,
  type CmsFaq,
  type FaqItem,
  type PromoBanner
} from "@huelegood/shared";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FAQAccordion,
  HeroSection,
  ProductGrid,
  PromoBannerCard,
  SectionHeader
} from "@huelegood/ui";
import { fetchCmsSnapshot } from "../lib/api";

async function loadHomeCms() {
  try {
    const response = await fetchCmsSnapshot();
    return response.data;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function mapBanner(banner: CmsBanner): PromoBanner {
  return {
    title: banner.title,
    description: banner.description,
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref,
    note: banner.note,
    tone: banner.tone
  };
}

function mapFaq(faq: CmsFaq): FaqItem {
  return {
    question: faq.question,
    answer: faq.answer,
    category: faq.category
  };
}

const usageMoments = [
  {
    title: "Tráfico y trayectos largos",
    description: "Llévalo en la guantera, mochila o bolso para una sensación fresca cuando el día se siente pesado."
  },
  {
    title: "Oficina y estudio",
    description: "Un formato discreto y práctico para tener cerca durante jornadas largas, reuniones o bloques de enfoque."
  },
  {
    title: "Viajes y altura",
    description: "Ligero, portable y fácil de llevar cuando cambias de ciudad, clima o ritmo."
  }
];

const differentiators = [
  {
    title: "No es vape",
    description: "No depende de humo ni vapor. Está pensado para quien quiere algo simple, portátil y directo."
  },
  {
    title: "No es pomada",
    description: "No ensucia ni requiere aplicación tópica. Solo lo llevas contigo y lo usas cuando lo necesitas."
  },
  {
    title: "Look premium y discreto",
    description: "Diseño cuidado para acompañarte en oficina, viaje, carro o bolso sin perder presencia."
  }
];

export default async function HomePage() {
  const cms = await loadHomeCms();
  const hero = cms?.heroCopy ?? heroCopy;
  const banners = cms?.banners.filter((banner) => banner.status === "active").map(mapBanner) ?? promoBanners;
  const faqs = cms?.faqs.filter((faq) => faq.status === "active").map(mapFaq) ?? faqItems;
  const testimonials = cms?.testimonials.filter((testimonial) => testimonial.status === "active") ?? cmsTestimonials;

  return (
    <div className="space-y-14 py-6 md:py-10">
      <HeroSection copy={hero} />

      <section className="grid gap-5 lg:grid-cols-2">
        {banners.map((banner) => (
          <PromoBannerCard key={banner.title} banner={banner} />
        ))}
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Elige tu Huele Huele"
          description="Tres formatos para distintas rutinas: el clásico de uso diario, la versión premium y un combo pensado para tener siempre una unidad a la mano."
          action={{ label: "Ver catálogo completo", href: "/catalogo" }}
        />
        <ProductGrid products={featuredProducts} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hecho para acompañarte en movimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {usageMoments.map((item) => (
              <div key={item.title} className="rounded-[1.5rem] border border-black/8 bg-black/[0.02] px-4 py-4">
                <p className="text-base font-semibold text-[#132016]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-black/66">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-[#132016] text-white">
          <CardHeader>
            <Badge className="w-fit bg-white/15 text-white">Diferencial</Badge>
            <CardTitle className="text-white">Una alternativa práctica y limpia</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {differentiators.map((item) => (
              <div key={item.title} className="rounded-[1.5rem] bg-white/8 px-4 py-4">
                <p className="text-base font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/76">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Lo compran por practicidad, lo recomiendan por cómo se siente"
          description="Historias de uso real en trayectos, oficina, viajes y rutinas donde tener frescura a la mano sí hace diferencia."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{testimonial.name}</CardTitle>
                    <p className="mt-1 text-sm text-black/55">{testimonial.role}</p>
                  </div>
                  <Badge tone="info">{`${testimonial.rating}/5`}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-black/70">{testimonial.quote}</p>
                <div className="text-xs uppercase tracking-[0.18em] text-black/45">Actualizado {formatDate(testimonial.updatedAt)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Preguntas frecuentes"
          description="Lo esencial para elegir tu producto y entender en qué momentos suele acompañarte mejor."
        />
        <FAQAccordion items={faqs} />
      </section>
    </div>
  );
}
