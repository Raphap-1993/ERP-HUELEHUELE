import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { GamePrototypeProduct } from "../content/storefront-v2-game-content";

export const pixelPanelClass =
  "game-panel relative overflow-hidden rounded-[20px] border-[4px] border-[#17341c]";

export const pixelButtonClass =
  "game-pressable relative inline-flex min-h-[42px] items-center justify-center overflow-hidden rounded-[12px] border-[3px] border-[#17341c] bg-[linear-gradient(180deg,#f7e18d_0%,#e7af4c_100%)] px-4 py-3 font-[family-name:var(--font-pixel)] text-[10px] uppercase leading-[1.2] text-[#17341c] [text-shadow:1px_1px_0_#fff4c0] shadow-[0_0_0_2px_#fff2bf,4px_4px_0_#8c7026] before:absolute before:inset-x-[4px] before:top-[4px] before:h-2 before:rounded-full before:bg-white/35 hover:bg-[linear-gradient(180deg,#fae99e_0%,#ebb95d_100%)] active:shadow-[0_0_0_2px_#fff2bf,2px_2px_0_#8c7026]";

type PixelTone = "cream" | "mint" | "sky" | "gold" | "dark";

const panelToneClassMap: Record<PixelTone, string> = {
  cream:
    "bg-[#d7be88] text-[#17341c] shadow-[0_0_0_2px_#fdfcf1,0_0_0_6px_#17341c,7px_7px_0_#8e7b4d]",
  mint:
    "bg-[#b4c86e] text-[#17341c] shadow-[0_0_0_2px_#eef8cf,0_0_0_6px_#17341c,7px_7px_0_#6b8733]",
  sky:
    "bg-[#89b4c7] text-[#17341c] shadow-[0_0_0_2px_#e8f7ff,0_0_0_6px_#17341c,7px_7px_0_#4e7089]",
  gold:
    "bg-[#ca9f43] text-[#17341c] shadow-[0_0_0_2px_#fff1a7,0_0_0_6px_#17341c,7px_7px_0_#8b5c1b]",
  dark:
    "bg-[#2b342b] text-[#f4f6dd] shadow-[0_0_0_2px_#465545,0_0_0_6px_#17341c,7px_7px_0_#101510]",
};

const panelInnerToneClassMap: Record<PixelTone, string> = {
  cream:
    "border-[#907544] bg-[linear-gradient(180deg,#fbf7d9_0%,#f0ebc2_52%,#e2dbb1_100%)]",
  mint:
    "border-[#6f8437] bg-[linear-gradient(180deg,#eef7c5_0%,#deedaa_52%,#d2e095_100%)]",
  sky:
    "border-[#52758d] bg-[linear-gradient(180deg,#edf8ff_0%,#d8eef9_52%,#c5e1ed_100%)]",
  gold:
    "border-[#8f6322] bg-[linear-gradient(180deg,#ffe79d_0%,#f6d474_45%,#e6be59_100%)]",
  dark:
    "border-[#4b5c49] bg-[linear-gradient(180deg,#4d634a_0%,#324032_45%,#212921_100%)]",
};

