import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Prototipo Huele Huele Saga",
    template: "%s | Prototipo Huele Huele Saga",
  },
  description:
    "Carril paralelo de la saga botánica arcade de Huele Huele. No corresponde a la experiencia pública activa.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function StorefrontV2GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
