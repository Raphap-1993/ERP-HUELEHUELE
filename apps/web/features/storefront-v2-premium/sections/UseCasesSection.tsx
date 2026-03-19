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

export function UseCasesSection({ items }: { items: PremiumUseCase[] }) {
  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Momentos de uso"
        title="La promesa se vuelve premium cuando entra en escenas reales y no en un claim vacío."
        description="Tráfico, escritorio y viaje ordenan la narrativa pública para que el producto se entienda rápido y con contexto."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <StorefrontV2PremiumPanel key={item.title} tone="light" className="overflow-hidden p-0">
            <div className="space-y-0">
              <StorefrontV2PremiumMedia src={resolveUseCaseImage(item.image)} alt={item.title} className="min-h-[260px] rounded-none border-none shadow-none" />
              <div className="space-y-3 p-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">{item.label}</p>
                <h3 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-[#112017]">{item.title}</h3>
                <p className="text-sm leading-7 text-black/62">{item.description}</p>
              </div>
            </div>
          </StorefrontV2PremiumPanel>
        ))}
      </div>
    </section>
  );
}
