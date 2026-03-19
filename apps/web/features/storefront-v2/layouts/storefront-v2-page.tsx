import { StorefrontV2Shell } from "../components/storefront-v2-shell";
import { loadStorefrontV2Content } from "../lib/content";
import { BenefitsGridSection } from "../sections/BenefitsGridSection";
import { BrandStorySection } from "../sections/BrandStorySection";
import { CtaBannerSection } from "../sections/CtaBannerSection";
import { FaqSection } from "../sections/FaqSection";
import { HeroEditorialSection } from "../sections/HeroEditorialSection";
import { HowToUseSection } from "../sections/HowToUseSection";
import { IngredientsStorySection } from "../sections/IngredientsStorySection";
import { ProductHighlightGrid } from "../sections/ProductHighlightGrid";
import { TestimonialsSection } from "../sections/TestimonialsSection";

export async function StorefrontV2Experience({
  preview = false
}: {
  preview?: boolean;
}) {
  const content = await loadStorefrontV2Content();

  return (
    <StorefrontV2Shell preview={preview}>
      <HeroEditorialSection hero={content.hero} metrics={content.heroMetrics} products={content.products} preview={preview} />
      <BenefitsGridSection benefits={content.benefits} />
      <ProductHighlightGrid products={content.products} />
      <IngredientsStorySection stories={content.ingredientStories} />
      <HowToUseSection steps={content.usageSteps} />
      <BrandStorySection metrics={content.brandMetrics} cards={content.brandStoryCards} />
      <TestimonialsSection testimonials={content.testimonials} />
      <FaqSection faqs={content.faqs} secondaryBanner={content.secondaryBanner} />
      <CtaBannerSection banner={content.ctaBanner} secondaryBanner={content.secondaryBanner} />
    </StorefrontV2Shell>
  );
}
