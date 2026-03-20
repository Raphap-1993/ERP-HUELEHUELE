import { Badge, Button } from "@huelegood/ui";
import { StorefrontV2PremiumMedia } from "../components/storefront-v2-premium-media";
import { StorefrontV2PremiumPanel } from "../components/storefront-v2-premium-section";
import { VendorApplicationForm } from "../components/vendor-application-form";
import { vendorApplicationContent } from "../content";
import { storefrontV2PremiumMedia } from "../lib/media";

export function VendorApplicationPage() {
  const { hero, evaluationChecklist, sellerBenefits, steps } = vendorApplicationContent;

  return (
    <div className="space-y-10 py-6 md:space-y-14 md:py-10">
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="relative overflow-hidden rounded-[2.6rem] border border-[#1a3a2e]/8 bg-[linear-gradient(160deg,rgba(255,255,255,0.97)_0%,rgba(250,248,243,0.95)_55%,rgba(232,242,235,0.94)_100%)] px-7 py-8 shadow-[0_34px_90px_rgba(26,58,46,0.09)] md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(82,183,136,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(201,168,76,0.12),transparent_30%)]" />
          <div className="relative space-y-8">
            <div className="space-y-4">
              <Badge className="bg-[#1a3a2e] text-white">{hero.eyebrow}</Badge>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold leading-[0.93] tracking-[-0.045em] text-[#1a3a2e] md:text-[4.15rem]">{hero.title}</h1>
                <p className="max-w-2xl text-base leading-7 text-black/64 md:text-lg">{hero.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button href="#postulacion">Postularme ahora</Button>
              <Button href="#proceso" variant="secondary">
                Ver proceso
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {hero.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.65rem] border border-[#1a3a2e]/8 bg-white/74 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{metric.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[#1a3a2e]">{metric.value}</p>
                  <p className="mt-2 text-sm leading-6 text-black/56">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <StorefrontV2PremiumMedia
          src={storefrontV2PremiumMedia.seller}
          alt="Visual editorial para vendedores Huele Huele"
          className="min-h-[520px]"
          overlay={
            <div className="flex h-full items-end p-6">
              <div className="max-w-sm rounded-[1.7rem] border border-white/18 bg-white/80 p-5 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/38">Onboarding comercial</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#1a3a2e]">
                  Esta página ahora sí registra postulaciones reales contra el endpoint existente del backend.
                </p>
              </div>
            </div>
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <VendorApplicationForm source="Trabaja con nosotros" className="h-fit" />

        <StorefrontV2PremiumPanel id="proceso" tone="dark" className="space-y-6">
          <div className="space-y-3">
            <Badge className="w-fit bg-white/14 text-white">Proceso comercial</Badge>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Qué evaluamos y qué recibe el vendedor.</h2>
            <p className="text-sm leading-7 text-white/74">
              La ruta debe verse profesional, corta y entendible. No vende humo: explica screening, activación y salida real dentro del sistema.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Lo que evaluamos</p>
              <div className="mt-4 grid gap-3">
                {evaluationChecklist.map((item) => (
                  <div key={item} className="rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-3 text-sm leading-6 text-white/82">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Lo que recibe</p>
              <div className="mt-4 grid gap-3">
                {sellerBenefits.map((item) => (
                  <div key={item} className="rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-3 text-sm leading-6 text-white/82">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </StorefrontV2PremiumPanel>
      </section>

      <section id="postulacion" className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-black/42">Ruta de entrada</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1a3a2e] md:text-[2.65rem]">
            Así se activa un vendedor dentro de Huele Huele.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-black/62">
            La postulación se captura desde la web pública, se revisa en admin y se integra al flujo operativo ya definido por el backend.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <StorefrontV2PremiumPanel key={step.step} tone={index === 1 ? "muted" : "light"}>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-black/38">Paso {step.step}</p>
                <h3 className="text-[1.45rem] font-semibold tracking-tight text-[#1a3a2e]">{step.title}</h3>
                <p className="text-sm leading-6 text-black/64">{step.description}</p>
              </div>
            </StorefrontV2PremiumPanel>
          ))}
        </div>
      </section>
    </div>
  );
}
