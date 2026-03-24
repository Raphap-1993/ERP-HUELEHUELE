import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@huelegood/ui";
import { resolveStorefrontMediaSrc } from "../lib/media";

export function StorefrontV2Media({
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

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[2.4rem] border border-[#17211a]/8 bg-[linear-gradient(145deg,#edf1e8_0%,#f7f2e8_58%,#dde5d5_100%)] shadow-[0_36px_100px_rgba(23,33,26,0.12)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(23,33,26,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(203,181,140,0.28),transparent_30%)]" />
      <div className="absolute inset-[1px] rounded-[2.3rem] border border-white/30" />
      <Image
        fill
        alt={alt}
        src={resolvedSrc}
        priority={priority}
        quality={quality}
        sizes={sizes ?? "(min-width: 1280px) 42vw, (min-width: 768px) 50vw, 100vw"}
        className={cn("object-cover transition duration-700 group-hover:scale-[1.03]", imageClassName)}
      />
      {overlay ? <div className="absolute inset-0">{overlay}</div> : null}
    </div>
  );
}
