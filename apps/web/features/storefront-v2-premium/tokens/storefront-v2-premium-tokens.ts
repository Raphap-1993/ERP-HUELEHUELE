import type { CatalogProduct } from "@huelegood/shared";

export const storefrontV2PremiumTokens = {
  palette: {
    ink: "#112017",
    forest: "#314032",
    olive: "#67745f",
    herbal: "#90a07f",
    sand: "#c6a471",
    ivory: "#f8f2e7",
    mist: "#e9eee4",
    smoke: "#667064"
  },
  spacing: {
    page: "space-y-8 py-6 md:space-y-12 md:py-10",
    section: "space-y-6 md:space-y-8"
  },
  className: {
    canvas: "bg-[linear-gradient(180deg,rgba(249,244,236,0.76)_0%,rgba(238,243,233,0.88)_46%,rgba(248,244,238,0.78)_100%)]",
    panel:
      "rounded-[2rem] border border-[#112017]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(250,245,238,0.95)_100%)] p-6 shadow-[0_28px_80px_rgba(17,32,23,0.08)] backdrop-blur md:p-8",
    panelMuted:
      "rounded-[2rem] border border-[#112017]/8 bg-[linear-gradient(180deg,rgba(240,244,235,0.94)_0%,rgba(252,247,239,0.92)_100%)] p-6 shadow-[0_24px_70px_rgba(17,32,23,0.07)] md:p-8",
    panelDark:
      "rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#112017_0%,#253125_54%,#4f5f4b_100%)] p-6 text-white shadow-[0_34px_90px_rgba(17,32,23,0.28)] md:p-8",
    media:
      "group relative overflow-hidden rounded-[2.4rem] border border-[#112017]/8 bg-[linear-gradient(145deg,#edf2ea_0%,#f8f2e7_58%,#dce5d5_100%)] shadow-[0_36px_100px_rgba(17,32,23,0.12)]",
    eyebrow: "text-[11px] uppercase tracking-[0.3em] text-[#667064]",
    title: "text-3xl font-semibold tracking-[-0.04em] text-[#112017] md:text-[2.85rem]",
    description: "max-w-2xl text-base leading-7 text-black/62",
    pill:
      "inline-flex items-center rounded-full border border-[#112017]/10 bg-white/78 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#112017]/58 backdrop-blur"
  }
} as const;

export function premiumProductToneClasses(tone?: CatalogProduct["tone"]) {
  switch (tone) {
    case "amber":
      return {
        frame: "bg-[linear-gradient(145deg,#f7efe2_0%,#f1dfc0_45%,#dfcfab_100%)]",
        badge: "bg-[#fff0d6] text-[#7d5623]",
        accent: "text-[#8e6430]"
      };
    case "graphite":
      return {
        frame: "bg-[linear-gradient(145deg,#ecefe9_0%,#dde3db_45%,#c8d0c8_100%)]",
        badge: "bg-white/78 text-[#112017]",
        accent: "text-[#304033]"
      };
    default:
      return {
        frame: "bg-[linear-gradient(145deg,#edf2e8_0%,#e2ead7_45%,#cfdbc3_100%)]",
        badge: "bg-[#112017] text-white",
        accent: "text-[#4a6047]"
      };
  }
}
