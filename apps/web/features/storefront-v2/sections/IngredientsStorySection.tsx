import { StorefrontV2Media } from "../components/storefront-v2-media";
import { StorefrontV2Panel } from "../components/storefront-v2-section";
import type { StorefrontV2IngredientStory } from "../lib/content";
import { storefrontV2Media } from "../lib/media";

export function IngredientsStorySection({
  stories
}: {
  stories: StorefrontV2IngredientStory[];
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
      <StorefrontV2Media
        src={storefrontV2Media.traffic}
        alt="Escena sensorial y portable de Huele Huele"
        className="min-h-[520px]"
        overlay={
          <div className="flex h-full items-end p-6">
            <div className="max-w-sm rounded-[1.7rem] border border-white/18 bg-white/78 p-5 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">Lectura sensorial</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#17211a]">
                La capa v2 habla de textura, atmósfera y escenas de uso antes que de saturar con claims o ruido visual.
              </p>
            </div>
          </div>
        }
      />

      <StorefrontV2Panel tone="muted" className="space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#6c7368]">Ingredients story</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#17211a] md:text-[2.75rem]">
            Una historia de producto leída por capas, no por saturación.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-black/62">
            La estética premium/editorial funciona mejor cuando la marca se percibe limpia, sensorial y portable. Estas capas cuentan
            esa historia sin alterar la base comercial ni prometer lo que el producto no comunica hoy.
          </p>
        </div>

        <div className="grid gap-4">
          {stories.map((story) => (
            <div key={story.title} className="rounded-[1.65rem] border border-[#17211a]/8 bg-white/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{story.note}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#17211a]">{story.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/62">{story.description}</p>
            </div>
          ))}
        </div>
      </StorefrontV2Panel>
    </section>
  );
}
