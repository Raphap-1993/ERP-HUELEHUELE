import { HeroSection } from "../sections/HeroSection";
import { BenefitsSection } from "../sections/BenefitsSection";
import { ComparisonSection } from "../sections/ComparisonSection";
import { PricingSection } from "../sections/PricingSection";
import { TestimonialsSection } from "../sections/TestimonialsSection";
import { WholesaleB2BSection } from "../sections/WholesaleB2BSection";
import { FaqAccordionSection } from "../sections/FaqAccordionSection";
import { InstagramSection } from "../sections/InstagramSection";
import { StickyBarClient } from "../components/StickyBarClient";
import { fetchCmsSiteSettings } from "../../../lib/api";

export async function StorefrontV2PremiumExperience({
  preview = false
}: {
  preview?: boolean;
}) {
  const heroProductImageUrl = await fetchCmsSiteSettings()
    .then((r) => r.data.heroProductImageUrl ?? undefined)
    .catch(() => undefined);

  return (
    <>
      <HeroSection heroProductImageUrl={heroProductImageUrl} />
      <BenefitsSection />
      <ComparisonSection />
      <PricingSection />
      <TestimonialsSection />
      <WholesaleB2BSection />
      <FaqAccordionSection />
      <InstagramSection />
      <StickyBarClient />
    </>
  );
}
