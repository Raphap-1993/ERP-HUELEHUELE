import { cmsTestimonials, faqItems, heroCopy, wholesalePlans, type CmsTestimonial, type FaqItem } from "@huelegood/shared";
import { HeroSection } from "../sections/HeroSection";
import { BenefitsSection } from "../sections/BenefitsSection";
import { ComparisonSection } from "../sections/ComparisonSection";
import { PricingSection } from "../sections/PricingSection";
import { TestimonialsSection } from "../sections/TestimonialsSection";
import { WholesaleB2BSection } from "../sections/WholesaleB2BSection";
import { FaqAccordionSection } from "../sections/FaqAccordionSection";
import { InstagramSection } from "../sections/InstagramSection";
import { StickyBarClient } from "../components/StickyBarClient";
import { fetchCatalogSummary, fetchCmsSnapshot, fetchWholesaleTiers } from "../../../lib/api";

export async function StorefrontV2PremiumExperience({
  preview = false
}: {
  preview?: boolean;
}) {
  const [cmsResponse, catalogResponse, wholesaleResponse] = await Promise.all([
    fetchCmsSnapshot().catch(() => null),
    fetchCatalogSummary().catch(() => null),
    fetchWholesaleTiers().catch(() => null)
  ]);
  const cms = cmsResponse?.data;
  const hero = cms?.heroCopy ?? heroCopy;
  const heroProductImageUrl = cms?.siteSetting.heroProductImageUrl ?? undefined;
  const testimonials: CmsTestimonial[] =
    cms?.testimonials.filter((testimonial) => testimonial.status === "active")?.length
      ? cms.testimonials.filter((testimonial) => testimonial.status === "active")
      : cmsTestimonials;
  const faqs: FaqItem[] =
    cms?.faqs.filter((faq) => faq.status === "active").map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    })) ?? faqItems;
  const products = catalogResponse?.data.products ?? [];
  const currencyCode = catalogResponse?.data.currencyCode ?? "PEN";
  const wholesaleTiers = wholesaleResponse?.data?.length ? wholesaleResponse.data : wholesalePlans;

  return (
    <>
      <HeroSection heroProductImageUrl={heroProductImageUrl} heroCopy={hero} />
      <BenefitsSection />
      <ComparisonSection />
      <PricingSection products={products} currencyCode={currencyCode} />
      <TestimonialsSection testimonials={testimonials} />
      <WholesaleB2BSection plans={wholesaleTiers} />
      <FaqAccordionSection faqs={faqs} />
      <InstagramSection />
      <StickyBarClient />
    </>
  );
}
