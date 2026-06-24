import test from "node:test";
import assert from "node:assert/strict";
import { CmsSocialPlatform, CmsTestimonialKind, type CmsTestimonial } from "@huelegood/shared";
import {
  hueleHomeBenefits,
  hueleHomeMoments,
  hueleHomeProducts,
  resolveHueleHomeProductCards
} from "./huele-home-content";
import * as hueleHomeContent from "./huele-home-content";

type TikTokVideoResolver = (testimonials: CmsTestimonial[]) => {
  id: string;
  title: string;
  caption: string;
  subcopy: string;
  href: string;
  playerUrl: string;
  imageAlt: string;
  imageUrl: string;
  platformLabel: "TikTok";
}[];

function cmsTestimonial(overrides: Partial<CmsTestimonial> & Pick<CmsTestimonial, "id">): CmsTestimonial {
  const { id, ...rest } = overrides;

  return {
    id,
    name: "Cliente TikTok",
    role: "Compradora verificada",
    quote: "Lo llevo a todas partes.",
    rating: 5,
    kind: CmsTestimonialKind.Social,
    position: 1,
    socialUrl: "https://www.tiktok.com/@huelegood/video/100",
    socialPlatform: CmsSocialPlatform.Tiktok,
    coverImageUrl: "/media/tiktok-cover.webp",
    status: "active",
    updatedAt: "2026-06-23T00:00:00.000Z",
    ...rest
  };
}

function resolveTikTokVideos(testimonials: CmsTestimonial[]) {
  const resolver = (
    hueleHomeContent as typeof hueleHomeContent & {
      resolveHueleHomeTikTokVideos?: TikTokVideoResolver;
    }
  ).resolveHueleHomeTikTokVideos;

  if (typeof resolver !== "function") {
    assert.fail("resolveHueleHomeTikTokVideos is not exported");
  }

  return resolver(testimonials);
}

test("huele home content preserves official benefit and moment structure", () => {
  assert.deepEqual(
    hueleHomeBenefits.map((benefit) => benefit.title),
    ["Soroche", "Mareos", "Malos olores", "Energía"]
  );

  assert.deepEqual(
    hueleHomeMoments.map((moment) => moment.key),
    ["trafico", "oficina", "viaje", "sierra", "noche"]
  );
});

test("huele home product cards prefer runtime catalog data over static labels", () => {
  const cards = resolveHueleHomeProductCards([
    {
      id: "prod-1",
      name: "Runtime Verde",
      slug: "clasico-verde",
      categorySlug: "productos",
      tagline: "Runtime tagline",
      description: "Runtime description",
      price: 34.9,
      badge: "Runtime badge",
      tone: "emerald",
      benefits: ["Runtime benefit"],
      sku: "RT-VERDE",
      imageUrl: "/fallback-runtime-image.webp",
      imageAlt: "Fallback runtime image",
      images: [
        {
          id: "img-secondary",
          url: "/media/runtime-secondary.webp",
          altText: "Secondary image",
          sortOrder: 2,
          isPrimary: false
        },
        {
          id: "img-primary",
          url: "/media/runtime-primary.webp",
          altText: "Primary image from database",
          sortOrder: 1,
          isPrimary: true
        }
      ],
      defaultVariantId: "variant-1",
      variantCount: 1,
      isPurchasable: true,
      stockStatus: "available"
    }
  ]);

  assert.equal(cards[0].name, "Runtime Verde");
  assert.equal(cards[0].priceLabel, "S/ 34.90");
  assert.equal(cards[0].href, "/producto/clasico-verde");
  assert.equal(cards[0].ctaLabel, "Comprar ahora");
  assert.equal(cards[0].imageUrl, "/media/runtime-primary.webp");
  assert.equal(cards[0].imageAlt, "Primary image from database");
  assert.equal(cards[0].source, "runtime");
  assert.equal(hueleHomeProducts.length, 3);
});

test("huele home product cards are built from every runtime product before using static fallbacks", () => {
  const cards = resolveHueleHomeProductCards([
    {
      id: "prod-2",
      name: "Producto nuevo desde BD",
      slug: "producto-nuevo-db",
      categorySlug: "productos",
      tagline: "Texto administrado",
      description: "Descripcion administrada",
      price: 49.9,
      badge: "Nuevo",
      tone: "amber",
      benefits: ["Runtime benefit"],
      sku: "RT-NEW",
      imageUrl: "/media/producto-nuevo.webp",
      defaultVariantId: "variant-2",
      variantCount: 1,
      isPurchasable: true,
      stockStatus: "available"
    }
  ]);

  assert.equal(cards.length, 1);
  assert.equal(cards[0].key, "producto-nuevo-db");
  assert.equal(cards[0].name, "Producto nuevo desde BD");
  assert.equal(cards[0].imageUrl, "/media/producto-nuevo.webp");
  assert.equal(cards[0].source, "runtime");
});

