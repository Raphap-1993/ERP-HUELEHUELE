import Image from "next/image";
import { gamePrototypeGmMascotSrc } from "../content/storefront-v2-game-art";
import { StorefrontV2GameShell } from "../components/storefront-v2-game-shell";
import {
  PixelInfoPill,
  PixelLinkButton,
  PixelSpeechBubble,
  PixelTitleBanner,
  PixelWindow,
} from "../components/storefront-v2-game-ui";

const fieldParty = [
  { label: "LU", arrows: "↑↑" },
  { label: "MA", arrows: "↗" },
  { label: "RA", arrows: "→" },
  { label: "VE", arrows: "↑" },
] as const;

const systemLogs = [
  { title: "Dungeon Reports", detail: "Server Data Updated!" },
  { title: "New Bug Detected!", detail: "Minor Slime Encounter!" },
] as const;

const commandActions = [
  {
    title: "Manage Quests",
    detail: "(Orders)",
    href: "/storefront-v2-game/mayoristas",
  },
  {
    title: "Summon Users",
    detail: "(Customers)",
    href: "/storefront-v2-game/catalogo",
  },
  {
    title: "Craft Items",
    detail: "(Products)",
    href: "/storefront-v2-game/producto/clasico-verde",
  },
  {
    title: "System Settings",
    detail: "(Config)",
    href: "/storefront-v2-game/checkout",
  },
] as const;

const popularityNodes = [
  "left-[10%] top-[52%]",
  "left-[24%] top-[28%]",
  "left-[38%] top-[66%]",
  "left-[54%] top-[40%]",
  "left-[68%] top-[18%]",
] as const;

const commerceIslands = [
  "left-[7%] top-[18%] h-16 w-24 rotate-[-8deg] rounded-[42px] bg-[#6eaa51]",
  "left-[18%] top-[45%] h-14 w-20 rotate-[6deg] rounded-[30px] bg-[#5b9144]",
  "left-[36%] top-[28%] h-20 w-28 rotate-[4deg] rounded-[48px] bg-[#d4cc79]",
  "left-[48%] top-[50%] h-16 w-[5.5rem] rotate-[-12deg] rounded-[34px] bg-[#7cae56]",
  "left-[62%] top-[22%] h-[4.5rem] w-24 rotate-[8deg] rounded-[42px] bg-[#d3c16b]",
  "left-[78%] top-[48%] h-20 w-16 rotate-[14deg] rounded-[36px] bg-[#78b157]",
] as const;

const mapPins = [
  {
    className: "left-[28%] top-[36%]",
    label: "Current Orders",
    value: "128 Active Quests",
    tone: "green" as const,
  },
  {
    className: "right-[18%] top-[32%]",
    label: "Guild Route",
    value: "14 New Leads",
    tone: "gold" as const,
  },
  {
    className: "left-[48%] bottom-[16%]",
    label: "Inventory",
    value: "85% Stock Level",
    tone: "blue" as const,
  },
] as const;

