import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteSetting } from "@huelegood/shared";
import { AdminSessionProvider } from "../components/admin-session-provider";
import { AdminShell } from "../components/admin-shell";
import { fetchCmsSiteSettings } from "../lib/api";
import "react-international-phone/style.css";
import "./globals.css";

async function resolveRuntimeSettings() {
  try {
    const response = await fetchCmsSiteSettings();
    return response.data;
  } catch {
    return siteSetting;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await resolveRuntimeSettings();
  const siteIconUrl =
    settings.faviconUrl?.trim() || settings.adminSidebarLogoUrl?.trim() || settings.headerLogoUrl?.trim() || undefined;

  return {
    title: `${settings.brandName} Admin`,
    description: "Panel operativo Huelegood",
    icons: siteIconUrl
      ? {
          icon: [{ url: siteIconUrl }],
          shortcut: [{ url: siteIconUrl }],
          apple: [{ url: siteIconUrl }]
        }
      : undefined
  };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const settings = await resolveRuntimeSettings();

  return (
    <html lang="es">
      <body>
        <AdminSessionProvider>
          <AdminShell runtimeSiteSettings={settings}>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
