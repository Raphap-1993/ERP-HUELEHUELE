import type { ReactNode } from "react";
import { siteSetting } from "@huelegood/shared";
import { AdminSessionProvider } from "../components/admin-session-provider";
import { AdminShell } from "../components/admin-shell";
import "./globals.css";

export const metadata = {
  title: `${siteSetting.brandName} Admin`,
  description: "Panel operativo Huelegood"
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AdminSessionProvider>
          <AdminShell>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
