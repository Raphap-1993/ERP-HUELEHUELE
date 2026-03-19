import { storefrontV2PremiumContent } from "../content";
import { StorefrontV2PremiumShell } from "../components/storefront-v2-premium-shell";
import { BenefitsEditorialSection } from "../sections/BenefitsEditorialSection";
import { BrandStorySection } from "../sections/BrandStorySection";
import { CtaBannerSection } from "../sections/CtaBannerSection";
import { FaqSection } from "../sections/FaqSection";
import { HeroEditorialSection } from "../sections/HeroEditorialSection";
import { ProductCatalogSection } from "../sections/ProductCatalogSection";
import { UseCasesSection } from "../sections/UseCasesSection";
import { VendorCalloutSection } from "../sections/VendorCalloutSection";
import { WholesaleSection } from "../sections/WholesaleSection";
import { WhyChooseSection } from "../sections/WhyChooseSection";

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
      <UseCasesSection items={content.useCases} />
      <BenefitsEditorialSection benefits={content.benefits} />
      <BrandStorySection metrics={content.brandMetrics} cards={content.brandStoryCards} />
      <WhyChooseSection reasons={content.whyChooseReasons} callout={content.whyChooseCallout} />
      <WholesaleSection plans={content.wholesalePlans} callout={content.wholesaleCallout} />
      <VendorCalloutSection callout={content.vendorCallout} />
      <FaqSection faqs={content.faqs} callout={content.faqCallout} />
      <CtaBannerSection banner={content.ctaBanner} />
    </StorefrontV2PremiumShell>
  );
}
