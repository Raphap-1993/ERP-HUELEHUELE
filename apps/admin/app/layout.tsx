import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteSetting } from "@huelegood/shared";
import { AdminSessionProvider } from "../components/admin-session-provider";
import { AdminShell } from "../components/admin-shell";
import { fetchCmsSiteSettings } from "../lib/api";
import "./globals.css";

export const metadata = {
  title: `${siteSetting.brandName} Admin`,
  description: "Panel operativo Huelegood"
};

async function resolveRuntimeSettings() {
  try {
    const response = await fetchCmsSiteSettings();
    return response.data;
  } catch {
    return siteSetting;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const settings = await resolveRuntimeSettings();

  return (
    <html lang="es">
      <body>
        <AdminSessionProvider>
          <AdminShell loadingImageUrl={settings.loadingImageUrl}>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
