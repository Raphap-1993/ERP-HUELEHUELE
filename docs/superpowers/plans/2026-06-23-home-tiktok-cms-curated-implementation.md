# Home TikTok CMS Curated Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new TikTok section to the green Huele Huele home using only curated CMS social testimonials with real cover images.

**Architecture:** Keep the feature frontend-only. Derive TikTok home items from `cms.testimonials` in `StorefrontGameHome`, pass them into the existing new green home component, and render a compact responsive video-card section between products and mayoristas. Do not use `storefront-v2-premium`, old testimonial sections, TikTok API, Prisma, or admin redesign.

**Tech Stack:** Next.js 15, React 19, TypeScript, `node:test`, existing Huele Huele CSS in `apps/web/app/globals.css`, `next/image` with existing storefront media helpers.

---

## File Structure

- Modify: `apps/web/lib/huele-home-content.ts`
  - Add `HueleHomeTikTokVideo` type and `resolveHueleHomeTikTokVideos()` mapper.
  - Keep mapper pure and testable.
- Modify: `apps/web/lib/huele-home-content.test.ts`
  - Add TDD tests for valid, invalid, ordering, and max-count behavior.
- Modify: `apps/web/components/storefront-game-home.tsx`
  - Pass derived TikTok videos to `HueleHomeExperience`.
- Modify: `apps/web/components/huele-home-experience.tsx`
  - Add `tiktokVideos` prop and render a new home-only section after products and before seller band.
- Modify: `apps/web/app/globals.css`
  - Add styles for the new TikTok section and responsive behavior.
- Modify: `apps/web/components/public-visual-contract.test.ts`
  - Assert new section markers exist and that no old UX text is introduced.

## Task 1: CMS TikTok Mapper

**Files:**
- Modify: `apps/web/lib/huele-home-content.test.ts`
- Modify: `apps/web/lib/huele-home-content.ts`

- [ ] **Step 1: Write failing mapper tests**

Add imports:

```ts
import { CmsSocialPlatform, CmsTestimonialKind } from "@huelegood/shared";
```

Add tests:

