import type { CatalogProduct } from "@huelegood/shared";

export const storefrontV2PremiumTokens = {
  palette: {
    ink: "#162117",
    forest: "#2e3d2e",
    olive: "#667055",
    herbal: "#8ea17b",
    sand: "#c7a066",
    ivory: "#f7f1e6",
    mist: "#e7ede3",
    smoke: "#5f675d"
  },
  spacing: {
    page: "space-y-10 py-6 md:space-y-16 md:py-10",
    section: "space-y-6 md:space-y-8"
  },
  className: {
    canvas:
      "bg-[linear-gradient(180deg,#f8f3e8_0%,#eef3ea_38%,#f7f2e7_100%)] before:pointer-events-none before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(199,160,102,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(142,161,123,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,33,23,0.06),transparent_30%)]",
    panel:
      "rounded-[2rem] border border-[#162117]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,244,236,0.94)_100%)] p-6 shadow-[0_30px_85px_rgba(22,33,23,0.08)] backdrop-blur md:p-8",
    panelMuted:
      "rounded-[2rem] border border-[#162117]/8 bg-[linear-gradient(180deg,rgba(239,244,236,0.96)_0%,rgba(251,246,238,0.94)_100%)] p-6 shadow-[0_24px_70px_rgba(22,33,23,0.07)] md:p-8",
    panelDark:
      "rounded-[2rem] border border-white/10 bg-[linear-gradient(140deg,#162117_0%,#2d3b2d_52%,#647254_100%)] p-6 text-white shadow-[0_36px_95px_rgba(22,33,23,0.26)] md:p-8",
    media:
      "group relative overflow-hidden rounded-[2.4rem] border border-[#162117]/8 bg-[linear-gradient(145deg,#edf2ea_0%,#f8f2e7_58%,#dce5d5_100%)] shadow-[0_38px_110px_rgba(22,33,23,0.12)]",
    eyebrow: "text-[11px] uppercase tracking-[0.32em] text-[#5f675d]",
    title: "text-3xl font-semibold tracking-[-0.045em] text-[#162117] md:text-[3.1rem]",
    description: "max-w-2xl text-base leading-7 text-black/62",
    pill:
      "inline-flex items-center rounded-full border border-[#162117]/10 bg-white/82 px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-[#162117]/58 backdrop-blur"
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
