import {
  FAQAccordion,
  HeroSection,
  ProductGrid,
  PromoBannerCard,
  SectionHeader,
  SellerCodeInput,
  WholesalePlanCard
} from "@huelegood/ui";
import { featuredProducts, heroCopy, promoBanners, wholesalePlans } from "@huelegood/shared";

export default function HomePage() {
  return (
    <div className="space-y-14 py-6 md:py-10">
      <HeroSection copy={heroCopy} />

      <section className="grid gap-5 lg:grid-cols-2">
        {promoBanners.map((banner) => (
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
        <SectionHeader title="Preguntas frecuentes" description="Pago, vendedor, mayoristas y operación comercial." />
        <FAQAccordion />
      </section>
    </div>
  );
}

