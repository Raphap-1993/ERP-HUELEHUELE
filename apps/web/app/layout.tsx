import type { ReactNode } from "react";
import Link from "next/link";
import { siteSetting, webNavigation } from "@huelegood/shared";
import { Button, PublicBrandStrip } from "@huelegood/ui";
import { fetchCmsSnapshot } from "../lib/api";
import "./globals.css";

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
    title: `${settings.brandName} | Plataforma comercial modular`,
    description: settings.tagline
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cms = await loadLayoutCms();
  const settings = cms?.siteSetting ?? siteSetting;
  const navigation = cms?.webNavigation ?? webNavigation;

  return (
    <html lang="es">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6">
          <header className="sticky top-4 z-20 mb-6 rounded-[1.75rem] border border-black/10 bg-white/85 px-5 py-4 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.24em] text-black/45">Huelegood</div>
                <PublicBrandStrip />
              </div>
              <nav className="flex flex-wrap items-center gap-2">
                {navigation.flatMap((group) => group.items).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm text-black/70 transition hover:bg-black/5 hover:text-[#132016]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button href="/checkout" size="sm">
                  Ir al checkout
                </Button>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-10 rounded-[1.75rem] border border-black/10 bg-[#132016] px-6 py-6 text-white shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-white/45">{settings.brandName}</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">{settings.tagline}</p>
              </div>
              <div className="text-sm text-white/70">
                Soporte: {settings.supportEmail} · WhatsApp: {settings.whatsapp}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
