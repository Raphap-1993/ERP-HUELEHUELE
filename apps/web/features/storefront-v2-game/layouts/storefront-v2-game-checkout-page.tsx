import Image from "next/image";
import type { ReactNode } from "react";
import { gamePrototypeGuideMascotSrc } from "../content/storefront-v2-game-art";
import { gamePrototypeProducts } from "../content/storefront-v2-game-content";
import { StorefrontV2GameShell } from "../components/storefront-v2-game-shell";
import {
  PixelInfoPill,
  PixelLinkButton,
  PixelProgressBar,
  PixelTitleBanner,
} from "../components/storefront-v2-game-ui";

const cartLines = [
  { product: gamePrototypeProducts[0], quantity: 1 },
  { product: gamePrototypeProducts[2], quantity: 1 },
] as const;

const footerLinks = ["Game Rules", "Support Guild"] as const;

const trees = [
  "left-[2%] top-[18%] scale-[0.9]",
  "left-[7%] bottom-[18%] scale-[0.8]",
  "right-[5%] top-[20%] scale-[0.85]",
  "right-[10%] bottom-[14%] scale-[0.75]",
] as const;

function FieldTree({ className }: { className: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="h-14 w-8 rounded-full bg-[#7f5c39]" />
      <div className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-[3px] border-[#17341c] bg-[#6fb54a]" />
      <div className="absolute -left-4 -top-16 h-16 w-16 rounded-full border-[3px] border-[#17341c] bg-[#8ed164]" />
      <div className="absolute left-3 top-1 h-16 w-16 rounded-full border-[3px] border-[#17341c] bg-[#7fc65a]" />
    </div>
  );
}

function ScrollCard({
  title,
  children,
  mascot = false,
}: {
  title: string;
  children: ReactNode;
  mascot?: boolean;
}) {
  return (
    <div className="relative rounded-[24px] border-[4px] border-[#17341c] bg-[#f7efc6] p-4 shadow-[0_0_0_2px_#fff6d4,5px_5px_0_#17341c]">
      <PixelTitleBanner tone="wood" className="min-h-[48px]">
        {title}
      </PixelTitleBanner>
      <div className="mt-5">{children}</div>
      {mascot ? (
        <div className="pointer-events-none absolute bottom-4 right-4 h-20 w-20 rounded-[18px] border-[3px] border-[#17341c] bg-[#dff0c0] shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
          <Image
            src={gamePrototypeGuideMascotSrc}
            alt=""
            fill
            className="object-contain p-1"
          />
        </div>
      ) : null}
    </div>
  );
}

function CheckoutField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border-[3px] border-[#17341c] bg-[#fffbea] px-4 py-4 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
      <p className="text-[10px] uppercase text-[#17341c]">{label}</p>
      <p className="mt-2 font-[var(--font-terminal)] text-[25px] leading-[1.02] text-[#17341c]">
        {value}
      </p>
    </div>
  );
}

export function StorefrontV2GameCheckoutPage() {
  const subtotal = cartLines.reduce(
    (sum, line) =>
      sum + Number(line.product.price.replace(/[^\d]/g, "")) * line.quantity,
    0,
  );

  return (
    <StorefrontV2GameShell
      activeHref="/storefront-v2-game/checkout"
      showHeader={false}
    >
      <main className="grid flex-1 gap-6">
        <section className="relative overflow-hidden rounded-[30px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#d8eca4_0%,#bede7c_54%,#a8d562_100%)] px-4 py-6 shadow-[0_0_0_3px_#eff8d2,8px_8px_0_#17341c] lg:px-6">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_100%)]" />
          {trees.map((tree) => (
            <FieldTree key={tree} className={tree} />
          ))}

          <div className="relative mx-auto max-w-[1120px]">
            <div className="flex flex-col items-center">
              <PixelTitleBanner tone="wood" className="min-h-[56px] px-8">
                Huele Huele Checkout Quest
              </PixelTitleBanner>
              <div className="mt-4 flex flex-col items-center gap-3">
                <PixelInfoPill label="Checkout XP" tone="gold" />
                <PixelProgressBar
                  value={75}
                  label="75% COMPLETE"
                  className="w-full max-w-[760px]"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr_0.78fr]">
              <ScrollCard title="Shipping Scroll" mascot>
                <div className="space-y-3 pr-16">
                  <CheckoutField label="Name:" value="Alex Chen" />
                  <CheckoutField label="Address:" value="123 Pixel St. Game City" />
                  <CheckoutField label="Shipping Method:" value="Dragon Delivery (2 days)" />
                </div>
              </ScrollCard>

              <ScrollCard title="Payment Scroll" mascot>
                <div className="space-y-3 pr-16">
                  <CheckoutField label="Card:" value="**** **** **** 1234 (Visa)" />
                  <CheckoutField label="Expiry:" value="12/25" />
                  <CheckoutField label="CVV:" value="CVV" />
                </div>
              </ScrollCard>

              <div className="grid gap-5">
                <div className="rounded-[26px] border-[4px] border-[#17341c] bg-[#f1d072] p-4 shadow-[0_0_0_2px_#fff3b1,5px_5px_0_#17341c]">
                  <div className="flex items-center justify-between gap-3">
                    <PixelTitleBanner tone="wood" className="min-h-[48px]">
                      Order Total
                    </PixelTitleBanner>
                    <div className="flex h-12 w-14 items-center justify-center rounded-[12px] border-[3px] border-[#17341c] bg-[#9a6736] text-[18px]">
                      🪙
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {cartLines.map((line) => (
                      <div
                        key={line.product.slug}
                        className="flex items-center gap-3 rounded-[16px] border-[3px] border-[#17341c] bg-[#fff9e8] px-3 py-3 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                      >
                        <div className="relative h-12 w-12 shrink-0 rounded-[10px] border-[3px] border-[#17341c] bg-[#dff0c1]">
                          <Image
                            src={line.product.image}
                            alt={line.product.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase text-[#17341c]">
                            {line.product.name}
                          </p>
                          <p className="mt-1 font-[var(--font-terminal)] text-[22px] leading-none text-[#17341c]">
                            {line.product.price} x {line.quantity}
                          </p>
                        </div>
                        <PixelInfoPill label={line.product.level} tone="gold" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[18px] border-[3px] border-[#17341c] bg-[#fff5d4] px-4 py-4 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]">
                    <p className="text-[10px] uppercase text-[#17341c]">
                      Order Total:
                    </p>
                    <p className="mt-2 font-[var(--font-terminal)] text-[32px] leading-none text-[#17341c]">
                      {subtotal} Gold Coins
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-[10px] uppercase text-[#17341c]">
                        Hearts
                      </span>
                      <span className="text-[18px] text-[#df5d6c]">♥</span>
                      <span className="text-[18px] text-[#df5d6c]">♥</span>
                      <span className="text-[18px] text-[#df5d6c]">♥</span>
                    </div>
                  </div>
                </div>

                <PixelLinkButton
                  href="/storefront-v2-game"
                  className="justify-center bg-[#f4d56f] py-5 text-[28px] text-[#17341c] [text-shadow:none] shadow-[0_0_0_3px_#fff6b8,6px_6px_0_#17341c] hover:bg-[#f7df84]"
                >
                  VICTORY!
                </PixelLinkButton>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-4 text-[10px] uppercase text-[#17341c]">
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
