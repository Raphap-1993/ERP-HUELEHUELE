import type { ReactNode } from "react";
import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { siteSetting, webNavigation, type NavigationItem } from "@huelegood/shared";
import "./globals.css";
import { PrelineScript } from "../components/preline-script";

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

const settings = siteSetting;
const navigationGroups = webNavigation;
const links = navigationGroups.flatMap((group) => group.items);
const currentYear = new Date().getFullYear();

export const metadata = {
  title: "Huele Huele | Inhalador Herbal Aromático — Frescura Natural para el Perú",
  description:
    "Huele Huele: el inhalador herbal aromático que alivia el soroche, los mareos y la fatiga mental. 100% natural, de bolsillo y acción doble. Envíos a todo el Perú."
};

function isExternal(item: NavigationItem) {
  return Boolean(item.external) || /^https?:\/\//.test(item.href);
}

function NavLink({ item, className }: { item: NavigationItem; className: string }) {
  if (isExternal(item)) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noreferrer">
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`} suppressHydrationWarning>
        <div className="flex min-h-screen flex-col overflow-x-clip bg-white">

          {/* ── Header ──────────────────────────────────── */}
          <header className="sticky top-0 z-40 shrink-0 px-4 pt-3 md:px-6 md:pt-4">
            <div className="mx-auto max-w-[1200px]">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/6 bg-white/90 px-4 py-3 shadow-[0_4px_24px_rgba(26,58,46,0.08)] backdrop-blur-xl md:px-5">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a3a2e] text-sm">
                    🦜
                  </span>
                  <span className="font-serif text-base font-bold text-[#1a3a2e]">
                    {settings.brandName}
                  </span>
                </Link>

                {/* Nav links */}
                <nav className="hidden items-center gap-1 md:flex">
                  {links.map((item) => (
                    <NavLink
                      key={`${item.href}-${item.label}`}
                      item={item}
                      className="rounded-full px-3.5 py-2 text-sm text-black/60 transition hover:bg-[#d8f3dc] hover:text-[#1a3a2e]"
                    />
                  ))}
                </nav>

                {/* CTA */}
                <Link
                  href="/catalogo"
                  className="shrink-0 rounded-full bg-[#1a3a2e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d6a4f]"
                >
                  Comprar ahora
                </Link>
              </div>
            </div>
          </header>

          {/* ── Main — p-0 so home sections are truly full-width ── */}
          <main className="flex-1">{children}</main>

          {/* ── Footer ──────────────────────────────────── */}
          <footer className="bg-[#1a3a2e] px-4 py-12 text-white md:px-6">
            <div className="mx-auto max-w-[1200px]">
              <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
                {/* Brand column */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm">🦜</span>
                    <span className="font-serif text-base font-bold">{settings.brandName}</span>
                  </div>
                  <p className="max-w-xs text-sm leading-7 text-white/55">
                    Tu aliado natural para respirar bien, sentirte bien y moverte por la vida sin que nada te detenga.
                  </p>
                </div>

                {/* Nav groups */}
                {navigationGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                      {group.title}
                    </p>
                    <div className="flex flex-col gap-2">
                      {group.items.map((item) => (
                        <NavLink
                          key={`footer-${item.href}-${item.label}`}
                          item={item}
                          className="text-sm text-white/65 transition hover:text-[#52b788]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/35 md:flex-row md:justify-between">
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
