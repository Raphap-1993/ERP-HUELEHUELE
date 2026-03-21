import { FAQAccordion, Button, Badge } from "@huelegood/ui";
import type { FaqItem } from "@huelegood/shared";
import { siteSetting } from "@huelegood/shared";
import type { PremiumCallout, PremiumCtaBanner } from "../content";
import { StorefrontV2PremiumPanel, StorefrontV2PremiumSectionHeading } from "../components/storefront-v2-premium-section";

function normalizeWhatsAppHref(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}

function isPlaceholderWhatsApp(value: string) {
  return /000000/.test(value.replace(/\D/g, ""));
}

export function ContactFaqCtaSection({
  faqs,
  callout,
  banner
}: {
  faqs: FaqItem[];
  callout: PremiumCallout;
  banner: PremiumCtaBanner;
}) {
  const whatsappHref = isPlaceholderWhatsApp(siteSetting.whatsapp) ? undefined : normalizeWhatsAppHref(siteSetting.whatsapp);
  const whatsappLabel = isPlaceholderWhatsApp(siteSetting.whatsapp) ? "Atención comercial por WhatsApp" : siteSetting.whatsapp;
  const emailHref = siteSetting.supportEmail.includes("@") ? `mailto:${siteSetting.supportEmail}` : undefined;

  return (
    <section className="space-y-6">
      <StorefrontV2PremiumSectionHeading
        eyebrow="Contacto, FAQ y cierre"
        title="Una salida limpia para resolver dudas y comprar sin ruido."
        description="Si ya sabes cuál elegir, pasas directo. Si no, te ayudamos a decidir entre Clásico Verde, Premium Negro y Combo Dúo Perfecto."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[0.9fr_1.12fr_0.88fr]">
        <StorefrontV2PremiumPanel tone="muted" className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#667064]">{callout.label}</p>
            <h3 className="max-w-md text-3xl font-semibold tracking-[-0.04em] text-[#162117] md:text-[2.7rem]">
              {callout.title}
            </h3>
            <p className="max-w-md text-sm leading-7 text-black/62">{callout.description}</p>
          </div>

          <div className="space-y-3 rounded-[1.8rem] border border-[#162117]/8 bg-white/82 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Correo</p>
              {emailHref ? (
                <a href={emailHref} className="text-sm font-medium text-[#162117] underline decoration-[#162117]/20 underline-offset-4">
                  {siteSetting.supportEmail}
                </a>
              ) : (
                <p className="text-sm font-medium text-[#162117]">{siteSetting.supportEmail}</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">WhatsApp</p>
              {whatsappHref ? (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#162117] underline decoration-[#162117]/20 underline-offset-4">
                  {whatsappLabel}
                </a>
              ) : (
                <p className="text-sm font-medium text-[#162117]">{whatsappLabel}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Clásico Verde", "Premium Negro", "Combo Dúo Perfecto"].map((label) => (
              <Badge key={label} className="bg-white/84 text-[#162117]">
                {label}
              </Badge>
            ))}
          </div>
        </StorefrontV2PremiumPanel>

        <StorefrontV2PremiumPanel tone="light" className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#667064]">Preguntas frecuentes</p>
            <h3 className="text-3xl font-semibold tracking-[-0.04em] text-[#162117] md:text-[2.8rem]">
              Las dudas que suelen aparecer antes de elegir.
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-black/62">
              Aquí resolvemos lo que importa para comprar con calma: formato, uso y la diferencia entre cada referencia.
            </p>
          </div>

          <div className="rounded-[1.85rem] border border-[#162117]/8 bg-white/78 p-3 md:p-4">
            <FAQAccordion items={faqs} />
          </div>
        </StorefrontV2PremiumPanel>

        <StorefrontV2PremiumPanel tone="dark" className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">{banner.eyebrow}</p>
            <h3 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-[2.8rem]">{banner.title}</h3>
            <p className="max-w-md text-sm leading-7 text-white/72">{banner.description}</p>
          </div>

          <div className="grid gap-3">
            <Button href={banner.primaryCta.href} variant="secondary">
              {banner.primaryCta.label}
            </Button>
            <Button href={banner.secondaryCta.href} variant="ghost" className="border border-white/14 text-white hover:bg-white/10 hover:text-white">
              {banner.secondaryCta.label}
            </Button>
            <Button href={banner.tertiaryCta.href} variant="ghost" className="border border-white/14 text-white hover:bg-white/10 hover:text-white">
              {banner.tertiaryCta.label}
            </Button>
          </div>

          <div className="space-y-3 rounded-[1.75rem] border border-white/12 bg-white/8 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">Ruta sugerida</p>
            <div className="grid gap-2 text-sm text-white/78">
              {callout.points.map((point) => (
                <div key={point} className="rounded-full border border-white/12 bg-white/8 px-4 py-3">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </StorefrontV2PremiumPanel>
      </div>
    </section>
  );
}
