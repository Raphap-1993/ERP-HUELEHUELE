import type { ImageLoaderProps } from "next/image";
import { brandArt, productArtBySlug } from "../../../components/public-brand-art";

const storefrontMediaHosts = ["cdn.huelegood.com", "images.huelegood.com", "media.huelegood.com"] as const;
const storefrontMediaHostSet = new Set<string>(storefrontMediaHosts);

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeMediaBaseUrl(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value);
    if (!storefrontMediaHostSet.has(url.hostname)) {
      return null;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getStorefrontMediaBaseUrl() {
  return normalizeMediaBaseUrl(process.env.NEXT_PUBLIC_STOREFRONT_MEDIA_BASE_URL);
}

export function resolveStorefrontMediaSrc(src: string) {
  if (isAbsoluteUrl(src)) {
    return src;
  }

  const baseUrl = getStorefrontMediaBaseUrl();
  if (!baseUrl) {
    return src;
  }

  return `${baseUrl}/${src.replace(/^\/+/, "")}`;
}

export function isRemoteStorefrontMediaUrl(src: string) {
  try {
    return storefrontMediaHostSet.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

export function cloudflareImageLoader({ src, width, quality }: ImageLoaderProps) {
  const resolvedSrc = resolveStorefrontMediaSrc(src);
  if (!isRemoteStorefrontMediaUrl(resolvedSrc)) {
    return resolvedSrc;
  }

  const url = new URL(resolvedSrc);
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality ?? 82));
  url.searchParams.set("format", "auto");

  return url.toString();
}

export const storefrontV2Media = {
  hero: brandArt.hero,
  office: brandArt.office,
  traffic: brandArt.traffic,
  travel: brandArt.travel,
  checkout: brandArt.checkout,
  seller: brandArt.seller
} as const;

export const storefrontProductArtBySlug = productArtBySlug;
export { storefrontMediaHosts };
