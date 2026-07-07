import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gamePrototypeGuideMascotSrc } from "../content/storefront-v2-game-art";
import {
  gamePrototypeProducts,
  gamePrototypeQuests,
  getGamePrototypeProduct,
} from "../content/storefront-v2-game-content";
import { StorefrontV2GameShell } from "../components/storefront-v2-game-shell";
import {
  PixelInfoPill,
  PixelLinkButton,
  PixelSpeechBubble,
  PixelTitleBanner,
} from "../components/storefront-v2-game-ui";

const footerLinks = ["Quests", "Guilds", "Support", "Privacy"] as const;

export function StorefrontV2GameProductPage({ slug }: { slug: string }) {
  const product = getGamePrototypeProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = gamePrototypeProducts.filter((item) => item.slug !== product.slug).slice(0, 2);

  return (
    <StorefrontV2GameShell
      activeHref="/storefront-v2-game/catalogo"
      showHeader={false}
    >
      <main className="grid flex-1 gap-6">
        <section className="relative overflow-hidden rounded-[30px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#c2dd78_0%,#99c953_46%,#7caf43_100%)] px-4 py-5 shadow-[0_0_0_3px_#eff8d2,8px_8px_0_#17341c] lg:px-6">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute left-[-20px] top-6 h-[260px] w-[160px] rounded-[999px] border-[4px] border-[#17341c] bg-[#7fbf5a]" />
          <div className="absolute right-[-14px] top-10 h-[260px] w-[160px] rounded-[999px] border-[4px] border-[#17341c] bg-[#7fbf5a]" />

          <div className="relative mx-auto max-w-[1120px]">
            <div className="rounded-[22px] border-[4px] border-[#17341c] bg-[#aa7148] px-4 py-3 text-[#fff6da] shadow-[0_0_0_2px_#f4c697,4px_4px_0_#17341c]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-[10px] border-[3px] border-[#17341c] bg-[#dff0c2]">
                    <Image
                      src={gamePrototypeGuideMascotSrc}
                      alt=""
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <p className="text-[10px] uppercase leading-none">Huele Huele</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] uppercase">
                  {[
                    { href: "/storefront-v2-game", label: "Home" },
                    { href: "/storefront-v2-game/catalogo", label: "Shop" },
                    { href: "/storefront-v2-game/mayoristas", label: "About" },
                    { href: "/storefront-v2-game/mayoristas", label: "Contact" },
                    { href: "/storefront-v2-game/checkout", label: "Cart" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-[12px] border-[2px] border-[#17341c] bg-[#c1865b] px-3 py-2 shadow-[0_0_0_2px_rgba(255,255,255,0.15)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[24px] border-[4px] border-[#17341c] bg-[#c28a5d] p-4 shadow-[0_0_0_2px_#ffd8af,5px_5px_0_#17341c]">
                <div className="rounded-[18px] border-[3px] border-[#17341c] bg-[linear-gradient(180deg,#f7eedc_0%,#e4c49b_100%)] p-4 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.4)]">
                  <div className="relative mx-auto aspect-[0.95] max-w-[420px]">
                    <Image src={product.image} alt={product.name} fill priority className="object-contain" />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border-[4px] border-[#17341c] bg-[#d2edb4] p-4 shadow-[0_0_0_2px_#ffffff,5px_5px_0_#17341c]">
                <div className="flex items-start justify-between gap-4">
                  <PixelTitleBanner tone="wood" className="min-h-[48px]">
                    Character Stat Sheet
                  </PixelTitleBanner>
                  <div className="relative h-20 w-20 rounded-[18px] border-[3px] border-[#17341c] bg-[#f8f4df] shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                    <Image
                      src={gamePrototypeGuideMascotSrc}
                      alt=""
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-[18px] border-[3px] border-[#17341c] bg-[#fffbea] px-4 py-4 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                    <p className="text-[10px] uppercase text-[#17341c]">100% Natural</p>
                    <h1 className="mt-2 font-[var(--font-terminal)] text-[32px] leading-[0.94] text-[#17341c]">
                      {product.name}
                    </h1>
                    <div className="mt-4 space-y-2">
                      {[
                        "DOUBLE ACTION",
                        "QUICK ABSORPTION",
                        "DISCREET",
                      ].map((item) => (
                        <p key={item} className="text-[10px] uppercase text-[#17341c]">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[18px] border-[3px] border-[#17341c] bg-[#fffbea] px-4 py-4 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                    <div className="space-y-2">
                      {product.stats.map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between gap-3">
                          <p className="text-[10px] uppercase text-[#17341c]">{stat.label}</p>
                          <p className="text-[10px] uppercase text-[#8d4d31]">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <PixelInfoPill label={product.level} tone="gold" />
                      <PixelInfoPill label={product.rarity} tone="blue" />
                    </div>
                  </div>
                </div>

                <p className="mt-4 font-[var(--font-terminal)] text-[24px] leading-[1.02] text-[#17341c]">
                  Unlock the power of natural feel fresh and focus with {product.name}.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <PixelLinkButton
                    href="/storefront-v2-game/checkout"
                    className="min-w-[220px] bg-[#31ff36] text-[12px] text-white [text-shadow:2px_2px_0_#17341c] shadow-[0_0_0_3px_#d9ff7a,5px_5px_0_#17341c] hover:bg-[#43ff49]"
                  >
                    ADD TO BAG
                  </PixelLinkButton>
                  <PixelInfoPill label={product.price} tone="gold" />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-center">
                <PixelTitleBanner tone="wood" className="min-h-[44px] px-8">
                  NPC DIALOGUE (REAL STORIES)
                </PixelTitleBanner>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {gamePrototypeQuests.map((quote, index) => (
                  <PixelSpeechBubble key={quote.title} className="h-full bg-[#fffbea] px-4 py-4">
                    <p className="text-[10px] uppercase text-[#17341c]">
                      {index === 0 ? "Sofía Rivera" : index === 1 ? "Carlos Gomez" : "Laura Mendoza"}
                    </p>
                    <p className="mt-2 text-[10px] leading-[1.45] text-[#17341c]">
                      “{quote.body}”
                    </p>
                  </PixelSpeechBubble>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border-[4px] border-[#17341c] bg-[#f7efdc] p-4 shadow-[0_0_0_2px_#ffffff,4px_4px_0_#17341c]">
                <PixelTitleBanner tone="wood" className="min-h-[44px]">
                  Guild Partners
                </PixelTitleBanner>
                <div className="mt-4 flex flex-wrap gap-3">
                  {["OLTVA", "SHALOM", "TRUST BADGE"].map((badge) => (
                    <div
                      key={badge}
                      className="rounded-[14px] border-[3px] border-[#17341c] bg-white px-4 py-3 text-[10px] uppercase shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                    >
                      {badge}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border-[4px] border-[#17341c] bg-[#e7f6cf] p-4 shadow-[0_0_0_2px_#ffffff,4px_4px_0_#17341c]">
                <PixelTitleBanner tone="wood" className="min-h-[44px]">
                  Social Proof
                </PixelTitleBanner>
                <div className="mt-4 flex items-center gap-3">
                  <div className="relative h-20 w-20 shrink-0 rounded-[18px] border-[3px] border-[#17341c] bg-white shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                    <Image
                      src={gamePrototypeGuideMascotSrc}
                      alt=""
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <p className="font-[var(--font-terminal)] text-[26px] leading-[0.96] text-[#17341c]">
                      Join the Community!
                    </p>
                    <p className="mt-2 text-[10px] uppercase text-[#17341c]">
                      5000+ Players Strong
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {relatedProducts.map((item) => (
                    <PixelLinkButton
                      key={item.slug}
                      href={`/storefront-v2-game/producto/${item.slug}`}
                      className="justify-center bg-[#f8d57b] text-[10px]"
                    >
                      OPEN {item.name.toUpperCase()}
                    </PixelLinkButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-4 text-[10px] uppercase text-[#17341c]">
              {footerLinks.map((link) => (
                <span key={link}>{link}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </StorefrontV2GameShell>
  );
}
