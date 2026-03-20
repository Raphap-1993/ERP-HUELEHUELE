import type { PremiumUseCase } from "../content";
import { StorefrontV2PremiumMedia } from "../components/storefront-v2-premium-media";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";
import { storefrontV2PremiumMedia } from "../lib/media";

function resolveUseCaseImage(image: PremiumUseCase["image"]) {
  if (image === "office") {
    return storefrontV2PremiumMedia.office;
  }

  if (image === "travel") {
    return storefrontV2PremiumMedia.travel;
  }

  return storefrontV2PremiumMedia.traffic;
}

function useCasePoints(image: PremiumUseCase["image"]) {
  if (image === "office") {
    return ["Escritorio", "Reuniones", "Jornadas largas"];
  }

  if (image === "travel") {
    return ["Equipaje de mano", "Mochila", "Altura"];
  }

  return ["Carro", "Bolso", "Trayectos largos"];
}

export function UseCasesSection({ items }: { items: PremiumUseCase[] }) {
  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Escenas editoriales"
        title="Una composición más comercial cuando el producto vive en escenas reales."
        description="Tráfico, oficina, viajes y altura construyen el contexto correcto para explicar portabilidad, frescura y una compra bien editada."
      />

      <div className="space-y-5">
        {items.map((item, index) => (
          <StorefrontV2PremiumPanel
            key={item.title}
            tone={index === 1 ? "dark" : "light"}
            className="overflow-hidden p-0"
          >
            <div className={`grid gap-0 ${index % 2 === 0 ? "xl:grid-cols-[1.06fr_0.94fr]" : "xl:grid-cols-[0.94fr_1.06fr]"}`}>
              <div className={index % 2 === 0 ? "xl:order-1" : "xl:order-2"}>
                <StorefrontV2PremiumMedia
                  src={resolveUseCaseImage(item.image)}
                  alt={item.title}
                  className="min-h-[320px] rounded-none border-none shadow-none xl:min-h-[360px]"
                />
              </div>

              <div className={index % 2 === 0 ? "xl:order-2" : "xl:order-1"}>
                <div className="flex h-full flex-col justify-between gap-8 p-6 md:p-8">
                  <div className="space-y-4">
                    <p className={`text-[11px] uppercase tracking-[0.28em] ${index === 1 ? "text-white/42" : "text-black/38"}`}>{item.label}</p>
                    <h3 className={`max-w-xl text-[2rem] font-semibold leading-tight tracking-[-0.04em] ${index === 1 ? "text-white" : "text-[#162117]"}`}>
                      {item.title}
                    </h3>
                    <p className={`max-w-xl text-sm leading-7 ${index === 1 ? "text-white/72" : "text-black/62"}`}>{item.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {useCasePoints(item.image).map((point) => (
                      <div
                        key={point}
                        className={
                          index === 1
                            ? "rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-4 text-sm font-medium text-white/82"
                            : "rounded-[1.35rem] border border-[#162117]/8 bg-white/82 px-4 py-4 text-sm font-medium text-[#162117]"
                        }
                      >
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </StorefrontV2PremiumPanel>
        ))}
      </div>
    </section>
  );
}
