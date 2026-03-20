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
        <div className="min-h-screen">
          <header className="sticky top-0 z-30 border-b border-black/6 bg-[rgba(250,248,243,0.9)] backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2">
                <Link href="/" className="inline-flex min-h-10 items-center">
                    {headerLogoUrl ? (
                      <>
                        <img src={headerLogoUrl} alt={settings.brandName} className="h-9 w-auto max-w-[180px] object-contain" />
                        <span className="sr-only">{settings.brandName}</span>
                      </>
                    ) : (
                      <span className="block text-xs uppercase tracking-[0.38em] text-black/48">{settings.brandName}</span>
                    )}
                  </Link>
                <div className="hidden lg:block">
                  <PublicBrandStrip />
                </div>
              </div>

              <nav className="flex flex-wrap items-center gap-1 lg:justify-center">
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm text-black/68 transition hover:bg-white hover:text-[#132016]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <div className="hidden text-sm text-black/46 xl:block">Bienestar herbal portátil</div>
                <Button href="/catalogo" size="sm">
                  Comprar
                </Button>
              </div>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
          <footer className="border-t border-black/6 bg-[#f3f4ee]">
            <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1.25fr_0.75fr_0.75fr]">
              <div className="space-y-4">
                <div className="text-sm uppercase tracking-[0.28em] text-black/42">{settings.brandName}</div>
                <p className="max-w-xl text-sm leading-7 text-black/62">{settings.tagline}</p>
                <div className="text-xs uppercase tracking-[0.22em] text-black/44">Herbal · Fresco · Portable</div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-black/42">Navegación</p>
                <div className="grid gap-2 text-sm text-black/62">
                  {links.map((item) => (
                    <Link key={item.href} href={item.href} className="transition hover:text-[#132016]">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-black/42">Contacto</p>
                <div className="space-y-2 text-sm leading-6 text-black/62">
                  <p>{supportEmail}</p>
                  <p>{whatsapp}</p>
                  <p>Soporte comercial y acompañamiento de compra.</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
