import { StorefrontV2GameShell } from "../../features/storefront-v2-game/components/storefront-v2-game-shell";
import {
  PixelInfoPill,
  PixelLinkButton,
  PixelPanel,
} from "../../features/storefront-v2-game/components/storefront-v2-game-ui";

export default function StorefrontV2GameNotFound() {
  return (
    <StorefrontV2GameShell activeHref="/storefront-v2-game/catalogo">
      <main className="flex flex-1 items-center">
        <PixelPanel className="mx-auto max-w-[760px] p-5 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase text-[#17341c]">
                Ruta interrumpida
              </p>
              <h1 className="mt-2 text-[24px] uppercase leading-[1.45] text-[#17341c] lg:text-[30px]">
                Producto no encontrado
              </h1>
            </div>
            <PixelInfoPill label="404" tone="pink" />
          </div>
          <p className="mt-5 font-[var(--font-terminal)] text-[31px] leading-[1.02] text-[#17341c]">
            Esta pantalla no existe dentro del carril saga. Vuelve al catálogo o
            regresa al hub principal del prototipo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PixelLinkButton
              href="/storefront-v2-game/catalogo"
              className="min-w-[220px]"
            >
              Volver al catálogo
            </PixelLinkButton>
            <PixelLinkButton
              href="/storefront-v2-game"
              className="min-w-[220px] bg-[#3eff54] text-[12px] shadow-[0_0_0_3px_#dbff7f,5px_5px_0_#17341c] hover:bg-[#67ff5c]"
            >
              Volver al hub
            </PixelLinkButton>
          </div>
        </PixelPanel>
      </main>
    </StorefrontV2GameShell>
  );
}
