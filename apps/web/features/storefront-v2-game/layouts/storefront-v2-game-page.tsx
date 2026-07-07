import Image from "next/image";
import { gamePrototypeGuideMascotSrc } from "../content/storefront-v2-game-art";
import {
  gamePrototypeCommunityStats,
  gamePrototypeProducts,
  gamePrototypeQuests,
  gamePrototypeZones,
} from "../content/storefront-v2-game-content";
import { StorefrontV2GameShell } from "../components/storefront-v2-game-shell";
import {
  PixelInfoPill,
  PixelLinkButton,
  PixelSpeechBubble,
  PixelWindow,
} from "../components/storefront-v2-game-ui";

const flowerPatches = [
  { left: "6%", bottom: "20%", scale: "1" },
  { left: "14%", bottom: "28%", scale: ".75" },
  { left: "23%", bottom: "18%", scale: ".9" },
  { right: "24%", bottom: "18%", scale: ".85" },
  { right: "13%", bottom: "26%", scale: "1" },
  { right: "5%", bottom: "20%", scale: ".7" },
] as const;

const cloudPuffs = [
  "left-[9%] top-[12%] h-10 w-28",
  "right-[10%] top-[13%] h-12 w-32",
  "left-[28%] top-[18%] h-8 w-24",
] as const;

const shoppingZones = [
  { title: "LEVEL 1: SCENT DISCOVERY", icon: gamePrototypeZones[0]?.icon },
  { title: "LEVEL 2: FRAGRANCE PUZZLES", icon: gamePrototypeZones[1]?.icon },
  { title: "LEVEL 3: AROMA REWARDS", icon: gamePrototypeZones[2]?.icon },
] as const;

function FlowerPatch({
  left,
  right,
  bottom,
  scale,
}: {
  left?: string;
  right?: string;
  bottom: string;
  scale: string;
}) {
  return (
    <div
      className="absolute flex items-end gap-8"
      style={{ left, right, bottom, transform: `scale(${scale})` }}
    >
      {[0, 1].map((index) => (
        <div key={index} className="relative flex h-32 w-16 items-end justify-center">
          <div className="absolute bottom-0 h-24 w-[6px] rounded-full bg-[#4b8740]" />
          <div className="absolute bottom-16 h-12 w-12 rounded-full border-[3px] border-[#17341c] bg-[#ffe3d5]" />
          <div className="absolute bottom-[74px] h-10 w-10 rounded-full border-[3px] border-[#17341c] bg-[#f4f0d8]" />
          <div className="absolute bottom-[80px] h-6 w-6 rounded-full border-[3px] border-[#17341c] bg-[#ffd07f]" />
          <div className="absolute bottom-10 left-1 h-8 w-6 rounded-full border-[3px] border-[#17341c] bg-[#9ed76c]" />
          <div className="absolute bottom-12 right-1 h-7 w-5 rounded-full border-[3px] border-[#17341c] bg-[#9ed76c]" />
        </div>
      ))}
    </div>
  );
}

