import Link from "next/link";
import type { ReactNode } from "react";
import { Press_Start_2P, VT323 } from "next/font/google";
import { gamePrototypeNav } from "../content/storefront-v2-game-content";
import { PixelInfoPill, PixelLinkButton } from "./storefront-v2-game-ui";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

const terminalFont = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-terminal",
  display: "swap",
});

export function StorefrontV2GameShell({
  activeHref,
  children,
  theme = "field",
  showHeader = true,
}: {
  activeHref: string;
  children: ReactNode;
  theme?: "field" | "command";
  showHeader?: boolean;
}) {
  const isCommand = theme === "command";

  return (
    <div
      data-game-prototype="true"
      className={`${pixelFont.variable} ${terminalFont.variable} relative min-h-screen overflow-hidden ${isCommand ? "bg-[#1b241a] text-[#f4f6dd]" : "bg-[#99cd33] text-[#17341c]"}`}
      style={{
        fontFamily: isCommand
          ? "var(--font-terminal), monospace"
          : "var(--font-pixel), monospace",
      }}
    >
      <div
        className={`absolute inset-0 ${
          isCommand
            ? "bg-[radial-gradient(circle_at_top,#41563d_0%,#1d271c_48%,#0f140f_100%)]"
            : "bg-[radial-gradient(circle_at_top,#dbf38a_0%,#a8d945_38%,#6cae18_100%)]"
        }`}
      />
      <div
        className={`absolute inset-0 ${
          isCommand
            ? "opacity-25 [background-image:linear-gradient(rgba(178,233,128,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(178,233,128,0.1)_1px,transparent_1px)] [background-size:20px_20px]"
            : "opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(40,93,19,0.14)_1px,transparent_1px)] [background-size:20px_20px]"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 ${
          isCommand
            ? "h-[30vh] bg-[linear-gradient(180deg,rgba(24,32,24,0)_0%,rgba(6,8,6,0.9)_100%)]"
            : "h-[34vh] bg-[linear-gradient(180deg,rgba(126,170,30,0)_0%,rgba(65,123,11,0.9)_100%)]"
        }`}
      />
      {!isCommand ? (
        <>
          <div className="absolute left-[-8rem] top-[-5rem] h-72 w-72 rounded-full bg-[#eff8aa]/60 blur-3xl" />
          <div className="absolute bottom-[-7rem] right-[-5rem] h-80 w-80 rounded-full bg-[#4f9d17]/35 blur-3xl" />
          <div className="absolute inset-x-0 top-[22%] h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_100%)]" />
        </>
      ) : null}

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1360px] flex-col gap-6 px-3 py-4 lg:px-6 lg:py-6">
        {showHeader ? (
          <header
            className={`game-panel relative overflow-hidden rounded-[22px] border-[4px] border-[#17341c] font-[family-name:var(--font-pixel)] ${
              isCommand
                ? "bg-[#2c382b] shadow-[0_0_0_2px_#4a5f49,0_0_0_6px_#17341c,7px_7px_0_#0f140f]"
                : "bg-transparent shadow-none"
            }`}
          >
            {isCommand ? (
              <>
                <div className="pointer-events-none absolute inset-[6px] rounded-[14px] border-[2px] border-[#17341c] bg-[linear-gradient(180deg,#50674b_0%,#2e3d2d_48%,#212921_100%)]" />
                <div className="pointer-events-none absolute inset-x-[10px] top-[6px] h-6 rounded-b-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_100%)]" />
                <div className="relative flex flex-col gap-4 px-3 py-3 lg:px-4 lg:py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/storefront-v2-game/centro-de-mando"
                      className="game-pressable relative inline-flex min-h-[46px] items-center overflow-hidden rounded-[12px] border-[3px] border-[#17341c] bg-[linear-gradient(180deg,#41533f_0%,#2f3d30_100%)] px-4 py-3 shadow-[0_0_0_2px_#5e7159,4px_4px_0_#101510]"
                    >
                      <span className="pointer-events-none absolute inset-x-[4px] top-[4px] h-2 rounded-full bg-white/30" />
                      <p className="relative text-[11px] uppercase leading-[1.25] text-[#f4f6dd] [text-shadow:2px_2px_0_#101510]">
                        HUELE HUELE GM
                      </p>
                    </Link>
                    <PixelInfoPill label="GM COMMAND" tone="blue" />
                  </div>

                  <div className="flex flex-col gap-3 xl:items-end">
                    <nav className="flex flex-wrap gap-2 rounded-[16px] border-[3px] border-[#17341c] bg-[#1b231b] p-2 shadow-[0_0_0_2px_#455644,4px_4px_0_#101510]">
                      <PixelLinkButton
                        href="/storefront-v2-game"
                        className="min-w-[116px] bg-[#dce8c9] px-3 py-[0.72rem] text-[9px] text-[#17341c] shadow-[0_0_0_2px_#f4f8e8,4px_4px_0_#101510]"
                      >
                        RETURN HOME
                      </PixelLinkButton>
                    </nav>
                    <PixelInfoPill label="Realm Clock 14:02" tone="gold" />
                  </div>
                </div>
              </>
            ) : (
              <div className="relative flex flex-col gap-3 px-1 py-1 lg:flex-row lg:items-center lg:justify-between">
                <Link
                  href="/storefront-v2-game"
                  className="inline-flex items-center self-start px-1 py-1"
                >
                  <p className="text-[22px] uppercase leading-[0.95] text-[#1d4c22] [text-shadow:2px_2px_0_#f7fbdd] sm:text-[30px]">
                    HUELE HUELE GAME
                  </p>
                </Link>

                <nav className="flex flex-wrap gap-2 lg:justify-end">
                  {gamePrototypeNav.map((item) => {
                    const isActive =
                      item.href === activeHref ||
                      (item.href !== "/storefront-v2-game" &&
                        activeHref.startsWith(item.href));

                    return (
                      <PixelLinkButton
                        key={item.label}
                        href={item.href}
                        className={`min-w-[102px] bg-[linear-gradient(180deg,#f5efc7_0%,#e7ddb3_100%)] px-3 py-[0.72rem] text-[9px] text-[#17341c] [text-shadow:1px_1px_0_#fffce7] shadow-[0_0_0_2px_#fffce7,4px_4px_0_#8c7026] ${
                          isActive
                            ? "bg-[linear-gradient(180deg,#89eb50_0%,#58d83d_100%)] text-[#17341c] [text-shadow:1px_1px_0_#efffd6] shadow-[0_0_0_2px_#e8ff93,4px_4px_0_#567f1b]"
                            : ""
                        }`}
                      >
                        {item.label}
                      </PixelLinkButton>
                    );
                  })}
                </nav>
              </div>
            )}
          </header>
        ) : null}

        {children}
      </div>
    </div>
  );
}