export function PixelLinkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${pixelButtonClass} ${className}`.trim()}>
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

export function PixelPanel({
  children,
  className = "",
  tone = "cream",
}: {
  children: ReactNode;
  className?: string;
  tone?: PixelTone;
}) {
  return (
    <div
      className={`${pixelPanelClass} ${panelToneClassMap[tone]} game-panel ${className}`.trim()}
    >
      <div
        className={`pointer-events-none absolute inset-[6px] rounded-[13px] border-[2px] ${panelInnerToneClassMap[tone]}`}
      />
      <div className="pointer-events-none absolute inset-x-[10px] top-[6px] h-6 rounded-b-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_100%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PixelInfoPill({
  label,
  tone = "cream",
}: {
  label: string;
  tone?: "cream" | "gold" | "pink" | "blue" | "green";
}) {
  const toneClass =
    tone === "gold"
      ? "bg-[linear-gradient(180deg,#ffe59a_0%,#f4c85a_100%)] text-[#17341c] shadow-[0_0_0_2px_#fff7cb,3px_3px_0_#8b5c1b]"
      : tone === "pink"
        ? "bg-[linear-gradient(180deg,#ffd4d7_0%,#f7b4be_100%)] text-[#17341c] shadow-[0_0_0_2px_#fff1f3,3px_3px_0_#9a6672]"
        : tone === "blue"
          ? "bg-[linear-gradient(180deg,#d8efff_0%,#aed4ee_100%)] text-[#17341c] shadow-[0_0_0_2px_#f4fbff,3px_3px_0_#4e7089]"
          : tone === "green"
            ? "bg-[linear-gradient(180deg,#d9efad_0%,#b8d986_100%)] text-[#17341c] shadow-[0_0_0_2px_#fbffe9,3px_3px_0_#6b8733]"
            : "bg-[linear-gradient(180deg,#fcf9e1_0%,#efe8c0_100%)] text-[#17341c] shadow-[0_0_0_2px_#ffffff,3px_3px_0_#8e7b4d]";

  return (
    <span
      className={`game-panel relative inline-flex items-center gap-2 overflow-hidden rounded-[11px] border-[3px] border-[#17341c] px-3 py-[0.6rem] font-[family-name:var(--font-pixel)] text-[9px] uppercase leading-none ${toneClass}`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] border-[2px] border-[#17341c] bg-white/60" />
      <span className="relative z-10">{label}</span>
    </span>
  );
}

export function PixelTitleBanner({
  children,
  className = "",
  tone = "wood",
}: {
  children: ReactNode;
  className?: string;
  tone?: "wood" | "cream" | "dark";
}) {
  const toneClass =
    tone === "dark"
      ? "bg-[linear-gradient(180deg,#465845_0%,#2d392d_100%)] text-[#f4f6dd] shadow-[0_0_0_2px_#596e58,4px_4px_0_#101510]"
      : tone === "cream"
        ? "bg-[linear-gradient(180deg,#fcf9e1_0%,#eee6bf_100%)] text-[#17341c] shadow-[0_0_0_2px_#ffffff,4px_4px_0_#8e7b4d]"
        : "bg-[linear-gradient(180deg,#f1c885_0%,#c78f46_100%)] text-[#17341c] shadow-[0_0_0_2px_#f9e2b5,4px_4px_0_#8b5c1b]";

  return (
    <div
      className={`game-panel relative inline-flex items-center gap-3 overflow-hidden rounded-[12px] border-[3px] border-[#17341c] px-4 py-3 ${toneClass} ${className}`.trim()}
    >
      <span className="h-3 w-3 shrink-0 rounded-[3px] border-[2px] border-[#17341c] bg-white/60" />
      <span className="relative z-10 font-[family-name:var(--font-pixel)] text-[11px] uppercase leading-none">
        {children}
      </span>
    </div>
  );
}

export function PixelWindow({
  title,
  badge,
  children,
  className = "",
  tone = "cream",
}: {
  title?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: PixelTone;
}) {
  return (
    <PixelPanel tone={tone} className={className}>
      {title || badge ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <PixelTitleBanner tone={tone === "dark" ? "dark" : "wood"}>
              {title}
            </PixelTitleBanner>
          ) : (
            <span />
          )}
          {badge}
        </div>
      ) : null}
      <div className={title || badge ? "mt-4" : ""}>{children}</div>
    </PixelPanel>
  );
}

export function PixelSpeechBubble({
  children,
  className = "",
  tail = "left",
}: {
  children: ReactNode;
  className?: string;
  tail?: "left" | "right";
}) {
  return (
    <div
      className={`relative rounded-[18px] border-[3px] border-[#17341c] bg-[#fbfbe8] px-4 py-4 font-[family-name:var(--font-pixel)] shadow-[0_0_0_2px_#ffffff,4px_4px_0_#8e7b4d] ${className}`.trim()}
    >
      <div
        className={`absolute bottom-[-10px] h-5 w-5 rotate-45 border-b-[3px] border-r-[3px] border-[#17341c] bg-[#fbfbe8] ${
          tail === "right" ? "right-7" : "left-7"
        }`}
      />
      {children}
    </div>
  );
}

