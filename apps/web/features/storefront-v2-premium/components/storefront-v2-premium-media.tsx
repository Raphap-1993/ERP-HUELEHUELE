import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@huelegood/ui";
import { cloudflareImageLoader, isRemoteStorefrontMediaUrl, resolveStorefrontMediaSrc } from "../lib/media";
import { storefrontV2PremiumTokens } from "../tokens/storefront-v2-premium-tokens";

export function StorefrontV2PremiumMedia({
  src,
  alt,
  className,
  imageClassName,
  overlay,
  priority = false,
  sizes,
  quality
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  overlay?: ReactNode;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}) {
  const resolvedSrc = resolveStorefrontMediaSrc(src);
  const isRemote = isRemoteStorefrontMediaUrl(resolvedSrc);

  return (
    <div className={cn(storefrontV2PremiumTokens.className.media, className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(17,32,23,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(198,164,113,0.28),transparent_30%)]" />
      <div className="absolute inset-[1px] rounded-[2.3rem] border border-white/32" />
      <Image
        fill
        alt={alt}
        src={resolvedSrc}
        priority={priority}
        quality={quality}
        loader={isRemote ? cloudflareImageLoader : undefined}
        sizes={sizes ?? "(min-width: 1280px) 42vw, (min-width: 768px) 50vw, 100vw"}
        className={cn("object-cover transition duration-700 group-hover:scale-[1.03]", imageClassName)}
      />
      {overlay ? <div className="absolute inset-0">{overlay}</div> : null}
    </div>
  );
}
