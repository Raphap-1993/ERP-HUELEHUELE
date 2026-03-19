import {
  faqItems,
  featuredProducts,
  heroCopy,
  promoBanners,
  type CmsBanner,
  type CmsFaq,
  type FaqItem,
  type PromoBanner
} from "@huelegood/shared";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, FAQAccordion, PromoBannerCard, SectionHeader } from "@huelegood/ui";
import { fetchCmsSnapshot } from "../lib/api";
import { brandArt, EditorialMedia, EditorialProductGrid } from "../components/public-brand";

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

const usageMoments = [
  {
    title: "Trafico y trayectos largos",
    description: "Llevalo en la guantera, mochila o bolso para una sensacion fresca cuando el dia se siente pesado.",
    image: brandArt.traffic
  },
  {
    title: "Oficina y estudio",
    description: "Un formato discreto y practico para tener cerca durante jornadas largas, reuniones o bloques de enfoque.",
    image: brandArt.office
  },
  {
    title: "Viajes y altura",
    description: "Ligero, portable y facil de llevar cuando cambias de ciudad, clima o ritmo.",
    image: brandArt.travel
  }
];

const differentiators = [
  {
    title: "No es vape",
    description: "No depende de humo ni vapor. Esta pensado para quien quiere algo simple, portable y directo."
  },
  {
    title: "No es pomada",
    description: "No ensucia ni requiere aplicacion topica. Solo lo llevas contigo y lo usas cuando lo necesitas."
  },
  {
    title: "Look premium y discreto",
    description: "Diseno cuidado para acompanarte en oficina, viaje, carro o bolso sin perder presencia."
  }
];

const routineStories = [
  {
    title: "Oficina y traslados",
    tag: "Uso diario",
    description: "Para jornadas largas, reuniones y movimiento entre puntos donde conviene tener frescura a la mano."
  },
  {
    title: "Ruta y carretera",
    tag: "Trayectos largos",
    description: "Fácil de llevar en carro o mochila cuando el día pasa entre tráfico, carretera y cambios de ritmo."
  },
  {
    title: "Viajes y altura",
    tag: "Movimiento constante",
    description: "Ligero, práctico y listo para acompañarte cuando sales de ciudad, cambias de clima o viajas seguido."
  }
];

const trustPoints = [
  { value: "Fresco", label: "sensacion herbal lista para acompanarte" },
  { value: "Portable", label: "cabe en bolso, carro o escritorio" },
  { value: "Premium", label: "diseno limpio y look discreto" },
  { value: "Practico", label: "sin complicaciones en tu rutina" }
];

export default async function HomePage() {
  const cms = await loadHomeCms();
  const hero = cms?.heroCopy ?? heroCopy;
  const banners = cms?.banners.filter((banner) => banner.status === "active").map(mapBanner) ?? promoBanners;
  const faqs = cms?.faqs.filter((faq) => faq.status === "active").map(mapFaq) ?? faqItems;

  return (
    <div className="space-y-14 py-6 md:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative overflow-hidden rounded-[2.6rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(244,247,239,0.98)_100%)] px-7 py-8 shadow-soft md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(165,190,149,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(196,155,93,0.18),transparent_28%)]" />
          <div className="relative max-w-3xl space-y-7">
            <Badge className="bg-[#132016] text-white">{hero.eyebrow}</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-[0.96] tracking-tight text-[#132016] md:text-6xl">
                {hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/68 md:text-lg">{hero.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
              <Button href={hero.secondaryCta.href} variant="secondary">
                {hero.secondaryCta.label}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {trustPoints.map((point) => (
                <div key={point.value} className="rounded-[1.6rem] border border-black/8 bg-white/74 px-4 py-4 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#132016]">{point.value}</p>
                  <p className="mt-2 text-sm leading-6 text-black/56">{point.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <EditorialMedia
          src={brandArt.hero}
          alt="Editorial hero de Huele Huele"
          className="min-h-[420px]"
          overlay={
            <div className="flex h-full flex-col justify-between p-5">
              <div className="flex justify-end">
                <div className="rounded-full bg-white/78 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#132016] shadow-sm">
                  Huele Huele
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/78 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/38">Uso real</p>
                  <p className="mt-2 text-sm font-semibold text-[#132016]">Listo para acompanarte en trayectos, oficina y viaje.</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#132016]/92 p-4 text-white backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Diferencial</p>
                  <p className="mt-2 text-sm font-semibold">No es vape. No es pomada. Es Huele Huele.</p>
                </div>
              </div>
            </div>
          }
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {banners.map((banner) => (
          <PromoBannerCard key={banner.title} banner={banner} />
        ))}
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Elige tu Huele Huele"
          description="Tres formatos para distintas rutinas: el clasico de uso diario, la version premium y un combo pensado para tener siempre una unidad a la mano."
          action={{ label: "Ver catalogo completo", href: "/catalogo" }}
        />
        <EditorialProductGrid products={featuredProducts} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
        <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
          {usageMoments.map((item) => (
            <div key={item.title} className="space-y-3">
              <EditorialMedia src={item.image} alt={item.title} className="min-h-[250px]" />
              <Card className="rounded-[2rem] border-black/8 bg-white/90">
                <CardContent className="space-y-2">
                  <p className="text-base font-semibold text-[#132016]">{item.title}</p>
                  <p className="text-sm leading-6 text-black/64">{item.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <Card className="overflow-hidden rounded-[2.4rem] border-black/8 bg-[#132016] text-white">
          <CardHeader>
            <Badge className="w-fit bg-white/15 text-white">Diferencial</Badge>
            <CardTitle className="text-white">Una alternativa practica y limpia</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {differentiators.map((item) => (
              <div key={item.title} className="rounded-[1.5rem] bg-white/8 px-4 py-4">
                <p className="text-base font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/76">{item.description}</p>
              </div>
            ))}
            <div className="rounded-[1.8rem] bg-white/8 p-3">
              <EditorialMedia src={brandArt.office} alt="Escena editorial Huele Huele" className="min-h-[260px] border-0 shadow-none" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Dónde mejor acompaña Huele Huele"
          description="Tres contextos donde su formato portátil y su sensación fresca suelen hacer más sentido."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {routineStories.map((story) => (
            <Card key={story.title} className="rounded-[2rem] border-black/8 bg-white/92">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{story.title}</CardTitle>
                    <p className="mt-1 text-sm text-black/55">{story.tag}</p>
                  </div>
                  <Badge tone="success">Huele Huele</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-black/70">{story.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Preguntas frecuentes"
          description="Lo esencial para elegir tu producto y entender en que momentos suele acompanarte mejor."
        />
        <div className="rounded-[2.4rem] border border-black/8 bg-white/90 p-4 shadow-soft md:p-6">
          <FAQAccordion items={faqs} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <EditorialMedia src={brandArt.travel} alt="Huele Huele para viajes y movimiento" className="min-h-[340px]" />
        <Card className="rounded-[2.4rem] border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f3f7ed_100%)]">
          <CardContent className="space-y-5">
            <Badge tone="success">Listo para llevar</Badge>
            <div className="space-y-3">
              <CardTitle className="text-3xl md:text-4xl">Tu formato favorito para moverte ligero.</CardTitle>
              <p className="max-w-2xl text-base leading-7 text-black/66">
                Un formato pensado para acompañarte en trayectos, oficina y viaje con una sensación clara, práctica y fácil de llevar.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/catalogo">Ir al catalogo</Button>
              <Button href="/checkout" variant="secondary">
                Comprar ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
