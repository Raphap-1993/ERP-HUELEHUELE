import {
  cmsTestimonials,
  faqItems,
  featuredProducts,
  heroCopy,
  promoBanners,
  wholesalePlans,
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
  SectionHeader,
  SellerCodeInput,
  WholesalePlanCard
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
          title="Catálogo visible y seller-first"
          description="Huelegood nace con productos visibles, códigos de vendedor y narrativa comercial para convertir con trazabilidad."
          action={{ label: "Ver todo el catálogo", href: "/catalogo" }}
        />
        <ProductGrid products={featuredProducts} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SellerCodeInput />
        <div className="space-y-4">
          <SectionHeader title="Mayoristas y distribuidores" description="El funnel B2B inicia aquí y luego se gestiona desde operación." />
          <div className="grid gap-4 md:grid-cols-2">
            {wholesalePlans.map((plan) => (
              <WholesalePlanCard key={plan.tier} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader title="Prueba social" description="Testimonios y narrativa comercial editables desde el CMS interno." />
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
        <SectionHeader title="Preguntas frecuentes" description="Pago, vendedor, mayoristas y operación comercial." />
        <FAQAccordion items={faqs} />
      </section>
    </div>
  );
}
