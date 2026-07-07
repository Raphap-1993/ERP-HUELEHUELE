import Image from "next/image";
import { gamePrototypeGuideMascotSrc } from "../content/storefront-v2-game-art";
import { gamePrototypeGuildRanks } from "../content/storefront-v2-game-content";
import { StorefrontV2GameShell } from "../components/storefront-v2-game-shell";
import { PixelLinkButton, PixelTitleBanner } from "../components/storefront-v2-game-ui";

const guildBenefits = [
  "Margen 100%",
  "72 créditos sellados",
  "142 unidades recomendadas",
  "Cobertura nacional",
] as const;

export function StorefrontV2GameWholesalePage() {
  return (
    <StorefrontV2GameShell
      activeHref="/storefront-v2-game/mayoristas"
      showHeader={false}
    >
      <main className="grid flex-1 gap-6">
        <section className="relative overflow-hidden rounded-[30px] border-[4px] border-[#17341c] bg-[linear-gradient(180deg,#49be59_0%,#30a34d_100%)] px-4 py-5 shadow-[0_0_0_3px_#b9e28f,8px_8px_0_#17341c] lg:px-6">
          <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute left-0 bottom-0 h-20 w-full bg-[linear-gradient(180deg,rgba(22,49,30,0)_0%,rgba(22,49,30,0.2)_100%)]" />

          <div className="relative mx-auto max-w-[1120px]">
            <div className="rounded-[22px] border-[4px] border-[#17341c] bg-[#9fe26a] px-4 py-3 shadow-[0_0_0_2px_#d9ffb1,4px_4px_0_#17341c]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-[10px] border-[3px] border-[#17341c] bg-[#dff0c2]">
                    <Image
                      src={gamePrototypeGuideMascotSrc}
                      alt=""
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <p className="text-[10px] uppercase leading-none text-[#17341c]">
                    Huele Huele
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] uppercase text-[#17341c]">
                  {["Inicio", "Catálogo", "Gremio", "Contacto", "Carrito"].map((item) => (
                    <span
                      key={item}
                      className="rounded-[12px] border-[2px] border-[#17341c] bg-[#c7f094] px-3 py-2 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="flex items-start gap-4 rounded-[24px] border-[4px] border-[#17341c] bg-[#7fcf65] p-5 shadow-[0_0_0_2px_#b0ed8e,5px_5px_0_#17341c]">
                <div className="relative h-44 w-40 shrink-0">
                  <Image
                    src={gamePrototypeGuideMascotSrc}
                    alt="Guild guide mascot"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-[var(--font-terminal)] text-[34px] leading-[0.9] text-[#fffbea] [text-shadow:3px_3px_0_#17341c]">
                    ¡Únete al Gremio de Distribuidores de Huele Huele!
                  </h1>
                  <p className="mt-3 font-[var(--font-terminal)] text-[26px] leading-[1] text-[#17341c]">
                    ¡Embárcate en una nueva aventura empresarial con nuestro botín natural!
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border-[4px] border-[#17341c] bg-[#f7f3df] p-5 shadow-[0_0_0_2px_#ffffff,5px_5px_0_#17341c]">
                <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                  <div>
                    <PixelTitleBanner tone="wood" className="min-h-[44px]">
                      Beneficios del Gremio
                    </PixelTitleBanner>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {guildBenefits.map((benefit) => (
                        <div
                          key={benefit}
                          className="rounded-[16px] border-[3px] border-[#17341c] bg-[#fffbea] px-4 py-4 text-center shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                        >
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[10px] border-[3px] border-[#17341c] bg-[#f8d57b] text-[18px]">
                            ✦
                          </div>
                          <p className="mt-3 text-[10px] uppercase leading-[1.4] text-[#17341c]">
                            {benefit}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <PixelTitleBanner tone="wood" className="min-h-[44px]">
                        Niveles de Clase
                      </PixelTitleBanner>
                      <div className="mt-4 grid gap-3">
                        {gamePrototypeGuildRanks.map((rank) => (
                          <div
                            key={rank.title}
                            className="flex items-center gap-3 rounded-[18px] border-[3px] border-[#17341c] bg-[#fffbea] px-4 py-4 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                          >
                            <div className="relative h-12 w-12 shrink-0 rounded-[12px] border-[3px] border-[#17341c] bg-[#dff0c2]">
                              <Image
                                src={rank.icon}
                                alt=""
                                fill
                                className="object-contain p-1.5"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] uppercase text-[#17341c]">
                                {rank.title}
                              </p>
                              <p className="mt-1 text-[10px] uppercase text-[#5d8141]">
                                {rank.description}
                              </p>
                            </div>
                            <PixelLinkButton href="/storefront-v2-game/centro-de-mando" className="bg-[#31ff36] px-3 py-2 text-[10px] text-white [text-shadow:2px_2px_0_#17341c]">
                              Elegir Clase
                            </PixelLinkButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <PixelTitleBanner tone="wood" className="min-h-[44px]">
                      Misión de Ingreso
                    </PixelTitleBanner>
                    <div className="mt-4 rounded-[20px] border-[4px] border-[#17341c] bg-[#eed39b] p-4 shadow-[0_0_0_2px_#fff0c7,4px_4px_0_#17341c]">
                      <div className="space-y-3">
                        {[
                          ["Nombre del Aventurero", "Rapha"],
                          ["Correo Electrónico", "guild@huelegood.pe"],
                          ["Teléfono de Contacto", "+51 999 999 999"],
                          ["Mensaje", "Mayorista / Distribuidor"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-[16px] border-[3px] border-[#17341c] bg-[#fff9e8] px-4 py-4 shadow-[0_0_0_2px_#ffffff,3px_3px_0_#17341c]"
                          >
                            <p className="text-[10px] uppercase text-[#17341c]">
                              {label}
                            </p>
                            <p className="mt-2 font-[var(--font-terminal)] text-[24px] leading-[1.02] text-[#17341c]">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                      <PixelLinkButton
                        href="/storefront-v2-game/centro-de-mando"
                        className="mt-5 w-full justify-center bg-[#31ff36] py-4 text-[12px] text-white [text-shadow:2px_2px_0_#17341c] shadow-[0_0_0_3px_#d9ff7a,5px_5px_0_#17341c] hover:bg-[#43ff49]"
                      >
                        Aceptar Misión
                      </PixelLinkButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </StorefrontV2GameShell>
  );
}
