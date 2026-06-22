import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Baloo_2, Cormorant_Garamond, Manrope, Nunito } from "next/font/google";
import {
  siteSetting as fallbackSetting,
  webNavigation as fallbackNavigation,
  type NavigationItem
} from "@huelegood/shared";
import "./globals.css";
import { PrelineScript } from "../components/preline-script";
import { MobileNav } from "../components/mobile-nav";
import { LoadingScreen } from "../components/loading-screen";
import { fetchCmsNavigation, fetchCmsSiteSettings } from "../lib/api";

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

const hueleDisplayFont = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-hh-display",
  display: "swap"
});

const hueleBodyFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-hh-sans",
  display: "swap"
});

const currentYear = new Date().getFullYear();
const publicLogoUrl = "/brand/logo-hh.png";

function resolvePublicLogoUrl(value?: string) {
  const logoUrl = value?.trim();
  if (!logoUrl) {
    return publicLogoUrl;
  }

  const normalizedLogoUrl = decodeURIComponent(logoUrl).toLowerCase();
  if (normalizedLogoUrl.includes("logo 2.png")) {
    return publicLogoUrl;
  }

  return logoUrl;
}

function isExternal(item: NavigationItem) {
  return Boolean(item.external) || /^https?:\/\//.test(item.href);
}

const compactHeaderIcons: Record<string, ReactNode> = {
  "/cuenta": (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M7 17V9" />
      <path d="M12 17V5" />
      <path d="M17 17v-6" />
      <path d="M5 7l7-4 7 4" />
    </svg>
  ),
  "/checkout": (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" />
    </svg>
  )
};

function NavLink({ item, className, compact = false }: { item: NavigationItem; className: string; compact?: boolean }) {
  const icon = compact ? compactHeaderIcons[item.href] : null;
  const content = icon ? (
    <>
      {icon}
      <span className="sr-only">{item.label}</span>
    </>
  ) : (
    item.label
  );

  if (isExternal(item)) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noreferrer" aria-label={icon ? item.label : undefined} title={icon ? item.label : undefined}>
        {content}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} aria-label={icon ? item.label : undefined} title={icon ? item.label : undefined}>
      {content}
    </Link>
  );
}

async function resolveRuntimeSettings() {
  try {
    const response = await fetchCmsSiteSettings();
    return response.data;
  } catch {
    return fallbackSetting;
  }
}

async function resolveRuntimePublicChrome() {
  const [settingsResponse, navigationResponse] = await Promise.all([
    fetchCmsSiteSettings().catch(() => null),
    fetchCmsNavigation().catch(() => null)
  ]);

  return {
    settings: settingsResponse?.data ?? fallbackSetting,
    navigationGroups:
      navigationResponse?.data && navigationResponse.data.length > 0
        ? navigationResponse.data
        : fallbackNavigation
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await resolveRuntimeSettings();
  const siteIconUrl = settings.faviconUrl?.trim() || resolvePublicLogoUrl(settings.headerLogoUrl);

  return {
    title: "Huele Huele | Inhalador Herbal Aromático — Frescura Natural para el Perú",
    description:
      "Huele Huele: el inhalador herbal aromático que alivia el soroche, los mareos y la fatiga mental. 100% natural, de bolsillo y acción doble. Envíos a todo el Perú.",
    icons: siteIconUrl
      ? {
          icon: [{ url: siteIconUrl }],
          shortcut: [{ url: siteIconUrl }],
          apple: [{ url: siteIconUrl }]
        }
      : undefined
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { settings, navigationGroups } = await resolveRuntimePublicChrome();
  const links = navigationGroups.flatMap((group) => group.items);
  const headerLogoUrl = resolvePublicLogoUrl(settings.headerLogoUrl);
  const loadingImageUrl = settings.loadingImageUrl?.trim() || undefined;

  return (
    <html lang="es">
      <body
        data-huele-chrome="true"
        className={`${bodyFont.variable} ${displayFont.variable} ${hueleDisplayFont.variable} ${hueleBodyFont.variable} antialiased`}
        suppressHydrationWarning
      >
        <LoadingScreen imageUrl={loadingImageUrl} />
        <div className="hh-public-root flex min-h-screen flex-col overflow-x-clip">

          {/* ── Header ──────────────────────────────────── */}
          <header data-site-header="true" className="hh-public-site-header">
            <div className="hh-public-header-frame">
              <div className="hh-public-header-shell">
                {/* Brand */}
                <Link href="/" className="hh-public-brand">
                  {headerLogoUrl ? (
                    <>
                      <img
                        src={headerLogoUrl}
                        alt={settings.brandName}
                        className="hh-public-brand-logo"
                      />
                      <span className="sr-only">{settings.brandName}</span>
                    </>
                  ) : (
                    <>
                      <span className="hh-public-brand-mark">
                        🦜
                      </span>
                      <span className="hh-public-brand-name">
                        {settings.brandName}
                      </span>
                    </>
                  )}
                </Link>

                {/* Nav links */}
                <nav className="hh-public-desktop-nav">
                  {links.map((item) => (
                    <NavLink
                      key={`${item.href}-${item.label}`}
                      item={item}
                      compact={Boolean(compactHeaderIcons[item.href])}
                      className={
                        compactHeaderIcons[item.href]
                          ? "hh-public-nav-link hh-public-nav-link--icon"
                          : "hh-public-nav-link"
                      }
                    />
                  ))}
                </nav>

                {/* Mobile nav */}
                <MobileNav links={links} brandName={settings.brandName} />

                {/* CTA */}
                <Link
                  href="/catalogo"
                  className="hh-public-header-cta"
                >
                  Comprar ahora
                </Link>
              </div>
            </div>
          </header>

          {/* ── Main — p-0 so home sections are truly full-width ── */}
          <main className="flex-1">{children}</main>

          {/* ── Footer ──────────────────────────────────── */}
          <footer data-site-footer="true" className="hh-public-site-footer">
            <div className="hh-public-footer-inner">
              <div className="hh-public-footer-grid">
                {/* Brand column */}
                <div className="hh-public-footer-brand">
                  <div className="hh-public-footer-lockup">
                    {headerLogoUrl ? (
                      <img
                        src={headerLogoUrl}
                        alt={settings.brandName}
                        className="hh-public-footer-logo"
                      />
                    ) : (
                      <span className="hh-public-footer-mark">🦜</span>
                    )}
                    <span className="hh-public-footer-name">{settings.brandName}</span>
                  </div>
                  <p className="hh-public-footer-tagline">
                    {settings.tagline ||
                      "Tu aliado natural para respirar bien, sentirte bien y moverte por la vida sin que nada te detenga."}
                  </p>
                </div>

                {/* Nav groups */}
                {navigationGroups.map((group) => (
                  <div key={group.title}>
                    <p className="hh-public-footer-title">
                      {group.title}
                    </p>
                    <div className="hh-public-footer-links">
                      {group.items.map((item) => (
                        <NavLink
                          key={`footer-${item.href}-${item.label}`}
                          item={item}
                          className="hh-public-footer-link"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hh-public-footer-bottom">
                <span>© {currentYear} {settings.brandName}. Todos los derechos reservados.</span>
                <span>Hecho con 💚 en Perú</span>
              </div>
            </div>
          </footer>
        </div>
        <PrelineScript />
      </body>
    </html>
  );
}
