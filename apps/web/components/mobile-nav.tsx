"use client";
import { useState } from "react";
import Link from "next/link";
import type { NavigationItem } from "@huelegood/shared";

function isExternal(item: NavigationItem) {
  return Boolean(item.external) || /^https?:\/\//.test(item.href);
}

interface MobileNavProps {
  links: NavigationItem[];
  brandName: string;
  ctaHref?: string;
}

export function MobileNav({ links, brandName, ctaHref = "/catalogo" }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl text-[#1a3a2e] transition hover:bg-[#d8f3dc]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label={`Menú de ${brandName}`}
        aria-modal="true"
        className={[
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-white shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
          <span className="font-serif text-base font-bold text-[#1a3a2e]">{brandName}</span>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1a3a2e] transition hover:bg-[#d8f3dc]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {links.map((item) =>
            isExternal(item) ? (
              <a
                key={`mobile-${item.href}-${item.label}`}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={close}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#1a3a2e] transition hover:bg-[#d8f3dc]"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={`mobile-${item.href}-${item.label}`}
                href={item.href}
                onClick={close}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#1a3a2e] transition hover:bg-[#d8f3dc]"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* CTA at bottom */}
        <div className="border-t border-black/6 px-5 py-5">
          <Link
            href={ctaHref}
            onClick={close}
            className="block w-full rounded-full bg-[#1a3a2e] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#2d6a4f]"
          >
            Comprar ahora
          </Link>
        </div>
      </div>
    </>
  );
}
