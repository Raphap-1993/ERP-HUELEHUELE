import type { ReactNode } from "react";
import Link from "next/link";
import { siteSetting, webNavigation } from "@huelegood/shared";
import { Button, PublicBrandStrip } from "@huelegood/ui";
import { fetchCmsSnapshot } from "../lib/api";
import "./globals.css";

function isPlaceholderValue(value?: string | null) {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.includes("000") || normalized.includes("replace") || normalized.includes("example");
}

async function loadLayoutCms() {
  try {
    const response = await fetchCmsSnapshot();
    return response.data;
  } catch {
    return null;
  }
}

export async function generateMetadata() {
  const cms = await loadLayoutCms();
  const settings = cms?.siteSetting ?? siteSetting;

  return {
    title: `${settings.brandName} | Frescura herbal portátil`,
    description: settings.tagline
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cms = await loadLayoutCms();
  const settings = cms?.siteSetting ?? siteSetting;
  const navigation = cms?.webNavigation ?? webNavigation;
  const links = navigation.flatMap((group) => group.items);
  const supportEmail = isPlaceholderValue(settings.supportEmail) ? "hola@huelegood.com" : settings.supportEmail;
  const whatsapp = isPlaceholderValue(settings.whatsapp) ? "Canal comercial por WhatsApp" : settings.whatsapp;
  const headerLogoUrl = isPlaceholderValue(settings.headerLogoUrl) ? undefined : settings.headerLogoUrl;

  return (
    <html lang="es">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-4 py-4 md:px-6 md:py-6">
          <header className="sticky top-4 z-30 mb-8 overflow-hidden rounded-[2.25rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,249,244,0.94)_100%)] px-5 py-4 shadow-[0_26px_80px_rgba(22,34,20,0.08)] backdrop-blur-xl md:px-7 md:py-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(171,192,154,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(201,166,109,0.12),transparent_26%)]" />
            <div className="relative flex flex-col gap-4">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <Link href="/" className="inline-flex min-h-10 items-center">
                    {headerLogoUrl ? (
                      <>
                        <img src={headerLogoUrl} alt={settings.brandName} className="h-10 w-auto max-w-[180px] object-contain" />
                        <span className="sr-only">{settings.brandName}</span>
                      </>
                    ) : (
                      <span className="block text-xs uppercase tracking-[0.38em] text-black/42">{settings.brandName}</span>
                    )}
                  </Link>
                  <PublicBrandStrip />
                </div>

                <div className="flex flex-col gap-4 xl:items-end">
                  <nav className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {links.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-full px-4 py-2 text-sm text-black/68 transition hover:bg-white/80 hover:text-[#132016]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.24em] text-black/38">Compra directa</span>
                    <Button href="/catalogo" size="sm">
                      Comprar ahora
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-12 overflow-hidden rounded-[2.5rem] border border-black/8 bg-[linear-gradient(135deg,#132016_0%,#1d3422_54%,#243d28_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(19,32,22,0.32)] md:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr_0.7fr]">
              <div className="space-y-4">
                <div className="text-sm uppercase tracking-[0.28em] text-white/42">{settings.brandName}</div>
                <p className="max-w-2xl text-sm leading-7 text-white/74">{settings.tagline}</p>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                  <span>Frescura</span>
                  <span>Portabilidad</span>
                  <span>Viajes</span>
                  <span>Tráfico</span>
                  <span>Altura</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/42">Explorar</p>
                <div className="grid gap-2 text-sm text-white/76">
                  {links.map((item) => (
                    <Link key={item.href} href={item.href} className="transition hover:text-white">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/42">Contacto</p>
                <div className="space-y-2 text-sm leading-6 text-white/76">
                  <p>{supportEmail}</p>
                  <p>{whatsapp}</p>
                  <p>Respuesta comercial y soporte de compra.</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
