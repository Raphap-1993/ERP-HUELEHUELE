"use client";

import type { ReactNode } from "react";
import { Press_Start_2P, VT323 } from "next/font/google";
import { cn } from "@huelegood/ui";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap"
});

const terminalFont = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-terminal",
  display: "swap"
});

type PanelTone = "cream" | "mint" | "gold" | "dark";
type TitleTone = "wood" | "cream" | "dark";
type BadgeTone = "green" | "gold" | "blue" | "pink" | "cream";
type CanvasBodyFont = "terminal" | "sans";

const panelClasses: Record<PanelTone, string> = {
  cream:
    "border-[#17341c] bg-[linear-gradient(180deg,#f8f3da_0%,#ece2b7_100%)] shadow-[0_0_0_2px_#ffffff,6px_6px_0_#17341c]",
  mint:
    "border-[#17341c] bg-[linear-gradient(180deg,#eef7c5_0%,#d2e095_100%)] shadow-[0_0_0_2px_#fbffe9,6px_6px_0_#6b8733]",
  gold:
    "border-[#17341c] bg-[linear-gradient(180deg,#ffe79d_0%,#e6be59_100%)] shadow-[0_0_0_2px_#fff1a7,6px_6px_0_#8b5c1b]",
  dark:
    "border-[#17341c] bg-[linear-gradient(180deg,#465845_0%,#212921_100%)] text-[#f4f6dd] shadow-[0_0_0_2px_#596e58,6px_6px_0_#101510]"
};

const titleClasses: Record<TitleTone, string> = {
  wood:
    "bg-[linear-gradient(180deg,#f1c885_0%,#c78f46_100%)] text-[#17341c] shadow-[0_0_0_2px_#f9e2b5,4px_4px_0_#8b5c1b]",
  cream:
    "bg-[linear-gradient(180deg,#fcf9e1_0%,#eee6bf_100%)] text-[#17341c] shadow-[0_0_0_2px_#ffffff,4px_4px_0_#8e7b4d]",
  dark:
    "bg-[linear-gradient(180deg,#465845_0%,#2d392d_100%)] text-[#f4f6dd] shadow-[0_0_0_2px_#596e58,4px_4px_0_#101510]"
};

const badgeClasses: Record<BadgeTone, string> = {
  green:
    "bg-[linear-gradient(180deg,#d9efad_0%,#b8d986_100%)] text-[#17341c] shadow-[0_0_0_2px_#fbffe9,3px_3px_0_#6b8733]",
  gold:
    "bg-[linear-gradient(180deg,#ffe59a_0%,#f4c85a_100%)] text-[#17341c] shadow-[0_0_0_2px_#fff7cb,3px_3px_0_#8b5c1b]",
  blue:
    "bg-[linear-gradient(180deg,#d8efff_0%,#aed4ee_100%)] text-[#17341c] shadow-[0_0_0_2px_#f4fbff,3px_3px_0_#4e7089]",
  pink:
    "bg-[linear-gradient(180deg,#ffd4d7_0%,#f7b4be_100%)] text-[#17341c] shadow-[0_0_0_2px_#fff1f3,3px_3px_0_#9a6672]",
  cream:
    "bg-[linear-gradient(180deg,#fcf9e1_0%,#efe8c0_100%)] text-[#17341c] shadow-[0_0_0_2px_#ffffff,3px_3px_0_#8e7b4d]"
};

export function StorefrontGameTemporalCanvas({
  children,
  className,
  bodyFont = "terminal"
}: {
  children: ReactNode;
  className?: string;
  bodyFont?: CanvasBodyFont;
}) {
  return (
    <div
      data-game-temporal="true"
      className={cn(
        `${pixelFont.variable} ${terminalFont.variable} relative overflow-hidden rounded-[32px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#dbf38a_0%,#a8d945_42%,#6cae18_100%)] px-4 py-5 text-[#17341c] shadow-[0_0_0_3px_#eff8d2,8px_8px_0_#17341c]`,
        className
      )}
      style={{ fontFamily: bodyFont === "sans" ? "var(--font-sans), sans-serif" : "var(--font-terminal), monospace" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(40,93,19,0.14)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0)_100%)]" />
      <div className="pointer-events-none absolute bottom-[-5rem] right-[-4rem] h-64 w-64 rounded-full bg-[#4f9d17]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-[-5rem] top-[-4rem] h-56 w-56 rounded-full bg-[#eff8aa]/55 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

type StorefrontGameTemporalSurfaceStat = {
  detail?: string;
  label: string;
  tone?: PanelTone;
  value: string;
};

type StorefrontGameTemporalSurfaceBadge = {
  label: string;
  tone?: BadgeTone;
};

type StorefrontGameTemporalSurfaceCallout = {
  bullets?: string[];
  description: string;
  title: string;
  tone?: PanelTone;
};

export function StorefrontGameTemporalSurfaceShell({
  badges,
  callout,
  canvasClassName,
  children,
  className,
  description,
  eyebrow,
  stats,
  title
}: {
  badges?: StorefrontGameTemporalSurfaceBadge[];
  callout?: StorefrontGameTemporalSurfaceCallout;
  canvasClassName?: string;
  children?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  stats?: StorefrontGameTemporalSurfaceStat[];
  title: string;
}) {
  return (
    <section className={cn("px-4 py-6 md:px-6 md:py-8", className)}>
      <StorefrontGameTemporalCanvas bodyFont="sans" className={cn("mx-auto max-w-[1440px]", canvasClassName)}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <StorefrontGameTemporalPanel className="h-full">
            <StorefrontGameTemporalTitle>{eyebrow}</StorefrontGameTemporalTitle>
            <h1 className="mt-5 max-w-4xl font-serif text-[2.4rem] font-semibold leading-[0.95] tracking-[-0.04em] text-[#17341c] sm:text-[3rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#17341c]/78 sm:text-lg">{description}</p>
            {badges?.length ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <StorefrontGameTemporalBadge key={`${badge.label}-${badge.tone ?? "cream"}`} tone={badge.tone ?? "cream"}>
                    {badge.label}
                  </StorefrontGameTemporalBadge>
                ))}
              </div>
            ) : null}
          </StorefrontGameTemporalPanel>

          {callout ? (
            <StorefrontGameTemporalPanel tone={callout.tone ?? "dark"} className="h-full">
              <StorefrontGameTemporalTitle tone={callout.tone === "dark" ? "dark" : "cream"}>
                Continuidad
              </StorefrontGameTemporalTitle>
              <h2 className="mt-5 font-serif text-[1.8rem] font-semibold leading-tight">{callout.title}</h2>
              <p className="mt-3 text-base leading-7 opacity-82">{callout.description}</p>
              {callout.bullets?.length ? (
                <div className="mt-5 space-y-3">
                  {callout.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 rounded-[16px] border-[2px] border-white/15 bg-white/6 px-4 py-3">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-[3px] border-[2px] border-current bg-current/40" />
                      <p className="text-sm leading-6 opacity-88">{bullet}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </StorefrontGameTemporalPanel>
          ) : null}
        </div>

        {stats?.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <StorefrontGameTemporalStat
                key={`${stat.label}-${stat.value}`}
                detail={stat.detail}
                label={stat.label}
                tone={stat.tone ?? "cream"}
                value={stat.value}
              />
            ))}
          </div>
        ) : null}

        {children ? <div className="mt-6">{children}</div> : null}
      </StorefrontGameTemporalCanvas>
    </section>
  );
}

