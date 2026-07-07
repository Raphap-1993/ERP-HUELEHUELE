import {
  featuredProducts,
  heroCopy,
  type CatalogProduct,
  type CmsTestimonial,
  type FaqItem,
  type HeroCopy
} from "@huelegood/shared";
import { storefrontV2PremiumContent, type PremiumHeroContent } from "../content";
import { StickyBarClient } from "../components/StickyBarClient";
import { StorefrontReveal } from "../components/StorefrontReveal";
import { StorefrontV2PremiumShell } from "../components/storefront-v2-premium-shell";
import { fetchCatalogSummary, fetchCmsSnapshot } from "../../../lib/api";
import { BenefitsSection } from "../sections/BenefitsSection";
import { CommercialRoutesSection } from "../sections/CommercialRoutesSection";
import { CtaBannerSection } from "../sections/CtaBannerSection";
import { FaqAccordionSection } from "../sections/FaqAccordionSection";
import { HeroEditorialSection } from "../sections/HeroEditorialSection";
import { ProductCatalogSection } from "../sections/ProductCatalogSection";
import { TestimonialsSection } from "../sections/TestimonialsSection";
import {
  curateStorefrontProducts,
  isStorefrontStaticFallbackEnabled
} from "../../../lib/storefront-runtime";

const allowStaticStorefrontFallbacks = isStorefrontStaticFallbackEnabled();

function buildHeroContent(hero: HeroCopy, products: CatalogProduct[]): PremiumHeroContent {
  const fallback = storefrontV2PremiumContent.hero;
  const curatedProductChips = products.slice(0, 3).map((product) => product.name);

  return {
    ...fallback,
    eyebrow: hero.eyebrow,
    title: hero.title,
    description: hero.description,
    primaryCta: hero.primaryCta,
    secondaryCta: hero.secondaryCta,
    productChips: curatedProductChips.length > 0 ? curatedProductChips : fallback.productChips,
    metrics: fallback.metrics.map((metric, index) => {
      if (index === 0) {
        return {
          ...metric,
          value: curatedProductChips.length > 0 ? `${curatedProductChips.length} formatos` : metric.value,
          detail: "Selección corta para elegir rápido sin mezclar compra, detalle y checkout."
        };
      }

      if (index === 2) {
        return {
          ...metric,
          detail: "La home ordena la decisión antes de mandar a catálogo, PDP o checkout."
        };
      }

      return metric;
    })
  };
}

export async function StorefrontV2PremiumExperience({
  preview = false
}: {
  preview?: boolean;
}) {
  const [cmsResponse, catalogResponse] = await Promise.all([
    fetchCmsSnapshot().catch(() => null),
    fetchCatalogSummary().catch(() => null)
  ]);
  const cms = cmsResponse?.data;
  const hero = cms?.heroCopy ?? heroCopy;
  const testimonials: CmsTestimonial[] = cms?.testimonials.filter((testimonial) => testimonial.status === "active") ?? [];
  const faqs: FaqItem[] =
    cms?.faqs.filter((faq) => faq.status === "active").map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    })) ?? [];
  const runtimeProducts = catalogResponse?.data.products ?? [];
  const curatedRuntimeProducts = curateStorefrontProducts(runtimeProducts, cms?.siteSetting.featuredProductSlugs);
  const curatedProducts =
    curatedRuntimeProducts.length > 0
      ? curatedRuntimeProducts
      : allowStaticStorefrontFallbacks
        ? featuredProducts
        : [];
  const catalogSource = curatedRuntimeProducts.length > 0 ? "runtime" : "static_fallback";
  const heroContent = buildHeroContent(hero, curatedProducts);

  return (
    <StorefrontV2PremiumShell preview={preview}>
      <HeroEditorialSection hero={heroContent} preview={preview} />
      <StorefrontReveal y={18}>
        <BenefitsSection />
      </StorefrontReveal>
      <StorefrontReveal y={18}>
        <ProductCatalogSection
          catalogSource={catalogSource}
          products={curatedProducts}
          highlights={storefrontV2PremiumContent.productHighlights}
        />
      </StorefrontReveal>
      <StorefrontReveal y={18}>
        <TestimonialsSection testimonials={testimonials.length > 0 ? testimonials : undefined} />
      </StorefrontReveal>
      <StorefrontReveal y={18}>
        <div id="mayoristas">
          <CommercialRoutesSection
            wholesale={storefrontV2PremiumContent.wholesaleCallout}
            vendor={storefrontV2PremiumContent.vendorCallout}
          />
        </div>
      </StorefrontReveal>
      <StorefrontReveal y={18}>
        <FaqAccordionSection faqs={faqs.length > 0 ? faqs : storefrontV2PremiumContent.faqs} />
      </StorefrontReveal>
      <StorefrontReveal y={18}>
        <CtaBannerSection banner={storefrontV2PremiumContent.ctaBanner} />
      </StorefrontReveal>
      <StickyBarClient />
    </StorefrontV2PremiumShell>
  );
}
