import {
  cmsTestimonials,
  faqItems,
  featuredProducts,
  heroCopy,
  promoBanners,
  type CmsBanner,
  type CmsFaq,
  type CmsTestimonial,
  type FaqItem,
  type PromoBanner
} from "@huelegood/shared";
import { Badge, Button, Card, CardContent, FAQAccordion } from "@huelegood/ui";
import { fetchCmsSnapshot } from "../lib/api";
import { EditorialMedia, EditorialProductGrid } from "../components/public-brand";
import { brandArt } from "../components/public-brand-art";
import { PublicChecklist, PublicInfoCard, PublicPageHero, PublicPanel, PublicSectionHeading } from "../components/public-shell";
import { StorefrontV2Experience } from "../features/storefront-v2/layouts/storefront-v2-page";
import { isStorefrontV2Enabled } from "../features/storefront-v2/lib/flags";
import { StorefrontV2PremiumExperience } from "../features/storefront-v2-premium/layouts/storefront-v2-premium-page";
import { isStorefrontV2PremiumEnabled } from "../features/storefront-v2-premium/lib/flags";

async function loadHomeCms() {
  try {
    const response = await fetchCmsSnapshot();
    return response.data;
  } catch {
    return null;
  }
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

function mapTestimonial(testimonial: CmsTestimonial) {
  return {
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.quote
  };
}

const usageMoments = [
  {
    title: "Trafico, ruta y trayectos largos",
    description: "Listo para carro, mochila o bolso cuando el día exige movimiento continuo y conviene tener frescura a la mano.",
    image: brandArt.traffic
  },
  {
    title: "Oficina, estudio y escritorio",
    description: "Un formato discreto y limpio para jornadas largas, reuniones o bloques de enfoque sin complicaciones.",
    image: brandArt.office
  },
  {
    title: "Viajes, cambios de ciudad y altura",
    description: "Ligero, práctico y fácil de llevar cuando cambias de clima, de ritmo o pasas más tiempo fuera de casa.",
    image: brandArt.travel
  }
];

const differentiators = [
  "No depende de humo ni vapor para acompañarte.",
  "No ensucia ni requiere aplicación tópica.",
  "Se guarda fácil y mantiene una presencia discreta.",
  "Está pensado para una rutina real: bolso, carro, escritorio o viaje."
];

const formatHighlights = [
  {
    label: "Clásico Verde",
    title: "Tu formato de todos los días",
    description: "Versátil, práctico y directo para quien quiere frescura herbal siempre a mano."
  },
  {
    label: "Premium Negro",
    title: "Diseño sobrio con presencia premium",
    description: "Ideal si quieres un acabado más elegante sin perder portabilidad ni simplicidad."
  },
  {
    label: "Combo Dúo Perfecto",
    title: "Más valor para tener uno siempre cerca",
    description: "Pensado para llevar uno contigo y dejar otro listo en carro, oficina o casa."
  }
];

export default async function HomePage() {
  if (isStorefrontV2PremiumEnabled()) {
    return <StorefrontV2PremiumExperience />;
  }

  if (isStorefrontV2Enabled()) {
    return <StorefrontV2Experience />;
  }

  const cms = await loadHomeCms();
  const hero = cms?.heroCopy ?? heroCopy;
  const banners = cms?.banners.filter((banner) => banner.status === "active").map(mapBanner) ?? promoBanners;
  const faqs = cms?.faqs.filter((faq) => faq.status === "active").map(mapFaq) ?? faqItems;
  const testimonials =
    cms?.testimonials.filter((testimonial) => testimonial.status === "active").map(mapTestimonial) ?? cmsTestimonials.map(mapTestimonial);

  return (
    <div className="space-y-14 py-6 md:space-y-16 md:py-10">
      <PublicPageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
        actions={[
          { label: hero.primaryCta.label, href: hero.primaryCta.href },
          { label: hero.secondaryCta.label, href: hero.secondaryCta.href, variant: "secondary" }
        ]}
        metrics={[
          { label: "Formato", value: "Portable", detail: "Cabe fácil en bolso, carro o escritorio." },
          { label: "Sensación", value: "Fresca", detail: "Una experiencia herbal práctica para tu rutina." },
          { label: "Estilo", value: "Premium", detail: "Diseño limpio y discreto para uso diario." },
          { label: "Compra", value: "Directa", detail: "Catálogo claro y checkout rápido." }
        ]}
        aside={
          <EditorialMedia
            src={brandArt.hero}
            alt="Producto Huele Huele en escena editorial"
            className="min-h-[520px]"
            priority
            overlay={
              <div className="flex h-full flex-col justify-between p-6">
                <div className="flex justify-between gap-3">
                  <div className="rounded-full border border-white/35 bg-white/76 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#132016] backdrop-blur">
                    Huele Huele
                  </div>
                  <div className="rounded-full bg-[#132016]/86 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white shadow-lg backdrop-blur">
                    Frescura portátil
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-white/30 bg-white/82 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/40">Uso real</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#132016]">
                      Hecho para acompañarte en trayectos, oficina, viajes y cambios de ritmo.
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/10 bg-[#132016]/88 p-4 text-white backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Diferencia</p>
                    <p className="mt-2 text-sm font-semibold leading-6">No es vape. No es pomada. Es Huele Huele.</p>
                  </div>
                </div>
              </div>
            }
          />
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <PublicPanel className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <div
              key={banner.title}
              className="rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(242,246,238,0.98)_100%)] p-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-black/38">{banner.note}</p>
                  <Badge className={banner.tone === "amber" ? "bg-[#f3e2b9] text-[#6b4312]" : "bg-[#e8efe1] text-[#132016]"}>
                    {banner.tone === "amber" ? "Selección" : "Favorito"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#132016]">{banner.title}</h2>
                  <p className="text-sm leading-6 text-black/62">{banner.description}</p>
                </div>
                <Button href={banner.ctaHref} variant="secondary">
                  {banner.ctaLabel}
                </Button>
              </div>
            </div>
          ))}
        </PublicPanel>

        <PublicInfoCard
          label="Lo que hace distinta a la marca"
          title="Una alternativa limpia, discreta y lista para moverse contigo."
          description="La propuesta pública de Huele Huele gira en torno al producto, a su formato y a cómo acompaña mejor una rutina real."
          tone="dark"
        />
      </section>

      <section className="space-y-7">
        <PublicSectionHeading
          eyebrow="Colección"
          title="Elige el formato que mejor va con tu ritmo."
          description="Tres referencias claras para comprar sin fricción: uso diario, presencia premium o un combo con más valor."
          action={{ label: "Ir al catálogo", href: "/catalogo" }}
        />
        <EditorialProductGrid products={featuredProducts} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <PublicPanel className="space-y-6">
          <PublicSectionHeading
            eyebrow="Uso cotidiano"
            title="Pensado para momentos reales, no para una promesa abstracta."
            description="La marca se entiende mejor cuando se ve integrada a escenas concretas de uso."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {usageMoments.map((item) => (
              <div key={item.title} className="space-y-3">
                <EditorialMedia src={item.image} alt={item.title} className="min-h-[240px]" />
                <div className="rounded-[1.7rem] border border-black/8 bg-white/84 p-4">
                  <p className="text-lg font-semibold tracking-tight text-[#132016]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-black/62">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </PublicPanel>

        <Card className="overflow-hidden rounded-[2.5rem] border-black/8 bg-[#132016] text-white shadow-[0_28px_90px_rgba(19,32,22,0.26)]">
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.26em] text-white/42">Diferencial de producto</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-[2.6rem]">
                Huele Huele entra mejor cuando el diseño, el formato y el uso se entienden al instante.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/74">
                Lo importante en público no es hablar de módulos ni arquitectura. Es mostrar un producto elegante, fácil
                de llevar y coherente con la rutina de quien lo compra.
              </p>
            </div>
            <PublicChecklist items={differentiators} tone="dark" />
            <EditorialMedia
              src={brandArt.office}
              alt="Escena editorial de Huele Huele en oficina"
              className="min-h-[290px] border-white/8 bg-white/8 shadow-none"
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-7">
        <PublicSectionHeading
          eyebrow="Selección"
          title="Tres formas de entrar a la marca."
          description="Cada formato responde a un tipo de compra distinto: probar, subir el nivel o resolver varias escenas de uso."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {formatHighlights.map((item) => (
            <PublicInfoCard key={item.title} label={item.label} title={item.title} description={item.description} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <PublicPanel className="space-y-6">
          <PublicSectionHeading
            eyebrow="Percepción"
            title="Lo que valoran de Huele Huele en su rutina."
            description="Usamos escenarios editoriales de uso, no promesas médicas ni claims ambiguos."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.slice(0, 3).map((testimonial) => (
              <div key={testimonial.id} className="rounded-[1.9rem] border border-black/8 bg-white/84 p-5">
                <p className="text-sm leading-7 text-black/68">“{testimonial.quote}”</p>
                <div className="mt-5 space-y-1">
                  <p className="text-sm font-semibold text-[#132016]">{testimonial.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/38">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </PublicPanel>

        <PublicPanel className="space-y-6">
          <PublicSectionHeading
            eyebrow="Preguntas frecuentes"
            title="Lo esencial antes de elegir tu formato."
            description="Información clara para que la decisión de compra sea simple."
          />
          <div className="rounded-[2rem] border border-black/8 bg-white/76 p-3 md:p-4">
            <FAQAccordion items={faqs} />
          </div>
        </PublicPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <EditorialMedia src={brandArt.travel} alt="Escena de viaje con Huele Huele" className="min-h-[360px]" />
        <PublicPanel className="flex flex-col justify-center space-y-6">
          <div className="space-y-3">
            <Badge className="bg-[#132016] text-white">Listo para llevar</Badge>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#132016] md:text-[2.8rem]">
              Compra el formato que mejor encaja con tu ritmo y tenlo siempre a la mano.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-black/62">
              Catálogo directo, compra clara y una marca pública enfocada en el producto, no en la operación interna.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/catalogo">Comprar ahora</Button>
            <Button href="/checkout" variant="secondary">
              Ir al checkout
            </Button>
          </div>
        </PublicPanel>
      </section>
    </div>
  );
}
