import { HeroSection } from "../sections/HeroSection";
import { BenefitsSection } from "../sections/BenefitsSection";
import { ComparisonSection } from "../sections/ComparisonSection";
import { PricingSection } from "../sections/PricingSection";
import { TestimonialsSection } from "../sections/TestimonialsSection";
import { WholesaleB2BSection } from "../sections/WholesaleB2BSection";
import { FaqAccordionSection } from "../sections/FaqAccordionSection";
import { InstagramSection } from "../sections/InstagramSection";
import { StickyBarClient } from "../components/StickyBarClient";

export function StorefrontV2PremiumExperience({
  preview = false
}: {
  preview?: boolean;
}) {
  return (
    <>
      <HeroSection />
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