export function StorefrontV2GameCommandCenterPage() {
  return (
    <StorefrontV2GameShell
      activeHref="/storefront-v2-game/centro-de-mando"
      theme="command"
      showHeader={false}
    >
      <main className="grid flex-1 gap-6">
        <section className="relative overflow-hidden rounded-[30px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#6fb852_0%,#4e8f3c_24%,#293427_68%,#161c16_100%)] px-4 py-5 shadow-[0_0_0_3px_#b8e77f,8px_8px_0_#101510] lg:px-6">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(215,255,124,0.25)_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute right-[10%] top-[8%] text-[16px] text-[#ffe36f]">✦ ✦</div>
          <div className="absolute right-[18%] top-[12%] text-[18px] text-[#ffd95b]">◎</div>
          <div className="absolute right-[24%] top-[5%] text-[16px] text-[#ffe36f]">✦</div>

          <div className="relative mx-auto max-w-[1180px]">
            <div className="flex flex-col items-center gap-3">
              <PixelTitleBanner tone="dark" className="min-h-[56px] px-8">
                Huele Huele
                <br />
                GM Command Center
              </PixelTitleBanner>
              <PixelInfoPill label="Realm Status: Online" tone="green" />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_270px]">
              <aside className="grid gap-4">
                <PixelWindow className="p-4" tone="dark">
                  <div className="flex items-start gap-3">
                    <div className="relative h-20 w-20 shrink-0 rounded-[18px] border-[3px] border-[#17341c] bg-[#dce8c9] shadow-[0_0_0_2px_#596e58,3px_3px_0_#101510]">
                      <Image
                        src={gamePrototypeGmMascotSrc}
                        alt="P-Chan guide"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase text-[#b5d79a]">
                        Admin Guide: P-Chan
                      </p>
                      <PixelSpeechBubble className="mt-2 bg-[#fffbea] px-4 py-4 text-[#17341c] shadow-[0_0_0_2px_#ffffff,4px_4px_0_#101510]">
                        <p className="font-[var(--font-terminal)] text-[22px] leading-[0.98]">
                          Ready for today&apos;s quests, GM?
                        </p>
                      </PixelSpeechBubble>
                    </div>
                  </div>
                </PixelWindow>

                <PixelWindow
                  title="Character Stats"
                  badge={<PixelInfoPill label="Use EXP" tone="gold" />}
                  className="p-4"
                  tone="dark"
                >
                  <div className="rounded-[18px] border-[3px] border-[#17341c] bg-[#141a14] p-4 shadow-[0_0_0_2px_#41533f,3px_3px_0_#101510]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] uppercase text-[#b5d79a]">
                        Team Level
                      </p>
                      <p className="font-[var(--font-terminal)] text-[24px] leading-none text-[#f4f6dd]">
                        45,200 EXP
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {fieldParty.map((member) => (
                        <div key={member.label} className="space-y-2 text-center">
                          <div className="flex h-14 items-center justify-center rounded-[14px] border-[3px] border-[#17341c] bg-[#2c3a2d] text-[22px] uppercase text-[#f4f6dd] shadow-[0_0_0_2px_#41533f,3px_3px_0_#101510]">
                            {member.label}
                          </div>
                          <p className="font-[var(--font-terminal)] text-[18px] leading-none text-[#99ef69]">
                            {member.arrows}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </PixelWindow>

                <PixelWindow
                  title="Popularity"
                  badge={<PixelInfoPill label="Daily Sales Quest" tone="blue" />}
                  className="p-4"
                  tone="dark"
                >
                  <div className="rounded-[18px] border-[3px] border-[#17341c] bg-[#141a14] p-4 shadow-[0_0_0_2px_#41533f,3px_3px_0_#101510]">
                    <div className="relative h-40 rounded-[16px] border-[3px] border-[#17341c] bg-[#1f261f]">
                      <div className="absolute left-[14%] top-[56%] h-[3px] w-[24%] rotate-[-38deg] bg-[#9de36b]" />
                      <div className="absolute left-[28%] top-[44%] h-[3px] w-[22%] rotate-[34deg] bg-[#9de36b]" />
                      <div className="absolute left-[42%] top-[54%] h-[3px] w-[20%] rotate-[-28deg] bg-[#9de36b]" />
                      <div className="absolute left-[56%] top-[38%] h-[3px] w-[20%] rotate-[-34deg] bg-[#9de36b]" />
                      {popularityNodes.map((node) => (
                        <div
                          key={node}
                          className={`absolute h-4 w-4 rounded-full border-[3px] border-[#17341c] bg-[#9de36b] ${node}`}
                        />
                      ))}
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase text-[#b5d79a]">
                          Daily Sales Quest
                        </p>
                        <p className="font-[var(--font-terminal)] text-[21px] leading-none text-[#f4f6dd]">
                          S/. 15,450
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase text-[#b5d79a]">
                          New Guild Members
                        </p>
                        <p className="font-[var(--font-terminal)] text-[21px] leading-none text-[#99ef69]">
                          +350
                        </p>
                      </div>
                    </div>
                  </div>
                </PixelWindow>
              </aside>

              <section className="grid gap-4">
                <PixelWindow
                  title="Realm of Commerce"
                  badge={<PixelInfoPill label="Live Map" tone="gold" />}
                  className="p-4 lg:p-5"
                  tone="dark"
                >
                  <div className="rounded-[20px] border-[3px] border-[#17341c] bg-[#2b3238] p-4 shadow-[0_0_0_2px_#41533f,5px_5px_0_#101510]">
                    <div className="relative aspect-[1.24] overflow-hidden rounded-[18px] border-[3px] border-[#17341c] bg-[linear-gradient(180deg,#78b8cf_0%,#5c95ac_100%)]">
                      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:26px_26px]" />
                      {commerceIslands.map((island) => (
                        <div
                          key={island}
                          className={`absolute border-[3px] border-[#17341c] ${island}`}
                        />
                      ))}
                      {mapPins.map((pin) => (
                        <div
                          key={pin.label}
                          className={`absolute rounded-[12px] border-[3px] border-[#17341c] px-3 py-2 text-[10px] uppercase text-[#17341c] ${
                            pin.tone === "gold"
                              ? "bg-[#f2d36e]"
                              : pin.tone === "blue"
                                ? "bg-[#d8efff]"
                                : "bg-[#f7f6de]"
                          } ${pin.className}`}
                        >
                          <p>{pin.label}</p>
                          <p className="mt-1 font-[var(--font-terminal)] text-[18px] leading-none">
                            {pin.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </PixelWindow>
              </section>

              <aside className="grid gap-4">
                <PixelWindow
                  title="System Logs & Alerts"
                  badge={<PixelInfoPill label="2 urgent" tone="pink" />}
                  className="p-4"
                  tone="dark"
                >
                  <div className="space-y-3">
                    {systemLogs.map((log) => (
                      <div
                        key={log.title}
                        className="rounded-[16px] border-[3px] border-[#17341c] bg-[#141a14] px-4 py-4 shadow-[0_0_0_2px_#41533f,3px_3px_0_#101510]"
                      >
                        <p className="text-[10px] uppercase text-[#b5d79a]">
                          {log.title}
                        </p>
                        <p className="mt-2 font-[var(--font-terminal)] text-[23px] leading-[1.02] text-[#f4f6dd]">
                          {log.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </PixelWindow>

                <PixelWindow
                  title="Command Actions"
                  badge={<PixelInfoPill label="4 active" tone="blue" />}
                  className="p-4"
                  tone="dark"
                >
                  <div className="grid gap-3">
                    {commandActions.map((action, index) => (
                      <PixelLinkButton
                        key={action.title}
                        href={action.href}
                        className={`w-full justify-between px-4 py-4 text-left ${
                          index === 3
                            ? "bg-[#89eb50] text-[#17341c] [text-shadow:1px_1px_0_#efffd6] shadow-[0_0_0_2px_#e8ff93,4px_4px_0_#567f1b]"
                            : "bg-[#d8e8cc] text-[#17341c] shadow-[0_0_0_2px_#f4f8e8,4px_4px_0_#101510]"
                        }`}
                      >
                        <span className="flex flex-col items-start">
                          <span>{action.title}</span>
                          <span className="mt-1 font-[var(--font-terminal)] text-[18px] normal-case leading-none">
                            {action.detail}
                          </span>
                        </span>
                        <span className="font-[var(--font-terminal)] text-[22px] leading-none">
                          ▶
                        </span>
                      </PixelLinkButton>
                    ))}
                  </div>
                </PixelWindow>
              </aside>
            </div>

            <div className="mt-4 rounded-[18px] border-[3px] border-[#17341c] bg-[#141a14] px-4 py-3 shadow-[0_0_0_2px_#41533f,4px_4px_0_#101510]">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase text-[#d8efc6]">
                <span>GM Status: Online</span>
                <span>Time in Realm: 14:02 PM</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </StorefrontV2GameShell>
  );
}