```ts
test("huele home TikTok videos use only active CMS TikTok social testimonials with real covers", () => {
  const videos = resolveHueleHomeTikTokVideos([
    {
      id: "tiktok-valid",
      name: "Uso real en viaje",
      role: "Viajes y altura",
      quote: "Un reset rapido antes de subir a la sierra.",
      rating: 5,
      kind: CmsTestimonialKind.Social,
      socialPlatform: CmsSocialPlatform.Tiktok,
      socialUrl: "https://www.tiktok.com/@huelehuele/video/123",
      coverImageUrl: "/media/tiktok-viaje.webp",
      position: 2,
      status: "active",
      updatedAt: "2026-06-23T10:00:00.000Z"
    },
    {
      id: "instagram-valid",
      name: "Instagram",
      role: "Social",
      rating: 5,
      kind: CmsTestimonialKind.Social,
      socialPlatform: CmsSocialPlatform.Instagram,
      socialUrl: "https://www.instagram.com/reel/abc",
      coverImageUrl: "/media/instagram.webp",
      position: 1,
      status: "active",
      updatedAt: "2026-06-23T10:00:00.000Z"
    },
    {
      id: "tiktok-missing-cover",
      name: "Sin portada",
      role: "TikTok",
      rating: 5,
      kind: CmsTestimonialKind.Social,
      socialPlatform: CmsSocialPlatform.Tiktok,
      socialUrl: "https://www.tiktok.com/@huelehuele/video/456",
      position: 3,
      status: "active",
      updatedAt: "2026-06-23T10:00:00.000Z"
    }
  ]);

  assert.deepEqual(videos, [
    {
      id: "tiktok-valid",
      title: "Uso real en viaje",
      caption: "Un reset rapido antes de subir a la sierra.",
      subcopy: "Viajes y altura",
      href: "https://www.tiktok.com/@huelehuele/video/123",
      imageAlt: "TikTok Huele Huele: Uso real en viaje",
      imageUrl: "/media/tiktok-viaje.webp",
      platformLabel: "TikTok"
    }
  ]);
});

test("huele home TikTok videos sort by position and render at most five items", () => {
  const videos = resolveHueleHomeTikTokVideos(
    Array.from({ length: 7 }, (_, index) => ({
      id: `tt-${index}`,
      name: `Video ${index}`,
      role: "Comunidad",
      quote: `Quote ${index}`,
      rating: 5,
      kind: CmsTestimonialKind.Social,
      socialPlatform: CmsSocialPlatform.Tiktok,
      socialUrl: `https://www.tiktok.com/@huelehuele/video/${index}`,
      coverImageUrl: `/media/tiktok-${index}.webp`,
      position: 7 - index,
      status: "active",
      updatedAt: "2026-06-23T10:00:00.000Z"
    }))
  );

  assert.equal(videos.length, 5);
  assert.deepEqual(
    videos.map((video) => video.title),
    ["Video 6", "Video 5", "Video 4", "Video 3", "Video 2"]
  );
});
```

- [ ] **Step 2: Run mapper tests and verify RED**

Run:

```bash
npx tsx --test apps/web/lib/huele-home-content.test.ts
```

Expected: fail because `CmsSocialPlatform`, `CmsTestimonialKind`, and `resolveHueleHomeTikTokVideos` are not imported/defined yet.

- [ ] **Step 3: Implement mapper**

In `apps/web/lib/huele-home-content.ts`, change the import:

```ts
import {
  CmsSocialPlatform,
  CmsTestimonialKind,
  type CatalogProduct,
  type CmsTestimonial
} from "@huelegood/shared";
```

Add type:

```ts
export type HueleHomeTikTokVideo = {
  id: string;
  title: string;
  caption: string;
  subcopy: string;
  href: string;
  imageAlt: string;
  imageUrl: string;
  platformLabel: "TikTok";
};
```

Add helpers after `resolveRuntimeProductCard()`:

```ts
function trimText(value?: string) {
  return value?.trim() ?? "";
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function isSupportedHomeVideoImage(url: string) {
  return url.startsWith("/") || url.includes("media.huelegood.com");
}

export function resolveHueleHomeTikTokVideos(testimonials: CmsTestimonial[]): HueleHomeTikTokVideo[] {
  return testimonials
    .filter((testimonial) => {
      const href = trimText(testimonial.socialUrl);
      const imageUrl = trimText(testimonial.coverImageUrl);
      return (
        testimonial.status === "active" &&
        testimonial.kind === CmsTestimonialKind.Social &&
        testimonial.socialPlatform === CmsSocialPlatform.Tiktok &&
        Boolean(href) &&
        Boolean(imageUrl) &&
        isSupportedHomeVideoImage(imageUrl)
      );
    })
    .sort((left, right) => left.position - right.position)
    .slice(0, 5)
    .map((testimonial) => {
      const title = truncateText(trimText(testimonial.name) || trimText(testimonial.quote) || "Video Huele Huele", 48);
      const caption = truncateText(trimText(testimonial.quote), 92);
      return {
        id: testimonial.id,
        title,
        caption,
        subcopy: truncateText(trimText(testimonial.role), 42),
        href: trimText(testimonial.socialUrl),
        imageAlt: `TikTok Huele Huele: ${title}`,
        imageUrl: trimText(testimonial.coverImageUrl),
        platformLabel: "TikTok"
      };
    });
}
```

- [ ] **Step 4: Run mapper tests and verify GREEN**

Run:

```bash
npx tsx --test apps/web/lib/huele-home-content.test.ts
```

Expected: pass.

## Task 2: Wire CMS TikTok Items Into New Home

**Files:**
- Modify: `apps/web/components/storefront-game-home.tsx`
- Modify: `apps/web/components/huele-home-experience.tsx`

- [ ] **Step 1: Write failing visual contract test**

In `apps/web/components/public-visual-contract.test.ts`, add:

```ts
  it("keeps curated TikTok content on the new Huele green home only", () => {
    const homeShell = readSource("components/storefront-game-home.tsx");
    const home = readSource("components/huele-home-experience.tsx");

    assert.match(homeShell, /resolveHueleHomeTikTokVideos/);
    assert.match(homeShell, /tiktokVideos=\{resolveHueleHomeTikTokVideos\(cms\?\.testimonials \?\? \[\]\)\}/);
    assert.match(home, /tiktokVideos/);
    assert.match(home, /id="tiktok"/);
    assert.match(home, /hh-tiktok-section/);
    assert.match(home, /Lo que más se está viendo\./);
    assert.doesNotMatch(home, /TestimonialsSection|Historias reales de quienes ya lo usan|Lo dicen ellos|Testimonios en texto/);
  });
```

- [ ] **Step 2: Run visual contract test and verify RED**

Run:

```bash
npx tsx --test apps/web/components/public-visual-contract.test.ts
```

Expected: fail because the TikTok section is not wired/rendered yet.

- [ ] **Step 3: Pass `tiktokVideos` from shell to home component**

In `apps/web/components/storefront-game-home.tsx`, change import:

```ts
import { resolveHueleHomeProductCards, resolveHueleHomeTikTokVideos } from "../lib/huele-home-content";
```

Add prop:

```tsx
      tiktokVideos={resolveHueleHomeTikTokVideos(cms?.testimonials ?? [])}
```

- [ ] **Step 4: Add component prop and empty-state guard**

In `apps/web/components/huele-home-experience.tsx`, change import to include:

```ts
  type HueleHomeTikTokVideo
```

Add prop:

```ts
  tiktokVideos: HueleHomeTikTokVideo[];
```

Add to function args:

```ts
  tiktokVideos,
```

No render output yet beyond accepting the prop.

- [ ] **Step 5: Run visual contract test**

Run:

```bash
npx tsx --test apps/web/components/public-visual-contract.test.ts
```

Expected: still fail because markup/classes are not rendered yet.

## Task 3: Render New TikTok Section And Styling

**Files:**
- Modify: `apps/web/components/huele-home-experience.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/components/public-visual-contract.test.ts`

- [ ] **Step 1: Render section in the new home only**

In `HueleHomeExperience`, after the products section and before `hh-seller-band`, add:

```tsx
      {tiktokVideos.length > 0 ? (
        <section id="tiktok" className="hh-tiktok-section" aria-labelledby="tiktok-title">
          <div className="hh-tiktok-heading">
            <span className="hh-section-kicker">TikTok real</span>
            <h2 id="tiktok-title">Lo que más se está viendo.</h2>
            <p>Momentos reales de frescura, directo desde la comunidad Huele Huele.</p>
          </div>

          <div className="hh-tiktok-rail" aria-label="Videos de TikTok Huele Huele">
            {tiktokVideos.map((video) => {
              const imageSrc = resolveStorefrontMediaSrc(video.imageUrl);
              const remote = isRemoteStorefrontMediaUrl(imageSrc);
              return (
                <Link
                  key={video.id}
                  href={video.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hh-tiktok-card"
                  aria-label={`Ver video de TikTok: ${video.title}`}
                >
                  <span className="hh-tiktok-media">
                    <Image
                      fill
                      src={imageSrc}
                      loader={remote ? cloudflareImageLoader : undefined}
                      alt={video.imageAlt}
                      sizes="(min-width: 921px) 230px, 72vw"
                    />
                    <span className="hh-tiktok-play" aria-hidden="true">
                      <Icon name="play" />
                    </span>
                  </span>
                  <span className="hh-tiktok-card-copy">
                    <small>{video.platformLabel}</small>
                    <strong>{video.title}</strong>
                    {video.caption ? <span>{video.caption}</span> : null}
                    {video.subcopy ? <em>{video.subcopy}</em> : null}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
```

- [ ] **Step 2: Add CSS**

In `apps/web/app/globals.css`, include `.hh-tiktok-section` in the shared width group:

```css
.hh-tiktok-section,
```

Add styles near the product/seller sections:

```css
.hh-tiktok-section {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(240px, 0.34fr) minmax(0, 0.66fr);
  gap: clamp(24px, 3vw, 40px);
  align-items: center;
  margin-top: 42px;
  scroll-margin-top: 120px;
  padding: 34px;
  border-radius: 8px;
  color: var(--hh-ink);
  background:
    radial-gradient(circle at 8% 18%, rgba(144, 236, 83, 0.18), transparent 34%),
    rgba(255, 253, 245, 0.96);
  box-shadow: var(--hh-shadow);
}

.hh-tiktok-heading h2 {
  margin: 14px 0 0;
  color: var(--hh-ink);
  font-size: clamp(2.15rem, 4vw, 3.9rem);
  line-height: 0.94;
}

.hh-tiktok-heading p {
  margin: 14px 0 0;
  color: var(--hh-muted);
  font-weight: 850;
  line-height: 1.5;
}

.hh-tiktok-rail {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.hh-tiktok-card {
  position: relative;
  display: grid;
  min-height: 360px;
  overflow: hidden;
  border-radius: 8px;
  color: var(--hh-white);
  background: var(--hh-green-950);
  box-shadow: 0 20px 42px rgba(4, 24, 12, 0.18);
  transition:
    transform 180ms var(--hh-ease-out),
    box-shadow 180ms var(--hh-ease-out);
}

.hh-tiktok-card:hover,
.hh-tiktok-card:focus-visible {
  transform: translateY(-5px);
  box-shadow: 0 26px 54px rgba(4, 24, 12, 0.24);
  outline: none;
}

.hh-tiktok-media {
  position: absolute;
  inset: 0;
}

.hh-tiktok-media::after {
  position: absolute;
  inset: auto 0 0;
  height: 58%;
  content: "";
  background: linear-gradient(180deg, transparent, rgba(3, 24, 13, 0.86));
}

.hh-tiktok-media img {
  object-fit: cover;
  transition: transform 260ms var(--hh-ease-out);
}

.hh-tiktok-card:hover .hh-tiktok-media img,
.hh-tiktok-card:focus-visible .hh-tiktok-media img {
  transform: scale(1.04);
}

.hh-tiktok-play {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: var(--hh-green-950);
  background: rgba(255, 253, 245, 0.92);
  box-shadow: 0 12px 28px rgba(4, 24, 12, 0.18);
}

.hh-tiktok-card-copy {
  position: relative;
  z-index: 2;
  display: grid;
  align-content: end;
  min-height: 360px;
  padding: 18px;
}

.hh-tiktok-card-copy small,
.hh-tiktok-card-copy em {
  display: inline-flex;
  justify-self: start;
  border-radius: 999px;
  font-style: normal;
  font-weight: 1000;
}

.hh-tiktok-card-copy small {
  margin-bottom: 10px;
  padding: 6px 9px;
  color: var(--hh-green-950);
  background: var(--hh-sun);
  font-size: 0.68rem;
  text-transform: uppercase;
}

.hh-tiktok-card-copy strong {
  font-family: var(--font-hh-display), ui-rounded, sans-serif;
  font-size: 1.24rem;
  line-height: 1;
}

.hh-tiktok-card-copy span {
  margin-top: 7px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.82rem;
  font-weight: 850;
  line-height: 1.35;
}

.hh-tiktok-card-copy em {
  margin-top: 10px;
  padding: 5px 9px;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(255, 255, 255, 0.14);
  font-size: 0.68rem;
}
```

In the max-width `900px` media query, add:

```css
  .hh-tiktok-section {
    display: block;
    padding: 26px 18px;
  }

  .hh-tiktok-heading {
    margin-bottom: 20px;
  }

  .hh-tiktok-rail {
    display: grid;
    grid-auto-columns: minmax(230px, 76vw);
    grid-auto-flow: column;
    grid-template-columns: none;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 4px;
  }

  .hh-tiktok-card {
    min-height: 340px;
    scroll-snap-align: start;
  }

  .hh-tiktok-card-copy {
    min-height: 340px;
  }
```

- [ ] **Step 3: Run visual contract test and verify GREEN**

Run:

```bash
npx tsx --test apps/web/components/public-visual-contract.test.ts
```

Expected: pass.

## Task 4: Final Verification

**Files:**
- No new production files beyond prior tasks.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npx tsx --test apps/web/lib/huele-home-content.test.ts apps/web/components/public-visual-contract.test.ts
```

Expected: pass.

- [ ] **Step 2: Run web typecheck**

Run:

```bash
npm run typecheck -w @huelegood/web
```

Expected: pass. If unrelated local dirty work causes failures outside touched files, record exact failures and do not mask them.

- [ ] **Step 3: Review diff scope**

Run:

```bash
git diff -- apps/web/lib/huele-home-content.ts apps/web/lib/huele-home-content.test.ts apps/web/components/storefront-game-home.tsx apps/web/components/huele-home-experience.tsx apps/web/app/globals.css apps/web/components/public-visual-contract.test.ts
```

Expected: only new TikTok section, mapper, and tests.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add apps/web/lib/huele-home-content.ts apps/web/lib/huele-home-content.test.ts apps/web/components/storefront-game-home.tsx apps/web/components/huele-home-experience.tsx apps/web/app/globals.css apps/web/components/public-visual-contract.test.ts
git commit -m "feat(web): add curated TikTok home section"
```

Expected: commit includes only the six implementation files.

