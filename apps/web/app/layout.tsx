import type { ReactNode } from "react";
import Link from "next/link";
import { siteSetting, webNavigation, type NavigationItem } from "@huelegood/shared";
import { fetchCmsSnapshot } from "../lib/api";
import "./globals.css";

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
        <img src={headerLogoUrl} alt={brandName} className="h-9 w-auto max-w-[180px] object-contain" />
        <span className="sr-only">{brandName}</span>
      </>
    );
  }

  return (
    <span
      className={
        tone === "muted"
          ? "block text-xs uppercase tracking-[0.34em] text-black/42"
          : "block text-xs uppercase tracking-[0.34em] text-black/56"
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
      <body className="antialiased">
        <div className="relative min-h-screen overflow-x-clip">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(201,214,188,0.3),transparent_54%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent)]" />

          <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
            <div className="mx-auto max-w-[1320px]">
              <div className="rounded-[1.9rem] border border-black/8 bg-[rgba(252,250,246,0.84)] shadow-[0_18px_60px_rgba(28,41,29,0.08)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 px-4 py-4 md:px-5 lg:flex-row lg:items-center lg:gap-6">
                  <div className="flex items-center justify-between gap-4 lg:min-w-[18rem]">
                    <Link href="/" className="inline-flex min-h-11 items-center">
                      <BrandMark brandName={settings.brandName} headerLogoUrl={headerLogoUrl} />
                    </Link>
                    <div className="hidden rounded-full border border-black/8 bg-white/72 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-black/44 md:inline-flex">
                      Tienda oficial
                    </div>
                  </div>

                  <nav className="flex flex-1 items-center gap-1 overflow-x-auto pb-1 text-sm text-black/62 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:justify-center lg:pb-0">
                    {links.map((item) => (
                      <ShellLink
                        key={`${item.href}-${item.label}`}
                        item={item}
                        className="rounded-full px-4 py-2.5 transition hover:bg-white hover:text-[#132016]"
                      />
                    ))}
                  </nav>

                  <div className="flex items-center justify-between gap-3 lg:min-w-[18rem] lg:justify-end">
                    <div className="hidden max-w-[16rem] text-right text-sm leading-6 text-black/48 xl:block">{settings.tagline}</div>
                    <Link
                      href="/catalogo"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#132016] px-5 text-sm font-medium text-white transition hover:bg-[#1b2d1f]"
                    >
                      Comprar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1320px] flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>

          <footer className="px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6">
            <div className="mx-auto max-w-[1320px] rounded-[2.25rem] border border-black/8 bg-[rgba(248,246,241,0.92)] shadow-[0_18px_60px_rgba(28,41,29,0.06)]">
              <div className="grid gap-10 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[1.1fr_1fr_0.9fr]">
                <section className="space-y-5">
                  <Link href="/" className="inline-flex min-h-10 items-center">
                    <BrandMark brandName={settings.brandName} headerLogoUrl={headerLogoUrl} tone="muted" />
                  </Link>
                  <p className="max-w-xl text-sm leading-7 text-black/62">{settings.tagline}</p>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-black/42">
                    <span className="rounded-full border border-black/8 bg-white/72 px-3 py-2">Catálogo curado</span>
                    <span className="rounded-full border border-black/8 bg-white/72 px-3 py-2">Compra directa</span>
                    <span className="rounded-full border border-black/8 bg-white/72 px-3 py-2">Acompañamiento comercial</span>
                  </div>
                </section>

                <section className="grid gap-6 sm:grid-cols-2">
                  {navigationGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">{group.title}</p>
                      <div className="grid gap-2 text-sm text-black/62">
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
                  <p className="text-[11px] uppercase tracking-[0.28em] text-black/40">Contacto</p>
                  <div className="space-y-3 text-sm leading-6 text-black/62">
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

              <div className="border-t border-black/6 px-6 py-4 text-xs uppercase tracking-[0.18em] text-black/38 md:px-8">
                © {currentYear} {settings.brandName}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