export function PixelProgressBar({
  value,
  label,
  className = "",
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[16px] border-[3px] border-[#17341c] bg-[linear-gradient(180deg,#fcf9e1_0%,#eee6bf_100%)] p-2 shadow-[0_0_0_2px_#ffffff,4px_4px_0_#8e7b4d] ${className}`.trim()}
    >
      <div className="overflow-hidden rounded-[12px] border-[3px] border-[#17341c] bg-[#dde3b4]">
        <div
          className="game-shimmer flex h-7 items-center justify-center bg-[linear-gradient(90deg,#f1b33f_0%,#ffe993_48%,#efaa33_100%)] text-[9px] uppercase text-[#17341c] [text-shadow:1px_1px_0_#fff3b6]"
          style={{ width: `${Math.max(8, Math.min(100, value))}%` }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export function GameProductCard({
  product,
  actionHref,
  actionLabel = "Abrir",
}: {
  product: GamePrototypeProduct;
  actionHref: string;
  actionLabel?: string;
}) {
  return (
    <article className="game-panel game-enter relative overflow-hidden rounded-[18px] border-[4px] border-[#17341c] bg-[#d4b779] p-3 shadow-[0_0_0_2px_#fffce8,0_0_0_6px_#17341c,6px_6px_0_#8e7b4d]">
      <div className="pointer-events-none absolute inset-[5px] rounded-[11px] border-[2px] border-[#8f7643] bg-[linear-gradient(180deg,#fbf7d9_0%,#eee7bf_52%,#e2d8af_100%)]" />
      <div
        className={`relative z-10 rounded-[14px] border-[3px] border-[#17341c] bg-gradient-to-b ${product.accent} p-3 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35),3px_3px_0_#17341c]`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex rounded-[10px] border-[3px] border-[#17341c] bg-white/85 px-3 py-2 text-[9px] uppercase leading-none text-[#17341c]">
            {product.meta}
          </span>
          <PixelInfoPill label={product.level} tone="gold" />
        </div>
        <div className="relative mx-auto mt-3 aspect-square max-w-[150px]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain"
          />
        </div>
      </div>

      <div className="relative z-10 mt-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-[var(--font-terminal)] text-[28px] leading-[0.95] text-[#17341c]">
              {product.name}
            </h3>
            <p className="mt-2 text-[10px] uppercase leading-[1.7] text-[#476530]">
              {product.coinPrice}
            </p>
          </div>
          <PixelInfoPill label={product.rarity} tone="blue" />
        </div>

        <p className="font-[var(--font-terminal)] text-[24px] leading-[1.02] text-[#17341c]">
          {product.sellerLine}
        </p>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-[var(--font-terminal)] text-[32px] leading-none text-[#4e6f33]">
              {product.price}
            </p>
            {product.compareAtPrice ? (
              <p className="mt-1 font-[var(--font-terminal)] text-[22px] leading-none text-[#8d7a48] line-through">
                {product.compareAtPrice}
              </p>
            ) : null}
          </div>
          <PixelInfoPill label={product.stock} tone="green" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <p className="font-[var(--font-terminal)] text-[22px] leading-[1.02] text-[#17341c]">
          {product.description}
        </p>
        <PixelLinkButton
          href={actionHref}
          className="w-full bg-[linear-gradient(180deg,#9ffb60_0%,#53d63a_100%)] text-[10px] text-[#17341c] [text-shadow:1px_1px_0_#efffd6] shadow-[0_0_0_2px_#e4ffb2,4px_4px_0_#567f1b] hover:bg-[linear-gradient(180deg,#afff73_0%,#63df49_100%)]"
        >
          {actionLabel}
        </PixelLinkButton>
      </div>
    </article>
  );
}
