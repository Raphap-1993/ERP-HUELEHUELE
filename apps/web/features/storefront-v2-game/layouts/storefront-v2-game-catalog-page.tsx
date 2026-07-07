import Image from "next/image";
import { gamePrototypeGuideMascotSrc } from "../content/storefront-v2-game-art";
import {
  gamePrototypeInventoryCategories,
  gamePrototypeProducts,
} from "../content/storefront-v2-game-content";
import { StorefrontV2GameShell } from "../components/storefront-v2-game-shell";
import {
  PixelInfoPill,
  PixelLinkButton,
  PixelSpeechBubble,
  PixelTitleBanner,
} from "../components/storefront-v2-game-ui";

const catalogTrees = [
  "left-[-40px] top-10 h-[320px] w-[180px]",
  "right-[-30px] top-8 h-[320px] w-[180px]",
] as const;

export function StorefrontV2GameCatalogPage() {
  return (
    <StorefrontV2GameShell
      activeHref="/storefront-v2-game/catalogo"
      showHeader={false}
    >
      <main className="grid flex-1 gap-6">
        <section className="relative overflow-hidden rounded-[30px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#b7d986_0%,#9bcb67_34%,#7db352_100%)] px-4 py-5 shadow-[0_0_0_3px_#eff8d2,8px_8px_0_#17341c] lg:px-6">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:14px_14px]" />
          {catalogTrees.map((tree) => (
            <div key={tree} className={`absolute ${tree}`}>
              <div className="absolute bottom-0 left-1/2 h-24 w-8 -translate-x-1/2 rounded-full bg-[#7d5c3d]" />
              <div className="absolute left-0 top-12 h-44 w-full rounded-[999px] border-[4px] border-[#17341c] bg-[#7fbb5a]" />
              <div className="absolute left-6 top-0 h-36 w-32 rounded-[999px] border-[4px] border-[#17341c] bg-[#8cc765]" />
              <div className="absolute right-4 top-10 h-32 w-28 rounded-[999px] border-[4px] border-[#17341c] bg-[#76af52]" />
            </div>
          ))}

          <div className="relative mx-auto max-w-[1120px]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-end gap-3">
                <div className="relative h-24 w-24 rounded-[22px] border-[4px] border-[#17341c] bg-[#9ed576] shadow-[0_0_0_2px_#ffffff,4px_4px_0_#17341c]">
                  <Image
                    src={gamePrototypeGuideMascotSrc}
                    alt="Huele Huele guide mascot"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <PixelSpeechBubble className="max-w-[280px] bg-white px-4 py-4">
                  <p className="text-[10px] uppercase leading-[1.6] text-[#17341c]">
                    ¡Bienvenido a mi Item Shop! Recoge tus Huele Huele aquí.
                  </p>
                </PixelSpeechBubble>
              </div>

              <PixelInfoPill label="MIS ITEMS: 0" tone="gold" />
            </div>

            <div className="mt-4 flex justify-center">
              <PixelTitleBanner tone="wood" className="min-h-[54px] px-8">
                Huele Huele Item Catalog
              </PixelTitleBanner>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[210px_1fr]">
              <div className="rounded-[24px] border-[4px] border-[#17341c] bg-[#dff1c7] p-4 shadow-[0_0_0_2px_#ffffff,5px_5px_0_#17341c]">
                <div className="rounded-[18px] border-[3px] border-[#17341c] bg-[#f7f3df] px-3 py-3 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                  <p className="text-center text-[10px] uppercase leading-[1.4] text-[#17341c]">
                    INVENTARIO
                    <br />
                    DE AROMAS
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {gamePrototypeInventoryCategories.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-[16px] border-[3px] border-[#17341c] bg-white px-3 py-3 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                    >
                      <div className="relative h-9 w-9 shrink-0 rounded-[10px] border-[3px] border-[#17341c] bg-[#f3f0d6]">
                        <Image
                          src={item.icon}
                          alt=""
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase leading-none text-[#17341c]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[10px] uppercase text-[#6a8d49]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {gamePrototypeProducts.map((product) => (
                  <article
                    key={product.slug}
                    className="rounded-[24px] border-[4px] border-[#17341c] bg-[#f4f0dc] p-3 shadow-[0_0_0_2px_#ffffff,5px_5px_0_#17341c]"
                  >
                    <div className="rounded-[20px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#d3f0b7_0%,#9fd66e_100%)] p-3 shadow-[0_0_0_2px_#edffd7]">
                      <div className="relative aspect-[0.92] overflow-hidden rounded-[16px] border-[3px] border-[#17341c] bg-white/40">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-3"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="font-[var(--font-terminal)] text-[23px] leading-[0.95] text-[#17341c]">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-[10px] uppercase text-[#c06036]">
                        {product.price}
                      </p>
                      <p className="mt-2 text-[10px] uppercase text-[#17341c]">
                        {product.sellerLine}
                      </p>
                      <p className="mt-3 text-[10px] leading-[1.4] text-[#365033]">
                        {product.description}
                      </p>
                    </div>
                    <PixelLinkButton
                      href={`/storefront-v2-game/producto/${product.slug}`}
                      className="mt-4 w-full bg-[#31ff36] text-[12px] text-white [text-shadow:2px_2px_0_#17341c] shadow-[0_0_0_3px_#d9ff7a,5px_5px_0_#17341c] hover:bg-[#45ff4f]"
                    >
                      ¡COLECCIONAR!
                    </PixelLinkButton>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-[20px] border-[4px] border-[#17341c] bg-[#b98154] px-4 py-3 text-[#f7f3df] shadow-[0_0_0_2px_#ffd7b8,4px_4px_0_#17341c] md:flex-row md:items-center md:justify-between">
              <p className="text-[10px] uppercase leading-none">
                © Huele Huele
              </p>
              <p className="text-[10px] uppercase leading-none">
                Cooling tin. Resistente. Ligero. Respira a otro nivel.
              </p>
              <PixelLinkButton
                href="/storefront-v2-game/mayoristas"
                className="bg-[#f8d57b] text-[10px]"
              >
                Guild Route
              </PixelLinkButton>
            </div>
          </div>
        </section>
      </main>
    </StorefrontV2GameShell>
  );
}
