import { storefrontV2PremiumContent } from "../content";
import { StorefrontV2PremiumShell } from "../components/storefront-v2-premium-shell";
import { ContactFaqCtaSection } from "../sections/ContactFaqCtaSection";
import { HeroEditorialSection } from "../sections/HeroEditorialSection";
import { ProductCatalogSection } from "../sections/ProductCatalogSection";
import { BrandStorySection } from "../sections/BrandStorySection";

export function StorefrontV2PremiumExperience({
  preview = false
}: {
  preview?: boolean;
}) {
  const content = storefrontV2PremiumContent;

  return (
    <StorefrontV2PremiumShell preview={preview}>
      <HeroEditorialSection hero={content.hero} preview={preview} />
      <ProductCatalogSection products={content.products} highlights={content.productHighlights} />
      <BrandStorySection metrics={content.brandMetrics} cards={content.brandStoryCards} />
      <ContactFaqCtaSection faqs={content.faqs} callout={content.faqCallout} banner={content.ctaBanner} />
    </StorefrontV2PremiumShell>
  );
}
