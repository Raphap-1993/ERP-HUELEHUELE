import type { ReactNode } from "react";
import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { siteSetting, webNavigation, type NavigationItem } from "@huelegood/shared";
import { fetchCmsSnapshot } from "../lib/api";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap"
});

function isPlaceholderValue(value?: string | null) {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.includes("000") || normalized.includes("replace") || normalized.includes("example");
}

function isExternalLink(item: NavigationItem) {
  return Boolean(item.external) || /^(https?:)?\/\//.test(item.href) || item.href.startsWith("mailto:") || item.href.startsWith("tel:");
}

function normalizeWhatsAppHref(value?: string | null) {
  if (!value || isPlaceholderValue(value)) {
    return undefined;
  }

  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 ? `https://wa.me/${digits}` : undefined;
}

function ShellLink({
  item,
  className
}: {
  item: NavigationItem;
  className: string;
}) {
  const external = isExternalLink(item);
  const openInNewTab = /^(https?:)?\/\//.test(item.href);

  if (external) {
    return (
      <a
        href={item.href}
        className={className}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noreferrer" : undefined}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  );
}

function BrandMark({
  brandName,
  headerLogoUrl,
  tone = "default"
}: {
  brandName: string;
  headerLogoUrl?: string;
  tone?: "default" | "muted";
}) {
  if (headerLogoUrl) {
    return (
      <>
        <img src={headerLogoUrl} alt={brandName} className="h-8 w-auto max-w-[180px] object-contain" />
        <span className="sr-only">{brandName}</span>
      </>
    );
  }

  return (
    <span
      className={
        tone === "muted"
          ? "block font-serif text-[0.76rem] uppercase tracking-[0.3em] text-black/44"
          : "block font-serif text-[0.76rem] uppercase tracking-[0.3em] text-black/58"
      }
    >
      {brandName}
    </span>
  );
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
    title: `${settings.brandName} | Bienestar herbal portátil`,
    description: settings.tagline
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cms = await loadLayoutCms();
  const settings = cms?.siteSetting ?? siteSetting;
  const navigationGroups = cms?.webNavigation ?? webNavigation;
  const links = navigationGroups.flatMap((group) => group.items);
  const supportEmail = isPlaceholderValue(settings.supportEmail) ? "hola@huelegood.com" : settings.supportEmail;
  const whatsapp = isPlaceholderValue(settings.whatsapp) ? "Atención comercial por WhatsApp" : settings.whatsapp;
  const headerLogoUrl = isPlaceholderValue(settings.headerLogoUrl) ? undefined : settings.headerLogoUrl;
  const emailHref = supportEmail.includes("@") ? `mailto:${supportEmail}` : undefined;
  const whatsappHref = normalizeWhatsAppHref(settings.whatsapp);
  const currentYear = new Date().getFullYear();

  return (
    <html lang="es">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <div className="relative flex min-h-screen flex-col overflow-x-clip">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_top_left,rgba(186,154,112,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(204,214,188,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.66),transparent)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18rem] bg-[radial-gradient(circle_at_bottom_right,rgba(207,190,160,0.16),transparent_28%)]" />

          <header className="sticky top-0 z-40 shrink-0 px-4 pt-3 md:px-6 md:pt-5">
            <div className="mx-auto max-w-[1240px]">
              <div className="rounded-[1.7rem] border border-black/6 bg-[rgba(252,248,242,0.82)] shadow-[0_16px_44px_rgba(24,34,28,0.07)] backdrop-blur-xl">
                <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)_auto] md:items-center md:px-5">
                  <div className="flex items-center justify-between gap-4 md:justify-start">
                    <Link href="/" className="inline-flex min-h-10 items-center">
                      <BrandMark brandName={settings.brandName} headerLogoUrl={headerLogoUrl} />
                    </Link>
                    <div className="hidden rounded-full border border-black/6 bg-white/72 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-black/42 md:inline-flex">
                      Tienda oficial
                    </div>
                  </div>

                  <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm text-black/58 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:justify-center md:pb-0">
                    {links.map((item) => (
                      <ShellLink
                        key={`${item.href}-${item.label}`}
                        item={item}
                        className="rounded-full px-3.5 py-2 transition hover:bg-white/82 hover:text-[#132016]"
                      />
                    ))}
                  </nav>

                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <div className="hidden max-w-[16rem] text-right text-sm leading-6 text-black/46 xl:block">{settings.tagline}</div>
                    <Link
                      href="/catalogo"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[#132016] px-[1.125rem] text-sm font-medium text-white transition hover:bg-[#1b2d1f]"
                    >
                      Comprar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1240px] flex-1 px-4 py-8 md:px-6 md:py-12">{children}</main>

          <footer className="shrink-0 px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6">
            <div className="mx-auto max-w-[1240px] rounded-[2rem] border border-black/6 bg-[rgba(248,244,238,0.9)] shadow-[0_16px_48px_rgba(28,41,29,0.05)]">
              <div className="grid gap-8 px-5 py-8 md:px-8 md:py-10 lg:grid-cols-[1.05fr_1fr_0.9fr]">
                <section className="space-y-5">
                  <Link href="/" className="inline-flex min-h-10 items-center">
                    <BrandMark brandName={settings.brandName} headerLogoUrl={headerLogoUrl} tone="muted" />
                  </Link>
                  <p className="max-w-xl text-sm leading-7 text-black/60">{settings.tagline}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-black/42">
                    <span className="rounded-full border border-black/6 bg-white/72 px-3 py-2">Catálogo curado</span>
                    <span className="rounded-full border border-black/6 bg-white/72 px-3 py-2">Compra directa</span>
                    <span className="rounded-full border border-black/6 bg-white/72 px-3 py-2">Acompañamiento comercial</span>
                  </div>
                </section>

                <section className="grid gap-6 sm:grid-cols-2">
                  {navigationGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.26em] text-black/38">{group.title}</p>
                      <div className="grid gap-2 text-sm text-black/60">
                        {group.items.map((item) => (
                          <ShellLink
                            key={`${group.title}-${item.href}-${item.label}`}
                            item={item}
                            className="transition hover:text-[#132016]"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>

                <section className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-black/38">Contacto</p>
                  <div className="space-y-3 text-sm leading-6 text-black/60">
                    {emailHref ? (
                      <a href={emailHref} className="block transition hover:text-[#132016]">
                        {supportEmail}
                      </a>
                    ) : (
                      <p>{supportEmail}</p>
                    )}
                    {whatsappHref ? (
                      <a href={whatsappHref} target="_blank" rel="noreferrer" className="block transition hover:text-[#132016]">
                        {whatsapp}
                      </a>
                    ) : (
                      <p>{whatsapp}</p>
                    )}
                    <p>Soporte de compra y atención comercial.</p>
                  </div>
                </section>
              </div>

              <div className="border-t border-black/6 px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-black/38 md:px-8">
                © {currentYear} {settings.brandName}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
