import { Baloo_2, Nunito } from "next/font/google";
import { featuredProducts } from "@huelegood/shared";
import { fetchCatalogSummary, fetchCmsSnapshot } from "../lib/api";
import { HueleHomeExperience } from "./huele-home-experience";
import { resolveHueleHomeProductCards } from "../lib/huele-home-content";
import { curateStorefrontProducts, isStorefrontStaticFallbackEnabled } from "../lib/storefront-runtime";

const hueleDisplayFont = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-hh-display",
  display: "swap"
});

const hueleBodyFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-hh-sans",
  display: "swap"
});

const allowStaticStorefrontFallbacks = isStorefrontStaticFallbackEnabled();
const publicLogoUrl = "/brand/logo-hh.png";

function resolvePublicLogoUrl(value?: string) {
  const logoUrl = value?.trim();
  if (!logoUrl) {
    return publicLogoUrl;
  }

  const normalizedLogoUrl = decodeURIComponent(logoUrl).toLowerCase();
  if (normalizedLogoUrl.includes("logo 2.png")) {
    return publicLogoUrl;
  }

  return logoUrl;
}

export async function StorefrontGameHome() {
  const [cmsResponse, catalogResponse] = await Promise.all([
    fetchCmsSnapshot().catch(() => null),
    fetchCatalogSummary().catch(() => null)
  ]);

  const cms = cmsResponse?.data;
  const siteSetting = cms?.siteSetting;
  const runtimeProducts = catalogResponse?.data.products ?? [];
  const curatedRuntimeProducts = curateStorefrontProducts(runtimeProducts, siteSetting?.featuredProductSlugs);
  const curatedProducts =
    curatedRuntimeProducts.length > 0
      ? curatedRuntimeProducts
      : allowStaticStorefrontFallbacks
      ? featuredProducts
      : [];

  const supportLines = [
    siteSetting?.whatsapp ? siteSetting.whatsapp : "+51 927 476 668",
    typeof siteSetting?.freeShippingThreshold === "number"
      ? `Desde S/ ${siteSetting.freeShippingThreshold.toFixed(0)}`
      : "Desde S/ 99",
    siteSetting?.supportEmail ? siteSetting.supportEmail : "contacto@huelegood.com"
  ].filter(Boolean);

  return (
    <HueleHomeExperience
      brandName={siteSetting?.brandName ?? "Huele Huele"}
      fontClassName={`${hueleDisplayFont.variable} ${hueleBodyFont.variable}`}
      logoUrl={resolvePublicLogoUrl(siteSetting?.headerLogoUrl)}
      productCards={resolveHueleHomeProductCards(curatedProducts)}
      supportLines={supportLines}
    />
  );
}
