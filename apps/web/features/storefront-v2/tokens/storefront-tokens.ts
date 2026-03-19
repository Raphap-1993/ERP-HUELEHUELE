import type { CatalogProduct } from "@huelegood/shared";

export const storefrontV2Tokens = {
  palette: {
    ink: "#17211a",
    olive: "#64715d",
    herbal: "#86906f",
    sand: "#d2c09f",
    ivory: "#f7f2e8",
    mist: "#edf1e8",
    smoke: "#6c7368"
  },
  radius: {
    panel: "rounded-[2rem]",
    media: "rounded-[2.4rem]",
    pill: "rounded-full"
  },
  shadow: {
    panel: "shadow-[0_28px_80px_rgba(23,33,26,0.08)]",
    media: "shadow-[0_36px_100px_rgba(23,33,26,0.12)]"
  },
  spacing: {
    page: "space-y-8 py-6 md:space-y-12 md:py-10",
    section: "space-y-6 md:space-y-8"
  },
  gradient: {
    canvas: "bg-[linear-gradient(180deg,rgba(250,247,240,0.75)_0%,rgba(241,244,236,0.82)_52%,rgba(248,244,236,0.72)_100%)]",
    panel: "bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,244,235,0.94)_100%)]",
    mist: "bg-[linear-gradient(145deg,#edf1e8_0%,#f7f2e8_58%,#dde5d5_100%)]",
    olive: "bg-[linear-gradient(135deg,#17211a_0%,#29372a_54%,#475444_100%)]"
  },
  className: {
    panel:
      "rounded-[2rem] border border-[#17211a]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,244,235,0.94)_100%)] p-6 shadow-[0_28px_80px_rgba(23,33,26,0.08)] backdrop-blur md:p-8",
    panelMuted:
      "rounded-[2rem] border border-[#17211a]/8 bg-[linear-gradient(180deg,rgba(245,247,241,0.94)_0%,rgba(252,248,240,0.92)_100%)] p-6 shadow-[0_24px_70px_rgba(23,33,26,0.07)] md:p-8",
    panelDark:
      "rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#17211a_0%,#29372a_54%,#475444_100%)] p-6 text-white shadow-[0_34px_90px_rgba(23,33,26,0.28)] md:p-8",
    pill:
      "inline-flex items-center rounded-full border border-[#17211a]/10 bg-white/76 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#17211a]/58 backdrop-blur",
    eyebrow: "text-[11px] uppercase tracking-[0.3em] text-[#6c7368]",
    title: "text-3xl font-semibold tracking-[-0.04em] text-[#17211a] md:text-[2.85rem]",
    description: "max-w-2xl text-base leading-7 text-black/62",
    gridCard: "rounded-[1.6rem] border border-[#17211a]/8 bg-white/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
    darkGridCard: "rounded-[1.6rem] border border-white/12 bg-white/8 p-5"
  }
} as const;

export function productToneClasses(tone?: CatalogProduct["tone"]) {
  switch (tone) {
    case "amber":
      return {
        frame: "bg-[linear-gradient(145deg,#f6efe3_0%,#f3e4c6_45%,#dfd0b2_100%)]",
        badge: "bg-[#fff1dc] text-[#7a531e]",
        accent: "text-[#8c6331]"
      };
    case "graphite":
      return {
        frame: "bg-[linear-gradient(145deg,#ebeeea_0%,#dde4dc_45%,#c9d1c8_100%)]",
        badge: "bg-white/78 text-[#17211a]",
        accent: "text-[#324033]"
      };
    default:
      return {
        frame: "bg-[linear-gradient(145deg,#edf2e6_0%,#e2ead8_45%,#d0dcc5_100%)]",
        badge: "bg-[#17211a] text-white",
        accent: "text-[#4f6448]"
      };
  }
}
