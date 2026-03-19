import type { ReactNode } from "react";
import { siteSetting } from "@huelegood/shared";
import { Badge } from "@huelegood/ui";
import { AdminSessionProvider } from "../components/admin-session-provider";
import { AdminSidebar } from "../components/admin-sidebar";
import "./globals.css";

export const metadata = {
  title: `${siteSetting.brandName} Admin`,
  description: "Backoffice Huelegood"
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AdminSessionProvider>
          <div className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[320px_1fr] lg:px-6">
            <AdminSidebar />
            <main className="space-y-6">
              <header className="rounded-[1.75rem] border border-black/10 bg-white/85 px-6 py-5 shadow-soft backdrop-blur">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-black/45">Backoffice</div>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#132016]">Huelegood operación central</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">PM2 ready</Badge>
                    <Badge tone="success">RBAC</Badge>
                    <Badge tone="warning">Pagos en revisión</Badge>
                  </div>
                </div>
              </header>
              {children}
            </main>
          </div>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
