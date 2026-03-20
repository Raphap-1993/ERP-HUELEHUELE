import { storefrontV2PremiumContent } from "../content";
import { StorefrontV2PremiumShell } from "../components/storefront-v2-premium-shell";
import { CommercialRoutesSection } from "../sections/CommercialRoutesSection";
import { CtaBannerSection } from "../sections/CtaBannerSection";
import { FaqSection } from "../sections/FaqSection";
import { HeroEditorialSection } from "../sections/HeroEditorialSection";
import { ProductCatalogSection } from "../sections/ProductCatalogSection";
import { UseCasesSection } from "../sections/UseCasesSection";
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
      <WhyChooseSection reasons={content.whyChooseReasons} callout={content.whyChooseCallout} />
      <CommercialRoutesSection wholesale={content.wholesaleCallout} vendor={content.vendorCallout} />
      <FaqSection faqs={content.faqs} callout={content.faqCallout} />
      <CtaBannerSection banner={content.ctaBanner} />
    </StorefrontV2PremiumShell>
  );
}