test("huele home TikTok videos include only active TikTok social testimonials with a usable local cover", () => {
  const videos = resolveTikTokVideos([
    cmsTestimonial({
      id: "valid-tiktok",
      name: "Ana lleva Huele Huele en la mochila",
      role: "Viajes y oficina",
      quote: "Me ayuda con mareos y olores en el camino.",
      coverImageUrl: "/media/testimonials/tiktok-ana.webp",
      socialUrl: "https://www.tiktok.com/@huelegood/video/123",
      position: 3
    }),
    cmsTestimonial({
      id: "instagram",
      socialPlatform: CmsSocialPlatform.Instagram,
      coverImageUrl: "/media/testimonials/instagram.webp",
      socialUrl: "https://www.instagram.com/p/123"
    }),
    cmsTestimonial({
      id: "missing-cover",
      coverImageUrl: ""
    }),
    cmsTestimonial({
      id: "inactive-tiktok",
      status: "inactive",
      coverImageUrl: "/media/testimonials/inactive.webp"
    })
  ]);

  assert.deepEqual(videos, [
    {
      id: "valid-tiktok",
      title: "Ana lleva Huele Huele en la mochila",
      caption: "Me ayuda con mareos y olores en el camino.",
      subcopy: "Viajes y oficina",
      href: "https://www.tiktok.com/@huelegood/video/123",
      playerUrl: "https://www.tiktok.com/player/v1/123?autoplay=1&controls=1&rel=0",
      imageAlt: "TikTok Huele Huele: Ana lleva Huele Huele en la mochila",
      imageUrl: "/media/testimonials/tiktok-ana.webp",
      platformLabel: "TikTok"
    }
  ]);
});

test("huele home TikTok videos are ordered by position and limited to five", () => {
  const positions = [30, 10, 20, 5, 50, 40, 60];
  const testimonials = positions.map((position, index) =>
    cmsTestimonial({
      id: `video-${index}`,
      name: `Video ${index}`,
      role: `Rol ${index}`,
      quote: `Quote ${index}`,
      position,
      socialUrl: `https://www.tiktok.com/@huelegood/video/${index}`,
      coverImageUrl: `https://media.huelegood.com/testimonials/tiktok-${index}.webp`
    })
  );

  const videos = resolveTikTokVideos(testimonials);

  assert.equal(videos.length, 5);
  assert.deepEqual(
    videos.map((video) => video.id),
    ["video-3", "video-1", "video-2", "video-0", "video-5"]
  );
});

test("huele home TikTok videos reject external cover URLs that only contain the media hostname in the path", () => {
  const videos = resolveTikTokVideos([
    cmsTestimonial({
      id: "spoofed-cover",
      coverImageUrl: "https://evil.example/media.huelegood.com/fake.webp"
    }),
    cmsTestimonial({
      id: "protocol-relative-cover",
      coverImageUrl: "//evil.example/fake.webp"
    }),
    cmsTestimonial({
      id: "plain-http-cover",
      coverImageUrl: "http://media.huelegood.com/testimonials/plain-http.webp"
    }),
    cmsTestimonial({
      id: "ftp-cover",
      coverImageUrl: "ftp://media.huelegood.com/testimonials/ftp.webp"
    }),
    cmsTestimonial({
      id: "trusted-cover",
      coverImageUrl: "https://media.huelegood.com/testimonials/trusted.webp",
      position: 2
    })
  ]);

  assert.deepEqual(
    videos.map((video) => video.id),
    ["trusted-cover"]
  );
});

test("huele home TikTok videos reject local or non-TikTok social URLs", () => {
  const videos = resolveTikTokVideos([
    cmsTestimonial({
      id: "local-social-url",
      socialUrl: "/checkout"
    }),
    cmsTestimonial({
      id: "external-social-url",
      socialUrl: "https://evil.example/video/123"
    }),
    cmsTestimonial({
      id: "spoofed-social-url",
      socialUrl: "https://tiktok.com.evil.example/@huelegood/video/123"
    }),
    cmsTestimonial({
      id: "plain-http-tiktok",
      socialUrl: "http://www.tiktok.com/@huelegood/video/123"
    }),
    cmsTestimonial({
      id: "ftp-tiktok",
      socialUrl: "ftp://www.tiktok.com/@huelegood/video/123"
    }),
    cmsTestimonial({
      id: "canonical-tiktok",
      socialUrl: "https://www.tiktok.com/@huelegood/video/456",
      position: 1
    }),
    cmsTestimonial({
      id: "short-tiktok",
      socialUrl: "https://vm.tiktok.com/ZMabc/",
      position: 2
    }),
    cmsTestimonial({
      id: "bare-tiktok",
      socialUrl: "https://tiktok.com/@huelegood/video/789",
      position: 3
    })
  ]);

  assert.deepEqual(
    videos.map((video) => video.id),
    ["canonical-tiktok", "bare-tiktok"]
  );
});

test("huele home TikTok videos expose an official player URL for inline modal playback", () => {
  const videos = resolveTikTokVideos([
    cmsTestimonial({
      id: "creator-video",
      socialUrl: "https://www.tiktok.com/@huele.good/video/7620939616262114580",
      coverImageUrl: "https://media.huelegood.com/testimonials/tiktok-player.webp"
    }),
    cmsTestimonial({
      id: "player-video",
      socialUrl: "https://www.tiktok.com/player/v1/7621563297229278485",
      coverImageUrl: "https://media.huelegood.com/testimonials/tiktok-player-2.webp",
      position: 2
    })
  ]);

  assert.deepEqual(
    videos.map((video) => video.playerUrl),
    [
      "https://www.tiktok.com/player/v1/7620939616262114580?autoplay=1&controls=1&rel=0",
      "https://www.tiktok.com/player/v1/7621563297229278485?autoplay=1&controls=1&rel=0"
    ]
  );
});
