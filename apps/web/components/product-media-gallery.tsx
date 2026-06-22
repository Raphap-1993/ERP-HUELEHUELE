"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  cloudflareImageLoader,
  isRemoteStorefrontMediaUrl,
} from "../features/storefront-v2/lib/media";

export type ProductMediaGalleryItem = {
  alt: string;
  id: string;
  label: string;
  objectPosition?: string;
  src: string;
  zoom?: number;
};

type ProductMediaGalleryProps = {
  items: ProductMediaGalleryItem[];
};

export function ProductMediaGallery({ items }: ProductMediaGalleryProps) {
  const galleryItems = useMemo(() => items.filter((item) => item.src), [items]);
  const [selectedId, setSelectedId] = useState(galleryItems[0]?.id ?? "");

  const selected =
    galleryItems.find((item) => item.id === selectedId) ?? galleryItems[0];

  if (!selected) {
    return null;
  }

  return (
    <div className="hh-pdp-gallery" aria-label="Galería de producto">
      <div className="hh-pdp-gallery-main">
        <Image
          fill
          priority
          src={selected.src}
          loader={
            isRemoteStorefrontMediaUrl(selected.src)
              ? cloudflareImageLoader
              : undefined
          }
          alt={selected.alt}
          sizes="(min-width: 1280px) 560px, (min-width: 768px) 48vw, 100vw"
          className="hh-pdp-gallery-image"
          style={{
            objectPosition: selected.objectPosition ?? "center",
            transform: selected.zoom ? `scale(${selected.zoom})` : undefined,
          }}
        />
      </div>

      {galleryItems.length > 1 ? (
        <div className="hh-pdp-gallery-thumbs" aria-label="Cambiar imagen">
          {galleryItems.map((item) => {
            const active = item.id === selected.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                className={active ? "is-active" : undefined}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="hh-pdp-gallery-thumb-media">
                  <Image
                    fill
                    src={item.src}
                    loader={
                      isRemoteStorefrontMediaUrl(item.src)
                        ? cloudflareImageLoader
                        : undefined
                    }
                    alt=""
                    sizes="128px"
                    className="hh-pdp-gallery-image"
                    style={{
                      objectPosition: item.objectPosition ?? "center",
                      transform: item.zoom ? `scale(${item.zoom})` : undefined,
                    }}
                  />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