export function StorefrontGameTemporalPanel({
  children,
  className,
  tone = "cream"
}: {
  children: ReactNode;
  className?: string;
  tone?: PanelTone;
}) {
  return (
    <div
      className={cn(
        "game-temporal-panel relative overflow-hidden rounded-[24px] border-[4px] p-4 lg:p-5",
        panelClasses[tone],
        className
      )}
    >
      <div className="pointer-events-none absolute inset-[6px] rounded-[16px] border-[2px] border-white/30" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function StorefrontGameTemporalTitle({
  children,
  className,
  tone = "wood"
}: {
  children: ReactNode;
  className?: string;
  tone?: TitleTone;
}) {
  return (
    <div
      className={cn(
        "inline-flex min-h-[48px] items-center gap-3 rounded-[12px] border-[3px] border-[#17341c] px-4 py-3",
        titleClasses[tone],
        className
      )}
    >
      <span className="h-3 w-3 shrink-0 rounded-[3px] border-[2px] border-[#17341c] bg-white/60" />
      <span className="font-[family-name:var(--font-pixel)] text-[11px] uppercase leading-none">{children}</span>
    </div>
  );
}

export function StorefrontGameTemporalBadge({
  children,
  className,
  tone = "cream"
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[11px] border-[3px] border-[#17341c] px-3 py-[0.55rem] font-[family-name:var(--font-pixel)] text-[9px] uppercase leading-none",
        badgeClasses[tone],
        className
      )}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] border-[2px] border-[#17341c] bg-white/60" />
      <span>{children}</span>
    </span>
  );
}

export function StorefrontGameTemporalStat({
  label,
  value,
  detail,
  tone = "cream"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: PanelTone;
}) {
  return (
    <StorefrontGameTemporalPanel tone={tone} className="h-full">
      <p className="font-[family-name:var(--font-pixel)] text-[9px] uppercase leading-[1.5] opacity-70">{label}</p>
      <p className="mt-3 text-[2rem] leading-none sm:text-[2.3rem]">{value}</p>
      {detail ? <p className="mt-3 text-base leading-6 opacity-78">{detail}</p> : null}
    </StorefrontGameTemporalPanel>
  );
}

export const storefrontGameTemporalActionClass =
  "game-temporal-press inline-flex min-h-[44px] items-center justify-center rounded-[12px] border-[3px] border-[#17341c] bg-[linear-gradient(180deg,#31ff36_0%,#1ac831_100%)] px-4 py-3 font-[family-name:var(--font-pixel)] text-[10px] uppercase leading-[1.25] text-white [text-shadow:2px_2px_0_#17341c] shadow-[0_0_0_2px_#d9ff7a,4px_4px_0_#17341c] transition hover:bg-[linear-gradient(180deg,#43ff49_0%,#24d13b_100%)]";

export const storefrontGameTemporalSecondaryActionClass =
  "game-temporal-press inline-flex min-h-[44px] items-center justify-center rounded-[12px] border-[3px] border-[#17341c] bg-[linear-gradient(180deg,#fcf9e1_0%,#eee6bf_100%)] px-4 py-3 font-[family-name:var(--font-pixel)] text-[10px] uppercase leading-[1.25] text-[#17341c] shadow-[0_0_0_2px_#ffffff,4px_4px_0_#8e7b4d] transition hover:bg-[linear-gradient(180deg,#fffcef_0%,#f6efcb_100%)]";
