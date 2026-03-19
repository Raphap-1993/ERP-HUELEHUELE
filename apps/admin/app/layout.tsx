import type { ReactNode } from "react";
import Link from "next/link";
import { adminNavigation, siteSetting } from "@huelegood/shared";
import { AdminSidebarLinkGroup, Badge, Button } from "@huelegood/ui";
import "./globals.css";

export const metadata = {
  title: `${siteSetting.brandName} Admin`,
  description: "Backoffice Huelegood"
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6">
          <aside className="rounded-[1.75rem] border border-black/10 bg-[#132016] p-6 text-white shadow-soft">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">{siteSetting.brandName} Admin</div>
              <p className="text-sm leading-6 text-white/72">
                Operación de pedidos, pagos, CMS, vendedores, mayoristas, CRM, comisiones y marketing.
              </p>
            </div>
            <div className="my-6">
              <Button href="/" variant="secondary" size="sm">
                Ir al storefront
              </Button>
            </div>
            <div className="space-y-8">
              {adminNavigation.map((group) => (
                <div key={group.title} className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">{group.title}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-2xl px-4 py-2 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
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
      </body>
    </html>
  );
}