export function StorefrontV2GamePage() {
  return (
    <StorefrontV2GameShell activeHref="/storefront-v2-game">
      <main className="grid flex-1 gap-6">
        <section className="relative overflow-hidden rounded-[30px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#f6f4d8_0%,#edf3ce_36%,#cfe394_58%,#a7cf63_100%)] px-4 pb-24 pt-6 shadow-[0_0_0_3px_#ffffff,8px_8px_0_#17341c] lg:px-8 lg:pb-28 lg:pt-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(180deg,rgba(130,176,79,0)_0%,rgba(104,148,56,0.4)_100%)]" />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(116,150,70,0.12)_1px,transparent_1px)] [background-size:16px_16px]" />
          {cloudPuffs.map((cloud) => (
            <div key={cloud} className={`absolute rounded-full bg-white/90 ${cloud}`} />
          ))}
          <div className="absolute left-[28%] top-[48%] h-44 w-72 -translate-x-1/2 rounded-full border-[4px] border-[#17341c] bg-[#7db759] opacity-95 shadow-[0_0_0_3px_#b8df86]" />
          <div className="absolute left-1/2 top-[53%] h-32 w-80 -translate-x-1/2 rounded-[60px] border-[4px] border-[#17341c] bg-[#67984a] shadow-[0_0_0_3px_#94cd67]" />
          <div className="absolute left-1/2 top-[60%] h-12 w-[420px] -translate-x-1/2 rounded-full bg-[#678e42]/45 blur-2xl" />
          {flowerPatches.map((patch, index) => (
            <FlowerPatch key={index} {...patch} />
          ))}

          <div className="relative mx-auto flex max-w-[1040px] flex-col items-center text-center">
            <PixelSpeechBubble className="mx-auto max-w-[420px] bg-white px-10 py-6 shadow-[0_0_0_2px_#ffffff,7px_7px_0_#17341c]">
              <p className="font-[var(--font-terminal)] text-[28px] leading-[0.92] text-[#234126] sm:text-[34px]">
                Welcome to the sensory quest!
              </p>
            </PixelSpeechBubble>

            <div className="relative z-10 mt-6 w-full max-w-[330px] lg:mt-8 lg:max-w-[360px]">
              <Image
                src={gamePrototypeGuideMascotSrc}
                alt="Huele Huele guide mascot"
                width={720}
                height={720}
                priority
                className="h-auto w-full drop-shadow-[8px_12px_0_rgba(23,52,28,0.18)]"
              />
            </div>

            <PixelLinkButton
              href="/storefront-v2-game/catalogo"
              className="relative z-10 mt-[-8px] min-w-[290px] bg-[#31ff36] px-8 py-4 text-[13px] text-white [text-shadow:2px_2px_0_#17341c] shadow-[0_0_0_3px_#d9ff7a,6px_6px_0_#17341c] hover:bg-[#43ff49]"
            >
              PRESS START TO SHOP
            </PixelLinkButton>
          </div>

          <div className="absolute inset-x-4 bottom-4 z-10 rounded-[24px] border-[4px] border-[#17341c] bg-[#f4f0d8]/96 p-3 shadow-[0_0_0_2px_#ffffff,5px_5px_0_#17341c] lg:inset-x-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3 rounded-[16px] border-[3px] border-[#17341c] bg-[#efe5ba] px-4 py-3 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                <span className="text-[10px] uppercase leading-none text-[#17341c]">
                  Shopping Zones
                </span>
              </div>
              <div className="grid flex-1 gap-3 md:grid-cols-3">
                {shoppingZones.map((zone) => (
                  <div
                    key={zone.title}
                    className="flex items-center justify-between gap-3 rounded-[16px] border-[3px] border-[#17341c] bg-[#fff9e8] px-4 py-3 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                  >
                    <p className="text-[10px] uppercase leading-[1.25] text-[#17341c]">
                      {zone.title}
                    </p>
                    <div className="relative h-8 w-8 shrink-0 rounded-[10px] border-[3px] border-[#17341c] bg-[#e4f3c8]">
                      {zone.icon ? (
                        <Image
                          src={zone.icon}
                          alt=""
                          fill
                          className="object-contain p-1"
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <PixelWindow
            title="Starter Loadout"
            badge={<PixelInfoPill label="3 ITEMS" tone="gold" />}
            className="p-4"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {gamePrototypeProducts.map((product) => (
                <article
                  key={product.slug}
                  className="rounded-[20px] border-[4px] border-[#17341c] bg-[#f7f3de] p-3 shadow-[0_0_0_2px_#ffffff,4px_4px_0_#17341c]"
                >
                  <div
                    className={`rounded-[16px] border-[3px] border-[#17341c] bg-gradient-to-b ${product.accent} p-3 shadow-[0_0_0_2px_rgba(255,255,255,0.35)]`}
                  >
                    <div className="relative mx-auto aspect-square max-w-[98px]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="font-[var(--font-terminal)] text-[22px] leading-[0.95] text-[#17341c]">
                      {product.name}
                    </p>
                    <p className="mt-1 text-[10px] uppercase text-[#c06036]">
                      {product.price}
                    </p>
                    <p className="mt-2 text-[10px] uppercase leading-[1.45] text-[#365033]">
                      {product.meta}
                    </p>
                  </div>
                  <PixelLinkButton
                    href={`/storefront-v2-game/producto/${product.slug}`}
                    className="mt-3 w-full bg-[#31ff36] px-3 py-3 text-[10px] text-white [text-shadow:2px_2px_0_#17341c] shadow-[0_0_0_3px_#d9ff7a,4px_4px_0_#17341c] hover:bg-[#45ff4f]"
                  >
                    COLLECT
                  </PixelLinkButton>
                </article>
              ))}
            </div>
          </PixelWindow>

          <div className="grid gap-4">
            <PixelWindow
              title="Quest Log"
              badge={<PixelInfoPill label="2 STORIES" tone="pink" />}
              className="p-4"
              tone="mint"
            >
              <div id="quest-log" className="space-y-4">
                {gamePrototypeQuests.map((quest, index) => (
                  <div key={quest.title} className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 rounded-[14px] border-[3px] border-[#17341c] bg-[#dff0c2] shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                      <Image
                        src={index === 0 ? gamePrototypeGuideMascotSrc : quest.icon}
                        alt=""
                        fill
                        className={index === 0 ? "object-contain p-1" : "object-contain p-2"}
                      />
                    </div>
                    <PixelSpeechBubble className="w-full bg-white px-4 py-4">
                      <p className="text-[10px] uppercase leading-[1.6] text-[#17341c]">
                        {quest.title}
                      </p>
                      <p className="mt-2 font-[var(--font-terminal)] text-[22px] leading-[1.05] text-[#17341c]">
                        {quest.body}
                      </p>
                      <p className="mt-3 text-[10px] uppercase text-[#5c8040]">
                        {quest.author}
                      </p>
                    </PixelSpeechBubble>
                  </div>
                ))}
              </div>
            </PixelWindow>

            <PixelWindow
              title="Social Proof"
              badge={<PixelInfoPill label="5000+ PLAYERS" tone="blue" />}
              className="p-4"
              tone="sky"
            >
              <div className="grid gap-3 md:grid-cols-3">
                {gamePrototypeCommunityStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[16px] border-[3px] border-[#17341c] bg-white px-4 py-4 text-center shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                  >
                    <p className="text-[10px] uppercase text-[#17341c]">
                      {stat.label}
                    </p>
                    <p className="mt-2 font-[var(--font-terminal)] text-[24px] leading-none text-[#17341c]">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <PixelLinkButton
                href="/storefront-v2-game/mayoristas"
                className="mt-5 w-full bg-[#9ad2ff]"
              >
                JOIN THE GUILD
              </PixelLinkButton>
            </PixelWindow>
          </div>
        </section>
      </main>
    </StorefrontV2GameShell>
  );
}
