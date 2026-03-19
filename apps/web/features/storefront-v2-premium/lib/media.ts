import { brandArt, productArtBySlug } from "../../../components/public-brand-art";

export {
  cloudflareImageLoader,
  getStorefrontMediaBaseUrl,
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc,
  storefrontMediaHosts
} from "../../storefront-v2/lib/media";

export const storefrontV2PremiumMedia = {
  hero: brandArt.hero,
  office: brandArt.office,
  traffic: brandArt.traffic,
  travel: brandArt.travel,
  wholesale: brandArt.wholesale,
  seller: brandArt.seller
} as const;

export const storefrontV2PremiumProductArtBySlug = productArtBySlug;
